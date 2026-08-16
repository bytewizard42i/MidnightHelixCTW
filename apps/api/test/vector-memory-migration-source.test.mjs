// SPDX-License-Identifier: Apache-2.0
//
// Source-contract tests for the migration 002 vector-memory slice.
//
// These tests read committed SQL (Structured Query Language) and Markdown text
// only. They prove nothing about a live database: no connection, migration,
// grant, capability activation, or query is performed anywhere in this file.
//
// The guards are written as reusable violation collectors so that every rule
// can be exercised BOTH ways: once against the real committed source, which
// must report zero violations, and once against a deliberately broken variant,
// which must report the specific violation. That makes the negative evidence
// committed and reproducible instead of a claim made in a review comment.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DATABASE_ROOT = new URL("../../../database/", import.meta.url);
const DOCS_ROOT = new URL("../../../docs/", import.meta.url);

const MIGRATION_URL = new URL(
  "migrations/002_testwired_vector_memory.sql",
  DATABASE_ROOT,
);
const ACTIVATION_URL = new URL(
  "activation/002_testwired_vector_memory_activation.sql",
  DATABASE_ROOT,
);
const GRANTS_URL = new URL(
  "activation/002_testwired_vector_memory_grants.sql",
  DATABASE_ROOT,
);
const VERIFICATION_URL = new URL(
  "activation/verify_vector_memory_activation.sql",
  DATABASE_ROOT,
);
const CAPABILITY_ACTIVATION_URL = new URL(
  "activation/activate_vector_memory_capability.sql",
  DATABASE_ROOT,
);
const CAPABILITY_VERIFICATION_URL = new URL(
  "activation/verify_vector_memory_capability.sql",
  DATABASE_ROOT,
);
const MIGRATIONS_README_URL = new URL("migrations/README.md", DATABASE_ROOT);
const IMPLEMENTATION_STATUS_URL = new URL(
  "IMPLEMENTATION_STATUS.md",
  DOCS_ROOT,
);

// Matches coalesce(..., true) even when the first argument itself contains a
// parenthesized call, for example coalesce(bool_and(x), true).
const VACUOUS_COALESCE_PATTERN =
  /coalesce\s*\((?:[^()]|\([^()]*\))*,\s*true\s*\)/i;

const QUALIFIED_SCHEMA = "mhelix_testwired";
const RUNTIME_ROLE = "mhelix_runtime";

// Guards must inspect executable SQL only. The reviewed files deliberately
// NAME forbidden patterns in their explanatory comments, so a whole-file regex
// would produce false failures.
function stripSqlComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

// A privilege-checking query legitimately COMPARES privilege names such as
// 'DELETE' inside string literals. Those are data, not statements.
function stripSqlStringLiterals(executableSql) {
  return executableSql.replace(/'[^']*'/g, "''");
}

function splitStatements(executableSql) {
  return executableSql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function collapse(sql) {
  return sql.replace(/\s+/g, " ");
}

async function readText(url) {
  return readFile(url, "utf8");
}

// --------------------------------------------------------------------------
// Violation collectors
// --------------------------------------------------------------------------

function collectMigrationViolations(rawSql) {
  const executable = stripSqlComments(rawSql);
  const flat = collapse(executable);
  const violations = [];

  for (const [, target] of [
    ...executable.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\S+)/g),
    ...executable.matchAll(
      /CREATE (?:UNIQUE )?INDEX IF NOT EXISTS\s+\S+\s+ON\s+(\S+)/g,
    ),
    ...executable.matchAll(/ALTER TABLE\s+(\S+)/g),
    ...executable.matchAll(/REFERENCES\s+([A-Za-z0-9_.]+)/g),
  ]) {
    if (!target.startsWith(`${QUALIFIED_SCHEMA}.`)) {
      violations.push(`unqualified-object:${target}`);
    }
  }

  for (const forbidden of [
    "DROP",
    "TRUNCATE",
    "DELETE",
    "UPDATE",
    "RENAME",
    "GRANT",
    "REVOKE",
    "UPSERT",
  ]) {
    if (new RegExp(`\\b${forbidden}\\b`, "i").test(executable)) {
      violations.push(`destructive-or-privileged:${forbidden}`);
    }
  }
  if (/\bON\s+CONFLICT\b/i.test(executable)) {
    violations.push("destructive-or-privileged:ON CONFLICT");
  }
  if (/\bSET\s+CLUSTER\s+SETTING\b/i.test(executable)) {
    violations.push("destructive-or-privileged:SET CLUSTER SETTING");
  }
  if (/\bALTER\s+COLUMN\b/i.test(executable)) {
    violations.push("destructive-or-privileged:ALTER COLUMN");
  }

  // Vector shape.
  if (!/embedding\s+VECTOR\(8\)\s+NOT NULL/.test(executable)) {
    violations.push("vector-dimension-not-exactly-8");
  }
  if (!/embedding_dimensions\s*=\s*8/.test(executable)) {
    violations.push("vector-dimension-check-missing");
  }
  const vectorIndexMatch = executable.match(/VECTOR INDEX\s+(\S+)\s*\(([^)]*)\)/);
  if (!vectorIndexMatch) {
    violations.push("vector-index-missing");
  } else {
    const indexColumns = vectorIndexMatch[2]
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    const expectedColumns = [
      "run_id",
      "projection_generation_id",
      "embedding vector_cosine_ops",
    ];
    if (JSON.stringify(indexColumns) !== JSON.stringify(expectedColumns)) {
      violations.push("vector-index-prefix-order-or-opclass-wrong");
    }
  }
  if (/vector_l2_ops|vector_ip_ops/.test(executable)) {
    violations.push("vector-index-wrong-opclass");
  }

  // Recall evidence must bind the same run AND the recall operation.
  if (
    !/FOREIGN KEY \(run_id, action_receipt_id, operation\) REFERENCES mhelix_testwired\.mhelix_action_receipts \(run_id, action_receipt_id, operation\)/.test(
      flat,
    )
  ) {
    violations.push("recall-receipt-binding-not-composite");
  }
  if (!/CHECK \(operation = 'recall'\)/.test(flat)) {
    violations.push("recall-operation-literal-missing");
  }
  if (
    !/CREATE UNIQUE INDEX IF NOT EXISTS uq_mhelix_action_receipts_run_receipt_operation ON mhelix_testwired\.mhelix_action_receipts \(run_id, action_receipt_id, operation\)/.test(
      flat,
    )
  ) {
    violations.push("receipt-composite-identity-index-missing");
  }
  if (/idx_mhelix_recall_result_items_receipt/.test(executable)) {
    violations.push("redundant-receipt-rank-index-present");
  }

  // Remaining boundary keys.
  const requiredKeys = [
    [
      /FOREIGN KEY \(case_namespace_id, run_id\) REFERENCES mhelix_testwired\.mhelix_runs \(case_namespace_id, run_id\)/,
      "run-boundary-key-missing",
    ],
    [
      /FOREIGN KEY \(case_namespace_id, run_id, session_id\) REFERENCES mhelix_testwired\.mhelix_memory_sessions \(case_namespace_id, run_id, session_id\)/,
      "session-boundary-key-missing",
    ],
    [
      /FOREIGN KEY \(session_id, memory_summary_id\) REFERENCES mhelix_testwired\.mhelix_memory_summaries \(session_id, memory_summary_id\)/,
      "summary-boundary-key-missing",
    ],
    [
      /FOREIGN KEY \(case_namespace_id, projection_generation_id\) REFERENCES mhelix_testwired\.mhelix_projection_generations \(case_namespace_id, projection_generation_id\)/,
      "projection-boundary-key-missing",
    ],
    [
      /FOREIGN KEY \(run_id, projection_generation_id, memory_summary_id\) REFERENCES mhelix_testwired\.mhelix_memory_summary_embeddings \(run_id, projection_generation_id, memory_summary_id\)/,
      "embedding-reference-key-missing",
    ],
    [
      /CREATE UNIQUE INDEX IF NOT EXISTS uq_mhelix_memory_summaries_session_summary ON mhelix_testwired\.mhelix_memory_summaries \(session_id, memory_summary_id\)/,
      "summaries-composite-unique-index-missing",
    ],
    [/UNIQUE \(action_receipt_id, result_rank\)/, "rank-uniqueness-missing"],
    [
      /UNIQUE \(action_receipt_id, memory_summary_id\)/,
      "receipt-summary-uniqueness-missing",
    ],
    [
      /CHECK \( transport_request_id IS NULL OR transport_request_id ~ '\^\[A-Za-z0-9\._:-\]\{1,128\}\$' \)/,
      "transport-identifier-check-missing",
    ],
    [/CHECK \(NOT public_mutations_enabled\)/, "mutation-claim-guard-missing"],
  ];
  for (const [pattern, violation] of requiredKeys) {
    if (!pattern.test(flat)) {
      violations.push(violation);
    }
  }

  // The vector table must carry no free-text or payload column.
  const embeddingTableMatch = executable.match(
    /CREATE TABLE IF NOT EXISTS mhelix_testwired\.mhelix_memory_summary_embeddings \(([\s\S]*?)\n\);/,
  );
  if (!embeddingTableMatch) {
    violations.push("embedding-table-missing");
  } else {
    const body = embeddingTableMatch[1];
    for (const unsafeColumn of [
      "public_safe_summary",
      "summary_text",
      "content",
      "raw_content",
      "document_bytes",
      "owner_name",
      "deed",
      "mortgage",
      "credential",
      "witness",
      "encryption_key",
      "filecoin",
    ]) {
      if (new RegExp(`\\b${unsafeColumn}\\b`, "i").test(body)) {
        violations.push(`unsafe-column:${unsafeColumn}`);
      }
    }
    const stringColumns = [...body.matchAll(/^\s*(\w+)\s+STRING/gm)].map(
      (match) => match[1],
    );
    if (JSON.stringify(stringColumns) !== JSON.stringify(["embedding_model_id"])) {
      violations.push("unexpected-string-column-in-vector-table");
    }
  }

  return violations;
}

function collectGrantViolations(rawSql) {
  const executable = stripSqlComments(rawSql);
  const violations = [];

  for (const [pattern, violation] of [
    [/ALL PRIVILEGES|GRANT ALL\b/i, "broad-all-privileges"],
    [/ALL TABLES IN SCHEMA/i, "broad-all-tables"],
    [/ALL SEQUENCES IN SCHEMA/i, "broad-all-sequences"],
    [/ALL FUNCTIONS IN SCHEMA/i, "broad-all-functions"],
    [/WITH GRANT OPTION/i, "grantable-privilege"],
    [/WITH ADMIN OPTION/i, "admin-option"],
    [/\bREVOKE\b/i, "revoke-present"],
    [/\bDELETE\b/i, "delete-granted"],
    [/\bTRUNCATE\b/i, "truncate-granted"],
    [/\bDROP\b|\bALTER\b/i, "schema-change-granted"],
    [/SET CLUSTER SETTING/i, "cluster-setting"],
    [/\bBEGIN\b|\bCOMMIT\b/i, "grants-wrapped-in-transaction"],
  ]) {
    if (pattern.test(executable)) {
      violations.push(violation);
    }
  }

  const statements = splitStatements(executable);
  let sawDatabaseConnect = false;
  let sawSchemaUsage = false;

  for (const statement of statements) {
    if (!/^GRANT/i.test(statement)) {
      violations.push(`non-grant-statement:${statement.slice(0, 24)}`);
      continue;
    }
    const flat = collapse(statement);
    const databaseGrant = flat.match(/^GRANT (.+?) ON DATABASE (\S+) TO (\S+)$/i);
    const schemaGrant = flat.match(/^GRANT (.+?) ON SCHEMA (\S+) TO (\S+)$/i);
    const tableGrant = flat.match(/^GRANT (.+?) ON TABLE (\S+) TO (\S+)$/i);

    if (databaseGrant) {
      if (databaseGrant[1].toUpperCase().trim() !== "CONNECT") {
        violations.push(`unexpected-database-privilege:${databaseGrant[1]}`);
      }
      if (databaseGrant[3] !== RUNTIME_ROLE) {
        violations.push(`unexpected-grantee:${databaseGrant[3]}`);
      }
      sawDatabaseConnect = true;
      continue;
    }
    if (schemaGrant) {
      if (schemaGrant[1].toUpperCase().trim() !== "USAGE") {
        violations.push(`unexpected-schema-privilege:${schemaGrant[1]}`);
      }
      if (schemaGrant[3] !== RUNTIME_ROLE) {
        violations.push(`unexpected-grantee:${schemaGrant[3]}`);
      }
      sawSchemaUsage = true;
      continue;
    }
    if (!tableGrant) {
      violations.push(`unparsable-grant:${flat.slice(0, 32)}`);
      continue;
    }

    const [, privilegeList, tableName, grantee] = tableGrant;
    if (!tableName.startsWith(`${QUALIFIED_SCHEMA}.`) || tableName.includes(",")) {
      violations.push(`unqualified-or-multi-table-grant:${tableName}`);
    }
    if (grantee !== RUNTIME_ROLE) {
      violations.push(`unexpected-grantee:${grantee}`);
    }
    for (const privilege of privilegeList
      .split(",")
      .map((entry) => entry.trim().toUpperCase())) {
      // This source-only slice grants SELECT and nothing else. INSERT and
      // UPDATE are deferred until the application executor is reviewed.
      if (privilege !== "SELECT") {
        violations.push(`non-select-privilege:${privilege}:${tableName}`);
      }
    }
  }

  if (!sawDatabaseConnect) {
    violations.push("database-connect-grant-missing");
  }
  if (!sawSchemaUsage) {
    violations.push("schema-usage-grant-missing");
  }
  return violations;
}

function collectVerifierViolations(rawSql) {
  const executable = stripSqlComments(rawSql);
  const withoutLiterals = stripSqlStringLiterals(executable);
  const violations = [];

  if (
    /\b(INSERT|UPSERT|DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE)\b/i.test(
      withoutLiterals,
    ) ||
    /\bUPDATE\s+\w/i.test(withoutLiterals)
  ) {
    violations.push("verifier-not-read-only");
  }
  if (/SELECT\s+\*/i.test(executable)) {
    violations.push("verifier-selects-star");
  }
  // The vacuous pattern: "no rows examined" must never become "true".
  if (VACUOUS_COALESCE_PATTERN.test(executable)) {
    violations.push("vacuous-coalesce-true");
  }
  for (const [pattern, violation] of [
    [/crdb_sql_type\s*=\s*'VECTOR\(8\)'/, "exact-vector-type-check-missing"],
    [/vector_cosine_ops/, "cosine-opclass-check-missing"],
    [/seq_in_index/, "index-order-check-missing"],
    [
      /uq_mhelix_memory_summaries_session_summary/,
      "summaries-unique-index-check-missing",
    ],
    [
      /uq_mhelix_action_receipts_run_receipt_operation/,
      "receipt-identity-index-check-missing",
    ],
    [
      /idx_mhelix_recall_result_items_receipt/,
      "redundant-index-absence-check-missing",
    ],
    [/constraint_type\s*=\s*'FOREIGN KEY'/, "foreign-key-check-missing"],
    [/check_clause/, "check-constraint-verification-missing"],
    [/transport_request_id/, "transport-check-missing"],
    [/EXCEPT/, "two-way-grant-comparison-missing"],
    [/is_grantable/, "grantable-check-missing"],
    [/ON DATABASE mhelix_testwired\]/, "database-connect-check-missing"],
    [/schema_privileges/, "schema-usage-check-missing"],
    [/owner/, "ownership-check-missing"],
    [/SHOW GRANTS ON ROLE FOR/, "role-membership-check-missing"],
  ]) {
    if (!pattern.test(executable)) {
      violations.push(violation);
    }
  }
  return violations;
}

function collectCapabilityViolations(activationSql, verificationSql) {
  const activationExecutable = stripSqlComments(activationSql);
  const verificationExecutable = stripSqlComments(verificationSql);
  const violations = [];

  // The commitment must be derived by the database, never supplied by a
  // caller, and the release commit must be the only bound argument.
  if (!/digest\(/.test(activationExecutable)) {
    violations.push("commitment-not-derived");
  }
  if (/\$2/.test(activationExecutable)) {
    violations.push("caller-supplied-second-argument");
  }
  if (/decode\(\s*\$1/.test(activationExecutable)) {
    violations.push("caller-supplied-commitment");
  }
  if (!/\$1 ~ '\^\[0-9a-f\]\{40\}\$'/.test(activationExecutable)) {
    violations.push("release-commit-format-unchecked");
  }
  if (/\b[0-9a-f]{40}\b/.test(activationExecutable)) {
    violations.push("hardcoded-release-commit");
  }
  if (/UPSERT|ON CONFLICT/i.test(activationExecutable)) {
    violations.push("activation-overwrites");
  }
  if ((activationExecutable.match(/INSERT INTO/g) ?? []).length !== 1) {
    violations.push("activation-not-single-insert");
  }
  for (const requiredPreimageField of [
    "domain=mhelixctw-vector-memory-capability-v1",
    "migration_id=002_testwired_vector_memory",
    "vector_dimension=8",
    "distance_metric=cosine",
    "embedding_model=mhelixctw-synthetic-embedding-v1",
  ]) {
    if (!activationExecutable.includes(requiredPreimageField)) {
      violations.push(`preimage-field-missing:${requiredPreimageField}`);
    }
    if (!verificationExecutable.includes(requiredPreimageField)) {
      violations.push(`verifier-preimage-field-missing:${requiredPreimageField}`);
    }
  }

  // The post-activation verifier must recompute the commitment and pin the
  // exact release rather than accepting a vague latest row.
  if (!/digest\(/.test(verificationExecutable)) {
    violations.push("post-activation-commitment-not-recomputed");
  }
  if (!/release_commit = \$1/.test(verificationExecutable)) {
    violations.push("post-activation-release-not-pinned");
  }
  if (!/release_commit <> \$1/.test(verificationExecutable)) {
    violations.push("stale-release-check-missing");
  }
  if (!/public_mutations_enabled = false/.test(verificationExecutable)) {
    violations.push("mutation-claim-check-missing");
  }
  if (VACUOUS_COALESCE_PATTERN.test(verificationExecutable)) {
    violations.push("vacuous-coalesce-true");
  }
  if (
    /\b(INSERT|UPSERT|DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE)\b/i.test(
      stripSqlStringLiterals(verificationExecutable),
    )
  ) {
    violations.push("post-activation-verifier-not-read-only");
  }
  return violations;
}

function collectWordingViolations(documentText) {
  const violations = [];
  const overstatements = [
    [/cannot be forged/i, "forgery-overclaim"],
    [/prevents every table mutation/i, "mutation-prevention-overclaim"],
    [/proves vector retrieval|retrieval is proven/i, "retrieval-overclaim"],
    [/index is used|uses the vector index\b/i, "index-use-overclaim"],
    [/\b\d+ of \d+ (unsafe )?variants?\b/i, "unreproduced-numeric-claim"],
    [
      /managed-mcp[^.]{0,80}\bis (?:fully |now )?least[- ]privileged/i,
      "managed-mcp-overclaim",
    ],
    [/deterministic embedding generator exists/i, "generator-overclaim"],
  ];
  for (const [pattern, violation] of overstatements) {
    if (pattern.test(documentText)) {
      violations.push(violation);
    }
  }
  return violations;
}

// --------------------------------------------------------------------------
// Positive tests: the committed source must be clean
// --------------------------------------------------------------------------

test("committed migration 002 reports zero source violations", async () => {
  assert.deepEqual(collectMigrationViolations(await readText(MIGRATION_URL)), []);
});

test("committed grant packet reports zero violations and is SELECT only", async () => {
  assert.deepEqual(collectGrantViolations(await readText(GRANTS_URL)), []);
});

test("committed schema verifier reports zero violations and fails closed", async () => {
  assert.deepEqual(
    collectVerifierViolations(await readText(VERIFICATION_URL)),
    [],
  );
});

test("committed capability activation and verification report zero violations", async () => {
  assert.deepEqual(
    collectCapabilityViolations(
      await readText(CAPABILITY_ACTIVATION_URL),
      await readText(CAPABILITY_VERIFICATION_URL),
    ),
    [],
  );
});

test("activation 002 ledger row matches the migration byte for byte", async () => {
  const migrationSource = await readText(MIGRATION_URL);
  const rawActivation = await readText(ACTIVATION_URL);
  const executable = stripSqlComments(rawActivation);

  const expectedChecksum = createHash("sha256")
    .update(migrationSource)
    .digest("hex");
  const expectedStatementCount = splitStatements(
    stripSqlComments(migrationSource),
  ).length;

  assert.match(rawActivation, new RegExp(`'${expectedChecksum}'`));
  assert.match(executable, new RegExp(`\\b${expectedStatementCount}\\b`));
  assert.equal(expectedStatementCount, 7);

  assert.match(executable, /^BEGIN;$/m);
  assert.match(executable, /^COMMIT;$/m);
  assert.equal((executable.match(/INSERT INTO/g) ?? []).length, 1);
  assert.doesNotMatch(executable, /UPSERT|ON CONFLICT/i);
  assert.doesNotMatch(executable, /\b[0-9a-f]{40}\b/);

  // The schema verifier and the capability sources must quote the same
  // checksum, or a stale migration could be certified.
  const verifier = await readText(VERIFICATION_URL);
  const capabilityActivation = await readText(CAPABILITY_ACTIVATION_URL);
  const capabilityVerifier = await readText(CAPABILITY_VERIFICATION_URL);
  for (const document of [verifier, capabilityActivation, capabilityVerifier]) {
    assert.match(document, new RegExp(`'${expectedChecksum}'`));
  }
});

test("published wording makes no unproven claim", async () => {
  for (const documentUrl of [
    MIGRATION_URL,
    GRANTS_URL,
    VERIFICATION_URL,
    CAPABILITY_ACTIVATION_URL,
    CAPABILITY_VERIFICATION_URL,
    MIGRATIONS_README_URL,
    IMPLEMENTATION_STATUS_URL,
  ]) {
    assert.deepEqual(
      collectWordingViolations(await readText(documentUrl)),
      [],
      `unproven claim in ${documentUrl.pathname}`,
    );
  }
});

// --------------------------------------------------------------------------
// Negative tests: each guard must actually reject a broken variant
// --------------------------------------------------------------------------

test("migration guards reject cross-run, wrong-operation, and shape regressions", async () => {
  const migration = await readText(MIGRATION_URL);

  const brokenVariants = [
    [
      "cross-run receipt reference",
      migration.replace(
        /FOREIGN KEY \(run_id, action_receipt_id, operation\)\n    REFERENCES mhelix_testwired\.mhelix_action_receipts\n      \(run_id, action_receipt_id, operation\),/,
        "FOREIGN KEY (action_receipt_id)\n    REFERENCES mhelix_testwired.mhelix_action_receipts (action_receipt_id),",
      ),
      "recall-receipt-binding-not-composite",
    ],
    [
      "non-recall operation permitted",
      migration.replace("CHECK (operation = 'recall'),", ""),
      "recall-operation-literal-missing",
    ],
    [
      "missing composite receipt identity index",
      migration.replace(
        /CREATE UNIQUE INDEX IF NOT EXISTS uq_mhelix_action_receipts_run_receipt_operation\n  ON mhelix_testwired\.mhelix_action_receipts\n    \(run_id, action_receipt_id, operation\);/,
        "",
      ),
      "receipt-composite-identity-index-missing",
    ],
    [
      "redundant receipt-rank index restored",
      `${migration}\nCREATE INDEX IF NOT EXISTS idx_mhelix_recall_result_items_receipt\n  ON mhelix_testwired.mhelix_recall_result_items (action_receipt_id, result_rank);`,
      "redundant-receipt-rank-index-present",
    ],
    [
      "wrong vector dimension",
      migration.replace("VECTOR(8)", "VECTOR(1536)"),
      "vector-dimension-not-exactly-8",
    ],
    [
      "wrong vector index prefix order",
      migration.replace(
        "    run_id,\n    projection_generation_id,\n    embedding vector_cosine_ops",
        "    projection_generation_id,\n    run_id,\n    embedding vector_cosine_ops",
      ),
      "vector-index-prefix-order-or-opclass-wrong",
    ],
    [
      "wrong operator class",
      migration.replace("vector_cosine_ops", "vector_l2_ops"),
      "vector-index-wrong-opclass",
    ],
    [
      "missing summary boundary key",
      migration.replace(
        /FOREIGN KEY \(session_id, memory_summary_id\)\n    REFERENCES mhelix_testwired\.mhelix_memory_summaries\n      \(session_id, memory_summary_id\),/,
        "",
      ),
      "summary-boundary-key-missing",
    ],
    [
      "missing transport identifier check",
      migration.replace(
        /\n    CHECK \(\n      transport_request_id IS NULL\n      OR transport_request_id ~ '\^\[A-Za-z0-9\._:-\]\{1,128\}\$'\n    \)/,
        "",
      ),
      "transport-identifier-check-missing",
    ],
    [
      "unsafe raw content column",
      migration.replace(
        "  embedding_model_id STRING NOT NULL,",
        "  raw_content STRING NOT NULL,\n  embedding_model_id STRING NOT NULL,",
      ),
      "unsafe-column:raw_content",
    ],
    [
      "unqualified table",
      migration.replace(
        "CREATE TABLE IF NOT EXISTS mhelix_testwired.mhelix_recall_result_items",
        "CREATE TABLE IF NOT EXISTS mhelix_recall_result_items",
      ),
      "unqualified-object:mhelix_recall_result_items",
    ],
    [
      "destructive statement appended",
      `${migration}\nDROP TABLE mhelix_testwired.mhelix_recall_result_items;`,
      "destructive-or-privileged:DROP",
    ],
  ];

  for (const [label, brokenSql, expectedViolation] of brokenVariants) {
    assert.notEqual(brokenSql, migration, `variant did not change source: ${label}`);
    assert.ok(
      collectMigrationViolations(brokenSql).includes(expectedViolation),
      `guard missed ${label} (expected ${expectedViolation})`,
    );
  }
});

test("grant guards reject broad, grantable, and write privileges", async () => {
  const grants = await readText(GRANTS_URL);

  const brokenVariants = [
    [
      "runtime UPDATE granted",
      grants.replace(
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_action_receipts",
        "GRANT SELECT, UPDATE ON TABLE mhelix_testwired.mhelix_action_receipts",
      ),
      "non-select-privilege:UPDATE:mhelix_testwired.mhelix_action_receipts",
    ],
    [
      "runtime INSERT granted",
      grants.replace(
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_recall_result_items",
        "GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_recall_result_items",
      ),
      "non-select-privilege:INSERT:mhelix_testwired.mhelix_recall_result_items",
    ],
    [
      "grantable privilege",
      grants.replace(
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_runs\n  TO mhelix_runtime;",
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_runs\n  TO mhelix_runtime WITH GRANT OPTION;",
      ),
      "grantable-privilege",
    ],
    [
      "wildcard schema grant",
      `${grants}\nGRANT SELECT ON ALL TABLES IN SCHEMA mhelix_testwired TO mhelix_runtime;`,
      "broad-all-tables",
    ],
    [
      "grant to public",
      grants.replace(
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_runs\n  TO mhelix_runtime;",
        "GRANT SELECT ON TABLE mhelix_testwired.mhelix_runs\n  TO public;",
      ),
      "unexpected-grantee:public",
    ],
    [
      "missing database connect",
      grants.replace(
        "GRANT CONNECT ON DATABASE mhelix_testwired TO mhelix_runtime;",
        "",
      ),
      "database-connect-grant-missing",
    ],
    [
      "grants wrapped in a transaction",
      `BEGIN;\n${grants}\nCOMMIT;`,
      "grants-wrapped-in-transaction",
    ],
  ];

  for (const [label, brokenSql, expectedViolation] of brokenVariants) {
    assert.notEqual(brokenSql, grants, `variant did not change source: ${label}`);
    assert.ok(
      collectGrantViolations(brokenSql).includes(expectedViolation),
      `guard missed ${label} (expected ${expectedViolation})`,
    );
  }
});

test("verifier guards reject vacuous and incomplete verification", async () => {
  const verifier = await readText(VERIFICATION_URL);

  const brokenVariants = [
    [
      "vacuous coalesce true",
      verifier.replace(
        "       ) = 1 AS ledger_row_is_exact;",
        "       ) = 1 OR coalesce(bool_and(true), true) AS ledger_row_is_exact;",
      ),
      "vacuous-coalesce-true",
    ],
    [
      "exact vector type check removed",
      verifier.replace("crdb_sql_type = 'VECTOR(8)'", "1 = 1"),
      "exact-vector-type-check-missing",
    ],
    [
      "index order check removed",
      verifier.replaceAll("seq_in_index", "ordinal_unused"),
      "index-order-check-missing",
    ],
    [
      "two-way grant comparison removed",
      verifier.replaceAll("EXCEPT", "UNION"),
      "two-way-grant-comparison-missing",
    ],
    [
      "ownership check removed",
      verifier.replaceAll("owner", "unrelated_column"),
      "ownership-check-missing",
    ],
    [
      "role membership check removed",
      verifier.replaceAll("SHOW GRANTS ON ROLE FOR", "SHOW SOMETHING ELSE FOR"),
      "role-membership-check-missing",
    ],
    [
      "grantable check removed",
      verifier.replaceAll("is_grantable", "ignored_flag"),
      "grantable-check-missing",
    ],
    [
      "mutating statement introduced",
      `${verifier}\nDELETE FROM mhelix_testwired.mhelix_recall_result_items;`,
      "verifier-not-read-only",
    ],
  ];

  for (const [label, brokenSql, expectedViolation] of brokenVariants) {
    assert.notEqual(brokenSql, verifier, `variant did not change source: ${label}`);
    assert.ok(
      collectVerifierViolations(brokenSql).includes(expectedViolation),
      `guard missed ${label} (expected ${expectedViolation})`,
    );
  }
});

test("capability guards reject caller-supplied commitments and unpinned releases", async () => {
  const activation = await readText(CAPABILITY_ACTIVATION_URL);
  const verification = await readText(CAPABILITY_VERIFICATION_URL);

  const brokenActivations = [
    [
      "caller-supplied commitment",
      activation.replace("release_commit=' || $1", "release_commit=' || $2"),
      "caller-supplied-second-argument",
    ],
    [
      "hardcoded release commit",
      activation.replace(
        "WHERE $1 ~ '^[0-9a-f]{40}$'",
        "WHERE $1 = '0123456789abcdef0123456789abcdef01234567'",
      ),
      "hardcoded-release-commit",
    ],
    [
      "caller-supplied commitment",
      activation.replaceAll("digest(", "decode($1, 'hex'), unused_digest("),
      "caller-supplied-commitment",
    ],
    [
      "overwrite behavior",
      activation.replace("INSERT INTO", "UPSERT INTO"),
      "activation-overwrites",
    ],
  ];
  for (const [label, brokenSql, expectedViolation] of brokenActivations) {
    assert.notEqual(brokenSql, activation, `variant did not change source: ${label}`);
    assert.ok(
      collectCapabilityViolations(brokenSql, verification).includes(
        expectedViolation,
      ),
      `guard missed ${label} (expected ${expectedViolation})`,
    );
  }

  const brokenVerifications = [
    [
      "release not pinned",
      verification.replaceAll("release_commit = $1", "release_commit IS NOT NULL"),
      "post-activation-release-not-pinned",
    ],
    [
      "commitment not recomputed",
      verification.replaceAll("digest(", "unrelated_function("),
      "post-activation-commitment-not-recomputed",
    ],
    [
      "stale release check removed",
      verification.replaceAll("release_commit <> $1", "false"),
      "stale-release-check-missing",
    ],
  ];
  for (const [label, brokenSql, expectedViolation] of brokenVerifications) {
    assert.notEqual(
      brokenSql,
      verification,
      `variant did not change source: ${label}`,
    );
    assert.ok(
      collectCapabilityViolations(activation, brokenSql).includes(
        expectedViolation,
      ),
      `guard missed ${label} (expected ${expectedViolation})`,
    );
  }
});

test("wording guard rejects overstated claims", async () => {
  const overstatedSamples = [
    ["provenance cannot be forged", "forgery-overclaim"],
    ["this flag prevents every table mutation", "mutation-prevention-overclaim"],
    ["this proves vector retrieval end to end", "retrieval-overclaim"],
    ["the index is used by the recall query", "index-use-overclaim"],
    ["9 of 9 unsafe variants rejected", "unreproduced-numeric-claim"],
    [
      "the managed-mcp identity is fully least-privileged today",
      "managed-mcp-overclaim",
    ],
  ];
  for (const [sample, expectedViolation] of overstatedSamples) {
    assert.ok(
      collectWordingViolations(sample).includes(expectedViolation),
      `wording guard missed: ${sample}`,
    );
  }
});

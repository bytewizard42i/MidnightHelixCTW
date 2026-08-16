// SPDX-License-Identifier: Apache-2.0
//
// Source-contract tests for the migration 002 vector-memory slice.
//
// These tests read committed SQL (Structured Query Language) text only. They
// prove nothing about a live database: no connection, migration, grant, or
// query is performed anywhere in this file. They exist so that a reviewer can
// trust the reviewed source has not drifted, and so that an unsafe pattern
// fails in continuous integration rather than during a live activation.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const MIGRATION_URL = new URL(
  "../../../database/migrations/002_testwired_vector_memory.sql",
  import.meta.url,
);
const ACTIVATION_URL = new URL(
  "../../../database/activation/002_testwired_vector_memory_activation.sql",
  import.meta.url,
);
const GRANTS_URL = new URL(
  "../../../database/activation/002_testwired_vector_memory_grants.sql",
  import.meta.url,
);
const VERIFICATION_URL = new URL(
  "../../../database/activation/verify_vector_memory_activation.sql",
  import.meta.url,
);

const QUALIFIED_SCHEMA = "mhelix_testwired";
const RUNTIME_ROLE = "mhelix_runtime";

// Every guard below must inspect executable SQL only. The reviewed files
// deliberately NAME forbidden patterns in their explanatory comments, so a
// naive whole-file regex would produce false failures.
function stripSqlComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

// A privilege-checking query legitimately COMPARES privilege names such as
// 'DELETE' inside string literals. Those are data, not statements, so keyword
// guards must ignore quoted text or they produce false failures.
function stripSqlStringLiterals(executableSql) {
  return executableSql.replace(/'[^']*'/g, "''");
}

function splitStatements(executableSql) {
  return executableSql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function readExecutable(url) {
  const raw = await readFile(url, "utf8");
  return { raw, executable: stripSqlComments(raw) };
}

test("migration 002 creates only schema-qualified objects", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);

  // Table creation, index targets, alter targets, and every foreign-key
  // target must name the dedicated schema, so correctness never depends on
  // the connection's search path.
  const qualificationTargets = [
    ...executable.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\S+)/g),
    ...executable.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS\s+\S+\s+ON\s+(\S+)/g),
    ...executable.matchAll(/ALTER TABLE\s+(\S+)/g),
    ...executable.matchAll(/REFERENCES\s+([A-Za-z0-9_.]+)/g),
  ];

  assert.ok(
    qualificationTargets.length >= 12,
    "expected the migration to declare tables, indexes, and foreign keys",
  );
  for (const [, target] of qualificationTargets) {
    assert.ok(
      target.startsWith(`${QUALIFIED_SCHEMA}.`),
      `unqualified object reference: ${target}`,
    );
  }
});

test("migration 002 contains no destructive or privileged statement", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);

  // A migration in this repository is additive only. Anything that could
  // remove, rewrite, or re-own committed state belongs to a separately
  // authorized operation, never to this file.
  assert.doesNotMatch(executable, /\bDROP\b/i);
  assert.doesNotMatch(executable, /\bTRUNCATE\b/i);
  assert.doesNotMatch(executable, /\bDELETE\b/i);
  assert.doesNotMatch(executable, /\bUPDATE\b/i);
  assert.doesNotMatch(executable, /\bRENAME\b/i);
  assert.doesNotMatch(executable, /\bOWNER\s+TO\b/i);
  assert.doesNotMatch(executable, /\bGRANT\b/i);
  assert.doesNotMatch(executable, /\bREVOKE\b/i);
  assert.doesNotMatch(executable, /\bSET\s+CLUSTER\s+SETTING\b/i);
  assert.doesNotMatch(executable, /\bCREATE\s+(USER|ROLE|DATABASE)\b/i);
  assert.doesNotMatch(executable, /\bALTER\s+COLUMN\b/i);
  assert.doesNotMatch(executable, /\bUPSERT\b/i);
  assert.doesNotMatch(executable, /\bON\s+CONFLICT\b/i);

  // The only ALTER permitted is the additive, idempotent column addition.
  const alterStatements = splitStatements(executable).filter((statement) =>
    /^ALTER TABLE/i.test(statement),
  );
  assert.equal(alterStatements.length, 1);
  assert.match(alterStatements[0], /ADD COLUMN IF NOT EXISTS/i);
});

test("migration 002 declares the verified vector dimension and cosine operator class", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);

  // The embedding must be an eight-dimensional VECTOR, and the index must be
  // built for the cosine distance operator that the recall query uses.
  // Official syntax: https://www.cockroachlabs.com/docs/v26.2/vector-indexes
  assert.match(executable, /embedding\s+VECTOR\(8\)\s+NOT NULL/);
  assert.match(executable, /embedding_dimensions\s*=\s*8/);
  assert.match(executable, /vector_cosine_ops/);

  // A missing dimension or a default L2 operator class would silently break
  // the intended cosine recall, so both are asserted explicitly.
  assert.doesNotMatch(executable, /VECTOR\s*\(\s*\)/);
  assert.doesNotMatch(executable, /vector_l2_ops/);
  assert.doesNotMatch(executable, /vector_ip_ops/);

  // The vector index must carry BOTH prefix columns before the embedding, in
  // order. A vector index is only usable when every prefix column is
  // constrained to an exact value by the query.
  const vectorIndexMatch = executable.match(
    /VECTOR INDEX\s+(\S+)\s*\(([^)]*)\)/,
  );
  assert.ok(vectorIndexMatch, "expected an inline VECTOR INDEX declaration");
  const indexColumns = vectorIndexMatch[2]
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  assert.deepEqual(indexColumns, [
    "run_id",
    "projection_generation_id",
    "embedding vector_cosine_ops",
  ]);
});

test("migration 002 enforces run, case, session, projection, and summary boundaries", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);

  // Composite foreign keys, not bare single-column keys, are what stop a
  // recall from crossing a run, case, session, projection, or summary
  // boundary.
  const requiredCompositeKeys = [
    /FOREIGN KEY \(case_namespace_id, run_id\)\s*REFERENCES mhelix_testwired\.mhelix_runs\s*\(case_namespace_id, run_id\)/,
    /FOREIGN KEY \(case_namespace_id, run_id, session_id\)\s*REFERENCES mhelix_testwired\.mhelix_memory_sessions\s*\(case_namespace_id, run_id, session_id\)/,
    /FOREIGN KEY \(session_id, memory_summary_id\)\s*REFERENCES mhelix_testwired\.mhelix_memory_summaries\s*\(session_id, memory_summary_id\)/,
    /FOREIGN KEY \(case_namespace_id, projection_generation_id\)\s*REFERENCES mhelix_testwired\.mhelix_projection_generations\s*\(case_namespace_id, projection_generation_id\)/,
    /FOREIGN KEY \(run_id, projection_generation_id, memory_summary_id\)\s*REFERENCES mhelix_testwired\.mhelix_memory_summary_embeddings\s*\(run_id, projection_generation_id, memory_summary_id\)/,
  ];
  for (const requiredKey of requiredCompositeKeys) {
    assert.match(executable.replace(/\s+/g, " "), requiredKey);
  }

  // The composite summary key is only possible because the migration adds a
  // unique index on the existing summaries table. Losing it would silently
  // weaken the session-to-summary boundary to runtime-only.
  assert.match(
    executable.replace(/\s+/g, " "),
    /CREATE UNIQUE INDEX IF NOT EXISTS uq_mhelix_memory_summaries_session_summary ON mhelix_testwired\.mhelix_memory_summaries \(session_id, memory_summary_id\)/,
  );
});

test("migration 002 keeps protected content out of the vector table", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);

  const embeddingTableMatch = executable.match(
    /CREATE TABLE IF NOT EXISTS mhelix_testwired\.mhelix_memory_summary_embeddings \(([\s\S]*?)\n\);/,
  );
  assert.ok(embeddingTableMatch, "expected the embedding table definition");
  const embeddingTableBody = embeddingTableMatch[1];

  // The vector table stores references, one embedding, a fixed model
  // identifier, a commitment, and audit fields. Any free-text or payload
  // column would be a privacy regression, so the unsafe names are rejected
  // outright.
  const forbiddenColumnNames = [
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
  ];
  for (const forbiddenColumnName of forbiddenColumnNames) {
    assert.doesNotMatch(
      embeddingTableBody,
      new RegExp(`\\b${forbiddenColumnName}\\b`, "i"),
      `unsafe column in the vector table: ${forbiddenColumnName}`,
    );
  }

  // No STRING column may exist in the embedding table other than the fixed
  // model identifier, which is pinned by a CHECK to one exact value.
  const stringColumns = [...embeddingTableBody.matchAll(/^\s*(\w+)\s+STRING/gm)]
    .map((match) => match[1]);
  assert.deepEqual(stringColumns, ["embedding_model_id"]);
  assert.match(
    embeddingTableBody,
    /CHECK \(embedding_model_id = 'mhelixctw-synthetic-embedding-v1'\)/,
  );
  assert.match(
    embeddingTableBody,
    /CHECK \(octet_length\(embedding_commitment\) = 32\)/,
  );
});

test("migration 002 makes duplicate durable results impossible", async () => {
  const { executable } = await readExecutable(MIGRATION_URL);
  const collapsed = executable.replace(/\s+/g, " ");

  // One rank per receipt and one summary per receipt: either constraint alone
  // would still permit a duplicated durable result.
  assert.match(collapsed, /UNIQUE \(action_receipt_id, result_rank\)/);
  assert.match(collapsed, /UNIQUE \(action_receipt_id, memory_summary_id\)/);

  // One embedding per summary per projection generation, and per run.
  assert.match(
    collapsed,
    /UNIQUE \(run_id, projection_generation_id, memory_summary_id\)/,
  );
  assert.match(collapsed, /UNIQUE \(projection_generation_id, memory_summary_id\)/);

  // The recall query is bounded to two candidates, so the durable rank is
  // bounded to match. An unbounded rank would let a later change silently
  // store more evidence rows than the reviewed query returns.
  assert.match(collapsed, /CHECK \(result_rank >= 1\)/);
  assert.match(collapsed, /CHECK \(result_rank <= 2\)/);

  // Receipt idempotency from migration 001 must not be weakened, and the
  // added transport identifier must reuse the exact validated handler
  // pattern rather than an invented one.
  assert.match(
    collapsed,
    /ADD COLUMN IF NOT EXISTS transport_request_id STRING CHECK \( transport_request_id IS NULL OR transport_request_id ~ '\^\[A-Za-z0-9\._:-\]\{1,128\}\$' \)/,
  );

  // Public mutations stay impossible at the schema level.
  assert.match(collapsed, /CHECK \(NOT public_mutations_enabled\)/);
  assert.match(collapsed, /public_mutations_enabled BOOL NOT NULL DEFAULT false/);
});

test("activation 002 inserts one ledger row with a checksum that matches the migration byte for byte", async () => {
  const migrationSource = await readFile(MIGRATION_URL, "utf8");
  const { raw, executable } = await readExecutable(ACTIVATION_URL);

  // Recompute both reviewed literals from the migration source, so the
  // activation file can never drift from the file it claims to describe.
  const expectedChecksum = createHash("sha256")
    .update(migrationSource)
    .digest("hex");
  const expectedStatementCount = splitStatements(
    stripSqlComments(migrationSource),
  ).length;

  assert.match(raw, new RegExp(`'${expectedChecksum}'`));
  assert.match(executable, new RegExp(`\\b${expectedStatementCount}\\b`));
  assert.equal(expectedStatementCount, 7);

  // Fail-closed insertion rules: one transaction, exactly one plain INSERT,
  // and no conflict concealment of a pre-existing ledger row.
  assert.match(executable, /^BEGIN;$/m);
  assert.match(executable, /^COMMIT;$/m);
  assert.equal((executable.match(/INSERT INTO/g) ?? []).length, 1);
  assert.match(
    executable,
    /INSERT INTO mhelix_testwired\.mhelix_schema_migrations/,
  );
  assert.doesNotMatch(executable, /UPSERT|ON CONFLICT/i);
  assert.doesNotMatch(executable, /UPDATE|DELETE|TRUNCATE|DROP|ALTER|GRANT/i);

  // No fabricated release commit or placeholder digest may appear. A
  // committed file cannot know the hash of the commit that contains it, so a
  // 40-character hexadecimal literal here would necessarily be invented.
  assert.doesNotMatch(executable, /\b[0-9a-f]{40}\b/);
  assert.doesNotMatch(executable, /(?:ab){16,}|0{40,}/i);
});

test("grants 002 stay least privilege with no grant option and no runs update", async () => {
  const { executable } = await readExecutable(GRANTS_URL);

  // Nothing broad, nothing re-grantable, nothing destructive.
  assert.doesNotMatch(executable, /ALL PRIVILEGES|GRANT ALL\b/i);
  assert.doesNotMatch(executable, /ALL TABLES IN SCHEMA/i);
  assert.doesNotMatch(executable, /ALL SEQUENCES IN SCHEMA/i);
  assert.doesNotMatch(executable, /ALL FUNCTIONS IN SCHEMA/i);
  assert.doesNotMatch(executable, /WITH GRANT OPTION/i);
  assert.doesNotMatch(executable, /WITH ADMIN OPTION/i);
  assert.doesNotMatch(executable, /\bREVOKE\b/i);
  assert.doesNotMatch(executable, /\bDELETE\b/i);
  assert.doesNotMatch(executable, /\bTRUNCATE\b/i);
  assert.doesNotMatch(executable, /\bDROP\b/i);
  assert.doesNotMatch(executable, /\bCREATE\b/i);
  assert.doesNotMatch(executable, /\bALTER\b/i);
  assert.doesNotMatch(executable, /SET CLUSTER SETTING/i);
  assert.doesNotMatch(executable, /\bON DATABASE\b/i);
  assert.doesNotMatch(executable, /\bON SCHEMA\b/i);

  // Parse every grant into privileges and its exact single table target.
  const grantStatements = splitStatements(executable).filter((statement) =>
    /^GRANT/i.test(statement),
  );
  assert.ok(grantStatements.length >= 10);

  const grantedUpdateTables = [];
  for (const grantStatement of grantStatements) {
    const parsed = grantStatement
      .replace(/\s+/g, " ")
      .match(/^GRANT (.+?) ON TABLE (\S+) TO (\S+)$/i);
    assert.ok(parsed, `unparsable grant: ${grantStatement}`);
    const [, privilegeList, tableName, grantee] = parsed;

    // Exactly one fully qualified table per statement, always to the runtime
    // role, never to public.
    assert.ok(tableName.startsWith(`${QUALIFIED_SCHEMA}.`));
    assert.equal(tableName.includes(","), false);
    assert.equal(grantee, RUNTIME_ROLE);
    assert.notEqual(grantee, "public");

    const privileges = privilegeList
      .split(",")
      .map((privilege) => privilege.trim().toUpperCase());
    for (const privilege of privileges) {
      assert.ok(
        ["SELECT", "INSERT", "UPDATE"].includes(privilege),
        `unexpected privilege ${privilege} on ${tableName}`,
      );
    }
    if (privileges.includes("UPDATE")) {
      grantedUpdateTables.push(tableName.split(".")[1]);
    }
  }

  // UPDATE is allowed on exactly three tables, and runs is not one of them.
  assert.deepEqual(grantedUpdateTables.sort(), [
    "mhelix_action_receipts",
    "mhelix_memory_sessions",
    "mhelix_projection_generations",
  ]);

  // Ranked recall results are immutable by privilege.
  const recallGrant = grantStatements.find((statement) =>
    statement.includes("mhelix_recall_result_items"),
  );
  assert.ok(recallGrant);
  assert.doesNotMatch(recallGrant, /UPDATE/i);
});

test("verification 002 is read-only and echoes no stored value", async () => {
  const { raw, executable } = await readExecutable(VERIFICATION_URL);

  // Read-only: no mutating statement of any kind. Quoted privilege names are
  // stripped first, because this file compares them as data.
  const executableWithoutLiterals = stripSqlStringLiterals(executable);
  assert.doesNotMatch(
    executableWithoutLiterals,
    /\b(INSERT|UPSERT|DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE)\b/i,
  );
  assert.doesNotMatch(executableWithoutLiterals, /\bUPDATE\s+\w/i);
  assert.doesNotMatch(executable, /SELECT\s+\*/i);

  // The stored embedding, its commitment, and the summary bytes must never be
  // returned as bare columns in a shareable transcript.
  assert.doesNotMatch(executable, /SELECT\s+embedding\b/i);
  assert.doesNotMatch(executable, /,\s*embedding\s*[,\n]/);
  assert.doesNotMatch(executable, /,\s*embedding_commitment\s*[,\n]/);
  assert.doesNotMatch(executable, /encode\(\s*embedding/i);

  // Fail-closed emptiness and least-privilege proofs must both be present.
  assert.match(executable, /runtime_capabilities_empty/);
  assert.match(executable, /recall_result_items_empty/);
  assert.match(executable, /runtime_has_no_update_on_runs/);
  assert.match(executable, /runtime_holds_no_grant_option/);

  // The recall and EXPLAIN templates stay commented, because they need values
  // no committed file may fabricate. If either became executable, this file
  // would stop being a safe read-only verification.
  const executableStatements = splitStatements(executable);
  for (const statement of executableStatements) {
    assert.match(statement, /^SELECT/i);
  }
  assert.match(raw, /--\s*EXPLAIN/);
  assert.match(raw, /NO INDEX-USE CLAIM IS MADE/);
});

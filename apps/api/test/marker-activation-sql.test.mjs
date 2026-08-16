// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX,
  MHELIX_ENVIRONMENT_MARKER_MANIFEST,
} from "../src/environment-marker.js";

const ACTIVATION_SQL_URL = new URL(
  "../../../database/activation/001_testwired_marker_activation.sql",
  import.meta.url,
);
const VERIFICATION_SQL_URL = new URL(
  "../../../database/activation/verify_marker_activation.sql",
  import.meta.url,
);

// Statement-level guards must inspect executable SQL (Structured Query
// Language) only, not the explanatory comments that name forbidden patterns.
function stripSqlComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

test("activation SQL projects only the canonical marker contract", async () => {
  const activationSql = await readFile(ACTIVATION_SQL_URL, "utf8");
  const manifest = MHELIX_ENVIRONMENT_MARKER_MANIFEST;

  // Every reviewed literal must appear exactly as the contract defines it.
  assert.match(activationSql, new RegExp(`'${manifest.migrationId}'`));
  assert.match(activationSql, new RegExp(`'${manifest.sourceFileName}'`));
  assert.match(activationSql, new RegExp(`'${manifest.migrationSha256}'`));
  assert.match(
    activationSql,
    new RegExp(`\\b${manifest.statementCount}\\b`),
  );
  assert.match(activationSql, new RegExp(`'${manifest.markerId}'`));
  assert.match(activationSql, new RegExp(`'${manifest.buildStage}'`));
  assert.match(
    activationSql,
    new RegExp(`'${MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX}'`),
  );

  // The inserted commitment must be the derived contract value, never the
  // migration checksum or a placeholder.
  assert.notEqual(
    MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX,
    manifest.migrationSha256,
  );
  assert.doesNotMatch(activationSql, /ab{63}|(?:ab){32}/i);

  // Fail-closed insertion rules: one transaction, plain INSERT statements
  // only, and no conflict concealment.
  const executableSql = stripSqlComments(activationSql);
  assert.match(executableSql, /^BEGIN;$/m);
  assert.match(executableSql, /^COMMIT;$/m);
  assert.equal((executableSql.match(/INSERT INTO/g) ?? []).length, 2);
  assert.doesNotMatch(executableSql, /UPSERT|ON CONFLICT/i);
  assert.doesNotMatch(executableSql, /UPDATE|DELETE|TRUNCATE|DROP|ALTER/);

  // Only the two intended tables are touched.
  assert.match(
    executableSql,
    /INSERT INTO mhelix_testwired\.mhelix_schema_migrations/,
  );
  assert.match(
    executableSql,
    /INSERT INTO mhelix_testwired\.mhelix_environment_markers/,
  );
});

test("verification SQL compares values and never echoes stored bytes", async () => {
  const verificationSql = await readFile(VERIFICATION_SQL_URL, "utf8");
  const manifest = MHELIX_ENVIRONMENT_MARKER_MANIFEST;

  // Expected values appear as comparands.
  assert.match(
    verificationSql,
    new RegExp(`'${MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX}'`),
  );
  assert.match(verificationSql, new RegExp(`'${manifest.migrationSha256}'`));
  assert.match(verificationSql, new RegExp(`'${manifest.markerId}'`));
  assert.match(verificationSql, new RegExp(`'${manifest.migrationId}'`));
  assert.match(verificationSql, new RegExp(`'${manifest.sourceFileName}'`));
  assert.match(verificationSql, new RegExp(`'${manifest.buildStage}'`));
  assert.match(
    verificationSql,
    new RegExp(`marker_version\\s*=\\s*${manifest.markerVersion}`),
  );
  assert.match(
    verificationSql,
    new RegExp(`statement_count\\s*=\\s*${manifest.statementCount}`),
  );

  // Both queries collapse zero, one, or unexpected duplicate matches into a
  // single boolean-only evidence row. Missing rows must become false rather
  // than a misleading empty result or SQL (Structured Query Language) NULL.
  assert.equal(
    (verificationSql.match(/count\(\*\) = 1 AS exactly_one_/g) ?? []).length,
    2,
  );
  assert.match(verificationSql, /coalesce\(bool_and\(/);
  assert.match(verificationSql, /evidence_receipt_id IS NOT NULL/);
  assert.match(verificationSql, /installed_at IS NOT NULL/);
  assert.match(verificationSql, /applied_at IS NOT NULL/);

  // Read-only: no mutating statement of any kind.
  const executableSql = stripSqlComments(verificationSql);
  assert.doesNotMatch(
    executableSql,
    /INSERT|UPSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE/,
  );

  // Every encode() of a stored byte column must feed an equality comparison,
  // so the stored commitment is never returned as a bare column.
  const encodeUses = executableSql.match(/encode\([^)]*\)[^\n]*/g) ?? [];
  assert.equal(encodeUses.length > 0, true);
  for (const encodeUse of encodeUses) {
    assert.match(encodeUse, /=/);
  }
  assert.doesNotMatch(verificationSql, /AS marker_commitment_hex/i);
  assert.doesNotMatch(verificationSql, /SELECT\s+\*/i);
  assert.doesNotMatch(verificationSql, /,\s*marker_commitment\s*[,\n]/);
  assert.doesNotMatch(verificationSql, /,\s*source_checksum\s*[,\n]/);
  assert.doesNotMatch(executableSql, /^\s*SELECT\s+marker_id\b/im);
  assert.doesNotMatch(executableSql, /^\s*SELECT\s+migration_id\b/im);
  assert.doesNotMatch(executableSql, /,\s*build_stage\s*[,\n]/);
  assert.doesNotMatch(executableSql, /,\s*marker_version\s*[,\n]/);
  assert.doesNotMatch(executableSql, /,\s*installed_at\s*[,\n]/);
  assert.doesNotMatch(executableSql, /,\s*applied_at\s*[,\n]/);
});

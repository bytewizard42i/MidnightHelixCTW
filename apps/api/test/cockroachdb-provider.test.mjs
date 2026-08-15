// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createCockroachDbProvider,
  MHELIX_COCKROACH_PROBE_SCHEMA_VERSION,
  MHELIX_ENVIRONMENT_MARKER_ID,
} from "../src/cockroachdb-provider.js";

const EXPECTED_DATABASE_NAME = "mhelix_testwired_private";
const EXPECTED_RUNTIME_USER = "mhelix_runtime_private";
const EXPECTED_MARKER_COMMITMENT_HEX = "ab".repeat(32);
const EVIDENCE_RECEIPT_ID = "019f1234-5678-7890-8abc-def012345678";
const STATEMENT_TIMEOUT_MILLISECONDS = 1_000;
const PRIVATE_FAILURE_SENTINEL =
  "MHELIX_PRIVATE_DRIVER_FAILURE_SENTINEL_7f46a3c291";

function validProbeRow(overrides = {}) {
  return {
    database_matches: true,
    runtime_user_matches: true,
    marker_id: MHELIX_ENVIRONMENT_MARKER_ID,
    build_stage: "TESTWIRED",
    marker_version: "1",
    marker_commitment_matches: true,
    evidence_receipt_id: EVIDENCE_RECEIPT_ID,
    observed_at: new Date("2026-08-15T12:30:45.000Z"),
    ...overrides,
  };
}

test("probe verifies server identity without returning database or role names", async () => {
  const calls = [];
  const provider = createCockroachDbProvider({
    queryExecutor: {
      async query(statement, parameters, options) {
        calls.push({ statement, parameters, options });
        return { rows: [validProbeRow()] };
      },
    },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  });

  const proof = await provider.probe();
  assert.deepEqual(proof, {
    schemaVersion: MHELIX_COCKROACH_PROBE_SCHEMA_VERSION,
    connected: true,
    receiptId: EVIDENCE_RECEIPT_ID,
    observedAt: "2026-08-15T12:30:45.000Z",
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].statement, /current_database\(\) = \$1/);
  assert.match(calls[0].statement, /current_user = \$2/);
  assert.match(
    calls[0].statement,
    /encode\(marker_commitment, 'hex'\) = \$4 AS marker_commitment_matches/,
  );
  assert.match(
    calls[0].statement,
    /FROM mhelix_testwired\.mhelix_environment_markers/,
  );
  assert.doesNotMatch(calls[0].statement, /AS marker_commitment_hex/);
  assert.deepEqual(calls[0].parameters, [
    EXPECTED_DATABASE_NAME,
    EXPECTED_RUNTIME_USER,
    MHELIX_ENVIRONMENT_MARKER_ID,
    EXPECTED_MARKER_COMMITMENT_HEX,
  ]);
  assert.deepEqual(calls[0].options, {
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  });

  const serializedProof = JSON.stringify(proof);
  assert.doesNotMatch(serializedProof, /mhelix_testwired_private/);
  assert.doesNotMatch(serializedProof, /mhelix_runtime_private/);
  assert.doesNotMatch(serializedProof, /postgresql:\/\//);
  assert.doesNotMatch(
    serializedProof,
    new RegExp(EXPECTED_MARKER_COMMITMENT_HEX),
  );
});

test("identity mismatch, malformed evidence, and driver failures fail closed", async () => {
  for (const rows of [
    [],
    [validProbeRow({ database_matches: false })],
    [validProbeRow({ runtime_user_matches: false })],
    [validProbeRow(), validProbeRow()],
  ]) {
    const provider = createCockroachDbProvider({
      queryExecutor: {
        async query() {
          return { rows };
        },
      },
      expectedDatabaseName: EXPECTED_DATABASE_NAME,
      expectedRuntimeUser: EXPECTED_RUNTIME_USER,
      expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
      statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
    });
    await assert.rejects(
      provider.probe(),
      /^Error: CockroachDB connection and environment probe failed closed\.$/,
    );
  }

  const driverFailureProvider = createCockroachDbProvider({
    queryExecutor: {
      async query() {
        throw new Error(PRIVATE_FAILURE_SENTINEL);
      },
    },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  });
  await assert.rejects(driverFailureProvider.probe(), (error) => {
    assert.equal(
      error.message,
      "CockroachDB connection and environment probe failed closed.",
    );
    assert.doesNotMatch(error.message, new RegExp(PRIVATE_FAILURE_SENTINEL));
    return true;
  });
});

test("marker commitment mismatch fails closed without exposing either commitment", async () => {
  const provider = createCockroachDbProvider({
    queryExecutor: {
      async query() {
        return {
          rows: [validProbeRow({ marker_commitment_matches: false })],
        };
      },
    },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  });

  await assert.rejects(provider.probe(), (error) => {
    assert.equal(
      error.message,
      "CockroachDB connection and environment probe failed closed.",
    );
    assert.doesNotMatch(
      error.message,
      new RegExp(EXPECTED_MARKER_COMMITMENT_HEX),
    );
    return true;
  });
});

test("rapid concurrent probes share one underlying query", async () => {
  let resolveQuery;
  let queryCount = 0;
  const pendingQuery = new Promise((resolve) => {
    resolveQuery = resolve;
  });
  const provider = createCockroachDbProvider({
    queryExecutor: {
      query() {
        queryCount += 1;
        return pendingQuery;
      },
    },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  });

  const probePromises = [provider.probe(), provider.probe(), provider.probe()];
  await Promise.resolve();
  assert.equal(queryCount, 1);

  resolveQuery({ rows: [validProbeRow()] });
  const proofs = await Promise.all(probePromises);
  assert.equal(queryCount, 1);
  assert.deepEqual(proofs[0], proofs[1]);
  assert.deepEqual(proofs[1], proofs[2]);
});

test("outer timeout rejects late results without accumulating queries", async () => {
  let resolveQuery;
  let queryCount = 0;
  const pendingQuery = new Promise((resolve) => {
    resolveQuery = resolve;
  });
  const provider = createCockroachDbProvider({
    queryExecutor: {
      query() {
        queryCount += 1;
        if (queryCount === 1) {
          return pendingQuery;
        }

        return Promise.resolve({ rows: [validProbeRow()] });
      },
    },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
    statementTimeoutMilliseconds: 50,
    probeTimeoutMilliseconds: 100,
  });

  await assert.rejects(
    provider.probe(),
    /^Error: CockroachDB connection and environment probe failed closed\.$/,
  );
  const retryResults = await Promise.allSettled([
    provider.probe(),
    provider.probe(),
    provider.probe(),
  ]);
  assert.equal(queryCount, 1);
  assert.ok(retryResults.every((result) => result.status === "rejected"));

  resolveQuery({ rows: [validProbeRow()] });
  await new Promise((resolve) => setImmediate(resolve));

  const recoveredProof = await provider.probe();
  assert.equal(queryCount, 2);
  assert.equal(recoveredProof.connected, true);
});

test("server-side statement timeout is mandatory and precedes the outer timeout", () => {
  const baseOptions = {
    queryExecutor: { query: async () => ({ rows: [validProbeRow()] }) },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    expectedMarkerCommitmentHex: EXPECTED_MARKER_COMMITMENT_HEX,
  };

  assert.throws(
    () => createCockroachDbProvider(baseOptions),
    /statementTimeoutMilliseconds/,
  );
  assert.throws(
    () =>
      createCockroachDbProvider({
        ...baseOptions,
        statementTimeoutMilliseconds: 100,
        probeTimeoutMilliseconds: 100,
      }),
    /must be less than probeTimeoutMilliseconds/,
  );
});

test("expected marker commitment is required and strictly lowercase hexadecimal", () => {
  const baseOptions = {
    queryExecutor: { query: async () => ({ rows: [validProbeRow()] }) },
    expectedDatabaseName: EXPECTED_DATABASE_NAME,
    expectedRuntimeUser: EXPECTED_RUNTIME_USER,
    statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
  };

  for (const malformedCommitment of [
    undefined,
    "",
    "ab".repeat(31),
    "AB".repeat(32),
    "g".repeat(64),
  ]) {
    assert.throws(
      () =>
        createCockroachDbProvider({
          ...baseOptions,
          expectedMarkerCommitmentHex: malformedCommitment,
        }),
      /expectedMarkerCommitmentHex/,
    );
  }
});

test("migration source is additive, synthetic-only, and contains the core guards", async () => {
  const migrationSource = await readFile(
    new URL(
      "../../../database/migrations/001_testwired_memory_core.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    migrationSource,
    /^[ \\t]*(?:DROP|TRUNCATE|DELETE|CREATE[ \\t]+USER|GRANT|REVOKE|INSERT|UPSERT)\\b/im,
  );
  assert.match(
    migrationSource,
    /^CREATE SCHEMA IF NOT EXISTS mhelix_testwired;$/m,
  );
  for (const requiredTable of [
    "mhelix_schema_migrations",
    "mhelix_environment_markers",
    "mhelix_case_namespaces",
    "mhelix_runs",
    "mhelix_memory_sessions",
    "mhelix_memory_events",
    "mhelix_memory_summaries",
    "mhelix_projection_generations",
    "mhelix_active_projections",
    "mhelix_action_receipts",
  ]) {
    assert.match(
      migrationSource,
      new RegExp(
        "CREATE TABLE IF NOT EXISTS mhelix_testwired\\." +
          requiredTable +
          "\\b",
      ),
    );
  }
  assert.match(migrationSource, /CHECK \(protected_fields_returned = 0\)/);
  assert.match(migrationSource, /UNIQUE \(run_id, session_ordinal\)/);
  assert.match(
    migrationSource,
    /FOREIGN KEY \(case_namespace_id, run_id, session_id\)/,
  );
  assert.match(
    migrationSource,
    /FOREIGN KEY \(session_id, through_event_sequence\)[\s\S]*?REFERENCES mhelix_testwired\.mhelix_memory_events\s+\(session_id, event_sequence\)/,
  );
  assert.doesNotMatch(
    migrationSource,
    /^[ \\t]*(?:database_name|expected_runtime_user)[ \\t]+STRING\\b/im,
  );
  assert.match(
    migrationSource,
    /CHECK \(octet_length\(idempotency_key_hash\) = 32\)/,
  );
  const operationCheck = migrationSource.match(
    /CHECK \(operation IN \(([\s\S]*?)\)\)/,
  );
  assert.ok(operationCheck, "action receipts require an operation allowlist");
  assert.deepEqual(
    [...operationCheck[1].matchAll(/'([^']+)'/g)].map((match) => match[1]),
    [
      "create_run",
      "close_session",
      "recall",
      "verify_unencumbered",
      "attempt_protected_disclosure",
      "rebuild_recall_projection",
    ],
  );
  const referencedTables = [
    ...migrationSource.matchAll(/\bREFERENCES\s+([A-Za-z0-9_.]+)/g),
  ].map((match) => match[1]);
  assert.ok(referencedTables.length > 0);
  assert.ok(
    referencedTables.every((tableName) =>
      tableName.startsWith("mhelix_testwired."),
    ),
  );

  const indexedTables = [
    ...migrationSource.matchAll(
      /CREATE INDEX IF NOT EXISTS[\s\S]*?\bON\s+([A-Za-z0-9_.]+)/g,
    ),
  ].map((match) => match[1]);
  assert.ok(indexedTables.length > 0);
  assert.ok(
    indexedTables.every((tableName) =>
      tableName.startsWith("mhelix_testwired."),
    ),
  );
  assert.doesNotMatch(
    migrationSource,
    /\b(?:CREATE TABLE IF NOT EXISTS|ON|REFERENCES)\s+mhelix_(?!testwired\.)/,
  );
  assert.doesNotMatch(migrationSource, /\bVECTOR\s*\(/i);
});

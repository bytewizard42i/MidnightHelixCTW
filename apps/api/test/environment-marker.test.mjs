// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createMhelixEnvironmentMarkerPreimageBytes,
  deriveMhelixEnvironmentMarkerCommitmentHex,
  MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
  MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX,
  MHELIX_ENVIRONMENT_MARKER_ID,
  MHELIX_ENVIRONMENT_MARKER_MANIFEST,
  MHELIX_ENVIRONMENT_MARKER_VERSION,
  serializeMhelixEnvironmentMarkerPreimage,
} from "../src/environment-marker.js";
import {
  MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE as PROVIDER_MARKER_BUILD_STAGE,
  MHELIX_ENVIRONMENT_MARKER_ID as PROVIDER_MARKER_ID,
  MHELIX_ENVIRONMENT_MARKER_VERSION as PROVIDER_MARKER_VERSION,
} from "../src/cockroachdb-provider.js";

const EXPECTED_MIGRATION_SHA256 =
  "e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b";
const EXPECTED_MARKER_COMMITMENT_HEX =
  "ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198";
const EXPECTED_PREIMAGE = [
  "mhelixctw/environment-marker/v1",
  "marker_id=mhelixctw-testwired-environment",
  "build_stage=TESTWIRED",
  "marker_version=1",
  "migration_id=001_testwired_memory_core",
  "source_file_name=database/migrations/001_testwired_memory_core.sql",
  `migration_sha256=${EXPECTED_MIGRATION_SHA256}`,
  "statement_count=16",
].join("\n");

const migrationSourceUrl = new URL(
  "../../../database/migrations/001_testwired_memory_core.sql",
  import.meta.url,
);

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("canonical marker manifest owns every reviewed machine value", () => {
  assert.equal(Object.isFrozen(MHELIX_ENVIRONMENT_MARKER_MANIFEST), true);
  assert.deepEqual(MHELIX_ENVIRONMENT_MARKER_MANIFEST, {
    domainSeparator: "mhelixctw/environment-marker/v1",
    markerId: "mhelixctw-testwired-environment",
    buildStage: "TESTWIRED",
    markerVersion: 1,
    migrationId: "001_testwired_memory_core",
    sourceFileName: "database/migrations/001_testwired_memory_core.sql",
    migrationSha256: EXPECTED_MIGRATION_SHA256,
    statementCount: 16,
  });
  assert.match(
    MHELIX_ENVIRONMENT_MARKER_MANIFEST.sourceFileName,
    /^(?!\.\/)(?!\/)[A-Za-z0-9._/-]+$/,
  );
  assert.doesNotMatch(
    MHELIX_ENVIRONMENT_MARKER_MANIFEST.sourceFileName,
    /\\/,
  );
});

test("canonical marker preimage has exact bytes and commitment", () => {
  const preimage = serializeMhelixEnvironmentMarkerPreimage();
  const preimageBytes = createMhelixEnvironmentMarkerPreimageBytes();

  assert.equal(preimage, EXPECTED_PREIMAGE);
  assert.equal(preimage.split("\n").length, 8);
  assert.equal(preimage.endsWith("\n"), false);
  assert.doesNotMatch(preimage, /\r|\t| $/m);
  assert.equal(
    preimageBytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    false,
  );
  assert.equal(preimageBytes.toString("utf8"), EXPECTED_PREIMAGE);

  const independentlyDerivedCommitment = sha256Hex(preimageBytes);
  assert.equal(independentlyDerivedCommitment, EXPECTED_MARKER_COMMITMENT_HEX);
  assert.equal(
    deriveMhelixEnvironmentMarkerCommitmentHex(),
    EXPECTED_MARKER_COMMITMENT_HEX,
  );
  assert.equal(
    MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX,
    EXPECTED_MARKER_COMMITMENT_HEX,
  );
  assert.match(MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX, /^[0-9a-f]{64}$/);
  assert.equal(
    Buffer.from(MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX, "hex").length,
    32,
  );
});

test("migration bytes and reviewed statement metadata remain bound", async () => {
  const migrationSourceBytes = await readFile(migrationSourceUrl);
  const migrationSource = migrationSourceBytes.toString("utf8");

  assert.equal(sha256Hex(migrationSourceBytes), EXPECTED_MIGRATION_SHA256);
  assert.equal(
    sha256Hex(migrationSourceBytes),
    MHELIX_ENVIRONMENT_MARKER_MANIFEST.migrationSha256,
  );

  // This is a migration-specific sanity check, not a general SQL (Structured
  // Query Language) parser. The raw source digest above is the byte-level gate.
  const createSchemaCount =
    migrationSource.match(/^CREATE SCHEMA\b/gmu)?.length ?? 0;
  const createTableCount =
    migrationSource.match(/^CREATE TABLE\b/gmu)?.length ?? 0;
  const createIndexCount =
    migrationSource.match(/^CREATE INDEX\b/gmu)?.length ?? 0;
  const statementTerminatorCount =
    migrationSource.match(/;[ \t]*$/gmu)?.length ?? 0;

  assert.equal(createSchemaCount, 1);
  assert.equal(createTableCount, 10);
  assert.equal(createIndexCount, 5);
  assert.equal(statementTerminatorCount, 16);
  assert.equal(
    createSchemaCount + createTableCount + createIndexCount,
    MHELIX_ENVIRONMENT_MARKER_MANIFEST.statementCount,
  );
});

test("provider consumes canonical marker identity fields", () => {
  assert.equal(PROVIDER_MARKER_ID, MHELIX_ENVIRONMENT_MARKER_ID);
  assert.equal(
    PROVIDER_MARKER_BUILD_STAGE,
    MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
  );
  assert.equal(PROVIDER_MARKER_VERSION, MHELIX_ENVIRONMENT_MARKER_VERSION);
});

test("format drift produces a different commitment", () => {
  const lines = EXPECTED_PREIMAGE.split("\n");
  const driftedPreimages = [
    `${EXPECTED_PREIMAGE}\n`,
    lines.join("\r\n"),
    `\ufeff${EXPECTED_PREIMAGE}`,
    EXPECTED_PREIMAGE.replace(lines[1], `${lines[1]} `),
    [lines[0], lines[2], lines[1], ...lines.slice(3)].join("\n"),
  ];

  for (const driftedPreimage of driftedPreimages) {
    assert.notEqual(
      sha256Hex(Buffer.from(driftedPreimage, "utf8")),
      EXPECTED_MARKER_COMMITMENT_HEX,
    );
  }
});

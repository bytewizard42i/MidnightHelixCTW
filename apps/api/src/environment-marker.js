// SPDX-License-Identifier: Apache-2.0

import { createHash } from "node:crypto";

/**
 * The single handwritten machine-readable authority for the TestWired
 * environment marker. Database rows and deployment settings are projections
 * of this manifest. They must never become alternate sources of truth.
 */
export const MHELIX_ENVIRONMENT_MARKER_MANIFEST = Object.freeze({
  domainSeparator: "mhelixctw/environment-marker/v1",
  markerId: "mhelixctw-testwired-environment",
  buildStage: "TESTWIRED",
  markerVersion: 1,
  migrationId: "001_testwired_memory_core",
  sourceFileName: "database/migrations/001_testwired_memory_core.sql",
  migrationSha256:
    "e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b",
  statementCount: 16,
});

export const MHELIX_ENVIRONMENT_MARKER_ID =
  MHELIX_ENVIRONMENT_MARKER_MANIFEST.markerId;
export const MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE =
  MHELIX_ENVIRONMENT_MARKER_MANIFEST.buildStage;
export const MHELIX_ENVIRONMENT_MARKER_VERSION =
  MHELIX_ENVIRONMENT_MARKER_MANIFEST.markerVersion;

/**
 * Serialize the canonical eight-line UTF-8 (Unicode Transformation Format
 * 8-bit) preimage. LF (line feed) separates fields. There is no trailing LF
 * (line feed), CR (carriage return), BOM (byte order mark), space, or tab.
 */
export function serializeMhelixEnvironmentMarkerPreimage() {
  const manifest = MHELIX_ENVIRONMENT_MARKER_MANIFEST;

  return [
    manifest.domainSeparator,
    `marker_id=${manifest.markerId}`,
    `build_stage=${manifest.buildStage}`,
    `marker_version=${manifest.markerVersion}`,
    `migration_id=${manifest.migrationId}`,
    `source_file_name=${manifest.sourceFileName}`,
    `migration_sha256=${manifest.migrationSha256}`,
    `statement_count=${manifest.statementCount}`,
  ].join("\n");
}

/**
 * Return a new buffer so callers cannot mutate shared canonical bytes.
 */
export function createMhelixEnvironmentMarkerPreimageBytes() {
  return Buffer.from(serializeMhelixEnvironmentMarkerPreimage(), "utf8");
}

/**
 * Derive the public SHA-256 (Secure Hash Algorithm 256-bit) commitment from
 * the canonical bytes. This value detects configuration drift. It is not a
 * secret, signature, writer identity, or proof that the migration executed.
 */
export function deriveMhelixEnvironmentMarkerCommitmentHex() {
  return createHash("sha256")
    .update(createMhelixEnvironmentMarkerPreimageBytes())
    .digest("hex");
}

export const MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX =
  deriveMhelixEnvironmentMarkerCommitmentHex();

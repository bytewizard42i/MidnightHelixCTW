// SPDX-License-Identifier: Apache-2.0

import {
  MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
  MHELIX_ENVIRONMENT_MARKER_ID,
  MHELIX_ENVIRONMENT_MARKER_VERSION,
} from "./environment-marker.js";

/**
 * This module deliberately depends on a tiny query-executor interface instead
 * of a database driver. A separately reviewed bootstrap provides an adapter
 * around a bounded node-postgres pool. That adapter must implement this
 * interface and enforce statementTimeoutMilliseconds on the database server.
 *
 * @typedef {{
 *   query(
 *     statement: string,
 *     parameters: readonly unknown[],
 *     options: { statementTimeoutMilliseconds: number },
 *   ): Promise<{ rows: readonly Record<string, unknown>[] }>
 * }} CockroachQueryExecutor
 */

export {
  MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
  MHELIX_ENVIRONMENT_MARKER_ID,
  MHELIX_ENVIRONMENT_MARKER_VERSION,
};
export const MHELIX_COCKROACH_PROBE_SCHEMA_VERSION =
  "mhelixctw/cockroach-probe/v1";

export const MHELIX_COCKROACH_PROBE_RESULT_COLUMNS = Object.freeze([
  "database_matches",
  "runtime_user_matches",
  "marker_commitment_matches",
  "marker_id",
  "build_stage",
  "marker_version",
  "evidence_receipt_id",
  "observed_at",
]);

export const MHELIX_COCKROACH_PROBE_STATEMENT = [
  "SELECT current_database() = $1 AS database_matches,",
  "       current_user = $2 AS runtime_user_matches,",
  "       encode(marker_commitment, 'hex') = $4 AS marker_commitment_matches,",
  "       marker_id,",
  "       build_stage,",
  "       marker_version,",
  "       evidence_receipt_id::STRING AS evidence_receipt_id,",
  "       now() AS observed_at",
  "  FROM mhelix_testwired.mhelix_environment_markers",
  " WHERE marker_id = $3",
  " LIMIT 2",
].join("\n");

const SAFE_CONFIGURATION_VALUE_PATTERN = /^[^\u0000-\u001F\u007F]{1,128}$/u;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireSafeConfigurationValue(value, label) {
  if (typeof value !== "string" || !SAFE_CONFIGURATION_VALUE_PATTERN.test(value)) {
    throw new TypeError(label + " must be a bounded non-control string.");
  }

  return value;
}

function requireExpectedMarkerCommitmentHex(value) {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    throw new TypeError(
      "expectedMarkerCommitmentHex must be exactly 64 lowercase hexadecimal characters.",
    );
  }

  return value;
}

function readProbeTimeoutMilliseconds(value) {
  if (value === undefined) {
    return 1_500;
  }

  if (!Number.isSafeInteger(value) || value < 100 || value > 5_000) {
    throw new TypeError(
      "probeTimeoutMilliseconds must be an integer between 100 and 5000.",
    );
  }

  return value;
}

function readStatementTimeoutMilliseconds(value, probeTimeoutMilliseconds) {
  if (!Number.isSafeInteger(value) || value < 50 || value > 4_999) {
    throw new TypeError(
      "statementTimeoutMilliseconds must be an integer between 50 and 4999.",
    );
  }

  if (value >= probeTimeoutMilliseconds) {
    throw new TypeError(
      "statementTimeoutMilliseconds must be less than probeTimeoutMilliseconds.",
    );
  }

  return value;
}

async function awaitBeforeDeadline(operationPromise, deadlineMilliseconds) {
  const remainingMilliseconds = deadlineMilliseconds - Date.now();
  if (remainingMilliseconds <= 0) {
    throw new Error("CockroachDB connection and environment probe timed out.");
  }

  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error("CockroachDB connection and environment probe timed out."),
      );
    }, remainingMilliseconds);
  });

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function normalizeObservedAt(value) {
  const observedDate = value instanceof Date ? value : new Date(String(value));
  if (!Number.isFinite(observedDate.getTime())) {
    throw new Error("CockroachDB probe returned an invalid observation time.");
  }

  return observedDate.toISOString();
}

function validateProbeRow(row) {
  if (
    row === null ||
    typeof row !== "object" ||
    row.database_matches !== true ||
    row.runtime_user_matches !== true ||
    row.marker_id !== MHELIX_ENVIRONMENT_MARKER_ID ||
    row.build_stage !== MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE ||
    Number(row.marker_version) !== MHELIX_ENVIRONMENT_MARKER_VERSION ||
    row.marker_commitment_matches !== true ||
    typeof row.evidence_receipt_id !== "string" ||
    !UUID_PATTERN.test(row.evidence_receipt_id)
  ) {
    throw new Error(
      "CockroachDB probe did not match the reviewed TestWired environment marker.",
    );
  }

  return Object.freeze({
    schemaVersion: MHELIX_COCKROACH_PROBE_SCHEMA_VERSION,
    connected: true,
    receiptId: row.evidence_receipt_id.toLowerCase(),
    observedAt: normalizeObservedAt(row.observed_at),
  });
}

/**
 * Build the read-only provider used by health and status checks.
 *
 * The expected database, role, and marker commitment are sent as query
 * parameters, so none becomes executable SQL (Structured Query Language). The
 * fully qualified query returns only booleans for those comparisons. The public
 * proof therefore never contains the database name, runtime user, configured or
 * stored marker commitment, connection string, host, or credential material.
 *
 * @param {{
 *   queryExecutor: CockroachQueryExecutor,
 *   expectedDatabaseName: string,
 *   expectedRuntimeUser: string,
 *   expectedMarkerCommitmentHex: string,
 *   statementTimeoutMilliseconds: number,
 *   probeTimeoutMilliseconds?: number
 * }} options
 */
export function createCockroachDbProvider(options) {
  if (
    options === null ||
    typeof options !== "object" ||
    typeof options.queryExecutor?.query !== "function"
  ) {
    throw new TypeError("A CockroachDB query executor is required.");
  }

  const expectedDatabaseName = requireSafeConfigurationValue(
    options.expectedDatabaseName,
    "expectedDatabaseName",
  );
  const expectedRuntimeUser = requireSafeConfigurationValue(
    options.expectedRuntimeUser,
    "expectedRuntimeUser",
  );
  const expectedMarkerCommitmentHex = requireExpectedMarkerCommitmentHex(
    options.expectedMarkerCommitmentHex,
  );
  const probeTimeoutMilliseconds = readProbeTimeoutMilliseconds(
    options.probeTimeoutMilliseconds,
  );
  const statementTimeoutMilliseconds = readStatementTimeoutMilliseconds(
    options.statementTimeoutMilliseconds,
    probeTimeoutMilliseconds,
  );
  let inFlightAttempt;

  function getOrStartQueryAttempt() {
    if (inFlightAttempt !== undefined) {
      return inFlightAttempt;
    }

    const deadlineMilliseconds = Date.now() + probeTimeoutMilliseconds;
    const resultPromise = Promise.resolve()
      .then(() =>
        options.queryExecutor.query(
          MHELIX_COCKROACH_PROBE_STATEMENT,
          [
            expectedDatabaseName,
            expectedRuntimeUser,
            MHELIX_ENVIRONMENT_MARKER_ID,
            expectedMarkerCommitmentHex,
          ],
          { statementTimeoutMilliseconds },
        ),
      )
      .then((result) => {
        if (Date.now() >= deadlineMilliseconds) {
          throw new Error(
            "CockroachDB connection and environment probe returned too late.",
          );
        }

        return result;
      });

    const attempt = Object.freeze({ deadlineMilliseconds, resultPromise });
    inFlightAttempt = attempt;

    // Keep the attempt registered after the outer response timeout. The live
    // query executor enforces its shorter server and client timeouts and settles
    // this promise before another query may begin. This prevents a slow database
    // from accumulating one abandoned query per public health check.
    void resultPromise.then(
      () => {
        if (inFlightAttempt === attempt) {
          inFlightAttempt = undefined;
        }
      },
      () => {
        if (inFlightAttempt === attempt) {
          inFlightAttempt = undefined;
        }
      },
    );

    return attempt;
  }

  return Object.freeze({
    async probe() {
      try {
        const attempt = getOrStartQueryAttempt();
        const result = await awaitBeforeDeadline(
          attempt.resultPromise,
          attempt.deadlineMilliseconds,
        );

        if (!Array.isArray(result?.rows) || result.rows.length !== 1) {
          throw new Error(
            "CockroachDB probe returned an unexpected environment-marker row count.",
          );
        }

        const proof = validateProbeRow(result.rows[0]);
        if (Date.now() >= attempt.deadlineMilliseconds) {
          throw new Error(
            "CockroachDB connection and environment probe returned too late.",
          );
        }

        return proof;
      } catch {
        // A database library may place a URL (Uniform Resource Locator), role
        // name, or query fragment in an error. Replace every provider failure
        // with one bounded safe error.
        throw new Error(
          "CockroachDB connection and environment probe failed closed.",
        );
      }
    },
  });
}

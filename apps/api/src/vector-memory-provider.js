// SPDX-License-Identifier: Apache-2.0
//
// The vector-memory provider: the only component permitted to write judge
// memory to CockroachDB.
//
// DESIGN RULES, ALL ENFORCED HERE OR IN THE STATEMENT CATALOG:
//   * Operation-specific methods only. There is no general executor, and no
//     caller can supply, compose, or name SQL (Structured Query Language).
//   * Every logical operation runs in ONE serializable transaction, so a
//     partial write is impossible.
//   * Only CockroachDB serialization failures are retried, at most three
//     bounded attempts. Every other error fails immediately.
//   * Idempotency keys are hashed before storage. The raw key is never stored,
//     logged, returned, or placed in an error message.
//   * A repeated key with the SAME request returns the same durable
//     identifiers. The same key with DIFFERENT content fails and writes
//     nothing.
//   * Responses are built on exact allowlists, so database, host, user, query,
//     vector, and commitment internals cannot leak outward.
//
// This module performs no privilege decisions of its own beyond the capability
// gate: authorization policy lives in the handler, and memory is never treated
// as an authorization source.

import { createHash, randomUUID } from "node:crypto";

import { requireStatement } from "./vector-memory-statements.js";

/** CockroachDB reports a retryable serialization conflict with this SQLSTATE. */
const SERIALIZATION_FAILURE_SQLSTATE = "40001";

/** Bounded retry budget for serialization conflicts only. */
const MAXIMUM_TRANSACTION_ATTEMPTS = 3;

/** The capability this runtime slice requires before any write. */
export const VECTOR_MEMORY_CAPABILITY_ID = "vector_memory_recall";

/** Exactly the operations the public journey may record. */
const PERMITTED_OPERATIONS = Object.freeze([
  "create_run",
  "close_session",
  "recall",
  "attempt_protected_disclosure",
]);

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RELEASE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const MAXIMUM_SUMMARY_LENGTH = 512;

/**
 * A typed failure the handler can map to an exact HTTP (Hypertext Transfer
 * Protocol) status without leaking internals.
 */
export class VectorMemoryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "VectorMemoryError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new VectorMemoryError(code, message);
}

function requireUuid(value, label) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    fail("INVALID_INPUT", `${label} must be a valid identifier.`);
  }
  return value;
}

function requireBoundedSummary(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAXIMUM_SUMMARY_LENGTH ||
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    fail("INVALID_INPUT", `${label} must be bounded public-safe text.`);
  }
  return value;
}

/**
 * Hash an idempotency key to 32 bytes. The raw key never leaves this function,
 * which is why it is not returned and never appears in an error message.
 */
function hashIdempotencyKey(rawKey) {
  if (typeof rawKey !== "string" || !IDEMPOTENCY_KEY_PATTERN.test(rawKey)) {
    fail("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be 16 to 128 safe characters.");
  }
  return createHash("sha256").update(rawKey, "utf8").digest();
}

/** Stable 32-byte commitment over a request or response body. */
export function commitToCanonicalObject(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest();
}

/** Deterministic JSON with sorted keys, so a commitment is reproducible. */
function canonicalJson(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function isSerializationFailure(error) {
  return error?.code === SERIALIZATION_FAILURE_SQLSTATE;
}

function equalBytes(left, right) {
  if (!Buffer.isBuffer(left) || !Buffer.isBuffer(right)) {
    return false;
  }
  return left.length === right.length && left.equals(right);
}

/**
 * Create the provider.
 *
 * `pool` must expose `connect()` returning a client with `query()` and
 * `release()`. Injecting it keeps this module testable without a database and
 * keeps connection policy in the bootstrap layer.
 */
export function createVectorMemoryProvider(options) {
  const pool = options?.pool;
  if (!pool || typeof pool.connect !== "function") {
    throw new TypeError("A CockroachDB pool is required.");
  }
  const scenarioId = options?.scenarioId;
  if (typeof scenarioId !== "string" || scenarioId.length === 0) {
    throw new TypeError("A canonical scenario identifier is required.");
  }
  const releaseCommit = options?.releaseCommit;
  if (typeof releaseCommit !== "string" || !RELEASE_COMMIT_PATTERN.test(releaseCommit)) {
    throw new TypeError("A 40-character release commit is required.");
  }

  /** Run one statement from the frozen catalog. */
  async function run(client, statementName, parameters) {
    const text = requireStatement(statementName);
    return client.query({ text, values: parameters ?? [] });
  }

  /**
   * Execute one logical operation inside a single serializable transaction,
   * retrying ONLY serialization conflicts, at most three attempts.
   */
  async function withTransaction(work) {
    let lastError;
    for (let attempt = 1; attempt <= MAXIMUM_TRANSACTION_ATTEMPTS; attempt += 1) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const result = await work(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // A failed rollback must not mask the original error.
        }
        if (isSerializationFailure(error) && attempt < MAXIMUM_TRANSACTION_ATTEMPTS) {
          lastError = error;
          continue;
        }
        throw error;
      } finally {
        client.release();
      }
    }
    throw lastError ?? new VectorMemoryError("RETRY_EXHAUSTED", "Transaction retries exhausted.");
  }

  async function resolveCaseNamespace(client) {
    const result = await run(client, "selectCaseNamespaceByScenario", [scenarioId]);
    const row = result.rows?.[0];
    if (!row) {
      fail("SCENARIO_UNAVAILABLE", "The synthetic case namespace is not provisioned.");
    }
    return row.case_namespace_id;
  }

  /**
   * The write gate. Both halves must pass before any mutation: the capability
   * row must exist for THIS release, be at the reviewed version, and must not
   * claim public mutation readiness.
   *
   * This proves internal consistency only. It cannot prove the release label is
   * genuinely deployed; the handler compares that independently.
   */
  async function readCapability(client) {
    const result = await run(client, "selectRuntimeCapability", [
      VECTOR_MEMORY_CAPABILITY_ID,
      releaseCommit,
    ]);
    const row = result.rows?.[0];
    if (!row) {
      fail(
        "CAPABILITY_NOT_ACTIVATED",
        "No vector-memory capability is recorded for this release.",
      );
    }
    if (Number(row.capability_version) !== 1) {
      fail("CAPABILITY_NOT_ACTIVATED", "The recorded capability version is not supported.");
    }
    if (row.public_mutations_enabled === true) {
      fail("CAPABILITY_INVALID", "The capability row claims public mutation readiness.");
    }
    return { capabilityState: String(row.capability_state) };
  }

  /** Read-only capability probe for the readiness gate. */
  async function checkCapability() {
    const client = await pool.connect();
    try {
      return await readCapability(client);
    } finally {
      client.release();
    }
  }

  function requireOperation(operation) {
    if (!PERMITTED_OPERATIONS.includes(operation)) {
      fail("INVALID_INPUT", "Unsupported operation.");
    }
    return operation;
  }

  /**
   * Look for a prior receipt for this exact key. Returns the stored receipt on
   * a true replay, and fails on a key reused with different content.
   */
  async function resolveReplay(client, runId, operation, keyHash, requestCommitment) {
    const existing = await run(client, "selectReceiptByIdempotency", [
      runId,
      operation,
      keyHash,
    ]);
    const row = existing.rows?.[0];
    if (!row) {
      return null;
    }
    if (!equalBytes(row.request_commitment, requestCommitment)) {
      fail(
        "IDEMPOTENCY_CONFLICT",
        "This idempotency key was already used with different request content.",
      );
    }
    return row;
  }

  return Object.freeze({
    checkCapability,

    /**
     * Checkpoint one: create the synthetic run and open Session A.
     */
    async createRun({ agentIdentifier, idempotencyKey, transportRequestId }) {
      const keyHash = hashIdempotencyKey(idempotencyKey);
      const requestCommitment = commitToCanonicalObject({
        operation: "create_run",
        agentIdentifier,
        scenarioId,
      });

      return withTransaction(async (client) => {
        await readCapability(client);
        const caseNamespaceId = await resolveCaseNamespace(client);

        // Replay: the run's own idempotency constraint is authoritative here.
        const priorRun = await run(client, "selectRunByIdempotency", [
          caseNamespaceId,
          keyHash,
        ]);
        if (priorRun.rows?.[0]) {
          const existingRunId = priorRun.rows[0].run_id;
          const sessionA = await run(client, "selectSessionByOrdinal", [
            existingRunId,
            "A",
          ]);
          return Object.freeze({
            replayed: true,
            runId: existingRunId,
            runState: String(priorRun.rows[0].run_state),
            sessionId: sessionA.rows?.[0]?.session_id ?? null,
            sessionState: sessionA.rows?.[0]?.session_state ?? null,
            sessionCreatedAt: sessionA.rows?.[0]?.started_at ?? null,
          });
        }

        const inserted = await run(client, "insertRun", [
          caseNamespaceId,
          agentIdentifier,
          keyHash,
        ]);
        const runId = inserted.rows[0].run_id;

        const session = await run(client, "insertSession", [
          caseNamespaceId,
          runId,
          "A",
          agentIdentifier,
          options.resourceIdentifier,
          options.authorityGrantIdentifier,
        ]);

        await run(client, "insertActionReceiptReserved", [
          caseNamespaceId,
          runId,
          session.rows[0].session_id,
          "create_run",
          keyHash,
          requestCommitment,
          transportRequestId,
        ]);

        return Object.freeze({
          replayed: false,
          runId,
          runState: String(inserted.rows[0].run_state),
          sessionId: session.rows[0].session_id,
          sessionState: String(session.rows[0].session_state),
          sessionCreatedAt: session.rows[0].started_at,
        });
      });
    },

    /**
     * Checkpoint two: close Session A, persist public-safe summaries and their
     * embeddings, and activate this run's projection.
     *
     * `corpusEntries` are the committed public-safe fixtures. Each carries its
     * own canonical summary, vector literal, and commitment.
     */
    async closeSessionAndBuildProjection({
      runId,
      idempotencyKey,
      transportRequestId,
      corpusEntries,
    }) {
      requireUuid(runId, "runId");
      const keyHash = hashIdempotencyKey(idempotencyKey);
      if (!Array.isArray(corpusEntries) || corpusEntries.length === 0) {
        fail("INVALID_INPUT", "At least one public-safe summary is required.");
      }
      const requestCommitment = commitToCanonicalObject({
        operation: "close_session",
        runId,
        entryCount: corpusEntries.length,
      });

      return withTransaction(async (client) => {
        await readCapability(client);
        const caseNamespaceId = await resolveCaseNamespace(client);

        const replay = await resolveReplay(
          client,
          runId,
          "close_session",
          keyHash,
          requestCommitment,
        );
        if (replay) {
          const activeProjection = await run(client, "selectRunActiveProjection", [runId]);
          const replaySession = await run(client, "selectSessionByOrdinal", [runId, "A"]);
          const replaySessionRow = replaySession.rows?.[0];
          return Object.freeze({
            replayed: true,
            receiptId: replay.action_receipt_id,
            projectionGenerationId:
              activeProjection.rows?.[0]?.projection_generation_id ?? null,
            storedSummaryCount: corpusEntries.length,
            sessionId: replaySessionRow?.session_id ?? null,
            sessionState: replaySessionRow?.session_state ?? "CLOSED",
            sessionCreatedAt: replaySessionRow?.started_at ?? null,
            sessionClosedAt: replaySessionRow?.closed_at ?? null,
            canonicalMemoryIds: corpusEntries.map((entry) => entry.fixtureId),
          });
        }

        const sessionA = await run(client, "selectSessionByOrdinal", [runId, "A"]);
        const sessionRow = sessionA.rows?.[0];
        if (!sessionRow) {
          fail("SESSION_NOT_FOUND", "Session A does not exist for this run.");
        }
        const sessionId = sessionRow.session_id;

        const receipt = await run(client, "insertActionReceiptReserved", [
          caseNamespaceId,
          runId,
          sessionId,
          "close_session",
          keyHash,
          requestCommitment,
          transportRequestId,
        ]);
        const receiptId = receipt.rows[0].action_receipt_id;

        const projection = await run(client, "insertProjectionGeneration", [
          caseNamespaceId,
          corpusEntries.length,
          commitToCanonicalObject({
            runId,
            entries: corpusEntries.map((entry) => entry.embeddingCommitmentHex),
          }),
        ]);
        const projectionGenerationId = projection.rows[0].projection_generation_id;

        // Each summary is anchored to its own event in the same session, which
        // is what the composite foreign key in migration 001 requires.
        let eventSequence = 0;
        for (const entry of corpusEntries) {
          eventSequence += 1;
          const summaryText = requireBoundedSummary(
            entry.publicSafeSummary,
            "publicSafeSummary",
          );
          const summaryCommitment = commitToCanonicalObject({
            fixtureId: entry.fixtureId,
            publicSafeSummary: summaryText,
          });

          await run(client, "insertMemoryEvent", [
            sessionId,
            eventSequence,
            "SESSION_CLOSED",
            summaryText,
            summaryCommitment,
            summaryCommitment,
            new Date().toISOString(),
          ]);

          const summary = await run(client, "insertMemorySummary", [
            sessionId,
            eventSequence,
            summaryText,
            summaryCommitment,
          ]);

          await run(client, "insertSummaryEmbedding", [
            caseNamespaceId,
            runId,
            sessionId,
            projectionGenerationId,
            summary.rows[0].memory_summary_id,
            entry.embeddingModelId,
            entry.embeddingDimensions,
            entry.vectorLiteral,
            Buffer.from(entry.embeddingCommitmentHex, "hex"),
          ]);
        }

        await run(client, "updateProjectionVerified", [
          caseNamespaceId,
          projectionGenerationId,
        ]);
        await run(client, "insertRunActiveProjection", [
          runId,
          caseNamespaceId,
          projectionGenerationId,
        ]);
        const closedSession = await run(client, "updateSessionClosed", [caseNamespaceId, runId, sessionId]);

        await run(client, "updateActionReceiptSettled", [
          receiptId,
          runId,
          "COMMITTED",
          commitToCanonicalObject({ projectionGenerationId, stored: eventSequence }),
        ]);

        const closedRow = closedSession.rows?.[0];
        return Object.freeze({
          replayed: false,
          receiptId,
          projectionGenerationId,
          storedSummaryCount: eventSequence,
          sessionId,
          sessionState: String(closedRow?.session_state ?? "CLOSED"),
          sessionCreatedAt: closedRow?.started_at ?? null,
          sessionClosedAt: closedRow?.closed_at ?? null,
          canonicalMemoryIds: corpusEntries.map((entry) => entry.fixtureId),
        });
      });
    },

    /**
     * Checkpoint three: from a fresh session, recall the two best matching
     * public-safe memories through CockroachDB vector search.
     */
    async recall({ runId, idempotencyKey, transportRequestId, queryVectorLiteral, queryText }) {
      requireUuid(runId, "runId");
      const keyHash = hashIdempotencyKey(idempotencyKey);
      const requestCommitment = commitToCanonicalObject({
        operation: "recall",
        runId,
        queryText,
      });

      return withTransaction(async (client) => {
        await readCapability(client);
        const caseNamespaceId = await resolveCaseNamespace(client);

        const replay = await resolveReplay(
          client,
          runId,
          "recall",
          keyHash,
          requestCommitment,
        );
        if (replay) {
          const storedItems = await run(client, "selectRecallItemsByReceipt", [
            replay.action_receipt_id,
          ]);
          const replaySessionB = await run(client, "selectSessionByOrdinal", [runId, "B"]);
          const replaySessionBRow = replaySessionB.rows?.[0];
          return Object.freeze({
            replayed: true,
            receiptId: replay.action_receipt_id,
            sessionId: replaySessionBRow?.session_id ?? null,
            sessionState: replaySessionBRow?.session_state ?? "OPEN",
            sessionCreatedAt: replaySessionBRow?.started_at ?? null,
            matches: storedItems.rows.map(toPublicMatch),
          });
        }

        // The active projection is resolved FROM THE RUN, never from caller
        // input, so a historical generation cannot be reactivated by supplying
        // its identifier.
        const activeProjection = await run(client, "selectRunActiveProjection", [runId]);
        const projectionGenerationId =
          activeProjection.rows?.[0]?.projection_generation_id;
        if (!projectionGenerationId) {
          fail("PROJECTION_NOT_ACTIVE", "This run has no active recall projection.");
        }

        // Session B: reuse it if the fresh session already exists.
        const existingSessionB = await run(client, "selectSessionByOrdinal", [runId, "B"]);
        let sessionBId;
        let sessionBCreatedAt;
        if (existingSessionB.rows?.[0]) {
          sessionBId = existingSessionB.rows[0].session_id;
          sessionBCreatedAt = existingSessionB.rows[0].started_at;
        } else {
          const insertedSessionB = await run(client, "insertSession", [
            caseNamespaceId,
            runId,
            "B",
            options.agentIdentifier,
            options.resourceIdentifier,
            options.authorityGrantIdentifier,
          ]);
          sessionBId = insertedSessionB.rows[0].session_id;
          sessionBCreatedAt = insertedSessionB.rows[0].started_at;
        }

        const receipt = await run(client, "insertActionReceiptReserved", [
          caseNamespaceId,
          runId,
          sessionBId,
          "recall",
          keyHash,
          requestCommitment,
          transportRequestId,
        ]);
        const receiptId = receipt.rows[0].action_receipt_id;

        const found = await run(client, "recallTopTwoByCosineDistance", [
          runId,
          projectionGenerationId,
          queryVectorLiteral,
        ]);

        let rank = 0;
        for (const row of found.rows) {
          rank += 1;
          await run(client, "insertRecallResultItem", [
            receiptId,
            runId,
            projectionGenerationId,
            row.memory_summary_id,
            rank,
            row.cosine_distance,
            commitToCanonicalObject({
              memorySummaryId: row.memory_summary_id,
              rank,
            }),
          ]);
        }

        await run(client, "insertMemoryEvent", [
          sessionBId,
          1,
          "MEMORY_RECALLED",
          `Recalled ${rank} public-safe memories for this run.`,
          commitToCanonicalObject({ receiptId, rank }),
          commitToCanonicalObject({ projectionGenerationId }),
          new Date().toISOString(),
        ]);

        await run(client, "updateActionReceiptSettled", [
          receiptId,
          runId,
          "COMMITTED",
          commitToCanonicalObject({ receiptId, matches: rank }),
        ]);

        return Object.freeze({
          replayed: false,
          receiptId,
          sessionId: sessionBId,
          sessionState: "OPEN",
          sessionCreatedAt: sessionBCreatedAt,
          projectionGenerationId,
          matches: found.rows.map(toPublicMatch),
        });
      });
    },

    /**
     * Checkpoint four: refuse an unauthorized protected disclosure and persist
     * a durable denial.
     *
     * The refusal is enforced by CODE here and by a CHECK constraint in the
     * database. Recalled memory is never consulted as an authorization source.
     * No protected value is read, so none can be returned.
     */
    async recordDisclosureDenial({
      runId,
      idempotencyKey,
      transportRequestId,
      requestedProtectedFieldNames,
    }) {
      requireUuid(runId, "runId");
      const keyHash = hashIdempotencyKey(idempotencyKey);
      const fieldNames = Array.isArray(requestedProtectedFieldNames)
        ? requestedProtectedFieldNames.filter(
            (name) => typeof name === "string" && /^[A-Za-z]{1,64}$/.test(name),
          )
        : [];
      const requestCommitment = commitToCanonicalObject({
        operation: "attempt_protected_disclosure",
        runId,
        requestedProtectedFieldNames: fieldNames,
      });

      return withTransaction(async (client) => {
        await readCapability(client);
        const caseNamespaceId = await resolveCaseNamespace(client);

        const replay = await resolveReplay(
          client,
          runId,
          "attempt_protected_disclosure",
          keyHash,
          requestCommitment,
        );
        if (replay) {
          return Object.freeze({
            replayed: true,
            receiptId: replay.action_receipt_id,
            receiptState: String(replay.receipt_state),
            protectedFieldsReturned: 0,
            requestedProtectedFieldNames: fieldNames,
          });
        }

        const sessionB = await run(client, "selectSessionByOrdinal", [runId, "B"]);
        const sessionId = sessionB.rows?.[0]?.session_id;
        if (!sessionId) {
          fail("SESSION_NOT_FOUND", "A recall session is required before this attempt.");
        }

        const receipt = await run(client, "insertActionReceiptReserved", [
          caseNamespaceId,
          runId,
          sessionId,
          "attempt_protected_disclosure",
          keyHash,
          requestCommitment,
          transportRequestId,
        ]);
        const receiptId = receipt.rows[0].action_receipt_id;

        // The event records only the NAMES of the fields that were refused.
        await run(client, "insertMemoryEvent", [
          sessionId,
          2,
          "DISCLOSURE_DENIED",
          `Refused disclosure of ${fieldNames.length} protected field names.`,
          commitToCanonicalObject({ receiptId, fieldNames }),
          commitToCanonicalObject({ denied: true }),
          new Date().toISOString(),
        ]);

        await run(client, "updateActionReceiptSettled", [
          receiptId,
          runId,
          "DENIED",
          commitToCanonicalObject({ denied: true, fieldNames }),
        ]);

        return Object.freeze({
          replayed: false,
          receiptId,
          receiptState: "DENIED",
          protectedFieldsReturned: 0,
          requestedProtectedFieldNames: fieldNames,
        });
      });
    },

    /**
     * Checkpoint five: fetch an immutable receipt by identifier, with the same
     * evidence it recorded when it was written.
     */
    async fetchReceipt({ receiptId }) {
      requireUuid(receiptId, "receiptId");
      const client = await pool.connect();
      try {
        const found = await run(client, "selectReceiptByIdentifier", [receiptId]);
        const row = found.rows?.[0];
        if (!row) {
          fail("RECEIPT_NOT_FOUND", "No receipt exists for that identifier.");
        }
        const items = await run(client, "selectRecallItemsByReceipt", [receiptId]);
        return Object.freeze({
          receiptId: row.action_receipt_id,
          runId: row.run_id,
          operation: String(row.operation),
          receiptState: String(row.receipt_state),
          protectedFieldsReturned: Number(row.protected_fields_returned),
          transportRequestId: row.transport_request_id ?? null,
          createdAt: row.created_at,
          completedAt: row.completed_at ?? null,
          matches: items.rows.map(toPublicMatch),
        });
      } finally {
        client.release();
      }
    },
  });
}

/**
 * Map one stored row to the exact public shape. Building the object explicitly,
 * rather than spreading the row, is what stops a future column from leaking.
 */
function toPublicMatch(row) {
  return Object.freeze({
    memorySummaryId: row.memory_summary_id,
    publicSafeSummary: row.public_safe_summary,
    cosineDistance: Number(row.cosine_distance),
    rank: row.result_rank === undefined ? undefined : Number(row.result_rank),
  });
}

// SPDX-License-Identifier: Apache-2.0
//
// Integration tests for the five-checkpoint judge journey through the public
// handler, with a stubbed vector-memory provider.
//
// These prove the behaviour a judge will actually exercise: create, close,
// recall, refuse, fetch. They also prove the two properties the whole
// submission rests on — the routes stay fail-closed until the capability gate
// opens, and a refusal returns zero protected fields.

import assert from "node:assert/strict";
import test from "node:test";

import { createHandler } from "../src/handler.js";
import { CANONICAL_SCENARIO } from "../src/constants.js";

const PRIMARY_ORIGIN = "https://testwired.helixctw.com";

// Public configuration must exist before the handler module reads it.
process.env.MHELIX_PUBLIC_ALLOWED_ORIGINS = PRIMARY_ORIGIN;
process.env.MHELIX_MAX_REQUEST_BYTES = "4096";
process.env.MHELIX_MAX_RESPONSE_BYTES = "32768";
process.env.MHELIX_RELEASE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
process.env.AWS_REGION = "us-east-1";

const RUN_ID = "22222222-2222-4222-8222-222222222222";
const RECEIPT_ID = "66666666-6666-4666-8666-666666666666";
const PROJECTION_ID = "55555555-5555-4555-8555-555555555555";
const REPLAY_MARKER = "penny-journey-replay-marker-0001";

/** A CockroachDB probe stub reporting the live environment marker. */
function connectedCockroachProvider() {
  return {
    async probe() {
      return {
        schemaVersion: "mhelixctw/cockroach-probe/v1",
        connected: true,
        databaseMatches: true,
        userMatches: true,
        markerMatches: true,
        receiptId: "9738e14c-506f-4e2f-be2b-32f2008ff0fd",
        observedAt: "2026-08-16T21:37:31.625Z",
      };
    },
  };
}

/** A vector-memory provider stub that records what the handler asked for. */
function stubMemoryProvider(overrides = {}) {
  const calls = [];
  const provider = {
    calls,
    async checkCapability() {
      if (overrides.capabilityFails) {
        throw Object.assign(new Error("no capability"), {
          code: "CAPABILITY_NOT_ACTIVATED",
        });
      }
      return { capabilityState: "SOURCE_ONLY" };
    },
    async createRun(request) {
      calls.push(["createRun", request]);
      return {
        replayed: false,
        runId: RUN_ID,
        runState: "OPEN",
        sessionId: "33333333-3333-4333-8333-333333333333",
        sessionState: "OPEN",
        sessionCreatedAt: "2026-08-14T12:00:00.000Z",
      };
    },
    async closeSessionAndBuildProjection(request) {
      calls.push(["closeSession", request]);
      return {
        replayed: false,
        receiptId: RECEIPT_ID,
        projectionGenerationId: PROJECTION_ID,
        storedSummaryCount: request.corpusEntries.length,
        sessionId: "33333333-3333-4333-8333-333333333333",
        sessionState: "CLOSED",
        sessionCreatedAt: "2026-08-14T12:00:00.000Z",
        sessionClosedAt: "2026-08-14T12:01:00.000Z",
        canonicalMemoryIds: request.corpusEntries.map((entry) => entry.fixtureId),
      };
    },
    async recall(request) {
      calls.push(["recall", request]);
      return {
        replayed: false,
        receiptId: RECEIPT_ID,
        sessionId: "44444444-4444-4444-8444-444444444444",
        sessionState: "OPEN",
        sessionCreatedAt: "2026-08-14T12:02:00.000Z",
        matches: [
          {
            memorySummaryId: "77777777-7777-4777-8777-777777777777",
            publicSafeSummary: "Edgar Morrow is a TestTown citizen.",
            cosineDistance: 0.0125,
          },
        ],
      };
    },
    async recordDisclosureDenial(request) {
      calls.push(["denial", request]);
      return {
        replayed: false,
        receiptId: RECEIPT_ID,
        receiptState: "DENIED",
        protectedFieldsReturned: 0,
        requestedProtectedFieldNames: request.requestedProtectedFieldNames,
      };
    },
    async fetchReceipt(request) {
      calls.push(["fetchReceipt", request]);
      return {
        receiptId: RECEIPT_ID,
        runId: RUN_ID,
        operation: "recall",
        receiptState: "COMMITTED",
        protectedFieldsReturned: 0,
        transportRequestId: "req-1",
        createdAt: "t0",
        completedAt: "t1",
        matches: [],
      };
    },
    ...overrides,
  };
  return provider;
}

function buildEvent({ method, path, body, idempotencyKey = REPLAY_MARKER }) {
  const headers = { origin: PRIMARY_ORIGIN };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    headers["idempotency-key"] = idempotencyKey;
  }
  return {
    version: "2.0",
    rawPath: path,
    requestContext: {
      http: { method, path },
      requestId: "11111111-2222-3333-4444-555555555555",
    },
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
  };
}

/** The validated Lambda runtime environment, matching handler.test.mjs. */
const VALIDATED_AWS_LAMBDA_ENVIRONMENT = Object.freeze({
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_EXECUTION_ENV: "AWS_Lambda_nodejs24.x",
  AWS_LAMBDA_FUNCTION_MEMORY_SIZE: "256",
  AWS_LAMBDA_FUNCTION_NAME: "mhelixctw-testwired-worker",
  AWS_LAMBDA_FUNCTION_VERSION: "$LATEST",
  AWS_LAMBDA_INITIALIZATION_TYPE: "on-demand",
  AWS_LAMBDA_LOG_GROUP_NAME: "/aws/lambda/mhelixctw-testwired-worker",
  AWS_LAMBDA_LOG_STREAM_NAME: "2026/08/16/[$LATEST]journey-test",
  AWS_LAMBDA_RUNTIME_API: "127.0.0.1:9001",
  LAMBDA_RUNTIME_DIR: "/var/runtime",
  LAMBDA_TASK_ROOT: "/var/task",
});

for (const variableName of Object.keys(VALIDATED_AWS_LAMBDA_ENVIRONMENT)) {
  delete process.env[variableName];
}

async function withLambdaEnvironment(run) {
  const previous = new Map(
    Object.keys(VALIDATED_AWS_LAMBDA_ENVIRONMENT).map((name) => [
      name,
      process.env[name],
    ]),
  );
  Object.assign(process.env, VALIDATED_AWS_LAMBDA_ENVIRONMENT);
  try {
    return await run();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

async function invoke(handler, event) {
  const response = await handler(event);
  return { statusCode: response.statusCode, body: JSON.parse(response.body) };
}

test("without a memory provider every write stays fail-closed", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({ cockroachProvider: connectedCockroachProvider() });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error.code, "LIVE_PROVIDERS_NOT_CONNECTED");
  });
});

test("an unactivated capability keeps the routes fail-closed", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider({ capabilityFails: true }),
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error.code, "LIVE_PROVIDERS_NOT_CONNECTED");
  });
});

test("a disconnected environment marker keeps the routes fail-closed", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      // No CockroachDB probe at all, so the marker is not CONNECTED.
      vectorMemoryProvider: stubMemoryProvider(),
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 503);
  });
});

test("checkpoint one creates a run and opens Session A", async () => {
  await withLambdaEnvironment(async () => {
    const provider = stubMemoryProvider();
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: provider,
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.runId, RUN_ID);
    assert.equal(response.body.session.ordinal, "A");
    assert.equal(response.body.protectedFieldsReturned, 0);
    // The transport request identifier is bound to the receipt.
    const [, request] = provider.calls.find(([name]) => name === "createRun");
    assert.equal(request.transportRequestId, "11111111-2222-3333-4444-555555555555");
    assert.equal(request.idempotencyKey, REPLAY_MARKER);
  });
});

test("checkpoint two stores the whole public-safe corpus with vectors", async () => {
  await withLambdaEnvironment(async () => {
    const provider = stubMemoryProvider();
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: provider,
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: `/api/v1/judge/runs/${RUN_ID}/sessions/close`,
        body: { sessionId: "33333333-3333-4333-8333-333333333333" },
      }),
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.receiptId, RECEIPT_ID);
    assert.equal(response.body.session.state, "CLOSED");
    assert.ok(
      Array.isArray(response.body.canonicalMemoryIds) &&
        response.body.canonicalMemoryIds.length >= 32,
      `expected at least 32 canonical memory IDs, got ${response.body.canonicalMemoryIds?.length}`,
    );

    const [, request] = provider.calls.find(([name]) => name === "closeSession");
    // The corpus must be large enough for vector indexing to be meaningful.
    assert.ok(
      request.corpusEntries.length >= 32,
      `expected at least 32 entries, got ${request.corpusEntries.length}`,
    );
    const entry = request.corpusEntries[0];
    assert.equal(entry.embeddingModelId, "mhelixctw-synthetic-embedding-v1");
    assert.equal(entry.embeddingDimensions, 8);
    // The vector reaches the provider as a literal with exactly eight values.
    assert.match(entry.vectorLiteral, /^\[-?\d+\.\d+(,-?\d+\.\d+){7}\]$/);
    assert.match(entry.embeddingCommitmentHex, /^[0-9a-f]{64}$/);
  });
});

test("checkpoint three recalls through vector search from a fresh session", async () => {
  await withLambdaEnvironment(async () => {
    const provider = stubMemoryProvider();
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: provider,
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: `/api/v1/judge/runs/${RUN_ID}/recall`,
        body: { query: CANONICAL_SCENARIO.question },
      }),
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.matches.length, 1);
    assert.equal(
      response.body.matches[0].publicSafeSummary,
      "Edgar Morrow is a TestTown citizen.",
    );
    assert.equal(response.body.protectedFieldsReturned, 0);

    // The query is embedded by the same deterministic model.
    const [, request] = provider.calls.find(([name]) => name === "recall");
    assert.match(request.queryVectorLiteral, /^\[-?\d+\.\d+(,-?\d+\.\d+){7}\]$/);
  });
});

test("checkpoint four refuses disclosure and returns zero protected fields", async () => {
  await withLambdaEnvironment(async () => {
    const provider = stubMemoryProvider();
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: provider,
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: `/api/v1/judge/runs/${RUN_ID}/actions`,
        body: {
          action: "attempt_protected_disclosure",
          agentDidz: CANONICAL_SCENARIO.unauthorizedAgentDidz,
        },
      }),
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.result.kind, "DISCLOSURE_DENIED");
    // The single most important assertion in the whole submission.
    assert.equal(response.body.protectedFieldsReturned, 0);

    // Only field NAMES appear anywhere in the response.
    const serialized = JSON.stringify(response.body);
    for (const fieldName of ["ein", "born", "documents"]) {
      assert.ok(serialized.includes(fieldName), `expected the name ${fieldName}`);
    }
    // No protected value shapes may appear.
    assert.doesNotMatch(serialized, /\b\d{2}-\d{7}\b/, "employer identification number");
    assert.doesNotMatch(serialized, /\b\d{4}-\d{2}-\d{2}\b/, "full date");
  });
});

test("checkpoint five fetches the immutable receipt", async () => {
  await withLambdaEnvironment(async () => {
    const provider = stubMemoryProvider();
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: provider,
    });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: `/api/v1/judge/receipts/${RECEIPT_ID}` }),
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.receipt.receiptId, RECEIPT_ID);
    assert.equal(response.body.receipt.protectedFieldsReturned, 0);
    assert.equal(response.body.receipt.scenarioId, CANONICAL_SCENARIO.scenarioId);
    assert.equal(response.body.receipt.transportRequestId, "req-1");
  });
});

test("a receipt that does not exist returns 404 without leaking internals", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider({
        async fetchReceipt() {
          throw Object.assign(new Error("No receipt exists for that identifier."), {
            code: "RECEIPT_NOT_FOUND",
          });
        },
      }),
    });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: `/api/v1/judge/receipts/${RECEIPT_ID}` }),
    );
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "RECEIPT_NOT_FOUND");
  });
});

test("an idempotency conflict surfaces as 409 and never as a database error", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider({
        async createRun() {
          throw Object.assign(new Error("key reused with different content"), {
            code: "IDEMPOTENCY_CONFLICT",
          });
        },
      }),
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 409);
    assert.equal(response.body.error.code, "IDEMPOTENCY_KEY_CONFLICT");
  });
});

test("an unexpected provider fault degrades to a generic 503, never a leak", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider({
        async createRun() {
          throw new Error(
            "connection to host db-internal.example refused for user mhelix_runtime",
          );
        },
      }),
    });
    const response = await invoke(
      handler,
      buildEvent({
        method: "POST",
        path: "/api/v1/judge/runs",
        body: { scenarioId: CANONICAL_SCENARIO.scenarioId },
      }),
    );
    assert.equal(response.statusCode, 503);
    const serialized = JSON.stringify(response.body);
    assert.doesNotMatch(serialized, /db-internal|mhelix_runtime|refused/);
  });
});

test("the memory slice never promotes the overall application", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider(),
    });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: "/api/v1/status" }),
    );
    assert.equal(response.statusCode, 200);
    // The global flags stay exactly as they were.
    assert.equal(response.body.currentAvailability, "NOT_CONNECTED");
    assert.equal(response.body.readyForMutations, false);
    // Deferred providers stay disconnected.
    const bedrock = response.body.providers.find((entry) => entry.id === "bedrock");
    assert.equal(bedrock.connection, "NOT_CONNECTED");
    // The transport label uses the human-facing alias.
    const aws = response.body.providers.find((entry) => entry.id === "aws");
    assert.match(aws.label, /^Helix Runtime Bridge/);
  });
});

test("status reports the memory slice as available when the gate would open", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider(),
    });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: "/api/v1/status" }),
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.memorySlice.available, true);
    assert.equal(response.body.memorySlice.embeddingEvidence, "MOCK");
    assert.deepEqual(response.body.memorySlice.routes, [
      "create_run",
      "close_session",
      "recall",
      "attempt_protected_disclosure",
      "fetch_receipt",
    ]);
    // The slice signal must never masquerade as global readiness.
    assert.equal(response.body.readyForMutations, false);
    assert.equal(response.body.currentAvailability, "NOT_CONNECTED");
  });
});

test("status reports the memory slice as unavailable without an activated capability", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({
      cockroachProvider: connectedCockroachProvider(),
      vectorMemoryProvider: stubMemoryProvider({ capabilityFails: true }),
    });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: "/api/v1/status" }),
    );
    assert.equal(response.body.memorySlice.available, false);
  });
});

test("status omits no baseline field when no memory provider exists", async () => {
  await withLambdaEnvironment(async () => {
    const handler = createHandler({ cockroachProvider: connectedCockroachProvider() });
    const response = await invoke(
      handler,
      buildEvent({ method: "GET", path: "/api/v1/status" }),
    );
    assert.equal(response.body.memorySlice.available, false);
    assert.equal(response.body.readyForMutations, false);
  });
});

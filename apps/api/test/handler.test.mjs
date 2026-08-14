// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import test from "node:test";

import { ACTIONS, CANONICAL_SCENARIO } from "../src/constants.js";
import { handler } from "../src/handler.js";

const PRIMARY_ORIGIN = "https://testwired.helixctw.com";
const TEST_IDEMPOTENCY_VALUE = "judge-operation-0001";
const FALLBACK_ORIGIN = "https://main.example.amplifyapp.com";

process.env.MHELIX_PUBLIC_ALLOWED_ORIGINS = `${PRIMARY_ORIGIN},${FALLBACK_ORIGIN}`;
process.env.MHELIX_MAX_REQUEST_BYTES = "4096";
process.env.MHELIX_MAX_RESPONSE_BYTES = "32768";
process.env.MHELIX_RELEASE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
process.env.AWS_REGION = "us-east-1";

const VALIDATED_AWS_LAMBDA_ENVIRONMENT = Object.freeze({
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_EXECUTION_ENV: "AWS_Lambda_nodejs24.x",
  AWS_LAMBDA_FUNCTION_MEMORY_SIZE: "256",
  AWS_LAMBDA_FUNCTION_NAME: "mhelixctw-testwired-worker",
  AWS_LAMBDA_FUNCTION_VERSION: "$LATEST",
  AWS_LAMBDA_INITIALIZATION_TYPE: "on-demand",
  AWS_LAMBDA_LOG_GROUP_NAME: "/aws/lambda/mhelixctw-testwired-worker",
  AWS_LAMBDA_LOG_STREAM_NAME: "2026/08/13/[$LATEST]runtime-test",
  AWS_LAMBDA_RUNTIME_API: "127.0.0.1:9001",
  LAMBDA_RUNTIME_DIR: "/var/runtime",
  LAMBDA_TASK_ROOT: "/var/task",
});
const LAMBDA_RUNTIME_ENVIRONMENT_VARIABLE_NAMES = Object.freeze([
  ...Object.keys(VALIDATED_AWS_LAMBDA_ENVIRONMENT),
  "AWS_SAM_LOCAL",
]);

for (const variableName of LAMBDA_RUNTIME_ENVIRONMENT_VARIABLE_NAMES) {
  delete process.env[variableName];
}

async function withTemporaryEnvironment(environmentOverrides, callback) {
  const previousValues = new Map(
    Object.keys(environmentOverrides).map((variableName) => [
      variableName,
      process.env[variableName],
    ]),
  );

  for (const [variableName, value] of Object.entries(environmentOverrides)) {
    if (value === undefined) {
      delete process.env[variableName];
    } else {
      process.env[variableName] = value;
    }
  }

  try {
    return await callback();
  } finally {
    for (const [variableName, previousValue] of previousValues) {
      if (previousValue === undefined) {
        delete process.env[variableName];
      } else {
        process.env[variableName] = previousValue;
      }
    }
  }
}

function event(method, path, body, headers = {}, rawQueryString = "") {
  return {
    version: "2.0",
    rawPath: path,
    rawQueryString,
    headers,
    requestContext: {
      requestId: "request-test-1",
      http: { method, path },
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function post(path, body, headers = {}) {
  return event("POST", path, body, {
    "content-type": "application/json",
    "idempotency-key": TEST_IDEMPOTENCY_VALUE,
    ...headers,
  });
}

function payload(response) {
  return JSON.parse(response.body);
}

function assertErrorEnvelope(response, expectedStatus, expectedCode) {
  const body = payload(response);
  assert.equal(response.statusCode, expectedStatus);
  assert.equal(body.schemaVersion, "mhelixctw/api/v1");
  assert.equal(body.ok, false);
  assert.equal(body.requestId, "request-test-1");
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "message", "retryable"]);
  assert.equal(body.error.code, expectedCode);
  assert.equal(typeof body.error.message, "string");
  assert.equal(typeof body.error.retryable, "boolean");
}

function assertScopedRuntimeEvidence(body, expectedEvidence, expectedConnection) {
  assert.equal(body.deploymentEvidence, "SOURCE_ONLY");
  assert.equal(body.transport.providerId, "aws");
  assert.equal(body.transport.scope, "AWS_API_GATEWAY_LAMBDA_ONLY");
  assert.equal(body.transport.evidence, expectedEvidence);
  assert.equal(body.transport.connection, expectedConnection);
  assert.equal(body.transport.downstreamProvidersConnected, false);

  const awsProvider = body.providers.find((provider) => provider.id === "aws");
  assert.equal(awsProvider?.evidence, expectedEvidence);
  assert.equal(awsProvider?.connection, expectedConnection);

  if (expectedEvidence === "REALDEAL_TEST") {
    assert.deepEqual(awsProvider.evidenceReference, {
      label: "REALDEAL_TEST",
      provider: "aws",
      requestId: "request-test-1",
    });
    assert.deepEqual(body.transport.evidenceReference, awsProvider.evidenceReference);
  } else {
    assert.equal(awsProvider?.evidenceReference, undefined);
    assert.equal(body.transport.evidenceReference, undefined);
  }

  for (const provider of body.providers.filter((provider) => provider.id !== "aws")) {
    assert.equal(provider.evidence, "SOURCE_ONLY");
    assert.equal(provider.connection, "NOT_CONNECTED");
    assert.equal(provider.evidenceReference, undefined);
  }
}

test("local health keeps AWS and downstream providers source-only", async () => {
  const response = await handler(event("GET", "/healthz"));
  const body = payload(response);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.handler, "READY");
  assert.equal(body.dependenciesConnected, false);
  assert.equal(body.buildStage, "TESTWIRED");
  assertScopedRuntimeEvidence(body, "SOURCE_ONLY", "NOT_CONNECTED");
  assert.equal(body.deploymentEvidence, "SOURCE_ONLY");
  assert.equal(body.releaseCommit, process.env.MHELIX_RELEASE_COMMIT);
  assert.equal(response.headers["cache-control"], "no-store");
  for (const provider of body.providers) {
    assert.equal(provider.evidence, "SOURCE_ONLY");
    assert.equal(provider.connection, "NOT_CONNECTED");
    assert.ok(["LIVE_TESTWIRED", "MOCK"].includes(provider.targetMode));
    assert.equal(provider.mode, undefined);
  }
});

test("both configured browser origins are exact-match allowed", async () => {
  for (const origin of [PRIMARY_ORIGIN, FALLBACK_ORIGIN]) {
    const response = await handler(event("GET", "/healthz", undefined, { origin }));
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["access-control-allow-origin"], origin);
    assert.equal(response.headers.vary, "Origin");
  }

  const rejected = await handler(
    event("GET", "/healthz", undefined, { origin: "https://attacker.example" }),
  );
  assertErrorEnvelope(rejected, 403, "ORIGIN_NOT_ALLOWED");
  assert.equal(rejected.headers["access-control-allow-origin"], undefined);
});

test("status and scenario catalog expose only the fixed synthetic surface", async () => {
  const status = payload(await handler(event("GET", "/api/v1/status")));
  assert.deepEqual(status.actions, ACTIONS);
  assert.equal(status.currentAvailability, "NOT_CONNECTED");
  assert.equal(status.readyForMutations, false);
  assert.equal(status.providers.find((provider) => provider.id === "managed-mcp")?.evidence, "SOURCE_ONLY");
  assert.equal(status.buildStage, "TESTWIRED");
  assertScopedRuntimeEvidence(status, "SOURCE_ONLY", "NOT_CONNECTED");
  assert.equal(status.deploymentEvidence, "SOURCE_ONLY");

  const catalog = payload(await handler(event("GET", "/api/v1/judge/scenarios")));
  assert.equal(catalog.buildStage, "TESTWIRED");
  assertScopedRuntimeEvidence(catalog, "SOURCE_ONLY", "NOT_CONNECTED");
  assert.equal(catalog.deploymentEvidence, "SOURCE_ONLY");
  const scenario = catalog.scenarios[0];
  assert.equal(scenario.scenarioId, "morrow-farmhouse-testwired-v1");
  assert.equal(scenario.agentDidz, "didz:testtown:agent:morrow-property-assistant");
  assert.equal(scenario.ownerDidz, "didz:testtown:person:edgar-morrow");
  assert.equal(scenario.resourceId, "rwaz:testtown:property:morrow-family-farmhouse");
  assert.equal(scenario.grantId, "grant:testtown:morrow-property-unencumbered:v1");
  assert.equal(scenario.predicate, "property.is_unencumbered");
  assert.equal(scenario.synthetic, true);
  assert.equal(scenario.fixtureEvidence, "SOURCE_ONLY");
  assert.equal(scenario.expectedResult, undefined);
  assert.equal(scenario.verifiedResult, undefined);
});

test("validated Lambda runtime promotes only the AWS transport", async () => {
  await withTemporaryEnvironment(VALIDATED_AWS_LAMBDA_ENVIRONMENT, async () => {
    const health = payload(await handler(event("GET", "/healthz")));
    const status = payload(await handler(event("GET", "/api/v1/status")));
    const catalog = payload(await handler(event("GET", "/api/v1/judge/scenarios")));

    for (const responseBody of [health, status, catalog]) {
      assertScopedRuntimeEvidence(responseBody, "REALDEAL_TEST", "CONNECTED");
    }

    assert.equal(health.dependenciesConnected, false);
    assert.equal(status.currentAvailability, "NOT_CONNECTED");
    assert.equal(status.readyForMutations, false);
    assert.equal(catalog.scenarios[0].currentAvailability, "NOT_CONNECTED");
    assert.equal(catalog.scenarios[0].fixtureEvidence, "SOURCE_ONLY");
  });
});

test("partial and SAM-local runtime markers cannot promote AWS evidence", async () => {
  await withTemporaryEnvironment(
    {
      AWS_EXECUTION_ENV: VALIDATED_AWS_LAMBDA_ENVIRONMENT.AWS_EXECUTION_ENV,
      AWS_LAMBDA_FUNCTION_NAME:
        VALIDATED_AWS_LAMBDA_ENVIRONMENT.AWS_LAMBDA_FUNCTION_NAME,
    },
    async () => {
      const health = payload(await handler(event("GET", "/healthz")));
      assertScopedRuntimeEvidence(health, "SOURCE_ONLY", "NOT_CONNECTED");
    },
  );

  await withTemporaryEnvironment(
    { ...VALIDATED_AWS_LAMBDA_ENVIRONMENT, AWS_SAM_LOCAL: "true" },
    async () => {
      const health = payload(await handler(event("GET", "/healthz")));
      assertScopedRuntimeEvidence(health, "SOURCE_ONLY", "NOT_CONNECTED");
    },
  );
});

test("valid operational requests never fabricate a run, receipt, or predicate result", async () => {
  const requests = [
    post("/api/v1/judge/runs", {
      scenarioId: CANONICAL_SCENARIO.scenarioId,
      agentDidz: CANONICAL_SCENARIO.agentDidz,
    }),
    post("/api/v1/judge/runs/run-test-1/sessions/close", {
      sessionId: "session-test-1",
    }),
    post("/api/v1/judge/runs/run-test-1/recall", {
      query: "Where were we, and what am I allowed to ask?",
    }),
    ...ACTIONS.map((action) =>
      post("/api/v1/judge/runs/run-test-1/actions", { action }),
    ),
    event("GET", "/api/v1/judge/receipts/receipt-test-1"),
  ];

  for (const request of requests) {
    const response = await handler(request);
    assertErrorEnvelope(response, 503, "LIVE_PROVIDERS_NOT_CONNECTED");
    const body = payload(response);
    assert.equal(body.runId, undefined);
    assert.equal(body.sessionId, undefined);
    assert.equal(body.receiptId, undefined);
    assert.equal(body.result, undefined);
    for (const provider of body.providers) {
      assert.equal(provider.evidence, "SOURCE_ONLY");
      assert.equal(provider.connection, "NOT_CONNECTED");
    }
  }
});

test("POST validation enforces idempotency, JSON, byte limits, and strict actions", async () => {
  const missingIdempotency = event(
    "POST",
    "/api/v1/judge/runs",
    { scenarioId: CANONICAL_SCENARIO.scenarioId },
    { "content-type": "application/json" },
  );
  assertErrorEnvelope(
    await handler(missingIdempotency),
    428,
    "IDEMPOTENCY_KEY_REQUIRED",
  );

  const wrongContentType = post(
    "/api/v1/judge/runs",
    { scenarioId: CANONICAL_SCENARIO.scenarioId },
    { "content-type": "text/plain" },
  );
  assertErrorEnvelope(await handler(wrongContentType), 415, "JSON_CONTENT_TYPE_REQUIRED");

  const unknownField = post("/api/v1/judge/runs", {
    scenarioId: CANONICAL_SCENARIO.scenarioId,
    claimedResult: true,
  });
  assertErrorEnvelope(await handler(unknownField), 400, "UNKNOWN_REQUEST_FIELD");

  const unsupportedAction = post("/api/v1/judge/runs/run-test-1/actions", {
    action: "dump_private_deed",
  });
  assertErrorEnvelope(await handler(unsupportedAction), 400, "UNSUPPORTED_ACTION");

  const oversized = post("/api/v1/judge/runs", {
    scenarioId: CANONICAL_SCENARIO.scenarioId,
    padding: "x".repeat(5000),
  });
  assertErrorEnvelope(await handler(oversized), 413, "REQUEST_LIMIT_EXCEEDED");
});

test("fixed routes reject query strings and wrong methods", async () => {
  assertErrorEnvelope(
    await handler(event("GET", "/healthz", undefined, {}, "debug=true")),
    400,
    "QUERY_PARAMETERS_NOT_ALLOWED",
  );

  const wrongMethod = await handler(event("POST", "/healthz"));
  assertErrorEnvelope(wrongMethod, 405, "METHOD_NOT_ALLOWED");
  assert.equal(wrongMethod.headers.allow, "GET");
});

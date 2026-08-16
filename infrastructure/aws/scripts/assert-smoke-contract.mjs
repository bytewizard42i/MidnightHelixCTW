// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_PROVIDER_IDENTIFIERS = Object.freeze([
  "aws",
  "cockroachdb",
  "bedrock",
  "midnight",
  "managed-mcp",
  "didz",
  "agenticdid",
  "rwaz",
]);

const DISCONNECTED_PROVIDER_IDENTIFIERS = new Set([
  "bedrock",
  "midnight",
  "managed-mcp",
  "didz",
  "agenticdid",
  "rwaz",
]);

const EXPECTED_RESPONSE_KEYS = Object.freeze({
  health: Object.freeze([
    "buildStage",
    "dependenciesConnected",
    "deploymentEvidence",
    "handler",
    "limits",
    "ok",
    "providers",
    "region",
    "releaseCommit",
    "requestId",
    "schemaVersion",
    "service",
    "transport",
  ]),
  status: Object.freeze([
    "actions",
    "buildStage",
    "currentAvailability",
    "deploymentEvidence",
    "ok",
    "providers",
    "readyForMutations",
    "releaseCommit",
    "requestId",
    "schemaVersion",
    "transport",
    "writeOperations",
  ]),
  scenarios: Object.freeze([
    "buildStage",
    "deploymentEvidence",
    "ok",
    "providers",
    "releaseCommit",
    "requestId",
    "scenarios",
    "schemaVersion",
    "transport",
  ]),
  mutation: Object.freeze([
    "error",
    "ok",
    "providers",
    "releaseCommit",
    "requestId",
    "schemaVersion",
  ]),
});

const EXPECTED_PROVIDER_BASE_KEYS = Object.freeze([
  "connection",
  "evidence",
  "id",
  "label",
  "targetMode",
]);
const EXPECTED_TRANSPORT_KEYS = Object.freeze([
  "connection",
  "downstreamProvidersConnected",
  "evidence",
  "evidenceReference",
  "providerId",
  "scope",
]);
const EXPECTED_SCENARIO_KEYS = Object.freeze([
  "actions",
  "agentDidz",
  "currentAvailability",
  "fixtureEvidence",
  "grantId",
  "ownerDidz",
  "predicate",
  "privacyBoundary",
  "question",
  "requiredLiveProviders",
  "resourceId",
  "scenarioId",
  "synthetic",
  "title",
  "unauthorizedAgentDidz",
]);
const EXPECTED_ACTIONS = Object.freeze([
  "verify_unencumbered",
  "attempt_protected_disclosure",
  "rebuild_recall_projection",
]);

const SAFE_REQUEST_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_RECEIPT_IDENTIFIER_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RELEASE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const FORBIDDEN_PUBLIC_KEY_PATTERN =
  /^(?:secret|secretArn|password|credential|connectionString|database|username|host|hostname|caCertificatePem|certificate|privateKey|markerCommitment|commitment|digest|apiKey|token)$/i;
const FORBIDDEN_PUBLIC_VALUE_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\//i,
  /\.cockroachlabs\.cloud/i,
  /\bmhelix_testwired\b/i,
  /\bmhelix_runtime\b/i,
  /MHELIX_COCKROACH_RUNTIME_SECRET_ARN/,
  /arn:aws:secretsmanager:/i,
  /secretsmanager/i,
  /-----BEGIN CERTIFICATE-----/,
  /\b[0-9a-f]{64}\b/,
]);

function assertCanonicalTimestamp(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  const parsedTimestamp = new Date(value);
  assert.ok(!Number.isNaN(parsedTimestamp.valueOf()), `${label} must be valid`);
  assert.equal(parsedTimestamp.toISOString(), value, `${label} must be canonical UTC`);
}

function assertExactKeys(value, expectedKeys, label) {
  assert.ok(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  assert.deepEqual(
    Object.keys(value).sort(),
    [...expectedKeys].sort(),
    `${label} contains an unexpected public field`,
  );
}

function assertNoSensitiveOutput(value, label, visited = new Set()) {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string") {
    for (const forbiddenPattern of FORBIDDEN_PUBLIC_VALUE_PATTERNS) {
      assert.doesNotMatch(value, forbiddenPattern, `${label} exposes sensitive material`);
    }
    return;
  }
  if (typeof value !== "object") {
    return;
  }
  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoSensitiveOutput(item, `${label}[${index}]`, visited),
    );
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    assert.doesNotMatch(
      key,
      FORBIDDEN_PUBLIC_KEY_PATTERN,
      `${label} exposes forbidden key ${key}`,
    );
    assertNoSensitiveOutput(nestedValue, `${label}.${key}`, visited);
  }
}

function assertTransport(responseBody, label) {
  assertExactKeys(
    responseBody.transport,
    EXPECTED_TRANSPORT_KEYS,
    `${label}.transport`,
  );
  assert.equal(responseBody.transport.providerId, "aws");
  assert.equal(responseBody.transport.scope, "AWS_API_GATEWAY_LAMBDA_ONLY");
  assert.equal(responseBody.transport.evidence, "REALDEAL_TEST");
  assert.equal(responseBody.transport.connection, "CONNECTED");
  assert.equal(responseBody.transport.downstreamProvidersConnected, false);
  assertExactKeys(
    responseBody.transport.evidenceReference,
    ["label", "provider", "requestId"],
    `${label}.transport.evidenceReference`,
  );
  assert.equal(responseBody.transport.evidenceReference.label, "REALDEAL_TEST");
  assert.equal(responseBody.transport.evidenceReference.provider, "aws");
  assert.equal(
    responseBody.transport.evidenceReference.requestId,
    responseBody.requestId,
  );
}

function assertProviderStates(responseBody, label, expectCockroachConnected) {
  assert.ok(Array.isArray(responseBody.providers), `${label}.providers must be an array`);
  assert.deepEqual(
    responseBody.providers.map((provider) => provider.id),
    EXPECTED_PROVIDER_IDENTIFIERS,
    `${label} provider order or membership changed`,
  );

  const providerByIdentifier = new Map(
    responseBody.providers.map((provider) => [provider.id, provider]),
  );

  const awsProvider = providerByIdentifier.get("aws");
  assertExactKeys(
    awsProvider,
    [...EXPECTED_PROVIDER_BASE_KEYS, "evidenceReference"],
    `${label} AWS provider`,
  );
  assert.equal(awsProvider.targetMode, "LIVE_TESTWIRED");
  assert.equal(awsProvider.evidence, "REALDEAL_TEST");
  assert.equal(awsProvider.connection, "CONNECTED");
  assertExactKeys(
    awsProvider.evidenceReference,
    ["label", "provider", "requestId"],
    `${label} AWS evidence reference`,
  );
  assert.equal(awsProvider.evidenceReference.label, "REALDEAL_TEST");
  assert.equal(awsProvider.evidenceReference.provider, "aws");
  assert.equal(awsProvider.evidenceReference.requestId, responseBody.requestId);
  assert.match(awsProvider.evidenceReference.requestId, SAFE_REQUEST_IDENTIFIER_PATTERN);

  const cockroachProvider = providerByIdentifier.get("cockroachdb");
  if (expectCockroachConnected) {
    assertExactKeys(
      cockroachProvider,
      [...EXPECTED_PROVIDER_BASE_KEYS, "detail", "evidenceReference"],
      `${label} CockroachDB provider`,
    );
    assert.equal(cockroachProvider.targetMode, "LIVE_TESTWIRED");
    assert.equal(cockroachProvider.evidence, "REALDEAL_TEST");
    assert.equal(cockroachProvider.connection, "CONNECTED");
    assertExactKeys(
      cockroachProvider.evidenceReference,
      ["label", "observedAt", "provider", "receiptId"],
      `${label} CockroachDB evidence reference`,
    );
    assert.equal(cockroachProvider.evidenceReference.label, "REALDEAL_TEST");
    assert.equal(cockroachProvider.evidenceReference.provider, "cockroachdb");
    assert.match(
      cockroachProvider.evidenceReference.receiptId,
      SAFE_RECEIPT_IDENTIFIER_PATTERN,
    );
    assertCanonicalTimestamp(
      cockroachProvider.evidenceReference.observedAt,
      `${label} CockroachDB observedAt`,
    );
  } else {
    assertExactKeys(
      cockroachProvider,
      EXPECTED_PROVIDER_BASE_KEYS,
      `${label} CockroachDB provider`,
    );
    assert.equal(cockroachProvider.targetMode, "LIVE_TESTWIRED");
    assert.equal(cockroachProvider.evidence, "SOURCE_ONLY");
    assert.equal(cockroachProvider.connection, "NOT_CONNECTED");
  }

  for (const providerIdentifier of DISCONNECTED_PROVIDER_IDENTIFIERS) {
    const provider = providerByIdentifier.get(providerIdentifier);
    assertExactKeys(
      provider,
      EXPECTED_PROVIDER_BASE_KEYS,
      `${label} ${providerIdentifier} provider`,
    );
    const expectedTargetMode = ["didz", "agenticdid", "rwaz"].includes(
      providerIdentifier,
    )
      ? "MOCK"
      : "LIVE_TESTWIRED";
    assert.equal(provider.targetMode, expectedTargetMode);
    assert.equal(provider.evidence, "SOURCE_ONLY");
    assert.equal(provider.connection, "NOT_CONNECTED");
  }
}

function assertResponseShape(responseBody, label) {
  assertExactKeys(responseBody, EXPECTED_RESPONSE_KEYS[label], `${label} response`);
  assert.equal(responseBody.schemaVersion, "mhelixctw/api/v1");
  assert.match(responseBody.requestId, SAFE_REQUEST_IDENTIFIER_PATTERN);

  if (label !== "mutation") {
    assertTransport(responseBody, label);
  }

  if (label === "health") {
    assertExactKeys(
      responseBody.limits,
      ["maxRequestBytes", "maxResponseBytes"],
      "health.limits",
    );
  }

  if (label === "status") {
    assert.deepEqual(responseBody.actions, EXPECTED_ACTIONS);
  }

  if (label === "scenarios") {
    assert.equal(responseBody.scenarios.length, 1);
    assertExactKeys(
      responseBody.scenarios[0],
      EXPECTED_SCENARIO_KEYS,
      "scenarios.scenarios[0]",
    );
    assert.deepEqual(responseBody.scenarios[0].actions, EXPECTED_ACTIONS);
    assert.deepEqual(
      responseBody.scenarios[0].requiredLiveProviders,
      ["cockroachdb", "bedrock", "midnight"],
    );
  }

  if (label === "mutation") {
    assertExactKeys(
      responseBody.error,
      ["code", "message", "retryable"],
      "mutation.error",
    );
  }
}

export function assertSmokeContract({
  health,
  status,
  scenarios,
  mutation,
  expectedReleaseCommit,
}) {
  assert.match(
    expectedReleaseCommit,
    RELEASE_COMMIT_PATTERN,
    "expectedReleaseCommit must be exactly 40 lowercase hexadecimal characters",
  );

  for (const [label, responseBody] of Object.entries({
    health,
    status,
    scenarios,
    mutation,
  })) {
    assertNoSensitiveOutput(responseBody, label);
    assertResponseShape(responseBody, label);
    assertProviderStates(responseBody, label, label !== "mutation");
    assert.equal(
      responseBody.releaseCommit,
      expectedReleaseCommit,
      `${label}.releaseCommit does not match the explicitly expected deployment commit`,
    );
  }

  assert.equal(health.ok, true);
  assert.equal(health.deploymentEvidence, "SOURCE_ONLY");
  assert.equal(health.dependenciesConnected, false);

  assert.equal(status.ok, true);
  assert.equal(status.deploymentEvidence, "SOURCE_ONLY");
  assert.equal(
    status.currentAvailability,
    "NOT_CONNECTED",
    "status.currentAvailability must remain NOT_CONNECTED",
  );
  assert.equal(status.readyForMutations, false);
  assert.equal(status.writeOperations, "BLOCKED_UNTIL_CONNECTED");

  assert.equal(scenarios.ok, true);
  assert.equal(scenarios.deploymentEvidence, "SOURCE_ONLY");
  assert.equal(
    scenarios.scenarios[0].scenarioId,
    "morrow-farmhouse-testwired-v1",
  );
  assert.equal(scenarios.scenarios[0].fixtureEvidence, "SOURCE_ONLY");
  assert.equal(scenarios.scenarios[0].currentAvailability, "NOT_CONNECTED");
  assert.equal(scenarios.scenarios[0].expectedResult, undefined);
  assert.equal(scenarios.scenarios[0].verifiedResult, undefined);

  assert.equal(mutation.ok, false);
  assert.equal(mutation.error.code, "LIVE_PROVIDERS_NOT_CONNECTED");
  assert.equal(mutation.error.retryable, false);
  for (const forbiddenResultKey of [
    "runId",
    "receiptId",
    "result",
    "predicate",
    "expectedResult",
    "verifiedResult",
  ]) {
    assert.equal(
      Object.hasOwn(mutation, forbiddenResultKey),
      false,
      `mutation response must not contain ${forbiddenResultKey}`,
    );
  }
}

async function readJsonFile(path, label) {
  const source = await readFile(path, "utf8");
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  if (process.argv.length !== 7) {
    throw new Error(
      "Usage: node assert-smoke-contract.mjs <health> <status> <scenarios> <mutation> <expected-release-commit>",
    );
  }

  const [health, status, scenarios, mutation] = await Promise.all([
    readJsonFile(process.argv[2], "health response"),
    readJsonFile(process.argv[3], "status response"),
    readJsonFile(process.argv[4], "scenario response"),
    readJsonFile(process.argv[5], "mutation response"),
  ]);

  assertSmokeContract({
    health,
    status,
    scenarios,
    mutation,
    expectedReleaseCommit: process.argv[6],
  });
}

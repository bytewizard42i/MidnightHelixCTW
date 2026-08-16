// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import test from "node:test";

import { assertSmokeContract } from "../scripts/assert-smoke-contract.mjs";

const OBSERVED_AT = "2026-08-16T12:00:00.000Z";
const RECEIPT_ID = "12345678-1234-4123-8123-123456789abc";
const EXPECTED_RELEASE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const STALE_RELEASE_COMMIT = "fedcba9876543210fedcba9876543210fedcba98";

const PROVIDER_LABELS = Object.freeze({
  aws: "AWS Lambda and API Gateway",
  cockroachdb: "CockroachDB Cloud connection and TestWired environment probe",
  bedrock: "AWS Bedrock embedding",
  midnight: "Midnight test network",
  "managed-mcp": "CockroachDB Managed MCP read-only evidence",
  didz: "DIDz synthetic identity fixture",
  agenticdid: "AgenticDID synthetic authority fixture",
  rwaz: "RWAz synthetic property fixture",
});

function awsTransport(requestId) {
  return {
    providerId: "aws",
    scope: "AWS_API_GATEWAY_LAMBDA_ONLY",
    evidence: "REALDEAL_TEST",
    connection: "CONNECTED",
    downstreamProvidersConnected: false,
    evidenceReference: {
      label: "REALDEAL_TEST",
      provider: "aws",
      requestId,
    },
  };
}

function providerStates({ cockroachConnected = true, requestId } = {}) {
  const baselineProvider = (id) => ({
    id,
    label: PROVIDER_LABELS[id],
    targetMode: ["didz", "agenticdid", "rwaz"].includes(id)
      ? "MOCK"
      : "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  });

  return [
    {
      ...baselineProvider("aws"),
      evidence: "REALDEAL_TEST",
      connection: "CONNECTED",
      evidenceReference: {
        label: "REALDEAL_TEST",
        provider: "aws",
        requestId,
      },
    },
    cockroachConnected
      ? {
          ...baselineProvider("cockroachdb"),
          evidence: "REALDEAL_TEST",
          connection: "CONNECTED",
          evidenceReference: {
            label: "REALDEAL_TEST",
            provider: "cockroachdb",
            receiptId: RECEIPT_ID,
            observedAt: OBSERVED_AT,
          },
          detail:
            "The bounded read-only query verified only the reviewed connection and marker.",
        }
      : baselineProvider("cockroachdb"),
    ...[
      "bedrock",
      "midnight",
      "managed-mcp",
      "didz",
      "agenticdid",
      "rwaz",
    ].map(baselineProvider),
  ];
}

function responseBase(requestId, ok) {
  return {
    schemaVersion: "mhelixctw/api/v1",
    ok,
    requestId,
    releaseCommit: EXPECTED_RELEASE_COMMIT,
  };
}

function validResponses() {
  const healthRequestId = "request-health-1";
  const statusRequestId = "request-status-1";
  const scenariosRequestId = "request-scenarios-1";
  const mutationRequestId = "request-mutation-1";

  return {
    health: {
      ...responseBase(healthRequestId, true),
      service: "midnight-helixctw-api",
      buildStage: "TESTWIRED",
      deploymentEvidence: "SOURCE_ONLY",
      transport: awsTransport(healthRequestId),
      handler: "READY",
      dependenciesConnected: false,
      region: "us-east-1",
      limits: {
        maxRequestBytes: 4_096,
        maxResponseBytes: 32_768,
      },
      providers: providerStates({ requestId: healthRequestId }),
    },
    status: {
      ...responseBase(statusRequestId, true),
      buildStage: "TESTWIRED",
      deploymentEvidence: "SOURCE_ONLY",
      transport: awsTransport(statusRequestId),
      currentAvailability: "NOT_CONNECTED",
      readyForMutations: false,
      writeOperations: "BLOCKED_UNTIL_CONNECTED",
      actions: [
        "verify_unencumbered",
        "attempt_protected_disclosure",
        "rebuild_recall_projection",
      ],
      providers: providerStates({ requestId: statusRequestId }),
    },
    scenarios: {
      ...responseBase(scenariosRequestId, true),
      buildStage: "TESTWIRED",
      deploymentEvidence: "SOURCE_ONLY",
      transport: awsTransport(scenariosRequestId),
      scenarios: [
        {
          scenarioId: "morrow-farmhouse-testwired-v1",
          title: "Morrow Family Farmhouse",
          question: "Is the synthetic Morrow family farmhouse unencumbered?",
          synthetic: true,
          ownerDidz: "didz:testtown:person:edgar-morrow",
          agentDidz: "didz:testtown:agent:morrow-property-assistant",
          unauthorizedAgentDidz: "didz:testtown:agent:unknown-listing-bot",
          resourceId: "rwaz:testtown:property:morrow-family-farmhouse",
          grantId: "grant:testtown:morrow-property-unencumbered:v1",
          predicate: "property.is_unencumbered",
          fixtureEvidence: "SOURCE_ONLY",
          currentAvailability: "NOT_CONNECTED",
          actions: [
            "verify_unencumbered",
            "attempt_protected_disclosure",
            "rebuild_recall_projection",
          ],
          requiredLiveProviders: ["cockroachdb", "bedrock", "midnight"],
          privacyBoundary:
            "The underlying deed and mortgage text must never be returned by this API.",
        },
      ],
      providers: providerStates({ requestId: scenariosRequestId }),
    },
    mutation: {
      ...responseBase(mutationRequestId, false),
      error: {
        code: "LIVE_PROVIDERS_NOT_CONNECTED",
        message: "Live providers remain unavailable.",
        retryable: false,
      },
      providers: providerStates({
        cockroachConnected: false,
        requestId: mutationRequestId,
      }),
    },
  };
}

test("smoke contract accepts only the scoped read-only provider promotion", () => {
  assert.doesNotThrow(() =>
    assertSmokeContract({
      ...validResponses(),
      expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
    }),
  );
});

test("smoke contract rejects leaked runtime configuration", () => {
  const responses = validResponses();
  responses.health.database = "mhelix_testwired";
  assert.throws(
    () =>
      assertSmokeContract({
        ...responses,
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
      }),
    /forbidden key database/,
  );
});

test("smoke contract rejects an aliased sensitive field", () => {
  const responses = validResponses();
  responses.health.providers[1].apiKey = "redacted";
  assert.throws(
    () =>
      assertSmokeContract({
        ...responses,
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
      }),
    /forbidden key apiKey/,
  );
});

test("smoke contract rejects an unexpected otherwise-benign response field", () => {
  const responses = validResponses();
  responses.status.debug = false;
  assert.throws(
    () =>
      assertSmokeContract({
        ...responses,
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
      }),
    /status response contains an unexpected public field/,
  );
});

test("smoke contract rejects an unexpected otherwise-benign provider field", () => {
  const responses = validResponses();
  responses.health.providers[0].latency = 1;
  assert.throws(
    () =>
      assertSmokeContract({
        ...responses,
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
      }),
    /health AWS provider contains an unexpected public field/,
  );
});

test("smoke contract rejects promotion of the overall application", () => {
  const responses = validResponses();
  responses.status.currentAvailability = "CONNECTED";
  assert.throws(
    () =>
      assertSmokeContract({
        ...responses,
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
      }),
    /status\.currentAvailability must remain NOT_CONNECTED/,
  );
});

for (const responseName of ["health", "status", "scenarios", "mutation"]) {
  test(`smoke contract rejects a stale ${responseName} release commit`, () => {
    const responses = validResponses();
    responses[responseName].releaseCommit = STALE_RELEASE_COMMIT;

    assert.throws(
      () =>
        assertSmokeContract({
          ...responses,
          expectedReleaseCommit: EXPECTED_RELEASE_COMMIT,
        }),
      new RegExp(
        `${responseName}\\.releaseCommit does not match the explicitly expected deployment commit`,
      ),
    );
  });
}

test("smoke contract rejects a malformed expected release commit", () => {
  assert.throws(
    () =>
      assertSmokeContract({
        ...validResponses(),
        expectedReleaseCommit: EXPECTED_RELEASE_COMMIT.toUpperCase(),
      }),
    /exactly 40 lowercase hexadecimal characters/,
  );
});

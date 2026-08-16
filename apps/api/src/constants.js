// SPDX-License-Identifier: Apache-2.0

/**
 * Canonical identifiers are intentionally centralized. The public API accepts
 * only this synthetic TestTown case during the hackathon, which prevents an
 * arbitrary public caller from turning the judge surface into a general data
 * or model proxy.
 */
export const CANONICAL_SCENARIO = Object.freeze({
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
});

export const ACTIONS = Object.freeze([
  "verify_unencumbered",
  "attempt_protected_disclosure",
  "rebuild_recall_projection",
]);

export const RESPONSE_SCHEMA_VERSION = "mhelixctw/api/v1";

/**
 * These are the fail-closed baseline states. The default handler upgrades only
 * the AWS (Amazon Web Services) row after validating its deployed Lambda
 * runtime. A separately injected, reviewed query executor may upgrade only the
 * CockroachDB connection-and-environment-probe row. Every other downstream
 * provider remains SOURCE_ONLY and NOT_CONNECTED until its integration records
 * real execution evidence. Mock fixture providers are not called by this
 * Phase 1 transport shell.
 */
export const PROVIDER_STATES = Object.freeze([
  Object.freeze({
    id: "aws",
    // Human-facing alias. The machine identifier stays `aws` because the
    // typed protocol contract and the browser both key on it; only the label
    // judges read on screen uses the product name.
    label: "Helix Runtime Bridge (AWS Lambda and API Gateway)",
    targetMode: "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "cockroachdb",
    label: "CockroachDB Cloud connection and TestWired environment probe",
    targetMode: "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "bedrock",
    label: "AWS Bedrock embedding",
    targetMode: "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "midnight",
    label: "Midnight test network",
    targetMode: "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "managed-mcp",
    label: "CockroachDB Managed MCP read-only evidence",
    targetMode: "LIVE_TESTWIRED",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "didz",
    label: "DIDz synthetic identity fixture",
    targetMode: "MOCK",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "agenticdid",
    label: "AgenticDID synthetic authority fixture",
    targetMode: "MOCK",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
  Object.freeze({
    id: "rwaz",
    label: "RWAz synthetic property fixture",
    targetMode: "MOCK",
    evidence: "SOURCE_ONLY",
    connection: "NOT_CONNECTED",
  }),
]);

export const ALLOWED_AGENT_IDENTIFIERS = Object.freeze([
  CANONICAL_SCENARIO.agentDidz,
  CANONICAL_SCENARIO.unauthorizedAgentDidz,
]);

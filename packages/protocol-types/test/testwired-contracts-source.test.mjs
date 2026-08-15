// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../src/testwired-contracts.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");

function interfaceBlock(interfaceName) {
  return source.match(
    new RegExp(`export interface ${interfaceName}[^{}]*\\{(.*?)\\n\\}`, "s"),
  )?.[1];
}

test("machine stages are complete and exclude output evidence labels", () => {
  const stageBlock = source.match(
    /export const IMPLEMENTATION_STAGES = \[(.*?)\] as const;/s,
  )?.[1];
  assert.ok(stageBlock, "IMPLEMENTATION_STAGES must remain a literal tuple");
  for (const expectedStage of [
    "LIVE_TESTWIRED",
    "VERIFIED_LOCAL",
    "MOCK",
    "SOURCE_ONLY",
    "PLANNED",
  ]) {
    assert.ok(stageBlock.includes(expectedStage), expectedStage);
  }
  assert.equal(stageBlock.includes("REALDEAL_TEST"), false);
});

test("REALDEAL_TEST is an output evidence label, not a stage", () => {
  const evidenceBlock = source.match(
    /export const OUTPUT_EVIDENCE_LABELS = \[(.*?)\] as const;/s,
  )?.[1];
  assert.ok(evidenceBlock, "OUTPUT_EVIDENCE_LABELS must remain a literal tuple");
  assert.ok(evidenceBlock.includes("REALDEAL_TEST"));
});

test("fixed Morrow actions and privacy counter remain in the wire contract", () => {
  for (const expectedAction of [
    "verify_unencumbered",
    "attempt_protected_disclosure",
    "rebuild_recall_projection",
  ]) {
    assert.ok(source.includes(expectedAction), expectedAction);
  }
  assert.match(source, /export type ProtectedFieldsReturned = 0;/);
  assert.ok(
    source.match(/readonly protectedFieldsReturned: ProtectedFieldsReturned;/g)
      ?.length >= 5,
    "run, session, recall, action, and receipt contracts must report zero",
  );
});

test("Managed MCP and mutation readiness stay explicit", () => {
  assert.match(source, /"managed-mcp"/);
  assert.match(source, /readonly readyForMutations: boolean;/);
});

test("successful mutation contracts require live evidence and checkpoint receipts", () => {
  for (const interfaceName of [
    "CreateRunResponse",
    "CloseSessionResponse",
    "RecallResponse",
    "JudgeActionResponse",
  ]) {
    const block = interfaceBlock(interfaceName);
    assert.ok(block, interfaceName);
    assert.match(block, /readonly deploymentEvidence: "LIVE_TESTWIRED";/);
  }
  for (const interfaceName of ["CloseSessionResponse", "RecallResponse"]) {
    const block = interfaceBlock(interfaceName);
    assert.match(block, /readonly receiptId: string;/);
    assert.doesNotMatch(block, /receiptId\?:/);
  }
});

test("successful mutation contracts bind one strictly formatted release commit", () => {
  const releaseCommitPattern = source.match(
    /export const RELEASE_COMMIT_PATTERN_SOURCE = "([^"]+)" as const;/,
  )?.[1];
  assert.equal(releaseCommitPattern, "^[0-9a-f]{40}$");
  assert.match(source, /export type ReleaseCommit = string;/);

  const releaseCommitValidator = new RegExp(releaseCommitPattern);
  assert.equal(
    releaseCommitValidator.test("0123456789abcdef0123456789abcdef01234567"),
    true,
  );
  for (const invalidReleaseCommit of [
    "0123456789abcdef0123456789abcdef0123456",
    "0123456789abcdef0123456789abcdef012345678",
    "0123456789ABCDEF0123456789ABCDEF01234567",
    "g123456789abcdef0123456789abcdef01234567",
    "x0123456789abcdef0123456789abcdef01234567",
  ]) {
    assert.equal(
      releaseCommitValidator.test(invalidReleaseCommit),
      false,
      invalidReleaseCommit,
    );
  }

  for (const interfaceName of [
    "CreateRunResponse",
    "CloseSessionResponse",
    "RecallResponse",
    "JudgeActionResponse",
  ]) {
    const block = interfaceBlock(interfaceName);
    assert.ok(block, interfaceName);
    assert.match(block, /readonly releaseCommit: ReleaseCommit;/);
    assert.doesNotMatch(block, /releaseCommit\?:/);
  }
});

test("recall and predicate results carry explicit generation lineage", () => {
  const recallMatchBlock = interfaceBlock("RecallMatch");
  assert.ok(recallMatchBlock);
  assert.match(recallMatchBlock, /readonly projectionGenerationId: string;/);
  assert.doesNotMatch(recallMatchBlock, /projectionGenerationId\?:/);

  const verifiedPredicateBlock = interfaceBlock("VerifiedPredicateResult");
  assert.ok(verifiedPredicateBlock);
  for (const requiredField of [
    "canonicalMemoryId",
    "evidenceCommitment",
    "projectionGenerationId",
    "sourceTextDisclosed",
    "midnightReceiptId",
  ]) {
    assert.ok(verifiedPredicateBlock.includes(requiredField), requiredField);
  }
  assert.match(verifiedPredicateBlock, /readonly midnightReceiptId: string;/);
  assert.doesNotMatch(verifiedPredicateBlock, /midnightReceiptId\?:/);
});

test("denied fields come from the fixed canonical allowlist", () => {
  const allowlist = source.match(
    /export const DENIED_PROTECTED_FIELDS = \[(.*?)\] as const;/s,
  )?.[1];
  assert.ok(allowlist);
  for (const fieldName of [
    "deed.full_text",
    "mortgage.full_record",
    "owner.birth_date",
    "owner.private_contact_information",
  ]) {
    assert.ok(allowlist.includes(fieldName), fieldName);
  }
  assert.match(
    interfaceBlock("DeniedDisclosureResult"),
    /readonly requestedProtectedFields: readonly DeniedProtectedField\[\];/,
  );
});

test("projection rebuilds restate the evidence commitment", () => {
  const block = interfaceBlock("ProjectionRebuildResult");
  assert.ok(block);
  assert.match(block, /readonly evidenceCommitment: string;/);
  assert.doesNotMatch(block, /evidenceCommitment\?:/);
});

test("judge receipts identify their exact operation", () => {
  assert.match(
    source,
    /export type JudgeReceiptOperation =\s*\| "create_run"\s*\| "close_session"\s*\| "recall"\s*\| JudgeAction;/s,
  );
  const baseBlock = interfaceBlock("JudgeReceiptBase");
  assert.ok(baseBlock);
  assert.match(baseBlock, /readonly releaseCommit: ReleaseCommit;/);
  assert.match(
    source,
    /readonly operation: "create_run" \| "close_session" \| "recall";/,
  );
  assert.match(source, /readonly action\?: never;/);
  assert.match(
    source,
    /\[Action in JudgeAction\]: JudgeReceiptBase & \{/,
  );
  assert.match(source, /readonly operation: Action;/);
  assert.match(source, /readonly action: Action;/);
  assert.doesNotMatch(source, /readonly action\?: JudgeAction;/);
});

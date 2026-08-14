// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../src/testwired-contracts.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");

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

// SPDX-License-Identifier: Apache-2.0
//
// Tests for the deterministic MOCK embedding generator and the committed
// public-safe memory corpus.
//
// These tests touch no database and no network. They prove the fixture
// generator is deterministic and bounded, and that the committed corpus obeys
// the privacy boundary: no protected value may appear in it, ever.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MAX_EMBEDDING_INPUT_LENGTH,
  SYNTHETIC_EMBEDDING_DIMENSIONS,
  SYNTHETIC_EMBEDDING_MODEL_ID,
  assertValidEmbedding,
  canonicalizeEmbeddingInput,
  computeEmbeddingCommitmentHex,
  generateSyntheticEmbedding,
  toVectorLiteral,
} from "../src/synthetic-embedding.js";

const CORPUS_URL = new URL(
  "../../../fixtures/testtown/memory-corpus/public-safe-corpus.json",
  import.meta.url,
);

async function readCorpus() {
  return JSON.parse(await readFile(CORPUS_URL, "utf8"));
}

test("the model identifier and dimension match the migration 002 contract", () => {
  // Migration 002 pins both with CHECK constraints. Drift here would make every
  // insert fail at runtime instead of at test time.
  assert.equal(SYNTHETIC_EMBEDDING_MODEL_ID, "mhelixctw-synthetic-embedding-v1");
  assert.equal(SYNTHETIC_EMBEDDING_DIMENSIONS, 8);
});

test("embeddings are deterministic across calls", () => {
  const first = generateSyntheticEmbedding("Edgar Morrow is a TestTown citizen.");
  const second = generateSyntheticEmbedding("Edgar Morrow is a TestTown citizen.");
  assert.deepEqual(first.embedding, second.embedding);
  assert.equal(first.embeddingCommitmentHex, second.embeddingCommitmentHex);
  assert.equal(first.evidence, "MOCK");
});

test("embeddings have exactly eight finite unit-normalized values", () => {
  const { embedding } = generateSyntheticEmbedding("a bounded public-safe summary");
  assert.equal(embedding.length, 8);
  for (const component of embedding) {
    assert.equal(Number.isFinite(component), true);
  }
  const magnitude = Math.sqrt(
    embedding.reduce((total, component) => total + component * component, 0),
  );
  assert.ok(Math.abs(magnitude - 1) < 1e-9, `magnitude was ${magnitude}`);
  assert.equal(assertValidEmbedding(embedding), true);
});

test("different inputs produce different vectors and commitments", () => {
  const first = generateSyntheticEmbedding("Edgar Morrow, Master Joiner");
  const second = generateSyntheticEmbedding("June Okafor, Registered Nurse");
  assert.notDeepEqual(first.embedding, second.embedding);
  assert.notEqual(first.embeddingCommitmentHex, second.embeddingCommitmentHex);
});

test("input canonicalization is stable and collapses only safe differences", () => {
  assert.equal(canonicalizeEmbeddingInput("  spaced   out  "), "spaced out");
  // The same logical text must land on the same vector regardless of padding.
  assert.deepEqual(
    generateSyntheticEmbedding("hello  world").embedding,
    generateSyntheticEmbedding(" hello world ").embedding,
  );
});

test("unsafe or unbounded input is rejected, never silently repaired", () => {
  assert.throws(() => canonicalizeEmbeddingInput(""), RangeError);
  assert.throws(() => canonicalizeEmbeddingInput("   "), RangeError);
  assert.throws(() => canonicalizeEmbeddingInput("bad\u0000null"), RangeError);
  assert.throws(() => canonicalizeEmbeddingInput("line\nbreak"), RangeError);
  assert.throws(() => canonicalizeEmbeddingInput("tab\there"), RangeError);
  assert.throws(
    () => canonicalizeEmbeddingInput("x".repeat(MAX_EMBEDDING_INPUT_LENGTH + 1)),
    RangeError,
  );
  assert.throws(() => canonicalizeEmbeddingInput(42), TypeError);
});

test("stored embeddings are validated fail-closed before being trusted", () => {
  assert.throws(() => assertValidEmbedding([0, 0, 0, 0, 0, 0, 0, 0]), RangeError);
  assert.throws(() => assertValidEmbedding([1, 0, 0, 0, 0, 0, 0]), RangeError);
  assert.throws(() => assertValidEmbedding([1, 0, 0, 0, 0, 0, 0, 0, 0]), RangeError);
  assert.throws(
    () => assertValidEmbedding([Number.NaN, 0, 0, 0, 0, 0, 0, 0]),
    RangeError,
  );
  assert.throws(() => assertValidEmbedding([2, 0, 0, 0, 0, 0, 0, 0]), RangeError);
  assert.throws(() => assertValidEmbedding("not an array"), TypeError);
});

test("the commitment binds the model, the input, and the vector together", () => {
  const { canonicalInput, embedding, embeddingCommitmentHex } =
    generateSyntheticEmbedding("commitment binding check");
  assert.match(embeddingCommitmentHex, /^[0-9a-f]{64}$/);
  assert.equal(
    computeEmbeddingCommitmentHex(canonicalInput, embedding),
    embeddingCommitmentHex,
  );
  // Changing one vector component must change the commitment.
  const tampered = [...embedding];
  tampered[0] = Number((tampered[0] + 0.1).toFixed(12));
  assert.notEqual(
    computeEmbeddingCommitmentHex(canonicalInput, tampered),
    embeddingCommitmentHex,
  );
  // Changing the input must change the commitment.
  assert.notEqual(
    computeEmbeddingCommitmentHex("different input", embedding),
    embeddingCommitmentHex,
  );
});

test("the vector literal is valid CockroachDB VECTOR syntax", () => {
  const { embedding } = generateSyntheticEmbedding("vector literal check");
  const literal = toVectorLiteral(embedding);
  assert.match(literal, /^\[-?\d+\.\d{12}(,-?\d+\.\d{12}){7}\]$/);
  assert.equal(literal.split(",").length, 8);
});

test("the committed corpus is large enough for meaningful vector indexing", async () => {
  const corpus = await readCorpus();
  assert.equal(corpus.schema, "mhelixctw/memory-corpus/v1");
  assert.equal(corpus.embeddingModelId, SYNTHETIC_EMBEDDING_MODEL_ID);
  assert.equal(corpus.embeddingDimensions, 8);
  assert.equal(corpus.embeddingEvidence, "MOCK");
  // The judge scenario requires a bounded set of at least 32 records so that
  // distributed vector indexing is exercised, not merely demonstrated on two
  // rows.
  assert.ok(
    corpus.entryCount >= 32,
    `corpus must hold at least 32 entries, found ${corpus.entryCount}`,
  );
  assert.equal(corpus.entries.length, corpus.entryCount);
});

test("every committed corpus entry reproduces its own vector and commitment", async () => {
  const corpus = await readCorpus();
  const seenFixtureIds = new Set();
  for (const entry of corpus.entries) {
    assert.match(entry.fixtureId, /^[a-z0-9-]+$/);
    assert.equal(seenFixtureIds.has(entry.fixtureId), false, entry.fixtureId);
    seenFixtureIds.add(entry.fixtureId);

    const regenerated = generateSyntheticEmbedding(entry.publicSafeSummary);
    assert.deepEqual(regenerated.embedding, entry.embedding, entry.fixtureId);
    assert.equal(
      regenerated.embeddingCommitmentHex,
      entry.embeddingCommitmentHex,
      entry.fixtureId,
    );
    assert.equal(assertValidEmbedding(entry.embedding), true);
  }
});

test("the committed corpus contains no protected value and no investigative detail", async () => {
  const corpus = await readCorpus();
  const serialized = JSON.stringify(corpus.entries);

  // Protected value SHAPES that must never appear: employer identification
  // numbers, state registration numbers, or full dates of any kind.
  assert.doesNotMatch(serialized, /\b\d{2}-\d{7}\b/, "employer identification number shape");
  assert.doesNotMatch(serialized, /\bPA-C-\d+\b/, "state registration shape");
  assert.doesNotMatch(serialized, /\b\d{4}-\d{2}-\d{2}\b/, "full date shape");

  // Fraud MECHANISM wording is investigative detail and stays behind the
  // boundary, including inside identifiers.
  for (const forbidden of [
    /never issued/i,
    /forged/i,
    /does not exist/i,
    /nonexistent/i,
    /impersonat/i,
    /not-in-irs/i,
  ]) {
    assert.doesNotMatch(serialized, forbidden, `investigative detail: ${forbidden}`);
  }

  // Protected fields are referenced by NAME only, never with a value.
  for (const entry of corpus.entries) {
    assert.ok(Array.isArray(entry.protectedFieldNames));
    for (const fieldName of entry.protectedFieldNames) {
      assert.match(fieldName, /^[a-zA-Z]+$/);
    }
    // The entry must expose exactly the public-safe shape and nothing more.
    assert.deepEqual(
      Object.keys(entry).sort(),
      [
        "category",
        "embedding",
        "embeddingCommitmentHex",
        "fixtureId",
        "honestyRole",
        "protectedFieldNames",
        "publicSafeSummary",
      ],
    );
  }
});

test("the corpus records its upstream provenance and privacy rule", async () => {
  const corpus = await readCorpus();
  // The hackathon requires disclosing incorporated pre-existing work.
  assert.equal(
    corpus.upstreamSource.repository,
    "https://github.com/bytewizard42i/TestTownDIDz",
  );
  assert.equal(corpus.upstreamSource.license, "Apache-2.0");
  assert.ok(corpus.privacyBoundary.protectedFieldNames.includes("ein"));
  assert.ok(corpus.privacyBoundary.protectedFieldNames.includes("born"));
  assert.match(corpus.privacyBoundary.rule, /zero protected fields/i);
});

test("the corpus carries flagged entities for the denial scenario", async () => {
  const corpus = await readCorpus();
  const villains = corpus.entries.filter((entry) => entry.honestyRole === "VILLAIN");
  // The refusal story needs at least one entity whose protected evidence a
  // caller might try to extract.
  assert.ok(villains.length >= 1, "expected at least one flagged entity");
  for (const villain of villains) {
    assert.ok(
      villain.protectedFieldNames.length > 0,
      `${villain.fixtureId} must have protected fields to withhold`,
    );
    // The summary may say an entity is flagged, but never why.
    assert.match(villain.publicSafeSummary, /flagged by TestTown review/);
  }
});

test("the deployable corpus copy matches the canonical fixture byte for byte", async () => {
  // The Lambda package contains only `apps/api`, so the runtime cannot reach
  // the fixtures directory and needs its own copy. Duplication is only safe if
  // drift is impossible, so this asserts the two files are identical. Both are
  // written by `scripts/build-memory-corpus.mjs` in one run.
  const canonical = await readFile(CORPUS_URL, "utf8");
  const deployable = await readFile(
    new URL("../src/memory-corpus.json", import.meta.url),
    "utf8",
  );
  assert.equal(deployable, canonical);
});

#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
//
// Build the committed public-safe memory corpus from the TestTownDIDz dossiers.
//
// WHY THIS EXISTS: the judge scenario needs a bounded set of at least 32
// deterministic, public-safe fixture summaries so that CockroachDB distributed
// vector indexing is exercised meaningfully rather than over two rows. The
// upstream synthetic town already has 63 dossiers, so this derives the corpus
// from them instead of inventing parallel test data.
//
// WHY THE OUTPUT IS COMMITTED: a judge must be able to clone this repository
// alone and run everything. TestTownDIDz is a separate repository and is NOT a
// build dependency. This script regenerates and verifies the committed corpus
// when the upstream checkout is available; the committed JSON is the source of
// truth for the application.
//
// THE PRIVACY BOUNDARY, ENFORCED HERE:
//   * Public-safe, and therefore embedded: display name, category, honesty
//     posture, issuer type, requested assurance level, attestation scopes,
//     subject tiers, employment role and employer, founding year.
//   * Protected, and therefore NEVER copied into this repository in any form:
//     employer identification numbers, state registration numbers, dates of
//     birth, birth-record issuers, document contents, and officer names. Only
//     the NAMES of those protected fields are recorded, so the denial route can
//     prove exactly which fields it withheld while returning zero of them.
//
// Usage:
//   node scripts/build-memory-corpus.mjs --source <path-to-TestTownDIDz> [--check]
//
// `--check` verifies the committed corpus matches a fresh derivation and exits
// nonzero on any drift, without writing.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { argv, exit } from "node:process";
import { join } from "node:path";

import {
  SYNTHETIC_EMBEDDING_DIMENSIONS,
  SYNTHETIC_EMBEDDING_MODEL_ID,
  generateSyntheticEmbedding,
} from "../apps/api/src/synthetic-embedding.js";

const CORPUS_PATH = new URL(
  "../fixtures/testtown/memory-corpus/public-safe-corpus.json",
  import.meta.url,
);

/**
 * The deployable copy. The Lambda package contains only `apps/api`, so the
 * runtime cannot reach the fixtures directory. Both files are written together
 * and a test asserts they stay byte-identical, so the duplication cannot drift.
 */
const DEPLOYABLE_CORPUS_PATH = new URL(
  "../apps/api/src/memory-corpus.json",
  import.meta.url,
);

/** Field names that must never have their values copied into this repository. */
const PROTECTED_FIELD_NAMES = Object.freeze([
  "ein",
  "stateRegistration",
  "born",
  "birthRecordIssuer",
  "documents",
  "officers",
]);

/** Categories included in the corpus, in a stable order. */
const INCLUDED_CATEGORIES = Object.freeze([
  "citizens",
  "organizations",
  "assets",
  "animals",
]);

function parseArguments() {
  const options = { source: null, check: false };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--source") {
      options.source = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--check") {
      options.check = true;
    }
  }
  return options;
}

/** Title-case a slug fragment for readable prose, without inventing facts. */
function humanizeSlug(slug) {
  return slug
    .replace(/^VILLAIN--/, "")
    .split("--")[0]
    .split("-")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Compose the one-sentence public-safe summary for a dossier.
 *
 * Every clause draws only on public-safe fields. The honesty posture is
 * included because it is a public civic fact in this synthetic town, but the
 * fraud MECHANISM is deliberately excluded: that is investigative detail and
 * belongs behind the protected boundary.
 */
function buildPublicSafeSummary(dossier) {
  const parts = [];
  const category = String(dossier.category ?? "record");
  parts.push(`${dossier.displayName} is a TestTown ${category}`);

  const employment = Array.isArray(dossier.employment) ? dossier.employment[0] : null;
  if (employment?.role && employment?.employerSlug) {
    parts.push(
      `working as ${employment.role} for ${humanizeSlug(employment.employerSlug)}`,
    );
  }

  const authority = dossier.authority ?? {};
  if (authority.issuerType) {
    parts.push(`acting as a ${String(authority.issuerType)} issuer`);
  }
  if (authority.requestedAssuranceLevel) {
    parts.push(
      `at requested assurance level ${String(authority.requestedAssuranceLevel)}`,
    );
  }
  if (Array.isArray(authority.attestationScopes) && authority.attestationScopes.length > 0) {
    parts.push(`attesting scopes ${authority.attestationScopes.join(" and ")}`);
  }
  if (Array.isArray(authority.subjectTiers) && authority.subjectTiers.length > 0) {
    parts.push(`for subject tiers ${authority.subjectTiers.join(" and ")}`);
  }

  const founded = dossier.identifiers?.founded;
  if (typeof founded === "string" && /^\d{4}/.test(founded)) {
    // Only the YEAR is public-safe. The full date stays behind the boundary.
    parts.push(`established ${founded.slice(0, 4)}`);
  }

  const honestyRole = dossier.honesty?.role;
  if (honestyRole === "VILLAIN") {
    parts.push("flagged by TestTown review as a fraudulent-credential risk");
  } else if (honestyRole === "AUTHENTIC") {
    parts.push("recorded as an authentic TestTown participant");
  }

  return `${parts.join(", ")}.`;
}

/** Which protected field names are actually present on this dossier. */
function presentProtectedFieldNames(dossier) {
  const present = [];
  for (const fieldName of PROTECTED_FIELD_NAMES) {
    const onIdentifiers = dossier.identifiers?.[fieldName];
    const onRoot = dossier[fieldName];
    const candidate = onIdentifiers ?? onRoot;
    const hasValue = Array.isArray(candidate)
      ? candidate.length > 0
      : candidate !== undefined && candidate !== null && candidate !== "";
    if (hasValue) {
      present.push(fieldName);
    }
  }
  return present;
}

async function readDossiers(sourceRoot) {
  const records = [];
  for (const category of INCLUDED_CATEGORIES) {
    const categoryRoot = join(sourceRoot, "dossiers", category);
    let entries;
    try {
      entries = await readdir(categoryRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
      const dossierPath = join(categoryRoot, entry.name, "dossier.json");
      let raw;
      try {
        raw = await readFile(dossierPath, "utf8");
      } catch {
        continue;
      }
      records.push({ category, slug: entry.name, dossier: JSON.parse(raw) });
    }
  }
  // Stable ordering keeps the committed corpus byte-reproducible.
  records.sort((left, right) =>
    `${left.category}/${left.slug}`.localeCompare(`${right.category}/${right.slug}`),
  );
  return records;
}

function buildCorpus(records) {
  const entries = records.map(({ category, slug, dossier }) => {
    const publicSafeSummary = buildPublicSafeSummary(dossier);
    const embedded = generateSyntheticEmbedding(publicSafeSummary);
    return {
      // Upstream villain directories encode the fraud mechanism in the slug
      // itself, for example `VILLAIN--shady-docs-llc--forged-ein-...`. That
      // mechanism is investigative detail and is excluded from the summary, so
      // it must not survive in the identifier either. Keep only the entity-name
      // segment; the honesty posture is carried by `honestyRole`.
      fixtureId: `testtown-${category}-${slug.replace(/^VILLAIN--/, "").split("--")[0]}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-{2,}/g, "-"),
      category: String(dossier.category ?? category),
      honestyRole: String(dossier.honesty?.role ?? "UNKNOWN"),
      publicSafeSummary: embedded.canonicalInput,
      embedding: embedded.embedding,
      embeddingCommitmentHex: embedded.embeddingCommitmentHex,
      protectedFieldNames: presentProtectedFieldNames(dossier),
    };
  });

  return {
    schema: "mhelixctw/memory-corpus/v1",
    embeddingModelId: SYNTHETIC_EMBEDDING_MODEL_ID,
    embeddingDimensions: SYNTHETIC_EMBEDDING_DIMENSIONS,
    embeddingEvidence: "MOCK",
    upstreamSource: {
      repository: "https://github.com/bytewizard42i/TestTownDIDz",
      license: "Apache-2.0",
      note: "Synthetic town dossiers. Only public-safe fields are derived here; protected values are never copied, only their field names.",
    },
    privacyBoundary: {
      publicSafeFields: [
        "displayName",
        "category",
        "honesty.role",
        "employment.role",
        "employment.employerSlug",
        "authority.issuerType",
        "authority.requestedAssuranceLevel",
        "authority.attestationScopes",
        "authority.subjectTiers",
        "identifiers.founded (year only)",
      ],
      protectedFieldNames: [...PROTECTED_FIELD_NAMES],
      rule: "Protected values are never stored in this repository or in the vector table. The disclosure route must return zero protected fields.",
    },
    entryCount: entries.length,
    entries,
  };
}

async function main() {
  const options = parseArguments();
  if (!options.source) {
    console.error(
      "usage: node scripts/build-memory-corpus.mjs --source <path-to-TestTownDIDz> [--check]",
    );
    exit(2);
  }

  const records = await readDossiers(options.source);
  if (records.length === 0) {
    console.error(`no dossiers found under ${options.source}`);
    exit(1);
  }
  const corpus = buildCorpus(records);

  if (corpus.entryCount < 32) {
    console.error(
      `corpus must contain at least 32 entries for meaningful vector indexing, got ${corpus.entryCount}`,
    );
    exit(1);
  }

  const serialized = `${JSON.stringify(corpus, null, 2)}\n`;

  if (options.check) {
    for (const path of [CORPUS_PATH, DEPLOYABLE_CORPUS_PATH]) {
      const committed = await readFile(path, "utf8");
      if (committed !== serialized) {
        console.error(
          `committed corpus at ${path.pathname} differs from a fresh derivation; re-run without --check`,
        );
        exit(1);
      }
    }
    console.log(
      `corpus check passed: ${corpus.entryCount} public-safe entries match both committed copies`,
    );
    return;
  }

  await writeFile(CORPUS_PATH, serialized, "utf8");
  await writeFile(DEPLOYABLE_CORPUS_PATH, serialized, "utf8");
  console.log(
    `wrote ${corpus.entryCount} public-safe corpus entries (${SYNTHETIC_EMBEDDING_DIMENSIONS}-dimensional ${SYNTHETIC_EMBEDDING_MODEL_ID})`,
  );
}

await main();

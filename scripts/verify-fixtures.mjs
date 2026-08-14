// SPDX-License-Identifier: Apache-2.0

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = join(repositoryRoot, "fixtures", "testtown");
const manifestPath = join(fixtureRoot, "manifest.json");

async function readJson(filePath) {
  const text = await readFile(filePath, "utf8");
  return { text, value: JSON.parse(text) };
}

function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const { value: manifest } = await readJson(manifestPath);

requireCondition(
  manifest.sourceCommit === "f145c07b3f8abf62c04e1532f67118b5a5aa66b9",
  "The TestTown snapshot must remain pinned to the reviewed public commit.",
);
requireCondition(
  manifest.syntheticDataOnly === true,
  "The fixture manifest must declare synthetic data only.",
);

const allFixtureFiles = [...manifest.sourceFiles, ...manifest.derivedFiles];
const forbiddenPropertyNames = new Set([
  "walletCard",
  "walletSeed",
  "seedPhrase",
  "privateKey",
  "secretKey",
  "preprodAddress",
]);

function inspectObject(value, path = "root") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectObject(entry, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") {
    return;
  }
  for (const [propertyName, propertyValue] of Object.entries(value)) {
    requireCondition(
      !forbiddenPropertyNames.has(propertyName),
      `Forbidden operational property ${propertyName} found at ${path}.`,
    );
    inspectObject(propertyValue, `${path}.${propertyName}`);
  }
}

const hashes = [];
for (const fixtureFile of allFixtureFiles) {
  const absolutePath = join(fixtureRoot, fixtureFile);
  const { text, value } = await readJson(absolutePath);
  inspectObject(value, fixtureFile);
  hashes.push({ file: fixtureFile, sha256: sha256(text) });

  if (fixtureFile.startsWith("derived/")) {
    requireCondition(
      value.synthetic === true,
      `${fixtureFile} must be explicitly synthetic.`,
    );
    if (Object.hasOwn(value, "evidence")) {
      requireCondition(
        value.evidence === "MOCK",
        `${fixtureFile} may only carry the MOCK evidence label.`,
      );
    }
  }
}

const { value: agentGrant } = await readJson(
  join(fixtureRoot, "derived", "mock-agenticdid.json"),
);
requireCondition(
  agentGrant.allowedActions.length === 1 &&
    agentGrant.allowedActions[0] === "property.is_unencumbered",
  "The synthetic agent grant must permit exactly the one-bit property predicate.",
);
requireCondition(
  agentGrant.protectedFieldsAllowed.length === 0,
  "The synthetic agent grant must not allow protected fields.",
);

const { value: titleStatus } = await readJson(
  join(fixtureRoot, "derived", "property-evidence", "title-status.json"),
);
requireCondition(
  titleStatus.predicate === "property.is_unencumbered" &&
    titleStatus.expectedResult === true,
  "The title-status fixture must define the reviewed one-bit result.",
);

console.log("MHelixCTW fixture verification passed.");
console.log(`Verified ${hashes.length} synthetic fixture files:`);
for (const entry of hashes) {
  console.log(`${entry.sha256}  ${relative(repositoryRoot, join(fixtureRoot, entry.file))}`);
}

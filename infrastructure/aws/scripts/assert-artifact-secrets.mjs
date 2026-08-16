#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0

import { readFile, readdir } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";

const artifactDirectory = process.argv[2];

if (!artifactDirectory) {
  console.error("Usage: assert-artifact-secrets.mjs <artifact-directory>");
  process.exit(2);
}

const absoluteArtifactDirectory = resolve(artifactDirectory);

const highConfidenceSecretPatterns = [
  {
    label: "private key",
    pattern: /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/,
  },
  {
    label: "AWS (Amazon Web Services) access key identifier",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    allowedMatches: new Set(["AKIAIOSFODNN7EXAMPLE"]),
  },
  {
    label: "assigned AWS (Amazon Web Services) secret access key",
    pattern:
      /AWS_SECRET_ACCESS_KEY\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}["']?/,
  },
  {
    label:
      "credential-bearing Cockroach Cloud URI (Uniform Resource Identifier)",
    pattern:
      /postgres(?:ql)?:\/\/[^\s:/@]+:[^\s@/]{16,}@[a-z0-9.-]+\.cockroachlabs\.cloud(?::\d+)?\//i,
  },
];

const contextualCredentialPatterns = [
  {
    label: "AWS (Amazon Web Services) secret access key assignment",
    pattern: /AWS_SECRET_ACCESS_KEY\s*[:=]/,
  },
  {
    label: "PostgreSQL credential-bearing URI (Uniform Resource Identifier)",
    pattern:
      /postgres(?:ql)?:\/\/[^\s:/@]+:[^\s@/]+@/,
  },
];

function isDependencyDocumentation(relativeFilePath) {
  const pathSegments = relativeFilePath.split("/");
  if (!pathSegments.includes("node_modules")) {
    return false;
  }

  const fileName = basename(relativeFilePath).toLowerCase();
  return (
    fileName.endsWith(".md") ||
    fileName.endsWith(".markdown") ||
    /^(?:readme|changelog|changes|history|license|notice)(?:\.|$)/.test(fileName)
  );
}

async function collectRegularFiles(directoryPath) {
  const collectedFiles = [];
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry.name);

    if (entry.isDirectory()) {
      collectedFiles.push(...(await collectRegularFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      collectedFiles.push(entryPath);
    }
  }

  return collectedFiles;
}

function findMatchingPattern(text, patterns) {
  for (const patternDefinition of patterns) {
    const textToInspect = patternDefinition.allowedMatches
      ? [...patternDefinition.allowedMatches].reduce(
          (remainingText, allowedMatch) =>
            remainingText.replaceAll(allowedMatch, ""),
          text,
        )
      : text;

    if (patternDefinition.pattern.test(textToInspect)) {
      return patternDefinition;
    }
  }

  return undefined;
}

const artifactFiles = await collectRegularFiles(absoluteArtifactDirectory);

for (const artifactFile of artifactFiles) {
  const fileBuffer = await readFile(artifactFile);
  if (fileBuffer.includes(0)) {
    continue;
  }

  const relativeFilePath = relative(absoluteArtifactDirectory, artifactFile)
    .split(sep)
    .join("/");
  const fileText = fileBuffer.toString("utf8");
  const highConfidenceMatch = findMatchingPattern(
    fileText,
    highConfidenceSecretPatterns,
  );

  if (highConfidenceMatch) {
    console.error(
      `Generated package contains ${highConfidenceMatch.label}: ${relativeFilePath}`,
    );
    process.exit(1);
  }

  if (isDependencyDocumentation(relativeFilePath)) {
    continue;
  }

  const contextualMatch = findMatchingPattern(
    fileText,
    contextualCredentialPatterns,
  );
  if (contextualMatch) {
    console.error(
      `Generated package contains ${contextualMatch.label}: ${relativeFilePath}`,
    );
    process.exit(1);
  }
}

console.log(
  `Artifact credential scan passed: ${artifactFiles.length} regular files checked.`,
);

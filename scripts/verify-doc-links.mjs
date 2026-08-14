// SPDX-License-Identifier: Apache-2.0

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules"]);
const markdownFiles = [];

async function collectMarkdownFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await collectMarkdownFiles(join(directoryPath, entry.name));
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      markdownFiles.push(join(directoryPath, entry.name));
    }
  }
}

function isExternalLink(linkTarget) {
  return /^(?:https?:|mailto:|tel:)/i.test(linkTarget);
}

function normalizeLocalTarget(rawTarget) {
  const withoutTitle = rawTarget.trim().split(/\s+["']/u, 1)[0];
  const withoutAngles = withoutTitle.replace(/^</u, "").replace(/>$/u, "");
  const withoutAnchor = withoutAngles.split("#", 1)[0];
  return decodeURI(withoutAnchor);
}

await collectMarkdownFiles(repositoryRoot);

const failures = [];
for (const markdownFile of markdownFiles) {
  const markdown = await readFile(markdownFile, "utf8");
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;

  for (const match of markdown.matchAll(linkPattern)) {
    const rawTarget = match[1];
    if (isExternalLink(rawTarget) || rawTarget.startsWith("#")) {
      continue;
    }

    const localTarget = normalizeLocalTarget(rawTarget);
    if (!localTarget) {
      continue;
    }
    if (localTarget.startsWith("/")) {
      failures.push(
        `${relative(repositoryRoot, markdownFile)} contains a machine-absolute link: ${rawTarget}`,
      );
      continue;
    }

    const resolvedTarget = resolve(dirname(markdownFile), localTarget);
    if (!resolvedTarget.startsWith(`${repositoryRoot}/`) && resolvedTarget !== repositoryRoot) {
      failures.push(
        `${relative(repositoryRoot, markdownFile)} links outside the repository: ${rawTarget}`,
      );
      continue;
    }

    try {
      await stat(resolvedTarget);
    } catch {
      failures.push(
        `${relative(repositoryRoot, markdownFile)} has a missing link target: ${rawTarget}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Documentation link verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Documentation link verification passed for ${markdownFiles.length} Markdown files.`);
}

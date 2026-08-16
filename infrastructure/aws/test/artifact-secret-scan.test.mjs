// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

const scannerPath = new URL(
  "../scripts/assert-artifact-secrets.mjs",
  import.meta.url,
);

async function createArtifactFixture(files) {
  const fixtureRoot = await mkdtemp(
    resolve(tmpdir(), "mhelix-artifact-secret-scan-"),
  );

  for (const [relativeFilePath, fileContents] of Object.entries(files)) {
    const fixtureFilePath = resolve(fixtureRoot, relativeFilePath);
    await mkdir(dirname(fixtureFilePath), { recursive: true });
    await writeFile(fixtureFilePath, fileContents, "utf8");
  }

  return fixtureRoot;
}

function runArtifactScanner(fixtureRoot) {
  return spawnSync(process.execPath, [scannerPath.pathname, fixtureRoot], {
    encoding: "utf8",
  });
}

test(
  "dependency documentation may contain a placeholder URI (Uniform Resource Identifier)",
  async () => {
    const placeholderUri = [
      "postgresql://example-user",
      "example-password@example.invalid/example-database",
    ].join(":");
    const fixtureRoot = await createArtifactFixture({
      "node_modules/pg-pool/README.md": `Example: ${placeholderUri}\n`,
      "src/lambda.js":
        "export const handler = async () => ({ statusCode: 200 });\n",
    });

    try {
      const result = runArtifactScanner(fixtureRoot);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Artifact credential scan passed/);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  },
);

test(
  "application-owned files reject credential-bearing URI (Uniform Resource Identifier) values",
  async () => {
    const credentialBearingUri = [
      "postgresql://runtime-user",
      "not-a-real-password@example.invalid/example-database",
    ].join(":");
    const fixtureRoot = await createArtifactFixture({
      "src/config.js":
        `export const unsafe = ${JSON.stringify(credentialBearingUri)};\n`,
    });

    try {
      const result = runArtifactScanner(fixtureRoot);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /PostgreSQL credential-bearing URI \(Uniform Resource Identifier\)/,
      );
      assert.match(result.stderr, /src\/config\.js/);
      assert.doesNotMatch(result.stderr, /not-a-real-password/);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  },
);

test("built templates remain under contextual credential checks", async () => {
  const credentialBearingUri = [
    "postgresql://template-user",
    "not-a-real-password@example.invalid/example-database",
  ].join(":");
  const fixtureRoot = await createArtifactFixture({
    "template.yaml": `UnsafeValue: ${credentialBearingUri}\n`,
  });

  try {
    const result = runArtifactScanner(fixtureRoot);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /PostgreSQL credential-bearing URI \(Uniform Resource Identifier\)/,
    );
    assert.match(result.stderr, /template\.yaml/);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("dependency runtime code remains under contextual credential checks", async () => {
  const credentialBearingUri = [
    "postgresql://dependency-user",
    "not-a-real-password@example.invalid/example-database",
  ].join(":");
  const fixtureRoot = await createArtifactFixture({
    "node_modules/example-package/index.js":
      `export const unsafe = ${JSON.stringify(credentialBearingUri)};\n`,
  });

  try {
    const result = runArtifactScanner(fixtureRoot);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /PostgreSQL credential-bearing URI \(Uniform Resource Identifier\)/,
    );
    assert.match(result.stderr, /node_modules\/example-package\/index\.js/);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test(
  "published AWS (Amazon Web Services) example identifiers remain allowed",
  async () => {
    const fixtureRoot = await createArtifactFixture({
      "node_modules/example-package/example.d.ts":
        'export const example = "AKIAIOSFODNN7EXAMPLE";\n',
    });

    try {
      const result = runArtifactScanner(fixtureRoot);
      assert.equal(result.status, 0, result.stderr);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  },
);

test(
  "high-confidence secrets are rejected in dependency documentation",
  async () => {
    const accessKeyIdentifier = ["AKIA", "ABCDEFGHIJKLMNOP"].join("");
    const fixtureRoot = await createArtifactFixture({
      "node_modules/example-package/README.md":
        `Never publish ${accessKeyIdentifier}.\n`,
    });

    try {
      const result = runArtifactScanner(fixtureRoot);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /AWS \(Amazon Web Services\) access key identifier/,
      );
      assert.match(
        result.stderr,
        /node_modules\/example-package\/README\.md/,
      );
      assert.doesNotMatch(result.stderr, new RegExp(accessKeyIdentifier));
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  },
);

test("private keys are rejected in dependency documentation", async () => {
  const privateKeyHeader = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  const fixtureRoot = await createArtifactFixture({
    "node_modules/example-package/README.md":
      `Never publish ${privateKeyHeader}.\n`,
  });

  try {
    const result = runArtifactScanner(fixtureRoot);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /private key/);
    assert.doesNotMatch(result.stderr, new RegExp(privateKeyHeader));
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test(
  "credential-bearing Cockroach Cloud URI (Uniform Resource Identifier) values fail in dependency documentation",
  async () => {
    const longPassword = "p".repeat(24);
    const credentialBearingUri = [
      "postgresql://mhelix_runtime",
      `${longPassword}@example.cockroachlabs.cloud:26257/mhelix_testwired`,
    ].join(":");
    const fixtureRoot = await createArtifactFixture({
      "node_modules/example-package/README.md":
        `Unsafe: ${credentialBearingUri}\n`,
    });

    try {
      const result = runArtifactScanner(fixtureRoot);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /credential-bearing Cockroach Cloud URI \(Uniform Resource Identifier\)/,
      );
      assert.doesNotMatch(result.stderr, new RegExp(longPassword));
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  },
);

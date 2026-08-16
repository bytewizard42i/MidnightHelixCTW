// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";

const apiPackage = JSON.parse(
  await readFile(
    new URL("../../../apps/api/package.json", import.meta.url),
    "utf8",
  ),
);
const repositoryPackageLock = JSON.parse(
  await readFile(new URL("../../../package-lock.json", import.meta.url), "utf8"),
);
const repositoryMakefile = await readFile(
  new URL("../../../Makefile", import.meta.url),
  "utf8",
);
const template = await readFile(new URL("../template.yaml", import.meta.url), "utf8");
const deployScript = await readFile(new URL("../scripts/deploy.sh", import.meta.url), "utf8");
const validateLocalScript = await readFile(
  new URL("../scripts/validate-local.sh", import.meta.url),
  "utf8",
);
const buildScript = await readFile(new URL("../scripts/build.sh", import.meta.url), "utf8");
const smokeScript = await readFile(
  new URL("../scripts/smoke-readonly.sh", import.meta.url),
  "utf8",
);
const builtTemplatePath = process.env.MHELIX_BUILT_TEMPLATE_FILE;
const builtTemplate = builtTemplatePath
  ? await readFile(builtTemplatePath, "utf8")
  : undefined;
const builtApiArtifactDirectory = builtTemplatePath
  ? resolve(dirname(builtTemplatePath), "ApiFunction")
  : undefined;

const expectedIamActions = [
  "logs:CreateLogStream",
  "logs:PutLogEvents",
  "secretsmanager:GetSecretValue",
  "sts:AssumeRole",
];

const expectedCorsKeys = [
  "allowCredentials",
  "allowHeaders",
  "allowMethods",
  "allowOrigins",
  "exposeHeaders",
  "maxAge",
];

const expectedRoutes = [
  "Path: /healthz",
  "Path: /api/v1/status",
  "Path: /api/v1/judge/scenarios",
  "Path: /api/v1/judge/runs",
  "Path: /api/v1/judge/runs/{runId}/sessions/close",
  "Path: /api/v1/judge/runs/{runId}/recall",
  "Path: /api/v1/judge/runs/{runId}/actions",
  "Path: /api/v1/judge/receipts/{receiptId}",
];

function readYamlBlock(document, key, label) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headerPattern = new RegExp(`^(\\s*)${escapedKey}:\\s*$`);
  const lines = document.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => headerPattern.test(line));

  assert.notEqual(headerIndex, -1, `${label} is missing ${key}`);

  const headerMatch = lines[headerIndex].match(headerPattern);
  const headerIndent = headerMatch[1].length;
  let endIndex = headerIndex + 1;

  while (endIndex < lines.length) {
    const line = lines[endIndex];
    if (line.trim() === "") {
      endIndex += 1;
      continue;
    }

    const indentation = line.match(/^\s*/)[0].length;
    // SAM's YAML emitter uses indentationless sequences in the built template.
    const isIndentlessSequenceItem =
      indentation === headerIndent && line.trimStart().startsWith("-");

    if (
      indentation < headerIndent ||
      (indentation === headerIndent && !isIndentlessSequenceItem)
    ) {
      break;
    }
    endIndex += 1;
  }

  return lines.slice(headerIndex + 1, endIndex).join("\n");
}

async function readDirectoryEntriesOrEmpty(directoryPath) {
  try {
    return await readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function collectInstalledPackageRoots(
  nodeModulesDirectory,
  lockKeyPrefix = "node_modules",
) {
  const packageRoots = [];
  const entries = await readDirectoryEntriesOrEmpty(nodeModulesDirectory);

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".bin") {
      continue;
    }

    if (entry.name.startsWith("@")) {
      const scopeDirectory = resolve(nodeModulesDirectory, entry.name);
      const scopedEntries = await readDirectoryEntriesOrEmpty(scopeDirectory);
      for (const scopedEntry of scopedEntries) {
        if (!scopedEntry.isDirectory()) {
          continue;
        }
        const packageRoot = resolve(scopeDirectory, scopedEntry.name);
        const packageLockKey =
          `${lockKeyPrefix}/${entry.name}/${scopedEntry.name}`;
        packageRoots.push({ packageRoot, packageLockKey });
        packageRoots.push(
          ...(await collectInstalledPackageRoots(
            resolve(packageRoot, "node_modules"),
            `${packageLockKey}/node_modules`,
          )),
        );
      }
      continue;
    }

    const packageRoot = resolve(nodeModulesDirectory, entry.name);
    const packageLockKey = `${lockKeyPrefix}/${entry.name}`;
    packageRoots.push({ packageRoot, packageLockKey });
    packageRoots.push(
      ...(await collectInstalledPackageRoots(
        resolve(packageRoot, "node_modules"),
        `${packageLockKey}/node_modules`,
      )),
    );
  }

  return packageRoots;
}

function collectIamActions(roleBlock) {
  const actionPattern =
    /^\s*(?:Action:\s*|-\s+)((?:[a-z][a-z0-9-]*):[A-Za-z][A-Za-z0-9*]*)\s*$/gm;
  return [...roleBlock.matchAll(actionPattern)]
    .map((match) => match[1])
    .sort();
}

function assertOpenApiTransportContract(document, label) {
  const serversBlock = readYamlBlock(document, "servers", label);
  const firstServerUrl = serversBlock.match(/^\s*-\s+url:\s*(\S.*?)\s*$/m);

  assert.ok(firstServerUrl, `${label} must define servers[0].url`);
  assert.ok(
    ["/", '"/"', "'/'"].includes(firstServerUrl[1]),
    `${label} servers[0].url must be the relative API root`,
  );

  const corsBlock = readYamlBlock(document, "x-amazon-apigateway-cors", label);
  const keyedLines = corsBlock
    .split(/\r?\n/)
    .map((line) => line.match(/^(\s*)([A-Za-z][A-Za-z0-9]*):/))
    .filter(Boolean);
  const directKeyIndent = Math.min(...keyedLines.map((match) => match[1].length));
  const directKeys = [
    ...new Set(
      keyedLines
        .filter((match) => match[1].length === directKeyIndent)
        .map((match) => match[2]),
    ),
  ].sort();

  assert.deepEqual(
    directKeys,
    expectedCorsKeys,
    `${label} CORS extension must be an object with the reviewed HTTP API keys`,
  );
  assert.match(corsBlock, /(?:!Split|Fn::Split:)/);
  assert.match(corsBlock, /(?:!Ref\s+PublicAllowedOrigins|Ref:\s+PublicAllowedOrigins)/);
  assert.doesNotMatch(document, /^\s+CorsConfiguration:/m);
}

test("template exposes exactly the eight reviewed routes", () => {
  for (const route of expectedRoutes) {
    assert.ok(template.includes(route), `missing route: ${route}`);
  }
  assert.equal((template.match(/PayloadFormatVersion: "2\.0"/g) ?? []).length, 8);
  assert.doesNotMatch(template, /Path:\s*\/\{proxy\+\}/);
  assert.doesNotMatch(template, /Path:\s*\$default/);
});

test("source template uses a valid OpenAPI server and object-shaped CORS", () => {
  assertOpenApiTransportContract(template, "source template");
  assert.match(template, /PublicAllowedOrigins:/);
  assert.match(template, /MHELIX_PUBLIC_ALLOWED_ORIGINS:\s*!Ref PublicAllowedOrigins/);
  assert.doesNotMatch(template, /allowOrigins:[\s\S]{0,80}["']\*["']/);
  assert.match(template, /ThrottlingBurstLimit:\s*2/);
  assert.match(template, /ThrottlingRateLimit:\s*1/);
  assert.match(template, /allowCredentials:\s*false/);
});

if (builtTemplate !== undefined) {
  test("SAM built template preserves the OpenAPI server and object-shaped CORS", () => {
    assertOpenApiTransportContract(builtTemplate, "SAM built template");
  });

  test("SAM built role preserves the exact reviewed IAM action set", () => {
    const builtFunctionRoleBlock = readYamlBlock(
      builtTemplate,
      "ApiFunctionRole",
      "SAM built template",
    );
    assert.deepEqual(
      collectIamActions(builtFunctionRoleBlock),
      expectedIamActions,
    );
  });

  test(
    "SAM (Serverless Application Model) package excludes API (Application Programming Interface) tests",
    async () => {
      const packageEntries = await readdir(builtApiArtifactDirectory);

      assert.ok(packageEntries.includes("package.json"));
      assert.ok(packageEntries.includes("package-lock.json"));
      assert.ok(packageEntries.includes("src"));
      for (const forbiddenEntry of ["test", "tests", "docs"]) {
        assert.ok(
          !packageEntries.includes(forbiddenEntry),
          `the Lambda artifact must not contain application ${forbiddenEntry}`,
        );
      }
      assert.deepEqual(
        packageEntries
          .filter((entry) => /\.(?:md|markdown)$/i.test(entry))
          .sort(),
        ["README.md"],
        "npm may include only the sanitized application README at artifact root",
      );

      const sourceEntries = await readdir(resolve(builtApiArtifactDirectory, "src"));
      assert.ok(sourceEntries.includes("lambda.js"));

      const productionDependencyEntries = await readdir(
        resolve(builtApiArtifactDirectory, "node_modules"),
      );
      assert.ok(productionDependencyEntries.includes("pg"));
      assert.ok(productionDependencyEntries.includes("@aws-sdk"));

      const awsSdkDependencyEntries = await readdir(
        resolve(builtApiArtifactDirectory, "node_modules", "@aws-sdk"),
      );
      assert.ok(awsSdkDependencyEntries.includes("client-secrets-manager"));

      const artifactPackageLock = JSON.parse(
        await readFile(
          resolve(builtApiArtifactDirectory, "package-lock.json"),
          "utf8",
        ),
      );
      assert.deepEqual(
        artifactPackageLock,
        repositoryPackageLock,
        "the artifact must carry the exact repository root lockfile",
      );

      const repositoryWorkspacePackageNames = new Set(
        Object.entries(repositoryPackageLock.packages)
          .filter(([packagePath]) => /^(?:apps|packages)\//.test(packagePath))
          .map(([, packageMetadata]) => packageMetadata.name)
          .filter(Boolean),
      );
      const installedPackageRoots = await collectInstalledPackageRoots(
        resolve(builtApiArtifactDirectory, "node_modules"),
      );
      assert.ok(installedPackageRoots.length > 0);

      for (const { packageRoot, packageLockKey } of installedPackageRoots) {
        const installedPackage = JSON.parse(
          await readFile(resolve(packageRoot, "package.json"), "utf8"),
        );
        const lockedPackage = repositoryPackageLock.packages[packageLockKey];
        assert.ok(
          lockedPackage,
          `artifact package ${packageLockKey} is absent from the root lockfile`,
        );
        assert.equal(
          installedPackage.version,
          lockedPackage.version,
          `artifact package ${packageLockKey} does not match the root lockfile`,
        );
        assert.equal(
          repositoryWorkspacePackageNames.has(installedPackage.name),
          false,
          `artifact must not contain internal workspace package ${installedPackage.name}`,
        );
        assert.equal(
          ["react", "react-dom", "vite"].includes(installedPackage.name),
          false,
          `artifact must not contain unrelated web package ${installedPackage.name}`,
        );
      }
    },
  );
}

test("account-incompatible reserved concurrency is absent", () => {
  assert.doesNotMatch(template, /ReservedConcurrentExecutions/);
  assert.doesNotMatch(template, /ProvisionedConcurrency/);
});

test("runtime secret access is exact and the stack creates no credential", () => {
  const secretParameterBlock = readYamlBlock(
    template,
    "CockroachRuntimeSecretArn",
    "source template",
  );
  const functionRoleBlock = readYamlBlock(
    template,
    "ApiFunctionRole",
    "source template",
  );
  const outputsBlock = readYamlBlock(template, "Outputs", "source template");

  assert.match(secretParameterBlock, /Type:\s*String/);
  assert.match(secretParameterBlock, /NoEcho:\s*true/);
  assert.match(
    secretParameterBlock,
    /AllowedPattern:\s*['"]\^arn:aws:secretsmanager:us-east-1:/,
  );
  assert.doesNotMatch(secretParameterBlock, /\*/);

  assert.match(functionRoleBlock, /logs:CreateLogStream/);
  assert.match(functionRoleBlock, /logs:PutLogEvents/);
  assert.equal(
    (functionRoleBlock.match(/secretsmanager:GetSecretValue/g) ?? []).length,
    1,
  );
  assert.match(
    functionRoleBlock,
    /Action:\s*secretsmanager:GetSecretValue\s*\n\s*Resource:\s*!Ref CockroachRuntimeSecretArn/,
  );
  assert.doesNotMatch(functionRoleBlock, /Resource:\s*["']?\*["']?/);
  assert.deepEqual(collectIamActions(functionRoleBlock), expectedIamActions);

  assert.match(
    template,
    /MHELIX_COCKROACH_RUNTIME_SECRET_ARN:\s*!Ref CockroachRuntimeSecretArn/,
  );
  assert.doesNotMatch(template, /AWS::SecretsManager::Secret/);
  assert.doesNotMatch(template, /SecretString|DATABASE_URL|PASSWORD/);
  assert.doesNotMatch(template, /kms:Decrypt|AWS::KMS::/);
  assert.doesNotMatch(template, /VpcConfig:/);
  assert.doesNotMatch(outputsBlock, /CockroachRuntimeSecretArn|secretsmanager/i);
  assert.doesNotMatch(template, /bedrock:/i);
});

test("Lambda package uses the reviewed deployment-only runtime entrypoint", () => {
  assert.match(template, /Runtime:\s*nodejs24\.x/);
  assert.match(template, /CodeUri:\s*\.\.\/\.\.\/\s*$/m);
  assert.match(template, /Handler:\s*src\/lambda\.handler/);
  assert.match(template, /Metadata:\s*\n\s*BuildMethod:\s*makefile/);
  assert.match(repositoryMakefile, /^build-ApiFunction:/m);
  assert.match(repositoryMakefile, /cp package\.json package-lock\.json/);
  assert.match(repositoryMakefile, /npm ci/);
  assert.match(repositoryMakefile, /--omit=dev/);
  assert.match(repositoryMakefile, /--ignore-scripts/);
  assert.match(repositoryMakefile, /--workspace @mhelix\/api/);
  assert.match(repositoryMakefile, /--include-workspace-root=false/);
  assert.match(repositoryMakefile, /apps\/api\/src\/\./);
  assert.doesNotMatch(repositoryMakefile, /npm install/);
  assert.deepEqual(apiPackage.files, ["src"]);
  assert.deepEqual(apiPackage.dependencies, {
    "@aws-sdk/client-secrets-manager": "3.1101.0",
    pg: "8.22.0",
  });
  assert.deepEqual(
    repositoryPackageLock.packages["apps/api"].dependencies,
    apiPackage.dependencies,
    "the root lockfile must pin the reviewed API runtime dependencies",
  );
  assert.match(template, /MHELIX_MAX_REQUEST_BYTES:\s*"4096"/);
  assert.match(template, /MHELIX_MAX_RESPONSE_BYTES:\s*"32768"/);
});

test("template excludes deadline-expanding services", () => {
  assert.doesNotMatch(
    template,
    /AWS::(?:Cognito|DynamoDB|SQS|StepFunctions|WAFv2|EC2|RDS|KMS)::/,
  );
});

test("logs have explicit retention and retained teardown behavior", () => {
  assert.equal((template.match(/Type: AWS::Logs::LogGroup/g) ?? []).length, 2);
  assert.equal((template.match(/DeletionPolicy: RetainExceptOnCreate/g) ?? []).length, 2);
  assert.equal((template.match(/UpdateReplacePolicy: Retain/g) ?? []).length, 2);
  assert.equal((template.match(/RetentionInDays: !Ref LogRetentionDays/g) ?? []).length, 2);
});

test("deploy path validates all tests, exact secret input, build, and scans", () => {
  assert.match(deployScript, /"\$\{SCRIPT_DIRECTORY\}\/validate-local\.sh"/);
  assert.match(
    deployScript,
    /COCKROACH_RUNTIME_SECRET_ARN="\$\{MHELIX_COCKROACH_RUNTIME_SECRET_ARN:-\}"/,
  );
  assert.match(
    deployScript,
    /CockroachRuntimeSecretArn="\$\{COCKROACH_RUNTIME_SECRET_ARN\}"/,
  );
  assert.match(deployScript, /\^arn:aws:secretsmanager:us-east-1:/);
  assert.doesNotMatch(
    deployScript,
    /echo[^\n]*\$\{COCKROACH_RUNTIME_SECRET_ARN\}/,
  );

  assert.match(validateLocalScript, /apps\/api\/test\/"?\*\.test\.mjs/);
  assert.match(
    validateLocalScript,
    /\$\{STACK_DIRECTORY\}\/test\/"?\*\.test\.mjs/,
  );
  assert.match(validateLocalScript, /"\$\{SCRIPT_DIRECTORY\}\/build\.sh"/);
  assert.doesNotMatch(
    validateLocalScript,
    /sam (?:validate|build)|forbidden_file|credential_bearing_file/,
  );

  assert.match(buildScript, /sam validate --lint/);
  assert.match(buildScript, /sam build/);
  assert.match(buildScript, /MHELIX_BUILT_TEMPLATE_FILE/);
  assert.match(buildScript, /package-lock\.json/);
  assert.match(buildScript, /src\/lambda\.js/);
  assert.match(buildScript, /node_modules\/pg/);
  assert.match(buildScript, /node_modules\/@aws-sdk\/client-secrets-manager/);
  assert.match(buildScript, /forbidden_application_path/);
  assert.match(buildScript, /unexpected_application_markdown/);
  assert.match(buildScript, /-type d -name node_modules -prune -o/);
  assert.match(buildScript, /forbidden_file/);
  assert.match(buildScript, /assert-artifact-secrets\.mjs/);
  assert.doesNotMatch(buildScript, /credential_bearing_file/);

  assert.equal(
    (smokeScript.match(/\bcurl\b/g) ?? []).length,
    (smokeScript.match(/--max-time\s+10/g) ?? []).length,
    "every public smoke request must have a fixed curl deadline",
  );
  assert.match(smokeScript, /MHELIX_EXPECTED_RELEASE_COMMIT/);
  assert.match(smokeScript, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(smokeScript, /--request POST/);
  assert.match(smokeScript, /mutation\.json/);
  assert.match(smokeScript, /assert-smoke-contract\.mjs/);
  assert.match(smokeScript, /cors_allowed_origin_values/);
  assert.match(
    smokeScript,
    /cors_allowed_origin_values\[0\].*!=.*allowed_origin/,
  );
  assert.doesNotMatch(smokeScript, /grep\s+-qi/);
});

// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../template.yaml", import.meta.url), "utf8");
const deployScript = await readFile(new URL("../scripts/deploy.sh", import.meta.url), "utf8");
const validateLocalScript = await readFile(
  new URL("../scripts/validate-local.sh", import.meta.url),
  "utf8",
);
const buildScript = await readFile(new URL("../scripts/build.sh", import.meta.url), "utf8");
const builtTemplatePath = process.env.MHELIX_BUILT_TEMPLATE_FILE;
const builtTemplate = builtTemplatePath
  ? await readFile(builtTemplatePath, "utf8")
  : undefined;

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
}

test("account-incompatible reserved concurrency is absent", () => {
  assert.doesNotMatch(template, /ReservedConcurrentExecutions/);
  assert.doesNotMatch(template, /ProvisionedConcurrency/);
});

test("Phase 1 grants only narrow log writes and creates no provider credentials", () => {
  assert.match(template, /logs:CreateLogStream/);
  assert.match(template, /logs:PutLogEvents/);
  assert.doesNotMatch(template, /Resource:\s*["']?\*["']?/);
  assert.doesNotMatch(template, /AWS::SecretsManager::Secret/);
  assert.doesNotMatch(template, /secretsmanager:/i);
  assert.doesNotMatch(template, /bedrock:/i);
  assert.doesNotMatch(template, /DATABASE_URL|PASSWORD|SecretString/);
});

test("Lambda package is the dedicated dependency-free API shell", () => {
  assert.match(template, /Runtime:\s*nodejs24\.x/);
  assert.match(template, /CodeUri:\s*\.\.\/\.\.\/apps\/api\//);
  assert.match(template, /Handler:\s*src\/handler\.handler/);
  assert.match(template, /MHELIX_MAX_REQUEST_BYTES:\s*"4096"/);
  assert.match(template, /MHELIX_MAX_RESPONSE_BYTES:\s*"32768"/);
});

test("template excludes deadline-expanding services", () => {
  assert.doesNotMatch(
    template,
    /AWS::(?:Cognito|DynamoDB|SQS|StepFunctions|WAFv2|EC2|RDS)::/,
  );
});

test("logs have explicit retention and retained teardown behavior", () => {
  assert.equal((template.match(/Type: AWS::Logs::LogGroup/g) ?? []).length, 2);
  assert.equal((template.match(/DeletionPolicy: RetainExceptOnCreate/g) ?? []).length, 2);
  assert.equal((template.match(/UpdateReplacePolicy: Retain/g) ?? []).length, 2);
  assert.equal((template.match(/RetentionInDays: !Ref LogRetentionDays/g) ?? []).length, 2);
});

test("deploy path validates tests, SAM build, and both package scans", () => {
  assert.match(deployScript, /"\$\{SCRIPT_DIRECTORY\}\/validate-local\.sh"/);
  assert.match(validateLocalScript, /"\$\{SCRIPT_DIRECTORY\}\/build\.sh"/);
  assert.doesNotMatch(validateLocalScript, /sam (?:validate|build)|forbidden_file|credential_bearing_file/);
  assert.match(buildScript, /sam validate --lint/);
  assert.match(buildScript, /sam build/);
  assert.match(buildScript, /MHELIX_BUILT_TEMPLATE_FILE/);
  assert.match(buildScript, /forbidden_file/);
  assert.match(buildScript, /credential_bearing_file/);
});

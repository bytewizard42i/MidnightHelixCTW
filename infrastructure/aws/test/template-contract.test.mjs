// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../template.yaml", import.meta.url), "utf8");

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

test("template exposes exactly the eight reviewed routes", () => {
  for (const route of expectedRoutes) {
    assert.ok(template.includes(route), `missing route: ${route}`);
  }
  assert.equal((template.match(/PayloadFormatVersion: "2\.0"/g) ?? []).length, 8);
  assert.doesNotMatch(template, /Path:\s*\/\{proxy\+\}/);
  assert.doesNotMatch(template, /Path:\s*\$default/);
});

test("template uses exact multi-origin CORS and strict public throttling", () => {
  assert.match(template, /PublicAllowedOrigins:/);
  assert.match(template, /AllowOrigins:\s*!Split \[",", !Ref PublicAllowedOrigins\]/);
  assert.match(template, /MHELIX_PUBLIC_ALLOWED_ORIGINS:\s*!Ref PublicAllowedOrigins/);
  assert.doesNotMatch(template, /AllowOrigins:[\s\S]{0,80}["']\*["']/);
  assert.match(template, /ThrottlingBurstLimit:\s*2/);
  assert.match(template, /ThrottlingRateLimit:\s*1/);
  assert.match(template, /AllowCredentials:\s*false/);
});

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
  assert.equal((template.match(/DeletionPolicy: Retain/g) ?? []).length, 2);
  assert.equal((template.match(/RetentionInDays: !Ref LogRetentionDays/g) ?? []).length, 2);
});

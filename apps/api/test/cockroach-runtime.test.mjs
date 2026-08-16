// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { rootCertificates } from "node:tls";
import test from "node:test";

import {
  createLazyCockroachDbProvider,
  MHELIX_COCKROACH_SECRET_SCHEMA_VERSION,
  parseCockroachRuntimeSecret,
} from "../src/cockroach-bootstrap.js";
import { createCockroachQueryExecutor } from "../src/cockroach-query-executor.js";
import {
  MHELIX_COCKROACH_PROBE_STATEMENT,
  MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
  MHELIX_ENVIRONMENT_MARKER_ID,
  MHELIX_ENVIRONMENT_MARKER_VERSION,
} from "../src/cockroachdb-provider.js";

const PASSWORD = "private-password-sentinel-123456";
const FAILURE = "private-driver-failure-sentinel";
const SECRET_ARN =
  "arn:aws:secretsmanager:us-east-1:123456789012:secret:mhelix/runtime-AbCdEf";
const EXPECTED_MARKER_COMMITMENT_HEX = "a".repeat(64);

function validSecret(overrides = {}) {
  return {
    schemaVersion: MHELIX_COCKROACH_SECRET_SCHEMA_VERSION,
    host: "cluster.j77.aws-us-east-1.cockroachlabs.cloud",
    port: 26_257,
    database: "mhelix_testwired",
    username: "mhelix_runtime",
    password: PASSWORD,
    caCertificatePem: rootCertificates[0],
    ...overrides,
  };
}

function validProbeRow(overrides = {}) {
  return {
    database_matches: true,
    runtime_user_matches: true,
    marker_commitment_matches: true,
    marker_id: MHELIX_ENVIRONMENT_MARKER_ID,
    build_stage: MHELIX_ENVIRONMENT_MARKER_BUILD_STAGE,
    marker_version: MHELIX_ENVIRONMENT_MARKER_VERSION,
    evidence_receipt_id: "123e4567-e89b-42d3-a456-426614174000",
    observed_at: new Date("2026-08-16T00:00:00.000Z"),
    ...overrides,
  };
}

function canonicalProbeParameters() {
  return [
    "mhelix_testwired",
    "mhelix_runtime",
    MHELIX_ENVIRONMENT_MARKER_ID,
    EXPECTED_MARKER_COMMITMENT_HEX,
  ];
}

function corruptCertificate(certificate) {
  const lines = certificate.split("\n");
  lines[1] = "!" + lines[1].slice(1);
  return lines.join("\n");
}

test("deployment Lambda entrypoint imports and fails closed without a secret ARN", async () => {
  const environmentVariableName = "MHELIX_COCKROACH_RUNTIME_SECRET_ARN";
  const previousSecretArn = process.env[environmentVariableName];
  delete process.env[environmentVariableName];

  try {
    const { handler: deploymentHandler } = await import("../src/lambda.js");
    const healthResponse = await deploymentHandler({
      version: "2.0",
      rawPath: "/healthz",
      rawQueryString: "",
      headers: {},
      requestContext: {
        requestId: "lambda-entrypoint-health-test",
        http: { method: "GET", path: "/healthz" },
      },
      isBase64Encoded: false,
    });
    const healthBody = JSON.parse(healthResponse.body);
    const healthCockroachProvider = healthBody.providers.find(
      (provider) => provider.id === "cockroachdb",
    );

    assert.equal(healthResponse.statusCode, 200);
    assert.equal(healthBody.ok, true);
    assert.equal(healthBody.handler, "READY");
    assert.equal(healthBody.dependenciesConnected, false);
    assert.equal(healthCockroachProvider.evidence, "SOURCE_ONLY");
    assert.equal(healthCockroachProvider.connection, "ERROR");
    assert.equal(healthCockroachProvider.evidenceReference, undefined);
    assert.doesNotMatch(
      healthResponse.body,
      /MHELIX_COCKROACH_RUNTIME_SECRET_ARN/,
    );

    const mutationPath = "/api/v1/judge/runs";
    const mutationResponse = await deploymentHandler({
      version: "2.0",
      rawPath: mutationPath,
      rawQueryString: "",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "lambda-entrypoint-test-0001",
      },
      requestContext: {
        requestId: "lambda-entrypoint-mutation-test",
        http: { method: "POST", path: mutationPath },
      },
      body: JSON.stringify({
        scenarioId: "morrow-farmhouse-testwired-v1",
      }),
      isBase64Encoded: false,
    });
    const mutationBody = JSON.parse(mutationResponse.body);
    const mutationCockroachProvider = mutationBody.providers.find(
      (provider) => provider.id === "cockroachdb",
    );

    assert.equal(mutationResponse.statusCode, 503);
    assert.equal(mutationBody.ok, false);
    assert.equal(mutationBody.error.code, "LIVE_PROVIDERS_NOT_CONNECTED");
    assert.equal(mutationCockroachProvider.evidence, "SOURCE_ONLY");
    assert.equal(mutationCockroachProvider.connection, "NOT_CONNECTED");
    assert.equal(mutationCockroachProvider.evidenceReference, undefined);
  } finally {
    if (previousSecretArn === undefined) {
      delete process.env[environmentVariableName];
    } else {
      process.env[environmentVariableName] = previousSecretArn;
    }
  }
});

test("secret parser accepts only the reviewed structured identity", () => {
  const parsed = parseCockroachRuntimeSecret(JSON.stringify(validSecret()));
  assert.equal(parsed.database, "mhelix_testwired");
  assert.equal(parsed.username, "mhelix_runtime");
  assert.equal(parsed.port, 26_257);
  for (const malformed of [
    validSecret({ database: "defaultdb" }),
    validSecret({ username: "root" }),
    validSecret({ port: 5432 }),
    { ...validSecret(), connectionString: "postgresql://private" },
  ]) {
    assert.throws(
      () => parseCockroachRuntimeSecret(JSON.stringify(malformed)),
      /CockroachDB/,
    );
  }
});

test("certificate parser validates every CA block and rejects mixed PEM text", () => {
  const validBundle = rootCertificates.slice(0, 2).join("\n");
  const parsed = parseCockroachRuntimeSecret(
    JSON.stringify(validSecret({ caCertificatePem: validBundle })),
  );
  assert.equal(parsed.caCertificatePem, validBundle + "\n");

  const corrupt = corruptCertificate(rootCertificates[1]);
  for (const caCertificatePem of [
    "comment\n" + rootCertificates[0],
    rootCertificates[0] + "\n\n",
    rootCertificates[0] +
      "\n-----BEGIN PRIVATE KEY-----\nQUJDRA==\n-----END PRIVATE KEY-----",
    corruptCertificate(rootCertificates[0]),
    rootCertificates[0] + "\n" + corrupt,
  ]) {
    assert.throws(
      () =>
        parseCockroachRuntimeSecret(
          JSON.stringify(validSecret({ caCertificatePem })),
        ),
      /CA certificate is invalid/,
    );
  }
});

test("query executor allows only the canonical probe and bounds TLS, time, and rows", async () => {
  const poolConfigurations = [];
  const queries = [];
  let idleErrorListener;
  let endCount = 0;
  class FakePool {
    constructor(configuration) {
      poolConfigurations.push(configuration);
    }
    on(eventName, listener) {
      assert.equal(eventName, "error");
      idleErrorListener = listener;
    }
    async query(configuration) {
      queries.push(configuration);
      return { rows: [validProbeRow()] };
    }
    async end() {
      endCount += 1;
    }
  }

  const secret = validSecret();
  const executor = createCockroachQueryExecutor({
    host: secret.host,
    port: secret.port,
    database: secret.database,
    user: secret.username,
    password: secret.password,
    caCertificatePem: rootCertificates.slice(0, 2).join("\n"),
    PoolClass: FakePool,
    connectionTimeoutMilliseconds: 250,
    statementTimeoutMilliseconds: 700,
    queryTimeoutMilliseconds: 950,
    probeTimeoutMilliseconds: 1_500,
  });
  const result = await executor.query(
    MHELIX_COCKROACH_PROBE_STATEMENT,
    canonicalProbeParameters(),
    { statementTimeoutMilliseconds: 700 },
  );
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].observed_at, "2026-08-16T00:00:00.000Z");
  assert.equal(poolConfigurations[0].max, 1);
  assert.equal(poolConfigurations[0].ssl.rejectUnauthorized, true);
  assert.equal(
    poolConfigurations[0].ssl.ca,
    rootCertificates.slice(0, 2).join("\n") + "\n",
  );
  assert.equal(poolConfigurations[0].connectionTimeoutMillis, 250);
  assert.equal(poolConfigurations[0].statement_timeout, 700);
  assert.equal(poolConfigurations[0].query_timeout, 950);
  assert.equal(queries[0].text, MHELIX_COCKROACH_PROBE_STATEMENT);
  assert.deepEqual(queries[0].values, canonicalProbeParameters());
  assert.doesNotThrow(() => idleErrorListener(new Error(FAILURE)));

  await assert.rejects(
    executor.query("SELECT $1 AS value", ["safe"], {
      statementTimeoutMilliseconds: 700,
    }),
    /canonical bounded CockroachDB probe/,
  );
  await assert.rejects(
    executor.query(
      MHELIX_COCKROACH_PROBE_STATEMENT,
      [...canonicalProbeParameters(), "fifth"],
      { statementTimeoutMilliseconds: 700 },
    ),
    /four bounded parameters/,
  );
  await executor.close();
  await executor.close();
  assert.equal(endCount, 1);

  assert.throws(
    () =>
      createCockroachQueryExecutor({
        host: secret.host,
        port: secret.port,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        caCertificatePem: secret.caCertificatePem,
        PoolClass: FakePool,
        connectionTimeoutMilliseconds: 500,
        statementTimeoutMilliseconds: 1_000,
        queryTimeoutMilliseconds: 1_250,
        probeTimeoutMilliseconds: 1_500,
      }),
    /outer timeout margin/,
  );
});

test("query executor rejects excess rows and unexpected result columns", async () => {
  let rows = [validProbeRow(), validProbeRow(), validProbeRow()];
  class FakePool {
    on() {}
    async query() {
      return { rows };
    }
    async end() {}
  }
  const secret = validSecret();
  const executor = createCockroachQueryExecutor({
    host: secret.host,
    port: secret.port,
    database: secret.database,
    user: secret.username,
    password: secret.password,
    caCertificatePem: secret.caCertificatePem,
    PoolClass: FakePool,
    connectionTimeoutMilliseconds: 250,
    statementTimeoutMilliseconds: 700,
    queryTimeoutMilliseconds: 950,
    probeTimeoutMilliseconds: 1_500,
  });
  await assert.rejects(
    executor.query(
      MHELIX_COCKROACH_PROBE_STATEMENT,
      canonicalProbeParameters(),
      { statementTimeoutMilliseconds: 700 },
    ),
    /query execution failed closed/,
  );
  rows = [{ ...validProbeRow(), unexpected: "not-reviewed" }];
  await assert.rejects(
    executor.query(
      MHELIX_COCKROACH_PROBE_STATEMENT,
      canonicalProbeParameters(),
      { statementTimeoutMilliseconds: 700 },
    ),
    /query execution failed closed/,
  );
  await executor.close();
});

test("lazy bootstrap is single-flight, destroys clients, and refreshes after TTL", async () => {
  let currentTime = 10_000;
  let fetchCount = 0;
  let destroyCount = 0;
  let closeCount = 0;
  const executorOptions = [];
  const providerOptions = [];
  const proof = Object.freeze({ connected: true });
  const lazyProvider = createLazyCockroachDbProvider({
    environment: { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: SECRET_ARN },
    now: () => currentTime,
    successfulProviderTtlMilliseconds: 5_000,
    secretsManagerClientFactory() {
      return {
        async send(command, options) {
          fetchCount += 1;
          assert.equal(command.input.SecretId, SECRET_ARN);
          assert.equal(command.input.VersionStage, "AWSCURRENT");
          assert.ok(options.abortSignal instanceof AbortSignal);
          await Promise.resolve();
          return { SecretString: JSON.stringify(validSecret()) };
        },
        destroy() {
          destroyCount += 1;
        },
      };
    },
    queryExecutorFactory(options) {
      executorOptions.push(options);
      return {
        query: async () => ({ rows: [] }),
        async close() {
          closeCount += 1;
        },
      };
    },
    providerFactory(options) {
      providerOptions.push(options);
      return { probe: async () => proof };
    },
  });
  const proofs = await Promise.all([
    lazyProvider.probe(),
    lazyProvider.probe(),
    lazyProvider.probe(),
  ]);
  assert.equal(fetchCount, 1);
  assert.equal(destroyCount, 1);
  assert.deepEqual(proofs, [proof, proof, proof]);
  assert.equal(executorOptions[0].database, "mhelix_testwired");
  assert.equal(executorOptions[0].user, "mhelix_runtime");
  assert.equal(executorOptions[0].connectionTimeoutMilliseconds, 250);
  assert.equal(executorOptions[0].statementTimeoutMilliseconds, 700);
  assert.equal(executorOptions[0].queryTimeoutMilliseconds, 950);
  assert.equal(executorOptions[0].probeTimeoutMilliseconds, 1_500);
  assert.ok(
    executorOptions[0].connectionTimeoutMilliseconds +
      executorOptions[0].queryTimeoutMilliseconds <=
      executorOptions[0].probeTimeoutMilliseconds - 250,
  );
  assert.equal(providerOptions[0].expectedDatabaseName, "mhelix_testwired");
  assert.equal(providerOptions[0].expectedRuntimeUser, "mhelix_runtime");
  assert.match(providerOptions[0].expectedMarkerCommitmentHex, /^[0-9a-f]{64}$/);
  assert.equal(providerOptions[0].statementTimeoutMilliseconds, 700);

  currentTime += 4_999;
  await lazyProvider.probe();
  assert.equal(fetchCount, 1);
  currentTime += 1;
  await lazyProvider.probe();
  assert.equal(fetchCount, 2);
  assert.equal(destroyCount, 2);
  assert.equal(closeCount, 1);
});

test("probe failure closes and invalidates the provider before rotation retry", async () => {
  let currentTime = 20_000;
  let fetchCount = 0;
  let destroyCount = 0;
  let closeCount = 0;
  let providerGeneration = 0;
  const proof = Object.freeze({ connected: true, generation: 2 });
  const lazyProvider = createLazyCockroachDbProvider({
    environment: { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: SECRET_ARN },
    now: () => currentTime,
    failureRetryCooldownMilliseconds: 5_000,
    secretsManagerClientFactory() {
      return {
        async send() {
          fetchCount += 1;
          return { SecretString: JSON.stringify(validSecret()) };
        },
        destroy() {
          destroyCount += 1;
        },
      };
    },
    queryExecutorFactory() {
      return {
        query: async () => ({ rows: [] }),
        async close() {
          closeCount += 1;
        },
      };
    },
    providerFactory() {
      providerGeneration += 1;
      const generation = providerGeneration;
      return {
        async probe() {
          if (generation === 1) throw new Error(FAILURE);
          return proof;
        },
      };
    },
  });
  await assert.rejects(lazyProvider.probe(), (error) => {
    assert.equal(error.message, "CockroachDB provider probe failed closed.");
    assert.doesNotMatch(error.message, new RegExp(FAILURE));
    return true;
  });
  assert.equal(fetchCount, 1);
  assert.equal(destroyCount, 1);
  assert.equal(closeCount, 1);
  await assert.rejects(lazyProvider.probe(), /failed closed/);
  assert.equal(fetchCount, 1);

  currentTime += 5_000;
  assert.equal(await lazyProvider.probe(), proof);
  assert.equal(fetchCount, 2);
  assert.equal(destroyCount, 2);
});

test("bootstrap failure is redacted, destroys clients, and honors cooldown", async () => {
  let currentTime = 10_000;
  let fetchCount = 0;
  let destroyCount = 0;
  const lazyProvider = createLazyCockroachDbProvider({
    environment: { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: SECRET_ARN },
    now: () => currentTime,
    failureRetryCooldownMilliseconds: 5_000,
    secretsManagerClientFactory() {
      return {
        async send() {
          fetchCount += 1;
          throw new Error(FAILURE);
        },
        destroy() {
          destroyCount += 1;
        },
      };
    },
  });
  await assert.rejects(lazyProvider.probe(), (error) => {
    assert.equal(
      error.message,
      "CockroachDB provider initialization failed closed.",
    );
    assert.doesNotMatch(error.message, new RegExp(FAILURE));
    return true;
  });
  await assert.rejects(lazyProvider.probe(), /failed closed/);
  assert.equal(fetchCount, 1);
  assert.equal(destroyCount, 1);
  currentTime += 5_000;
  await assert.rejects(lazyProvider.probe(), /failed closed/);
  assert.equal(fetchCount, 2);
  assert.equal(destroyCount, 2);
});

test("Secrets Manager fetch stays bounded when a client ignores its abort signal", async () => {
  let capturedAbortSignal;
  let destroyCount = 0;
  let executorFactoryCalled = false;
  const lazyProvider = createLazyCockroachDbProvider({
    environment: { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: SECRET_ARN },
    secretFetchTimeoutMilliseconds: 100,
    failureRetryCooldownMilliseconds: 1_000,
    secretsManagerClientFactory() {
      return {
        async send(_command, options) {
          assert.ok(options.abortSignal instanceof AbortSignal);
          capturedAbortSignal = options.abortSignal;
          return await new Promise(() => undefined);
        },
        destroy() {
          destroyCount += 1;
        },
      };
    },
    queryExecutorFactory() {
      executorFactoryCalled = true;
      throw new Error("must not run");
    },
  });

  await assert.rejects(lazyProvider.probe(), (error) => {
    assert.equal(
      error.message,
      "CockroachDB provider initialization failed closed.",
    );
    assert.doesNotMatch(error.message, /timed out|abort/i);
    return true;
  });
  assert.equal(capturedAbortSignal.aborted, true);
  assert.equal(destroyCount, 1);
  assert.equal(executorFactoryCalled, false);
});

test("Secrets Manager binary material is rejected even beside a valid SecretString", async () => {
  let destroyCount = 0;
  let executorFactoryCalled = false;
  const lazyProvider = createLazyCockroachDbProvider({
    environment: { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: SECRET_ARN },
    secretsManagerClientFactory() {
      return {
        async send() {
          return {
            SecretString: JSON.stringify(validSecret()),
            SecretBinary: Uint8Array.from([1, 2, 3]),
          };
        },
        destroy() {
          destroyCount += 1;
        },
      };
    },
    queryExecutorFactory() {
      executorFactoryCalled = true;
      throw new Error("must not run");
    },
  });

  await assert.rejects(lazyProvider.probe(), (error) => {
    assert.equal(
      error.message,
      "CockroachDB provider initialization failed closed.",
    );
    assert.doesNotMatch(error.message, /SecretBinary|SecretString/);
    return true;
  });
  assert.equal(destroyCount, 1);
  assert.equal(executorFactoryCalled, false);
});

test("secret ARN grammar is exact and missing configuration remains lazy", async () => {
  for (const invalidArn of [
    undefined,
    "arn:aws-us-gov:secretsmanager:us-east-1:123456789012:secret:mhelix/runtime-AbCdEf",
    "arn:aws:secretsmanager:us-west-2:123456789012:secret:mhelix/runtime-AbCdEf",
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:mhelix/runtime",
  ]) {
    let clientFactoryCalled = false;
    const environment =
      invalidArn === undefined
        ? {}
        : { MHELIX_COCKROACH_RUNTIME_SECRET_ARN: invalidArn };
    const lazyProvider = createLazyCockroachDbProvider({
      environment,
      secretsManagerClientFactory() {
        clientFactoryCalled = true;
        throw new Error("must not run");
      },
    });
    await assert.rejects(lazyProvider.probe(), /failed closed/);
    assert.equal(clientFactoryCalled, false);
  }
});

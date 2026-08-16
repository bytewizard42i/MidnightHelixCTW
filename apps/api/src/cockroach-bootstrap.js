// SPDX-License-Identifier: Apache-2.0

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

import { createCockroachDbProvider } from "./cockroachdb-provider.js";
import {
  createCockroachQueryExecutor,
  normalizeCertificateAuthorityBundle,
} from "./cockroach-query-executor.js";
import { MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX } from "./environment-marker.js";
import { Pool } from "pg";

import { CANONICAL_SCENARIO } from "./constants.js";
import { createVectorMemoryProvider } from "./vector-memory-provider.js";

export const MHELIX_COCKROACH_SECRET_SCHEMA_VERSION =
  "mhelixctw/cockroach-secret/v1";

const SECRET_ENVIRONMENT_NAME = "MHELIX_COCKROACH_RUNTIME_SECRET_ARN";
const EXPECTED_SECRET_KEYS = Object.freeze([
  "caCertificatePem",
  "database",
  "host",
  "password",
  "port",
  "schemaVersion",
  "username",
]);
const HOST_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.cockroachlabs\.cloud$/;
const ARN_PATTERN =
  /^arn:aws:secretsmanager:us-east-1:[0-9]{12}:secret:[A-Za-z0-9/_+=.@-]{1,512}-[A-Za-z0-9]{6}$/;
// A new Transport Layer Security database connection can take longer than a
// quarter second even when the database is healthy. Keep enough room for the
// connection handshake and one bounded read while remaining well inside the
// Helix Runtime Bridge (AWS Lambda) ten-second execution limit.
const CONNECTION_TIMEOUT_MILLISECONDS = 1_500;
const STATEMENT_TIMEOUT_MILLISECONDS = 1_000;
const QUERY_TIMEOUT_MILLISECONDS = 2_000;
const PROBE_TIMEOUT_MILLISECONDS = 4_000;

function requireObject(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(label + " must be a plain object.");
  }
  return value;
}

function requireExactKeys(secret) {
  const actual = Object.keys(secret).sort();
  const expected = [...EXPECTED_SECRET_KEYS].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new TypeError("The CockroachDB secret has an unexpected shape.");
  }
}

export function parseCockroachRuntimeSecret(secretString) {
  if (
    typeof secretString !== "string" ||
    secretString.length < 2 ||
    secretString.length > 65_536
  ) {
    throw new TypeError("The CockroachDB secret string is invalid.");
  }
  let parsed;
  try {
    parsed = JSON.parse(secretString);
  } catch {
    throw new TypeError("The CockroachDB secret is not valid JSON.");
  }
  const secret = requireObject(parsed, "secret");
  requireExactKeys(secret);
  if (secret.schemaVersion !== MHELIX_COCKROACH_SECRET_SCHEMA_VERSION) {
    throw new TypeError("The CockroachDB secret schema version is invalid.");
  }
  if (
    typeof secret.host !== "string" ||
    secret.host.length > 253 ||
    !HOST_PATTERN.test(secret.host)
  ) {
    throw new TypeError("The CockroachDB secret host is invalid.");
  }
  if (
    secret.port !== 26_257 ||
    secret.database !== "mhelix_testwired" ||
    secret.username !== "mhelix_runtime"
  ) {
    throw new TypeError("The CockroachDB secret identity is invalid.");
  }
  if (
    typeof secret.password !== "string" ||
    secret.password.length < 16 ||
    secret.password.length > 1_024 ||
    /[\u0000\r\n]/u.test(secret.password)
  ) {
    throw new TypeError("The CockroachDB secret password is invalid.");
  }
  return Object.freeze({
    host: secret.host,
    port: secret.port,
    database: secret.database,
    username: secret.username,
    password: secret.password,
    caCertificatePem: normalizeCertificateAuthorityBundle(
      secret.caCertificatePem,
    ),
  });
}

function requireInteger(value, fallback, minimum, maximum, label) {
  const selected = value === undefined ? fallback : value;
  if (!Number.isSafeInteger(selected) || selected < minimum || selected > maximum) {
    throw new TypeError(label + " is outside its reviewed bounds.");
  }
  return selected;
}

async function fetchCurrentSecret(clientFactory, secretArn, timeoutMilliseconds) {
  let client;
  let timeoutHandle;
  try {
    client = clientFactory();
    if (client === null || typeof client?.send !== "function") {
      throw new TypeError("The Secrets Manager client is invalid.");
    }

    const abortController = new AbortController();
    const timeoutPromise = new Promise((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        abortController.abort();
        reject(new Error("The Secrets Manager request timed out."));
      }, timeoutMilliseconds);
    });
    const requestPromise = Promise.resolve().then(() =>
      client.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
          VersionStage: "AWSCURRENT",
        }),
        { abortSignal: abortController.signal },
      ),
    );
    // The explicit race preserves the reviewed upper bound even if a client
    // implementation fails to honor the abort signal.
    const result = await Promise.race([requestPromise, timeoutPromise]);
    if (
      typeof result?.SecretString !== "string" ||
      result.SecretBinary !== undefined
    ) {
      throw new TypeError("The CockroachDB runtime secret is unavailable.");
    }
    return result.SecretString;
  } finally {
    clearTimeout(timeoutHandle);
    try {
      client?.destroy?.();
    } catch {
      // Client cleanup must not replace the bounded, redacted primary result.
    }
  }
}

export function createLazyCockroachDbProvider(options = {}) {
  const configuration = requireObject(options, "options");
  const environment = configuration.environment ?? process.env;
  const now = configuration.now ?? Date.now;
  const cooldown = requireInteger(
    configuration.failureRetryCooldownMilliseconds,
    5_000,
    1_000,
    60_000,
    "failureRetryCooldownMilliseconds",
  );
  const fetchTimeout = requireInteger(
    configuration.secretFetchTimeoutMilliseconds,
    1_000,
    100,
    2_000,
    "secretFetchTimeoutMilliseconds",
  );
  // Cache successful providers briefly. The fixed upper bound limits exposure
  // to a rotated AWSCURRENT secret while avoiding one secret fetch per probe.
  const successfulProviderTtl = requireInteger(
    configuration.successfulProviderTtlMilliseconds,
    30_000,
    5_000,
    300_000,
    "successfulProviderTtlMilliseconds",
  );
  const clientFactory =
    configuration.secretsManagerClientFactory ??
    (() => new SecretsManagerClient({ region: "us-east-1", maxAttempts: 2 }));
  const executorFactory =
    configuration.queryExecutorFactory ?? createCockroachQueryExecutor;
  const providerFactory =
    configuration.providerFactory ?? createCockroachDbProvider;
  let cachedEntry;
  let inFlight;
  let retryAfter = 0;

  function closeEntry(entry) {
    if (entry === undefined) return Promise.resolve();
    if (entry.closePromise === undefined) {
      entry.closePromise = Promise.resolve()
        .then(() => entry.queryExecutor.close?.())
        .catch(() => undefined);
    }
    return entry.closePromise;
  }

  async function initialize() {
    const secretArn = environment[SECRET_ENVIRONMENT_NAME];
    if (
      typeof secretArn !== "string" ||
      secretArn.length > 600 ||
      !ARN_PATTERN.test(secretArn)
    ) {
      throw new TypeError("The CockroachDB runtime secret ARN is invalid.");
    }

    let queryExecutor;
    try {
      const secretString = await fetchCurrentSecret(
        clientFactory,
        secretArn,
        fetchTimeout,
      );
      const secret = parseCockroachRuntimeSecret(secretString);
      queryExecutor = executorFactory({
        host: secret.host,
        port: secret.port,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        caCertificatePem: secret.caCertificatePem,
        connectionTimeoutMilliseconds: CONNECTION_TIMEOUT_MILLISECONDS,
        statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
        queryTimeoutMilliseconds: QUERY_TIMEOUT_MILLISECONDS,
        probeTimeoutMilliseconds: PROBE_TIMEOUT_MILLISECONDS,
      });
      const provider = providerFactory({
        queryExecutor,
        expectedDatabaseName: "mhelix_testwired",
        expectedRuntimeUser: "mhelix_runtime",
        expectedMarkerCommitmentHex: MHELIX_ENVIRONMENT_MARKER_COMMITMENT_HEX,
        statementTimeoutMilliseconds: STATEMENT_TIMEOUT_MILLISECONDS,
        probeTimeoutMilliseconds: PROBE_TIMEOUT_MILLISECONDS,
      });
      const initializedAt = now();
      if (!Number.isFinite(initializedAt)) {
        throw new TypeError("The provider clock is invalid.");
      }
      return {
        provider,
        queryExecutor,
        expiresAt: initializedAt + successfulProviderTtl,
        closePromise: undefined,
      };
    } catch (error) {
      if (queryExecutor !== undefined) {
        await closeEntry({ queryExecutor, closePromise: undefined });
      }
      throw error;
    }
  }

  async function getProviderEntry() {
    const currentTime = now();
    if (cachedEntry !== undefined && currentTime < cachedEntry.expiresAt) {
      return cachedEntry;
    }
    if (inFlight !== undefined) return inFlight;
    if (currentTime < retryAfter) {
      throw new Error("CockroachDB provider initialization failed closed.");
    }

    const expiredEntry = cachedEntry;
    cachedEntry = undefined;
    const attempt = Promise.resolve()
      .then(() => closeEntry(expiredEntry))
      .then(initialize);
    inFlight = attempt;
    try {
      cachedEntry = await attempt;
      retryAfter = 0;
      return cachedEntry;
    } catch {
      retryAfter = now() + cooldown;
      throw new Error("CockroachDB provider initialization failed closed.");
    } finally {
      if (inFlight === attempt) inFlight = undefined;
    }
  }

  async function invalidateFailedEntry(entry) {
    if (cachedEntry === entry) {
      cachedEntry = undefined;
    }
    retryAfter = Math.max(retryAfter, now() + cooldown);
    await closeEntry(entry);
  }

  return Object.freeze({
    async probe() {
      const entry = await getProviderEntry();
      try {
        return await entry.provider.probe();
      } catch {
        await invalidateFailedEntry(entry);
        throw new Error("CockroachDB provider probe failed closed.");
      }
    },
  });
}

/**
 * Lazy factory for the vector-memory provider, mirroring the probe factory
 * above: nothing touches the network until the first call, every failure is
 * cached briefly and surfaces as a thrown error, and a thrown error means the
 * handler's memory gate simply stays closed.
 *
 * The provider gets its own bounded pool rather than reusing the probe
 * executor, because that executor is deliberately locked to one canonical
 * read-only statement and must stay that way.
 */
export function createLazyVectorMemoryProvider(options = {}) {
  const configuration = requireObject(options, "options");
  const environment = configuration.environment ?? process.env;
  const now = configuration.now ?? Date.now;
  const cooldown = requireInteger(
    configuration.failureRetryCooldownMilliseconds,
    5_000,
    1_000,
    60_000,
    "failureRetryCooldownMilliseconds",
  );
  const fetchTimeout = requireInteger(
    configuration.secretFetchTimeoutMilliseconds,
    1_000,
    100,
    2_000,
    "secretFetchTimeoutMilliseconds",
  );
  const clientFactory =
    configuration.secretsManagerClientFactory ??
    (() => new SecretsManagerClient({ region: "us-east-1", maxAttempts: 2 }));
  const poolFactory = configuration.poolFactory ?? defaultVectorMemoryPoolFactory;
  const providerFactory =
    configuration.vectorMemoryProviderFactory ?? createVectorMemoryProvider;
  const scenario = configuration.scenario ?? CANONICAL_SCENARIO;

  let cachedProvider;
  let inFlight;
  let retryAfter = 0;

  async function initialize() {
    const secretArn = environment[SECRET_ENVIRONMENT_NAME];
    if (
      typeof secretArn !== "string" ||
      secretArn.length > 600 ||
      !ARN_PATTERN.test(secretArn)
    ) {
      throw new TypeError("The CockroachDB runtime secret ARN is invalid.");
    }
    const releaseCommit = environment.MHELIX_RELEASE_COMMIT;
    if (typeof releaseCommit !== "string" || !/^[0-9a-f]{40}$/.test(releaseCommit)) {
      throw new TypeError("The release commit is invalid.");
    }

    const secretString = await fetchCurrentSecret(
      clientFactory,
      secretArn,
      fetchTimeout,
    );
    const secret = parseCockroachRuntimeSecret(secretString);
    const pool = poolFactory(secret);

    return providerFactory({
      pool,
      scenarioId: scenario.scenarioId,
      releaseCommit,
      agentIdentifier: scenario.agentDidz,
      resourceIdentifier: scenario.resourceId,
      authorityGrantIdentifier: scenario.grantId,
    });
  }

  async function resolveProvider() {
    if (cachedProvider !== undefined) {
      return cachedProvider;
    }
    const currentTime = now();
    if (currentTime < retryAfter) {
      throw new Error("Vector-memory initialization is cooling down.");
    }
    if (inFlight === undefined) {
      inFlight = initialize()
        .then((provider) => {
          cachedProvider = provider;
          return provider;
        })
        .catch((error) => {
          retryAfter = now() + cooldown;
          throw error;
        })
        .finally(() => {
          inFlight = undefined;
        });
    }
    return inFlight;
  }

  // Every method defers to the lazily initialized provider. A failure at any
  // stage throws, and the handler's gate treats a throw as "stay closed".
  const delegate =
    (methodName) =>
    async (request) => {
      const provider = await resolveProvider();
      return provider[methodName](request);
    };

  return Object.freeze({
    checkCapability: delegate("checkCapability"),
    createRun: delegate("createRun"),
    closeSessionAndBuildProjection: delegate("closeSessionAndBuildProjection"),
    recall: delegate("recall"),
    recordDisclosureDenial: delegate("recordDisclosureDenial"),
    fetchReceipt: delegate("fetchReceipt"),
  });
}

/**
 * The dedicated vector-memory pool: TLS with the pinned certificate authority
 * bundle, at most two connections, and bounded timeouts that stay inside the
 * Lambda response budget. Statements are all schema-qualified, so no search
 * path is set.
 */
function defaultVectorMemoryPoolFactory(secret) {
  return new Pool({
    host: secret.host,
    port: secret.port,
    database: secret.database,
    user: secret.username,
    password: secret.password,
    ssl: {
      ca: normalizeCertificateAuthorityBundle(secret.caCertificatePem),
      rejectUnauthorized: true,
    },
    max: 2,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 4_000,
    query_timeout: 4_500,
    allowExitOnIdle: true,
  });
}

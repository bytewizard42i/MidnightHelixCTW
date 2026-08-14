// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";

import {
  ACTIONS,
  ALLOWED_AGENT_IDENTIFIERS,
  RESPONSE_SCHEMA_VERSION,
  CANONICAL_SCENARIO,
  PROVIDER_STATES,
} from "./constants.js";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const AWS_LAMBDA_FUNCTION_NAME_PATTERN = /^[A-Za-z0-9-_]{1,57}-worker$/;
const AWS_LAMBDA_FUNCTION_VERSION_PATTERN = /^(?:\$LATEST|[1-9][0-9]*)$/;
const AWS_LAMBDA_RUNTIME_API_PATTERN =
  /^(?:\[[0-9A-Fa-f:]+\]|[A-Za-z0-9.-]+):[1-9][0-9]{0,4}$/;
const RESOURCE_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RELEASE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const REQUEST_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const REGION_PATTERN = /^[a-z]{2}(?:-gov)?-[a-z]+-\d$/;
const TEXT_WITHOUT_CONTROL_CHARACTERS = /^[^\u0000-\u001F\u007F]*$/u;

class PublicApiError extends Error {
  constructor(statusCode, code, message, retryable = false) {
    super(message);
    this.name = "PublicApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = retryable;
  }
}

function readBoundedInteger(rawValue, fallback, minimum, maximum) {
  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isSafeInteger(parsedValue)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, parsedValue));
}

function readSafeEnvironmentValue(rawValue, pattern, fallback) {
  if (typeof rawValue !== "string" || !pattern.test(rawValue)) {
    return fallback;
  }

  return rawValue;
}

/**
 * Browser input can never promote provider evidence. AWS reserves these
 * variables in a managed Lambda runtime, while SAM local also supplies some of
 * them. Requiring the full, internally consistent set and explicitly rejecting
 * SAM local keeps local tests and emulators at SOURCE_ONLY.
 */
function isValidatedAwsLambdaRuntime(configurationValues) {
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  const functionMemorySize = Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE);
  const initializationType = process.env.AWS_LAMBDA_INITIALIZATION_TYPE;
  const allowedInitializationTypes = new Set([
    "on-demand",
    "provisioned-concurrency",
    "snap-start",
  ]);

  return (
    process.env.AWS_SAM_LOCAL?.toLowerCase() !== "true" &&
    typeof functionName === "string" &&
    AWS_LAMBDA_FUNCTION_NAME_PATTERN.test(functionName) &&
    process.env.AWS_LAMBDA_FUNCTION_VERSION !== undefined &&
    AWS_LAMBDA_FUNCTION_VERSION_PATTERN.test(process.env.AWS_LAMBDA_FUNCTION_VERSION) &&
    process.env.AWS_LAMBDA_RUNTIME_API !== undefined &&
    AWS_LAMBDA_RUNTIME_API_PATTERN.test(process.env.AWS_LAMBDA_RUNTIME_API) &&
    process.env.AWS_EXECUTION_ENV === "AWS_Lambda_nodejs24.x" &&
    process.env.LAMBDA_TASK_ROOT === "/var/task" &&
    process.env.LAMBDA_RUNTIME_DIR === "/var/runtime" &&
    Number.isInteger(functionMemorySize) &&
    functionMemorySize >= 128 &&
    functionMemorySize <= 10_240 &&
    allowedInitializationTypes.has(initializationType) &&
    process.env.AWS_LAMBDA_LOG_GROUP_NAME === `/aws/lambda/${functionName}` &&
    typeof process.env.AWS_LAMBDA_LOG_STREAM_NAME === "string" &&
    process.env.AWS_LAMBDA_LOG_STREAM_NAME.length > 0 &&
    process.env.AWS_LAMBDA_LOG_STREAM_NAME.length <= 512 &&
    configurationValues.region === "us-east-1" &&
    process.env.AWS_DEFAULT_REGION === configurationValues.region &&
    configurationValues.releaseCommit !== "UNSET" &&
    configurationValues.publicAllowedOrigins.length > 0
  );
}

function readConfiguration() {
  const configuredAllowedOrigins =
    process.env.MHELIX_PUBLIC_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ??
    [];

  // A browser origin must contain only scheme, host, and optional port. Paths,
  // credentials, query strings, fragments, wildcard origins, invalid members,
  // duplicates, and unexpectedly broad lists are refused as one fail-closed
  // configuration unit.
  let publicAllowedOrigins = [];
  if (configuredAllowedOrigins.length > 0 && configuredAllowedOrigins.length <= 4) {
    const validatedOrigins = [];
    let originConfigurationIsValid = true;
    for (const configuredOrigin of configuredAllowedOrigins) {
      try {
        const parsedOrigin = new URL(configuredOrigin);
        if (
          parsedOrigin.protocol !== "https:" ||
          parsedOrigin.origin !== configuredOrigin ||
          parsedOrigin.username !== "" ||
          parsedOrigin.password !== "" ||
          validatedOrigins.includes(configuredOrigin)
        ) {
          originConfigurationIsValid = false;
          break;
        }
        validatedOrigins.push(configuredOrigin);
      } catch {
        originConfigurationIsValid = false;
        break;
      }
    }
    if (originConfigurationIsValid) {
      publicAllowedOrigins = validatedOrigins;
    }
  }

  const releaseCommit = readSafeEnvironmentValue(
    process.env.MHELIX_RELEASE_COMMIT,
    RELEASE_COMMIT_PATTERN,
    "UNSET",
  );
  const region = readSafeEnvironmentValue(process.env.AWS_REGION, REGION_PATTERN, "UNSET");
  const validatedAwsLambdaRuntime = isValidatedAwsLambdaRuntime({
    publicAllowedOrigins,
    releaseCommit,
    region,
  });

  return {
    publicAllowedOrigins,
    maxRequestBytes: readBoundedInteger(
      process.env.MHELIX_MAX_REQUEST_BYTES,
      4_096,
      1_024,
      16_384,
    ),
    maxResponseBytes: readBoundedInteger(
      process.env.MHELIX_MAX_RESPONSE_BYTES,
      32_768,
      512,
      65_536,
    ),
    releaseCommit,
    region,
    buildStage: "TESTWIRED",
    // This field describes the integrated deployment as a whole. It remains
    // SOURCE_ONLY because the downstream providers are still disconnected.
    deploymentEvidence: "SOURCE_ONLY",
    transport: {
      providerId: "aws",
      scope: "AWS_API_GATEWAY_LAMBDA_ONLY",
      evidence: validatedAwsLambdaRuntime ? "REALDEAL_TEST" : "SOURCE_ONLY",
      connection: validatedAwsLambdaRuntime ? "CONNECTED" : "NOT_CONNECTED",
      downstreamProvidersConnected: false,
    },
  };
}

function getHeader(event, requestedHeaderName) {
  const normalizedRequestedName = requestedHeaderName.toLowerCase();
  const headerEntries = Object.entries(event?.headers ?? {});
  const matchingEntry = headerEntries.find(
    ([headerName]) => headerName.toLowerCase() === normalizedRequestedName,
  );

  return typeof matchingEntry?.[1] === "string" ? matchingEntry[1].trim() : "";
}

function getRequestId(event) {
  const candidateRequestId = event?.requestContext?.requestId;
  if (
    typeof candidateRequestId === "string" &&
    REQUEST_IDENTIFIER_PATTERN.test(candidateRequestId)
  ) {
    return candidateRequestId;
  }

  return randomUUID();
}

function getRequestMethod(event) {
  const candidateMethod = event?.requestContext?.http?.method;
  return typeof candidateMethod === "string" ? candidateMethod.toUpperCase() : "";
}

function getRequestPath(event) {
  const candidatePath = event?.rawPath ?? event?.requestContext?.http?.path;
  return typeof candidatePath === "string" ? candidatePath : "";
}

function buildTransportStatus(configuration, requestId) {
  if (configuration.transport.evidence !== "REALDEAL_TEST") {
    return { ...configuration.transport };
  }

  return {
    ...configuration.transport,
    evidenceReference: {
      label: "REALDEAL_TEST",
      provider: "aws",
      requestId,
    },
  };
}

function cloneProviderStates(configuration, requestId) {
  return PROVIDER_STATES.map((providerState) => {
    if (providerState.id !== "aws") {
      return { ...providerState };
    }

    const awsProviderState = {
      ...providerState,
      evidence: configuration.transport.evidence,
      connection: configuration.transport.connection,
    };
    if (configuration.transport.evidence !== "REALDEAL_TEST") {
      return awsProviderState;
    }

    return {
      ...awsProviderState,
      evidenceReference: {
        label: "REALDEAL_TEST",
        provider: "aws",
        requestId,
      },
    };
  });
}

function buildBasePayload(ok, requestId) {
  return {
    schemaVersion: RESPONSE_SCHEMA_VERSION,
    ok,
    requestId,
  };
}

function buildResponseHeaders(requestId, allowedOrigin, additionalHeaders = {}) {
  const responseHeaders = {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
    ...additionalHeaders,
  };

  if (allowedOrigin !== "") {
    responseHeaders["access-control-allow-origin"] = allowedOrigin;
    responseHeaders.vary = "Origin";
  }

  return responseHeaders;
}

function createJsonResponse(
  configuration,
  statusCode,
  payload,
  requestId,
  responseOrigin,
  additionalHeaders = {},
) {
  let responseStatusCode = statusCode;
  let responseBody = JSON.stringify(payload);

  if (Buffer.byteLength(responseBody, "utf8") > configuration.maxResponseBytes) {
    responseStatusCode = 500;
    responseBody = JSON.stringify({
      ...buildBasePayload(false, requestId),
      error: {
        code: "RESPONSE_LIMIT_EXCEEDED",
        message: "The bounded response could not be returned.",
        retryable: false,
      },
    });
  }

  return {
    statusCode: responseStatusCode,
    headers: buildResponseHeaders(requestId, responseOrigin, additionalHeaders),
    body: responseBody,
    isBase64Encoded: false,
  };
}

function validateOrigin(event, configuration) {
  const requestOrigin = getHeader(event, "origin");
  if (requestOrigin === "") {
    return "";
  }

  if (
    configuration.publicAllowedOrigins.length === 0 ||
    !configuration.publicAllowedOrigins.includes(requestOrigin)
  ) {
    throw new PublicApiError(
      403,
      "ORIGIN_NOT_ALLOWED",
      "This browser origin is not allowed to call the TestWired API.",
    );
  }

  return requestOrigin;
}

function assertNoQueryParameters(event) {
  if (typeof event?.rawQueryString === "string" && event.rawQueryString !== "") {
    throw new PublicApiError(
      400,
      "QUERY_PARAMETERS_NOT_ALLOWED",
      "This fixed-operation route does not accept query parameters.",
    );
  }
}

function decodeBoundedRequestBody(event, maximumRequestBytes) {
  if (typeof event?.body !== "string" || event.body === "") {
    throw new PublicApiError(
      400,
      "JSON_BODY_REQUIRED",
      "A non-empty JSON object is required.",
    );
  }

  const contentLengthHeader = getHeader(event, "content-length");
  if (/^\d+$/.test(contentLengthHeader) && Number(contentLengthHeader) > maximumRequestBytes) {
    throw new PublicApiError(
      413,
      "REQUEST_LIMIT_EXCEEDED",
      `The request body exceeds the ${maximumRequestBytes}-byte limit.`,
    );
  }

  let requestBytes;
  if (event.isBase64Encoded === true) {
    const maximumEncodedLength = Math.ceil(maximumRequestBytes / 3) * 4 + 4;
    if (
      event.body.length > maximumEncodedLength ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        event.body,
      )
    ) {
      throw new PublicApiError(
        400,
        "INVALID_BODY_ENCODING",
        "The request body encoding is invalid.",
      );
    }
    requestBytes = Buffer.from(event.body, "base64");
  } else {
    requestBytes = Buffer.from(event.body, "utf8");
  }

  if (requestBytes.byteLength > maximumRequestBytes) {
    throw new PublicApiError(
      413,
      "REQUEST_LIMIT_EXCEEDED",
      `The request body exceeds the ${maximumRequestBytes}-byte limit.`,
    );
  }

  try {
    const parsedBody = JSON.parse(requestBytes.toString("utf8"));
    if (parsedBody === null || Array.isArray(parsedBody) || typeof parsedBody !== "object") {
      throw new PublicApiError(
        400,
        "JSON_OBJECT_REQUIRED",
        "The JSON body must be an object.",
      );
    }
    return parsedBody;
  } catch (error) {
    if (error instanceof PublicApiError) {
      throw error;
    }
    throw new PublicApiError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }
}

function readPostBody(event, configuration) {
  const contentType = getHeader(event, "content-type");
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType)) {
    throw new PublicApiError(
      415,
      "JSON_CONTENT_TYPE_REQUIRED",
      "Content-Type must be application/json.",
    );
  }

  const idempotencyKey = getHeader(event, "idempotency-key");
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new PublicApiError(
      428,
      "IDEMPOTENCY_KEY_REQUIRED",
      "Idempotency-Key must contain 16 to 128 safe characters.",
    );
  }

  // The validated idempotency key is deliberately not returned or logged. A
  // later persistent implementation will hash it before lookup and storage.
  return decodeBoundedRequestBody(event, configuration.maxRequestBytes);
}

function assertStrictObjectShape(value, requiredKeys, optionalKeys = []) {
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new PublicApiError(
        400,
        "UNKNOWN_REQUEST_FIELD",
        "The request contains an unsupported field.",
      );
    }
  }

  for (const requiredKey of requiredKeys) {
    if (!Object.hasOwn(value, requiredKey)) {
      throw new PublicApiError(
        400,
        "REQUIRED_REQUEST_FIELD_MISSING",
        `The request is missing the required field: ${requiredKey}.`,
      );
    }
  }
}

function assertCanonicalAgentIdentifier(agentDidz) {
  if (agentDidz === undefined) {
    return;
  }

  if (typeof agentDidz !== "string" || !ALLOWED_AGENT_IDENTIFIERS.includes(agentDidz)) {
    throw new PublicApiError(
      400,
      "INVALID_AGENT_IDENTIFIER",
      "The agent identifier is not part of the fixed synthetic scenario.",
    );
  }
}

function assertBoundedIdentifier(identifier, fieldName) {
  if (typeof identifier !== "string" || !RESOURCE_IDENTIFIER_PATTERN.test(identifier)) {
    throw new PublicApiError(
      400,
      "INVALID_RESOURCE_IDENTIFIER",
      `${fieldName} must be a bounded identifier.`,
    );
  }
}

function validateStartRunBody(requestBody) {
  assertStrictObjectShape(requestBody, ["scenarioId"], ["agentDidz"]);
  if (requestBody.scenarioId !== CANONICAL_SCENARIO.scenarioId) {
    throw new PublicApiError(
      400,
      "UNKNOWN_SCENARIO",
      "Only the fixed Morrow farmhouse TestWired scenario is available.",
    );
  }
  assertCanonicalAgentIdentifier(requestBody.agentDidz);
}

function validateCloseSessionBody(requestBody) {
  assertStrictObjectShape(requestBody, ["sessionId"]);
  assertBoundedIdentifier(requestBody.sessionId, "sessionId");
}

function validateRecallBody(requestBody) {
  assertStrictObjectShape(requestBody, ["query"], ["agentDidz"]);
  if (
    typeof requestBody.query !== "string" ||
    requestBody.query.trim().length === 0 ||
    requestBody.query.length > 500 ||
    !TEXT_WITHOUT_CONTROL_CHARACTERS.test(requestBody.query)
  ) {
    throw new PublicApiError(
      400,
      "INVALID_RECALL_QUERY",
      "query must contain 1 to 500 characters without control characters.",
    );
  }
  assertCanonicalAgentIdentifier(requestBody.agentDidz);
}

function validateActionBody(requestBody) {
  assertStrictObjectShape(requestBody, ["action"], ["agentDidz"]);
  if (typeof requestBody.action !== "string" || !ACTIONS.includes(requestBody.action)) {
    throw new PublicApiError(
      400,
      "UNSUPPORTED_ACTION",
      "The action is not part of the fixed TestWired action set.",
    );
  }
  assertCanonicalAgentIdentifier(requestBody.agentDidz);
}

function unavailableOperationPayload(configuration, requestId) {
  return {
    ...buildBasePayload(false, requestId),
    error: {
      code: "LIVE_PROVIDERS_NOT_CONNECTED",
      message:
        "This Phase 1 API shell does not execute or persist judge operations until the reviewed live providers are connected.",
      retryable: false,
    },
    providers: cloneProviderStates(configuration, requestId),
  };
}

function resolveRoute(requestPath) {
  const staticRoutes = new Map([
    ["/healthz", { name: "health", method: "GET", parameters: {} }],
    ["/api/v1/status", { name: "status", method: "GET", parameters: {} }],
    [
      "/api/v1/judge/scenarios",
      { name: "scenarios", method: "GET", parameters: {} },
    ],
    ["/api/v1/judge/runs", { name: "startRun", method: "POST", parameters: {} }],
  ]);

  const staticRoute = staticRoutes.get(requestPath);
  if (staticRoute) {
    return staticRoute;
  }

  const closeSessionMatch = requestPath.match(
    /^\/api\/v1\/judge\/runs\/([^/]+)\/sessions\/close$/,
  );
  if (closeSessionMatch) {
    return {
      name: "closeSession",
      method: "POST",
      parameters: { runId: closeSessionMatch[1] },
    };
  }

  const recallMatch = requestPath.match(/^\/api\/v1\/judge\/runs\/([^/]+)\/recall$/);
  if (recallMatch) {
    return {
      name: "recall",
      method: "POST",
      parameters: { runId: recallMatch[1] },
    };
  }

  const actionMatch = requestPath.match(/^\/api\/v1\/judge\/runs\/([^/]+)\/actions$/);
  if (actionMatch) {
    return {
      name: "action",
      method: "POST",
      parameters: { runId: actionMatch[1] },
    };
  }

  const receiptMatch = requestPath.match(/^\/api\/v1\/judge\/receipts\/([^/]+)$/);
  if (receiptMatch) {
    return {
      name: "receipt",
      method: "GET",
      parameters: { receiptId: receiptMatch[1] },
    };
  }

  return null;
}

async function dispatchRequest(event, configuration, requestId) {
  assertNoQueryParameters(event);

  const requestPath = getRequestPath(event);
  const requestMethod = getRequestMethod(event);
  const resolvedRoute = resolveRoute(requestPath);

  if (!resolvedRoute) {
    throw new PublicApiError(404, "ROUTE_NOT_FOUND", "The requested route does not exist.");
  }

  if (requestMethod !== resolvedRoute.method) {
    const methodError = new PublicApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "The HTTP method is not allowed for this route.",
    );
    methodError.allowedMethod = resolvedRoute.method;
    throw methodError;
  }

  if (resolvedRoute.parameters.runId !== undefined) {
    assertBoundedIdentifier(resolvedRoute.parameters.runId, "runId");
  }
  if (resolvedRoute.parameters.receiptId !== undefined) {
    assertBoundedIdentifier(resolvedRoute.parameters.receiptId, "receiptId");
  }

  if (resolvedRoute.name === "health") {
    return {
      statusCode: 200,
      payload: {
        ...buildBasePayload(true, requestId),
        service: "midnight-helixctw-api",
        buildStage: configuration.buildStage,
        deploymentEvidence: configuration.deploymentEvidence,
        transport: buildTransportStatus(configuration, requestId),
        handler: "READY",
        dependenciesConnected: false,
        region: configuration.region,
        releaseCommit: configuration.releaseCommit,
        limits: {
          maxRequestBytes: configuration.maxRequestBytes,
          maxResponseBytes: configuration.maxResponseBytes,
        },
        providers: cloneProviderStates(configuration, requestId),
      },
    };
  }

  if (resolvedRoute.name === "status") {
    return {
      statusCode: 200,
      payload: {
        ...buildBasePayload(true, requestId),
        buildStage: configuration.buildStage,
        deploymentEvidence: configuration.deploymentEvidence,
        transport: buildTransportStatus(configuration, requestId),
        releaseCommit: configuration.releaseCommit,
        currentAvailability: "NOT_CONNECTED",
        readyForMutations: false,
        writeOperations: "BLOCKED_UNTIL_CONNECTED",
        actions: [...ACTIONS],
        providers: cloneProviderStates(configuration, requestId),
      },
    };
  }

  if (resolvedRoute.name === "scenarios") {
    return {
      statusCode: 200,
      payload: {
        ...buildBasePayload(true, requestId),
        buildStage: configuration.buildStage,
        deploymentEvidence: configuration.deploymentEvidence,
        transport: buildTransportStatus(configuration, requestId),
        scenarios: [
          {
            ...CANONICAL_SCENARIO,
            fixtureEvidence: "SOURCE_ONLY",
            currentAvailability: "NOT_CONNECTED",
            actions: [...ACTIONS],
            requiredLiveProviders: ["cockroachdb", "bedrock", "midnight"],
            privacyBoundary:
              "The underlying deed and mortgage text must never be returned by this API.",
          },
        ],
        providers: cloneProviderStates(configuration, requestId),
      },
    };
  }

  if (resolvedRoute.name === "receipt") {
    return {
      statusCode: 503,
      payload: unavailableOperationPayload(configuration, requestId),
    };
  }

  const requestBody = readPostBody(event, configuration);
  if (resolvedRoute.name === "startRun") {
    validateStartRunBody(requestBody);
  } else if (resolvedRoute.name === "closeSession") {
    validateCloseSessionBody(requestBody);
  } else if (resolvedRoute.name === "recall") {
    validateRecallBody(requestBody);
  } else if (resolvedRoute.name === "action") {
    validateActionBody(requestBody);
  }

  return {
    statusCode: 503,
    payload: unavailableOperationPayload(configuration, requestId),
  };
}

/**
 * AWS Lambda HTTP API payload-format 2.0 handler.
 *
 * This transport shell deliberately performs no database, model, wallet, or
 * network work. A valid mutation returns an explicit 503 until later adapters
 * are connected, which prevents fixture behavior from masquerading as a live
 * CockroachDB, Bedrock, or Midnight result.
 */
export async function handler(event) {
  const configuration = readConfiguration();
  const requestId = getRequestId(event);
  let responseOrigin = "";

  try {
    responseOrigin = validateOrigin(event, configuration);
    const dispatchedResponse = await dispatchRequest(event, configuration, requestId);
    return createJsonResponse(
      configuration,
      dispatchedResponse.statusCode,
      dispatchedResponse.payload,
      requestId,
      responseOrigin,
    );
  } catch (error) {
    if (error instanceof PublicApiError) {
      const additionalHeaders =
        error.allowedMethod === undefined ? {} : { allow: error.allowedMethod };
      return createJsonResponse(
        configuration,
        error.statusCode,
        {
          ...buildBasePayload(false, requestId),
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        },
        requestId,
        responseOrigin,
        additionalHeaders,
      );
    }

    // Never serialize or log the unexpected error object. Provider libraries
    // can place credentials or private payload fragments in their messages.
    console.error(
      JSON.stringify({
        level: "error",
        code: "UNEXPECTED_HANDLER_FAILURE",
        requestId,
      }),
    );

    return createJsonResponse(
      configuration,
      500,
      {
        ...buildBasePayload(false, requestId),
        error: {
          code: "INTERNAL_ERROR",
          message: "The bounded request could not be completed.",
          retryable: false,
        },
      },
      requestId,
      responseOrigin,
    );
  }
}

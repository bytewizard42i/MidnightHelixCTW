import type {
  ApiResponseEnvelope,
  HealthResponse,
  JsonObject,
  JudgeApiClient,
  JudgeMutationResponse,
  ScenariosResponse,
  StatusResponse,
} from "./types";

const REQUEST_TIMEOUT_MILLISECONDS = 15_000;

export class JudgeApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JudgeApiConfigurationError";
  }
}

export class JudgeApiRequestError extends Error {
  readonly httpStatus?: number;
  readonly requestId?: string;

  constructor(
    message: string,
    options: { readonly httpStatus?: number; readonly requestId?: string } = {},
  ) {
    super(message);
    this.name = "JudgeApiRequestError";
    this.httpStatus = options.httpStatus;
    this.requestId = options.requestId;
  }
}

/**
 * Vite exposes every VITE_ value to the browser. This validator therefore
 * accepts only a public HTTPS origin, plus localhost HTTP for development.
 */
export function normalizePublicApiBaseUrl(
  configuredValue: string | undefined,
): string | null {
  const trimmedValue = configuredValue?.trim();
  if (!trimmedValue) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new JudgeApiConfigurationError(
      "VITE_API_BASE_URL must be a complete public URL.",
    );
  }

  const isLocalDevelopment =
    parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
  if (parsedUrl.protocol !== "https:" && !(isLocalDevelopment && parsedUrl.protocol === "http:")) {
    throw new JudgeApiConfigurationError(
      "VITE_API_BASE_URL must use HTTPS, except for local development.",
    );
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new JudgeApiConfigurationError(
      "VITE_API_BASE_URL cannot contain credentials, query parameters, or a fragment.",
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

function createIdempotencyKey(): string {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    throw new JudgeApiConfigurationError(
      "This browser cannot create a cryptographically random idempotency key.",
    );
  }
  return `mhelix-web:${crypto.randomUUID()}`;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safePublicErrorMessage(responseBody: unknown): string {
  if (isJsonObject(responseBody) && typeof responseBody.message === "string") {
    return responseBody.message;
  }
  if (
    isJsonObject(responseBody) &&
    isJsonObject(responseBody.error) &&
    typeof responseBody.error.message === "string"
  ) {
    return responseBody.error.message;
  }
  return "The TestWired API failed closed without returning a public error message.";
}

export function createJudgeApiClient(baseUrl: string): JudgeApiClient {
  const normalizedBaseUrl = normalizePublicApiBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    throw new JudgeApiConfigurationError("VITE_API_BASE_URL is not configured.");
  }

  async function request<ResponseBody extends JsonObject>(
    path: string,
    options: {
      readonly method?: "GET" | "POST";
      readonly body?: JsonObject;
      readonly idempotentMutation?: boolean;
    } = {},
  ): Promise<ApiResponseEnvelope<ResponseBody>> {
    const abortController = new AbortController();
    const timeoutIdentifier = window.setTimeout(
      () => abortController.abort(),
      REQUEST_TIMEOUT_MILLISECONDS,
    );
    const method = options.method ?? "GET";
    const headers = new Headers({ Accept: "application/json" });

    if (method === "POST") {
      headers.set("Content-Type", "application/json");
      if (options.idempotentMutation) {
        headers.set("Idempotency-Key", createIdempotencyKey());
      }
    }

    try {
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: abortController.signal,
      });
      let requestId = response.headers.get("x-request-id") ?? undefined;
      const contentType = response.headers.get("content-type") ?? "";
      const responseBody: unknown = contentType.includes("application/json")
        ? await response.json()
        : null;
      if (!requestId && isJsonObject(responseBody) && typeof responseBody.requestId === "string") {
        requestId = responseBody.requestId;
      }

      if (!response.ok) {
        throw new JudgeApiRequestError(safePublicErrorMessage(responseBody), {
          httpStatus: response.status,
          requestId,
        });
      }
      if (!isJsonObject(responseBody)) {
        throw new JudgeApiRequestError(
          "The TestWired API returned an invalid response body.",
          { httpStatus: response.status, requestId },
        );
      }

      return {
        data: responseBody as ResponseBody,
        httpStatus: response.status,
        requestId,
        receivedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof JudgeApiRequestError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new JudgeApiRequestError(
          "The TestWired API did not respond within 15 seconds.",
        );
      }
      throw new JudgeApiRequestError(
        "The TestWired API could not be reached. No operation was recorded.",
      );
    } finally {
      window.clearTimeout(timeoutIdentifier);
    }
  }

  return {
    health: () => request<HealthResponse>("/healthz"),
    status: () => request<StatusResponse>("/api/v1/status"),
    scenarios: () => request<ScenariosResponse>("/api/v1/judge/scenarios"),
    startRun: ({ scenarioId, agentDidz }) =>
      request<JudgeMutationResponse>("/api/v1/judge/runs", {
        method: "POST",
        idempotentMutation: true,
        body: agentDidz ? { scenarioId, agentDidz } : { scenarioId },
      }),
    closeSession: ({ runId, sessionId }) =>
      request<JudgeMutationResponse>(
        `/api/v1/judge/runs/${encodeURIComponent(runId)}/sessions/close`,
        {
          method: "POST",
          idempotentMutation: true,
          body: { sessionId },
        },
      ),
    recall: ({ runId, query, agentDidz }) =>
      request<JudgeMutationResponse>(
        `/api/v1/judge/runs/${encodeURIComponent(runId)}/recall`,
        {
          method: "POST",
          idempotentMutation: true,
          body: agentDidz ? { query, agentDidz } : { query },
        },
      ),
    executeAction: ({ runId, action, agentDidz }) =>
      request<JudgeMutationResponse>(
        `/api/v1/judge/runs/${encodeURIComponent(runId)}/actions`,
        {
          method: "POST",
          idempotentMutation: true,
          body: agentDidz ? { action, agentDidz } : { action },
        },
      ),
    receipt: (receiptId) =>
      request<JudgeMutationResponse>(
        `/api/v1/judge/receipts/${encodeURIComponent(receiptId)}`,
      ),
  };
}

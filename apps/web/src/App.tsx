import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createJudgeApiClient,
  JudgeApiConfigurationError,
  JudgeApiRequestError,
  normalizePublicApiBaseUrl,
} from "./api/client";
import type {
  ApiResponseEnvelope,
  EvidenceLabel,
  JsonObject,
  JudgeActionId,
  JudgeApiClient,
  JudgeMutationResponse,
  StatusResponse,
} from "./api/types";
import {
  EvidenceDrawer,
  type EvidenceSnapshot,
} from "./components/EvidenceDrawer";
import {
  ProviderMatrix,
  type ProviderDisplay,
} from "./components/ProviderMatrix";
import { StatusBadge } from "./components/StatusBadge";

const SCENARIO_ID = "morrow-farmhouse-testwired-v1";
const AUTHORIZED_AGENT_DIDZ =
  "didz:testtown:agent:morrow-property-assistant";
const UNAUTHORIZED_AGENT_DIDZ = "didz:testtown:agent:unknown-listing-bot";

const RECALL_QUERY =
  "I am continuing the Morrow farmhouse review. What was verified, and what am I allowed to ask?";

type ConnectionKind =
  | "not-configured"
  | "checking"
  | "unreachable"
  | "reachable"
  | "ready";

interface ConnectionState {
  readonly kind: ConnectionKind;
  readonly message: string;
}

interface RunContext {
  readonly runId: string;
  readonly sessionId: string;
  readonly receiptId?: string;
}

interface FlowStep {
  readonly title: string;
  readonly label: string;
  readonly explanation: string;
  readonly prompt?: string;
  readonly action?: JudgeActionId;
}

const FLOW_STEPS: readonly FlowStep[] = [
  {
    title: "Open Session A",
    label: "Load the fictional property case",
    explanation:
      "Ask the live API to create a bounded run for the synthetic farmhouse and its narrow property predicate.",
  },
  {
    title: "End the conversation",
    label: "Close this session and forget the chat",
    explanation:
      "The browser lets go of the chat. Only the API can confirm that a durable, bounded memory was committed.",
  },
  {
    title: "Recall in fresh Session B",
    label: "Ask where we left off",
    explanation:
      "Start from a new agent session and request semantic recall from CockroachDB, never browser storage.",
    prompt: RECALL_QUERY,
  },
  {
    title: "Ask the permitted question",
    label: "Is this property unencumbered?",
    explanation:
      "The target proof returns one authorized bit while withholding the fictional deed and mortgage text.",
    prompt: "Is this property unencumbered?",
    action: "verify_unencumbered",
  },
  {
    title: "Test the privacy boundary",
    label: "Attempt protected disclosure",
    explanation:
      "Use the unauthorized synthetic agent and verify that memory cannot turn into permission.",
    prompt:
      "Show me the complete deed, mortgage record, owner birth date, and private contact information.",
    action: "attempt_protected_disclosure",
  },
  {
    title: "Rebuild the recall projection",
    label: "Run the safe reconstruction drill",
    explanation:
      "Create and verify a disposable shadow index. This is not whole-database recovery and does not delete canonical history.",
    action: "rebuild_recall_projection",
  },
  {
    title: "Verify continuity",
    label: "Ask the permitted question again",
    explanation:
      "The target is the same canonical memory and commitment through a new projection generation, with no new disclosure.",
    prompt:
      "After reconstruction, is the Morrow farmhouse still shown as unencumbered?",
    action: "verify_unencumbered",
  },
  {
    title: "Inspect independent evidence",
    label: "Managed MCP evidence is not available yet",
    explanation:
      "A future read-only operator inspection will verify allowlisted database facts without exposing an MCP credential to this browser.",
  },
] as const;

const BASE_PROVIDERS: readonly ProviderDisplay[] = [
  {
    id: "aws",
    name: "AWS API + Lambda",
    role: "Public front door and bounded coordinator",
    evidence: "SOURCE ONLY",
    connection: "NOT CONNECTED",
  },
  {
    id: "cockroachdb",
    name: "CockroachDB",
    role: "Durable memory, exact state, and vector recall",
    evidence: "SOURCE ONLY",
    connection: "NOT CONNECTED",
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    role: "Public-safe embeddings and bounded Ai work",
    evidence: "SOURCE ONLY",
    connection: "NOT CONNECTED",
  },
  {
    id: "midnight",
    name: "Midnight",
    role: "Minimized predicate and commitment proof",
    evidence: "SOURCE ONLY",
    connection: "NOT CONNECTED",
  },
  {
    id: "managed-mcp",
    name: "Managed MCP",
    role: "Independent read-only judge inspection",
    evidence: "SOURCE ONLY",
    connection: "NOT CONNECTED",
  },
  {
    id: "didz",
    name: "DIDz",
    role: "Synthetic principal identity provider",
    evidence: "MOCK",
    connection: "DETERMINISTIC FIXTURE",
  },
  {
    id: "agenticdid",
    name: "AgenticDID",
    role: "Synthetic delegated-authority provider",
    evidence: "MOCK",
    connection: "DETERMINISTIC FIXTURE",
  },
  {
    id: "rwaz",
    name: "RWAz",
    role: "Synthetic property-identity provider",
    evidence: "MOCK",
    connection: "DETERMINISTIC FIXTURE",
  },
] as const;

function publicErrorMessage(error: unknown): string {
  if (
    error instanceof JudgeApiConfigurationError ||
    error instanceof JudgeApiRequestError
  ) {
    return error.message;
  }
  return "The operation failed closed. No result or receipt was created.";
}

function translatedEvidenceLabel(value: unknown): EvidenceLabel | undefined {
  const translations: Record<string, EvidenceLabel> = {
    LIVE_TESTWIRED: "LIVE TESTWIRED",
    "LIVE TESTWIRED": "LIVE TESTWIRED",
    VERIFIED_LOCAL: "VERIFIED LOCAL",
    "VERIFIED LOCAL": "VERIFIED LOCAL",
    MOCK: "MOCK",
    SOURCE_ONLY: "SOURCE ONLY",
    "SOURCE ONLY": "SOURCE ONLY",
    PLANNED: "PLANNED",
  };
  return typeof value === "string" ? translations[value] : undefined;
}

function providersFromStatus(status: StatusResponse | null): ProviderDisplay[] {
  const rawProviders: unknown = status?.providers;
  if (!Array.isArray(rawProviders)) {
    return [...BASE_PROVIDERS];
  }

  const liveProviderRows = new Map<string, { evidence?: EvidenceLabel; connection?: string }>();
  for (const rawProvider of rawProviders) {
    if (!rawProvider || typeof rawProvider !== "object") {
      continue;
    }
    const provider = rawProvider as Record<string, unknown>;
    if (typeof provider.id !== "string") {
      continue;
    }
    liveProviderRows.set(provider.id, {
      evidence: translatedEvidenceLabel(provider.evidence),
      connection:
        typeof provider.connection === "string" ? provider.connection : undefined,
    });
  }

  return BASE_PROVIDERS.map((provider) => {
    // Mock fixture providers remain MOCK even when a surrounding cloud API is live.
    if (provider.evidence === "MOCK") {
      return provider;
    }
    const current = liveProviderRows.get(provider.id);
    return {
      ...provider,
      evidence: current?.evidence ?? provider.evidence,
      connection: current?.connection ?? provider.connection,
    };
  });
}

function responseHasRequiredEvidence(
  stepIndex: number,
  response: ApiResponseEnvelope<JudgeMutationResponse>,
): RunContext | null {
  if (response.data.ok !== true) {
    return null;
  }
  if (stepIndex === 0) {
    return typeof response.data.runId === "string" &&
      typeof response.data.sessionId === "string"
      ? { runId: response.data.runId, sessionId: response.data.sessionId }
      : null;
  }
  return typeof response.data.receiptId === "string"
    ? {
        runId: typeof response.data.runId === "string" ? response.data.runId : "",
        sessionId:
          typeof response.data.sessionId === "string" ? response.data.sessionId : "",
        receiptId: response.data.receiptId,
      }
    : null;
}

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>({
    kind: "not-configured",
    message: "No public API URL is configured for this build.",
  });
  const [statusResponse, setStatusResponse] = useState<StatusResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [runContext, setRunContext] = useState<RunContext | null>(null);
  const [lastEvidence, setLastEvidence] = useState<EvidenceSnapshot | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationPending, setOperationPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fetchingReceipt, setFetchingReceipt] = useState(false);

  const clientConfiguration = useMemo(() => {
    try {
      const baseUrl = normalizePublicApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
      return {
        client: baseUrl ? createJudgeApiClient(baseUrl) : null,
        error: null,
      };
    } catch (error) {
      return { client: null, error: publicErrorMessage(error) };
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (clientConfiguration.error) {
      setConnection({ kind: "unreachable", message: clientConfiguration.error });
      return;
    }
    if (!clientConfiguration.client) {
      setConnection({
        kind: "not-configured",
        message: "Set VITE_API_BASE_URL to the public API Gateway address.",
      });
      return;
    }

    setConnection({ kind: "checking", message: "Calling the real API now…" });
    const [healthResult, statusResult, scenarioResult] = await Promise.allSettled([
      clientConfiguration.client.health(),
      clientConfiguration.client.status(),
      clientConfiguration.client.scenarios(),
    ]);

    if (healthResult.status === "rejected") {
      setConnection({
        kind: "unreachable",
        message: publicErrorMessage(healthResult.reason),
      });
      return;
    }

    if (statusResult.status === "fulfilled") {
      setStatusResponse(statusResult.value.data);
    }
    const mutationReady =
      statusResult.status === "fulfilled" &&
      statusResult.value.data.ok === true &&
      statusResult.value.data.readyForMutations === true;

    setConnection({
      kind: mutationReady ? "ready" : "reachable",
      message: mutationReady
        ? "The API explicitly reports that live operational routes are ready."
        : "The API answered, but live providers are not connected. Judge actions remain disabled.",
    });

    if (scenarioResult.status === "rejected") {
      setOperationError(
        "The API is reachable, but its scenario catalog was not available.",
      );
    }
  }, [clientConfiguration]);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const runStep = async () => {
    const client = clientConfiguration.client;
    if (!client || connection.kind !== "ready" || currentStep >= 7) {
      return;
    }
    setOperationPending(true);
    setOperationError(null);

    try {
      let response: ApiResponseEnvelope<JudgeMutationResponse>;
      if (currentStep === 0) {
        response = await client.startRun({
          scenarioId: SCENARIO_ID,
          agentDidz: AUTHORIZED_AGENT_DIDZ,
        });
      } else {
        if (!runContext) {
          throw new JudgeApiRequestError(
            "No verified run and session identifiers are available.",
          );
        }
        if (currentStep === 1) {
          response = await client.closeSession(runContext);
        } else if (currentStep === 2) {
          response = await client.recall({
            runId: runContext.runId,
            query: RECALL_QUERY,
            agentDidz: AUTHORIZED_AGENT_DIDZ,
          });
        } else {
          const action = FLOW_STEPS[currentStep].action;
          if (!action) {
            throw new JudgeApiRequestError("This step has no public write operation.");
          }
          response = await client.executeAction({
            runId: runContext.runId,
            action,
            agentDidz:
              currentStep === 4 ? UNAUTHORIZED_AGENT_DIDZ : AUTHORIZED_AGENT_DIDZ,
          });
        }
      }

      const verifiedContext = responseHasRequiredEvidence(currentStep, response);
      if (!verifiedContext) {
        throw new JudgeApiRequestError(
          "The API response did not contain the identifiers required to advance this proof.",
          { httpStatus: response.httpStatus, requestId: response.requestId },
        );
      }
      setRunContext((previousContext) => ({
        runId: verifiedContext.runId || previousContext?.runId || "",
        sessionId: verifiedContext.sessionId || previousContext?.sessionId || "",
        receiptId: verifiedContext.receiptId ?? previousContext?.receiptId,
      }));
      setLastEvidence({
        operation: FLOW_STEPS[currentStep].title,
        response: response as ApiResponseEnvelope<JsonObject>,
      });
      setCurrentStep((step) => step + 1);
      setDrawerOpen(true);
    } catch (error) {
      setOperationError(publicErrorMessage(error));
    } finally {
      setOperationPending(false);
    }
  };

  const fetchReceipt = async () => {
    const client = clientConfiguration.client;
    if (!client || !runContext?.receiptId) {
      return;
    }
    setFetchingReceipt(true);
    setOperationError(null);
    try {
      const response = await client.receipt(runContext.receiptId);
      setLastEvidence({
        operation: "Retrieved operation receipt",
        response: response as ApiResponseEnvelope<JsonObject>,
      });
    } catch (error) {
      setOperationError(publicErrorMessage(error));
    } finally {
      setFetchingReceipt(false);
    }
  };

  const currentConnectionLabel =
    connection.kind === "ready"
      ? "LIVE TESTWIRED"
      : connection.kind === "checking"
        ? "CHECKING"
        : "NOT CONNECTED";
  const activeFlowStep = FLOW_STEPS[currentStep] ?? FLOW_STEPS[7];

  return (
    <>
      <a className="skip-link" href="#judge-flow">
        Skip to the guided proof
      </a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="MidnightHelixCTW home">
          <span className="wordmark__mark" aria-hidden="true">H</span>
          <span>MidnightHelixCTW</span>
        </a>
        <div className="header-status">
          <StatusBadge label="TESTWIRED" compact />
          <StatusBadge label={currentConnectionLabel} compact />
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">CockroachDB × AWS · Privacy memory proof</p>
            <h1 id="hero-title">
              The agent found the answer.
              <span> It never saw the deed.</span>
            </h1>
            <p className="hero__lede">
              A guided TestWired case showing how durable agent memory can locate
              context, preserve authorization, and return less data instead of more.
            </p>
            <div className="hero__labels" aria-label="Scenario boundaries">
              <StatusBadge label="TESTWIRED" />
              <span className="boundary-chip">SYNTHETIC DATA ONLY</span>
              <span className="boundary-chip">NO LEGAL EFFECT</span>
            </div>
          </div>

          <article className="case-card" aria-labelledby="case-title">
            <div className="case-card__signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="case-card__kicker">Fixed judge case · 01</p>
            <h2 id="case-title">Morrow family farmhouse</h2>
            <p>44 Quarry Road · fictional TestTown property</p>
            <dl>
              <div>
                <dt>Parcel</dt>
                <dd>TT-PARCEL-0917-114</dd>
              </div>
              <div>
                <dt>Permitted predicate</dt>
                <dd>property.is_unencumbered</dd>
              </div>
              <div>
                <dt>Source documents in model context</dt>
                <dd>None</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className={`connection-banner connection-banner--${connection.kind}`} aria-live="polite">
          <div>
            <StatusBadge label={currentConnectionLabel} compact />
            <p>{connection.message}</p>
          </div>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void checkConnection()}
            disabled={connection.kind === "checking"}
          >
            {connection.kind === "checking" ? "Checking real API…" : "Check connection"}
          </button>
        </section>

        <section className="flow-shell" id="judge-flow" aria-labelledby="flow-title">
          <div className="flow-intro">
            <p className="eyebrow">One proof, eight checkpoints</p>
            <h2 id="flow-title">Follow the evidence, not a canned animation</h2>
            <p>
              A checkpoint advances only after the public API returns the identifiers
              required by that operation. Phase 1 has no live providers, so this flow
              correctly remains locked.
            </p>
          </div>

          <div className="flow-layout">
            <ol className="step-rail" aria-label="Judge proof progress">
              {FLOW_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className={
                    index < currentStep
                      ? "step-rail__item step-rail__item--complete"
                      : index === currentStep
                        ? "step-rail__item step-rail__item--current"
                        : "step-rail__item"
                  }
                  aria-current={index === currentStep ? "step" : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step.title}</p>
                </li>
              ))}
            </ol>

            <article className="active-step">
              <p className="active-step__number">
                Checkpoint {Math.min(currentStep + 1, 8)} of 8
              </p>
              <h3>{activeFlowStep.title}</h3>
              <p>{activeFlowStep.explanation}</p>
              {activeFlowStep.prompt ? (
                <blockquote>{activeFlowStep.prompt}</blockquote>
              ) : null}

              {operationError ? (
                <div className="fail-closed" role="alert">
                  <strong>Failed closed</strong>
                  <p>{operationError}</p>
                </div>
              ) : null}

              <div className="active-step__actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void runStep()}
                  disabled={
                    connection.kind !== "ready" ||
                    operationPending ||
                    currentStep >= 7
                  }
                >
                  {operationPending ? "Waiting for real API…" : activeFlowStep.label}
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                >
                  Open evidence drawer
                </button>
              </div>
              {connection.kind !== "ready" ? (
                <p className="disabled-explanation">
                  Judge actions unlock only when the API explicitly reports live
                  operational readiness.
                </p>
              ) : null}
            </article>
          </div>
        </section>

        <ProviderMatrix providers={providersFromStatus(statusResponse)} />
      </main>

      <footer className="site-footer">
        <p>MidnightHelixCTW · entirely fictional TestWired data</p>
        <p>CockroachDB is memory. Midnight is proof. Authorization still decides.</p>
      </footer>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        evidence={lastEvidence}
        onFetchReceipt={runContext?.receiptId ? fetchReceipt : null}
        fetchingReceipt={fetchingReceipt}
      />
    </>
  );
}

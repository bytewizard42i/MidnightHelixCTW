export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue | undefined;
}

export type EvidenceLabel =
  | "LIVE TESTWIRED"
  | "VERIFIED LOCAL"
  | "MOCK"
  | "SOURCE ONLY"
  | "PLANNED"
  | "NOT AVAILABLE";

export interface ApiResponseEnvelope<ResponseBody extends JsonObject> {
  readonly data: ResponseBody;
  readonly httpStatus: number;
  readonly requestId?: string;
  readonly receivedAt: string;
}

export interface HealthResponse extends JsonObject {
  readonly ok?: boolean;
  readonly service?: string;
  readonly deploymentStatus?: string;
}

export interface ProviderStatus extends JsonObject {
  readonly evidenceLabel?: EvidenceLabel;
  readonly provider?: string;
  readonly receiptId?: string;
}

export interface StatusResponse extends JsonObject {
  readonly ok?: boolean;
  readonly service?: string;
  readonly deploymentStatus?: string;
  readonly releaseCommit?: string;
  readonly providers?: JsonValue[];
  readonly readyForMutations?: boolean;
}

export interface ScenarioCatalogEntry extends JsonObject {
  readonly scenarioId?: string;
  readonly title?: string;
  readonly synthetic?: boolean;
  readonly evidenceLabel?: EvidenceLabel;
}

export interface ScenariosResponse extends JsonObject {
  readonly scenarios?: ScenarioCatalogEntry[];
}

export type JudgeActionId =
  | "verify_unencumbered"
  | "attempt_protected_disclosure"
  | "rebuild_recall_projection";

export interface JudgeMutationResponse extends JsonObject {
  readonly ok?: boolean;
  readonly runId?: string;
  readonly sessionId?: string;
  readonly receiptId?: string;
}

export interface JudgeApiClient {
  health(): Promise<ApiResponseEnvelope<HealthResponse>>;
  status(): Promise<ApiResponseEnvelope<StatusResponse>>;
  scenarios(): Promise<ApiResponseEnvelope<ScenariosResponse>>;
  startRun(input: {
    readonly scenarioId: string;
    readonly agentDidz?: string;
  }): Promise<ApiResponseEnvelope<JudgeMutationResponse>>;
  closeSession(input: {
    readonly runId: string;
    readonly sessionId: string;
  }): Promise<ApiResponseEnvelope<JudgeMutationResponse>>;
  recall(input: {
    readonly runId: string;
    readonly query: string;
    readonly agentDidz?: string;
  }): Promise<ApiResponseEnvelope<JudgeMutationResponse>>;
  executeAction(input: {
    readonly runId: string;
    readonly action: JudgeActionId;
    readonly agentDidz?: string;
  }): Promise<ApiResponseEnvelope<JudgeMutationResponse>>;
  receipt(
    receiptId: string,
  ): Promise<ApiResponseEnvelope<JudgeMutationResponse>>;
}

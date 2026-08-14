// SPDX-License-Identifier: Apache-2.0

/** Evidence describes the mechanism behind one output, not the whole app. */
export type EvidenceLabel = "MOCK" | "REALDEAL_TEST" | "REALDEAL" | "PLANNED";

export interface Evidenced<Value> {
  readonly value: Value;
  readonly evidence: EvidenceLabel;
  readonly provider: string;
  readonly receiptId?: string;
}

export interface SyntheticPrincipal {
  readonly didz: string;
  readonly commitment: string;
  readonly synthetic: true;
}

export interface SyntheticGrant {
  readonly grantId: string;
  readonly agentDidz: string;
  readonly resource: string;
  readonly allowedActions: readonly string[];
  readonly protectedFieldsAllowed: readonly string[];
  readonly expiresAt: string;
  readonly synthetic: true;
}

export interface SyntheticProperty {
  readonly objectId: string;
  readonly ownerCommitment: string;
  readonly publicDescription: string;
  readonly synthetic: true;
}

export interface DidzProvider {
  getPrincipal(didz: string): Promise<Evidenced<SyntheticPrincipal>>;
}

export interface AgenticDidProvider {
  getGrant(agentDidz: string, resource: string): Promise<Evidenced<SyntheticGrant | null>>;
}

export interface RwazProvider {
  getProperty(objectId: string): Promise<Evidenced<SyntheticProperty>>;
}

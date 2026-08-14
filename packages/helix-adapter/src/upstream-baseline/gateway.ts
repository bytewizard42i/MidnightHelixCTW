/**
 * gateway.ts — HelixCTW DataGateway (kernel Seam 4).
 *
 * The GATE step, faithful to demoLand semantics: the SAME query returns
 * different field visibility depending on the caller's resolved authority.
 * This provider owns the gate DECISION (which needs to understand grants);
 * the backend owns storage and returns rows already shaped for the tier.
 *
 * Disclosures use the SHARED evaluator from kernel-core, so a "prove
 * you're over 21" here means exactly what it means in demoLand and, in
 * realDeal, what the ZK circuit must prove. Only the boolean leaves.
 */

import { createHash } from 'node:crypto';
import type {
  CanonicalDidz,
  CredentialCommitment,
  DisclosureRequest,
  DisclosureResult,
  Evidenced,
  ScopedGrant,
} from '@didz/kernel-types';
import { asCommitment, evidenced } from '@didz/kernel-types';
import type { DataGateway, GatedQuery, GatedResult } from '@didz/kernel-core';
import { KernelError, evaluateDisclosurePredicate } from '@didz/kernel-core';
import type { HelixBackend } from './backend.js';

/** Does any active grant cover this dataset's action class + resource? */
function hasReadGrant(
  grants: readonly ScopedGrant[],
  requiredActionClass: string,
  resource: string,
): boolean {
  return grants.some(
    (g) =>
      g.actionClasses.includes(requiredActionClass) &&
      g.resources.some(
        (p) => p === '*' || p === resource || (p.endsWith('*') && resource.startsWith(p.slice(0, -1))),
      ),
  );
}

export class HelixDataGateway implements DataGateway {
  constructor(private readonly backend: HelixBackend) {}

  async query(q: GatedQuery, activeGrants: readonly ScopedGrant[]): Promise<Evidenced<GatedResult>> {
    const gating = await this.backend.datasetGating(q.query);
    if (!gating) throw new KernelError('QUERY_UNKNOWN', `no dataset registered for query '${q.query}'`);

    const tier = hasReadGrant(activeGrants, gating.requiredActionClass, gating.resource) ? 'granted' : 'public';
    const rows = await this.backend.runGatedQuery(q.query, q.params as Record<string, unknown>, tier);
    return evidenced({ tier, rows }, this.backend.evidence);
  }

  async disclose(req: DisclosureRequest, holder: CanonicalDidz): Promise<Evidenced<DisclosureResult>> {
    const cred = await this.backend.getCredential(req.credentialId);
    if (!cred) throw new KernelError('CREDENTIAL_NOT_FOUND', `unknown credential ${req.credentialId}`);

    // One bit out — the shared kernel-core evaluator (the spec a realDeal
    // ZK proof must satisfy). The claim value never leaves.
    const satisfied = evaluateDisclosurePredicate(req.predicate, req.args, cred.claims);

    // Pairwise, unlinkable subject commitment per (holder, predicate) context.
    const digest = createHash('sha256')
      .update(`helixctw:disclosure:${holder}:${req.predicate}`)
      .digest('hex');
    return evidenced(
      { request: req, satisfied, subjectCommitment: asCommitment(digest) },
      this.backend.evidence,
    );
  }

  async storeCredential(cred: CredentialCommitment): Promise<Evidenced<void>> {
    await this.backend.putCredentialCommitment(cred);
    return evidenced(undefined, this.backend.evidence);
  }

  /**
   * Fetch + hash-verify a cold-layer document. Not part of the DataGateway
   * seam (which is query/disclose/store), but the natural home for the
   * Weave's verified-retrieval step; consumers reach for it directly.
   */
  async fetchDocument(cid: string, expectedSha256: string): Promise<Uint8Array> {
    return this.backend.fetchDocument(cid, expectedSha256);
  }
}

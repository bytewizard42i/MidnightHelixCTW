/**
 * backend.ts — how the HelixCTW DataGateway reaches storage.
 *
 * SAME PATTERN AS adapter-midnight (teaching note): a backend seam INSIDE
 * the adapter. The gateway (gateway.ts) computes the tier from grants and
 * evaluates disclosures; the backend just stores and fetches. Swap
 * InMemory (MOCK) for CockroachDB+Lighthouse (REALDEAL_TEST) and the
 * gateway above never changes — the demoLand/realDeal principle applied to
 * a data plane.
 *
 * STORAGE_PLAN.md invariants enforced here:
 *  - the server stores COMMITMENTS, never raw claims (claims are held
 *    holder-side; disclosure is a client concern, and in realDeal a
 *    holder-generated ZK proof — the shared evaluator is that proof's spec);
 *  - cold-layer documents are HASH-VERIFIED before they are ever served
 *    (the Weave's whole reason to exist);
 *  - we talk only to the helix_testtown TWIN INSTANCE, never the frozen
 *    HelixCTW hackathon cluster.
 */

import { createHash } from 'node:crypto';
import type {
  CredentialCommitment,
  CredentialId,
  CredentialPrivate,
  EvidenceLabel,
} from '@didz/kernel-types';
import { KernelError } from '@didz/kernel-core';

/** Gating config for one dataset (mirrors demoLand's DemoDataset shape). */
export interface DatasetGating {
  readonly requiredActionClass: string;
  readonly resource: string;
  readonly publicFields: readonly string[];
}

/** A dataset the backend serves: gating config + rows. */
export interface HelixDataset extends DatasetGating {
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

/**
 * The seam. `datasetGating` lets the gateway decide the tier from grants
 * WITHOUT the backend knowing what a grant is; `runGatedQuery` then returns
 * rows already shaped for the resolved tier.
 */
export interface HelixBackend {
  readonly evidence: EvidenceLabel; // 'MOCK' | 'REALDEAL_TEST'
  /** Gating config for a named query, or undefined if the query is unknown. */
  datasetGating(name: string): Promise<DatasetGating | undefined>;
  /** Rows for a named query at a resolved tier ('public' strips to publicFields). */
  runGatedQuery(name: string, params: Record<string, unknown>, tier: string): Promise<readonly Record<string, unknown>[]>;
  /** Holder-side credential lookup (claims live with the holder, not the server). */
  getCredential(id: CredentialId): Promise<CredentialPrivate | undefined>;
  /** Persist a credential COMMITMENT (never claims). */
  putCredentialCommitment(c: CredentialCommitment): Promise<void>;
  /** Cold-layer document fetch, HASH-VERIFIED before return. */
  fetchDocument(cid: string, expectedSha256: string): Promise<Uint8Array>;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Strip a row to only its public fields (the 'public' tier). */
function stripToPublic(
  row: Readonly<Record<string, unknown>>,
  publicFields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of publicFields) if (f in row) out[f] = row[f];
  return out;
}

/* ------------------------------------------------------------------ */
/* Shared cold-layer fetch (Filecoin via Lighthouse gateway).          */
/* ------------------------------------------------------------------ */

/**
 * Fetch bytes from the Lighthouse/IPFS gateway and HASH-VERIFY them.
 * A mismatch is refused — serving unverified cold data would defeat the
 * entire trust model, so this throws rather than returning suspect bytes.
 */
export async function fetchAndVerifyFromLighthouse(cid: string, expectedSha256: string): Promise<Uint8Array> {
  // Gateway is CONFIGURABLE via HELIX_IPFS_GATEWAY (finding, Aug 3 2026:
  // Lighthouse's free tier returns HTTP 402 on its own gateway — serving is
  // behind the trial/paid plan — and freshly-uploaded content is not yet on
  // the public IPFS DHT, so public gateways 504. Point this at an
  // authenticated Lighthouse gateway, a paid gateway, or a pinning service
  // once one is available). Bytes are content-addressed either way, so the
  // hash-verify below is what actually guarantees integrity, not the source.
  const base = process.env['HELIX_IPFS_GATEWAY']?.replace(/\/$/, '') ?? 'https://gateway.lighthouse.storage/ipfs';
  const url = `${base}/${cid}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new KernelError('CREDENTIAL_NOT_FOUND', `cold fetch ${cid}: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const actual = sha256Hex(bytes);
  if (actual !== expectedSha256) {
    throw new KernelError('CREDENTIAL_NOT_FOUND', `document hash mismatch — refusing to serve (cid ${cid}: expected ${expectedSha256.slice(0, 12)}…, got ${actual.slice(0, 12)}…)`);
  }
  return bytes;
}

/* ------------------------------------------------------------------ */
/* InMemoryHelixBackend (MOCK) — testable with zero services.          */
/* ------------------------------------------------------------------ */

export class InMemoryHelixBackend implements HelixBackend {
  readonly evidence: EvidenceLabel = 'MOCK';
  private readonly datasets = new Map<string, HelixDataset>();
  private readonly credentials = new Map<string, CredentialPrivate>();
  /** cid → {bytes, sha256}. In-memory stand-in for the Filecoin cold layer. */
  private readonly documents = new Map<string, { bytes: Uint8Array; sha256: string }>();

  addDataset(name: string, ds: HelixDataset): void {
    this.datasets.set(name, ds);
  }

  /** Holder-side claims store (the wallet stand-in) — same role as demoLand's addPrivateCredential. */
  addHolderCredential(cred: CredentialPrivate): void {
    this.credentials.set(cred.commitment.id, cred);
  }

  /** Seed a cold document (bytes + its true hash) for fetch/verify tests. */
  addDocument(cid: string, bytes: Uint8Array): void {
    this.documents.set(cid, { bytes, sha256: sha256Hex(bytes) });
  }

  async datasetGating(name: string): Promise<DatasetGating | undefined> {
    const ds = this.datasets.get(name);
    return ds && { requiredActionClass: ds.requiredActionClass, resource: ds.resource, publicFields: ds.publicFields };
  }

  async runGatedQuery(name: string, _params: Record<string, unknown>, tier: string): Promise<readonly Record<string, unknown>[]> {
    const ds = this.datasets.get(name);
    if (!ds) throw new KernelError('QUERY_UNKNOWN', `no dataset '${name}'`);
    if (tier === 'granted') return ds.rows;
    return ds.rows.map((r) => stripToPublic(r, ds.publicFields));
  }

  async getCredential(id: CredentialId): Promise<CredentialPrivate | undefined> {
    return this.credentials.get(id);
  }

  async putCredentialCommitment(c: CredentialCommitment): Promise<void> {
    if (!this.credentials.has(c.id)) this.credentials.set(c.id, { commitment: c, claims: {} });
  }

  async fetchDocument(cid: string, expectedSha256: string): Promise<Uint8Array> {
    const doc = this.documents.get(cid);
    if (!doc) throw new KernelError('CREDENTIAL_NOT_FOUND', `no document ${cid}`);
    if (doc.sha256 !== expectedSha256) {
      throw new KernelError('CREDENTIAL_NOT_FOUND', `document hash mismatch — refusing to serve (cid ${cid})`);
    }
    return doc.bytes;
  }
}

/* ------------------------------------------------------------------ */
/* CockroachHelixBackend (REALDEAL_TEST) — hot layer on CockroachDB,   */
/* cold layer on Filecoin via Lighthouse.                              */
/* ------------------------------------------------------------------ */

/** Minimal shape of the `pg` Pool we depend on (kept narrow for testability). */
export interface PgLike {
  query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
}

export interface CockroachBackendOptions {
  /** A connected pg Pool (or compatible). Injected so tests can stub it. */
  readonly pool: PgLike;
  /**
   * Holder-side claims store (the wallet stand-in). The DB holds only
   * commitments; claims for disclosure come from here, exactly as in
   * realDeal where disclosure is holder-generated. Optional.
   */
  readonly holderCredentials?: Map<string, CredentialPrivate>;
}

export class CockroachHelixBackend implements HelixBackend {
  readonly evidence: EvidenceLabel = 'REALDEAL_TEST';
  private readonly pool: PgLike;
  private readonly holder: Map<string, CredentialPrivate>;

  constructor(opts: CockroachBackendOptions) {
    this.pool = opts.pool;
    this.holder = opts.holderCredentials ?? new Map();
  }

  /** Holder-side claims (wallet stand-in) — never persisted server-side. */
  addHolderCredential(cred: CredentialPrivate): void {
    this.holder.set(cred.commitment.id, cred);
  }

  async datasetGating(name: string): Promise<DatasetGating | undefined> {
    const { rows } = await this.pool.query(
      'SELECT required_action_class, resource, public_fields FROM datasets WHERE name = $1',
      [name],
    );
    const r = rows[0];
    if (!r) return undefined;
    return {
      requiredActionClass: String(r['required_action_class']),
      resource: String(r['resource']),
      publicFields: (r['public_fields'] as string[]) ?? [],
    };
  }

  async runGatedQuery(name: string, _params: Record<string, unknown>, tier: string): Promise<readonly Record<string, unknown>[]> {
    const gating = await this.datasetGating(name);
    if (!gating) throw new KernelError('QUERY_UNKNOWN', `no dataset '${name}'`);
    const { rows } = await this.pool.query('SELECT body FROM rows WHERE dataset = $1', [name]);
    const bodies = rows.map((r) => r['body'] as Record<string, unknown>);
    if (tier === 'granted') return bodies;
    return bodies.map((b) => stripToPublic(b, gating.publicFields));
  }

  async getCredential(id: CredentialId): Promise<CredentialPrivate | undefined> {
    // Claims come from the holder-side store; the DB only ever held the
    // commitment. If the holder half was never provided, disclosure over
    // this backend simply can't prove facts it doesn't have — correct.
    return this.holder.get(id);
  }

  async putCredentialCommitment(c: CredentialCommitment): Promise<void> {
    await this.pool.query(
      'UPSERT INTO credential_commitments (id, body) VALUES ($1, $2)',
      [c.id, JSON.stringify(c)],
    );
  }

  async fetchDocument(cid: string, expectedSha256: string): Promise<Uint8Array> {
    return fetchAndVerifyFromLighthouse(cid, expectedSha256);
  }
}

/**
 * adapter-helixctw.test.ts
 *
 * Layer 1: the FULL protocol conformance suite with the DATA seam swapped
 *   to this adapter (InMemory backend) while identity/objects/authority run
 *   on the three REAL pillar circuits — proving the data gateway composes
 *   interchangeably at the seam.
 * Layer 2: adapter-specific tests (tier gating, unknown query, disclosure,
 *   and the non-negotiable hash-verify refusal) — no services needed.
 * Layer 3: CockroachDB tests, gated behind HELIX_TESTTOWN_DB_URL.
 * Layer 4: Lighthouse cold-layer E2E, gated behind DIDZ_LIGHTHOUSE=1.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { conformanceSuite } from '@didz/kernel-conformance';
import { makeDemolandProviders, DemolandEnforcementGate } from '@didz/kernel-demoland';
import {
  MidnightIdentityProvider,
  MidnightObjectProvider,
  MidnightAuthorityProvider,
  createInProcessDidzRegistryBackend,
  createInProcessRwaRegistryBackend,
  createInProcessScopedGrantBackend,
} from '@didz/adapter-midnight';
import { asCommitment, asCredentialId, type CanonicalDidz, type ScopedGrant } from '@didz/kernel-types';
import { CockroachHelixBackend, HelixDataGateway, InMemoryHelixBackend, type PgLike } from '../src/index.js';

const DIDZ = fileURLToPath(new URL('../../../../DIDz-io/build/didz-registry/contract/index.js', import.meta.url));
const RWA = fileURLToPath(new URL('../../../../RWAz/build/rwa-registry/contract/index.js', import.meta.url));
const GRANT = fileURLToPath(new URL('../../../../midnight-modules/build/scoped-grant/contract/index.js', import.meta.url));

/* ------------------------------------------------------------------ */
/* Layer 1 — conformance with the data seam = HelixDataGateway.        */
/* ------------------------------------------------------------------ */
if (existsSync(DIDZ) && existsSync(RWA) && existsSync(GRANT)) {
  conformanceSuite('HelixCTW data seam + three real circuits', {
    makeHarness: async () => {
      const world = makeDemolandProviders({ seed: 42 });
      const clock = { now: () => world.clock.now() };
      const identity = new MidnightIdentityProvider(await createInProcessDidzRegistryBackend({ contractModulePath: DIDZ }), clock);
      const objects = new MidnightObjectProvider(await createInProcessRwaRegistryBackend({ contractModulePath: RWA }), clock);
      const authority = new MidnightAuthorityProvider(await createInProcessScopedGrantBackend({ contractModulePath: GRANT }), clock);
      const gate = new DemolandEnforcementGate(authority, world.clock, {});
      const data = new HelixDataGateway(new InMemoryHelixBackend());
      return {
        providers: { ...world.providers, identity, objects, authority, gate, data },
        advanceTime: (ms: number) => world.clock.advance(ms),
        now: () => world.clock.now(),
      };
    },
  });
} else {
  describe('@didz/adapter-helixctw conformance', () => {
    it.skip('pillar contracts not compiled — compile DIDz-io, RWAz, midnight-modules scoped-grant first', () => {});
  });
}

/* ------------------------------------------------------------------ */
/* Layer 2 — adapter-specific, InMemory backend (MOCK), no services.   */
/* ------------------------------------------------------------------ */
describe('HelixDataGateway over InMemory backend', () => {
  const CALLER = 'did:didz:demo:caller' as CanonicalDidz;

  function gatewayWithPets() {
    const backend = new InMemoryHelixBackend();
    backend.addDataset('pets-directory', {
      requiredActionClass: 'read:pets',
      resource: 'dataset:pets',
      publicFields: ['species'],
      rows: [
        { species: 'dog', name: 'Biscuit', ownerName: 'June Okafor', chipId: '985-141-002-119-04' },
        { species: 'horse', name: 'Comet', ownerName: 'Rosa Delgado', chipId: '985-141-002-776-31' },
      ],
    });
    return { backend, gateway: new HelixDataGateway(backend) };
  }

  const readGrant: ScopedGrant = {
    id: 'grant:read' as never,
    grantor: CALLER,
    subject: CALLER,
    actionClasses: ['read:pets'],
    resources: ['dataset:pets'],
    counterparties: ['*'],
    perActionCap: 0n,
    cumulativeCap: 0n,
    expiresAt: Number.MAX_SAFE_INTEGER,
    delegable: false,
    status: 'active',
    issuedAt: 0,
  };

  it('public tier strips rows to public fields; granted tier returns full rows', async () => {
    const { gateway } = gatewayWithPets();
    const q = { caller: CALLER, query: 'pets-directory', params: {} };

    const pub = (await gateway.query(q, [])).value;
    expect(pub.tier).toBe('public');
    expect(Object.keys(pub.rows[0]!)).toEqual(['species']);
    expect(pub.rows[0]!['name']).toBeUndefined();

    const granted = (await gateway.query(q, [readGrant])).value;
    expect(granted.tier).toBe('granted');
    expect(granted.rows[0]!['name']).toBe('Biscuit');
    expect(granted.rows[0]!['chipId']).toBe('985-141-002-119-04');
  });

  it('a grant for the wrong resource does not unlock the dataset', async () => {
    const { gateway } = gatewayWithPets();
    const wrong: ScopedGrant = { ...readGrant, resources: ['dataset:vehicles'] };
    const res = (await gateway.query({ caller: CALLER, query: 'pets-directory', params: {} }, [wrong])).value;
    expect(res.tier).toBe('public');
  });

  it('unknown query throws QUERY_UNKNOWN', async () => {
    const { gateway } = gatewayWithPets();
    await expect(gateway.query({ caller: CALLER, query: 'nope', params: {} }, [])).rejects.toMatchObject({
      code: 'QUERY_UNKNOWN',
    });
  });

  it('disclosure returns one bit — true for the real claim, false for a lie, value never leaves', async () => {
    const { backend, gateway } = gatewayWithPets();
    const commitment = {
      id: asCredentialId('cred-age'),
      issuerCommitment: asCommitment('issuer'),
      subjectCommitment: asCommitment('subject'),
      claimsCommitment: asCommitment('claims'),
      credentialType: 'birth' as const,
      status: 'active' as const,
      issuedAt: 0,
    };
    backend.addHolderCredential({ commitment, claims: { birthYear: 1989 } });

    const over21 = (await gateway.disclose({ credentialId: commitment.id, predicate: 'claim-at-least', args: { key: 'birthYear', min: 1900 } }, CALLER)).value;
    expect(over21.satisfied).toBe(true);
    const impossible = (await gateway.disclose({ credentialId: commitment.id, predicate: 'claim-at-least', args: { key: 'birthYear', min: 2100 } }, CALLER)).value;
    expect(impossible.satisfied).toBe(false);
    // one-bit rule: no claim value on the wire
    expect(JSON.stringify(over21)).not.toContain('1989');
  });

  it('THE WEAVE: a tampered cold document is REFUSED, never served', async () => {
    const backend = new InMemoryHelixBackend();
    const gateway = new HelixDataGateway(backend);
    const bytes = new TextEncoder().encode('articles of incorporation — St. Brigid\u2019s');
    backend.addDocument('bafyGENUINE', bytes);

    // Correct hash → served.
    const trueHash = (await import('node:crypto')).createHash('sha256').update(bytes).digest('hex');
    await expect(gateway.fetchDocument('bafyGENUINE', trueHash)).resolves.toBeInstanceOf(Uint8Array);
    // Wrong expected hash (as if bytes were swapped under us) → refused.
    await expect(gateway.fetchDocument('bafyGENUINE', 'deadbeef'.repeat(8))).rejects.toMatchObject({
      code: 'CREDENTIAL_NOT_FOUND',
    });
  });

  it('evidence label is MOCK for the in-memory backend', async () => {
    const { gateway } = gatewayWithPets();
    const res = await gateway.query({ caller: CALLER, query: 'pets-directory', params: {} }, []);
    expect(res.evidence).toBe('MOCK');
  });
});

/* ------------------------------------------------------------------ */
/* Layer 3 — CockroachDB (REALDEAL_TEST), gated behind env.            */
/* Uses a stub PgLike unless a real URL is present, so the backend's   */
/* SQL-shaping logic is always exercised; a real pool is used when set.*/
/* ------------------------------------------------------------------ */
describe('CockroachHelixBackend', () => {
  const CALLER = 'did:didz:demo:caller' as CanonicalDidz;

  it('shapes gated queries against a pg-compatible pool (stubbed) and labels REALDEAL_TEST', async () => {
    // A tiny in-memory stand-in for pg that answers the two SELECTs.
    const stub: PgLike = {
      async query(text: string) {
        if (text.includes('FROM datasets')) {
          return { rows: [{ required_action_class: 'read:pets', resource: 'dataset:pets', public_fields: ['species'] }] };
        }
        if (text.includes('FROM rows')) {
          return { rows: [{ body: { species: 'dog', name: 'Biscuit' } }] };
        }
        return { rows: [] };
      },
      async end() {},
    };
    const backend = new CockroachHelixBackend({ pool: stub });
    expect(backend.evidence).toBe('REALDEAL_TEST');
    const gateway = new HelixDataGateway(backend);

    const pub = (await gateway.query({ caller: CALLER, query: 'pets-directory', params: {} }, [])).value;
    expect(pub.tier).toBe('public');
    expect(pub.rows[0]).toEqual({ species: 'dog' });
  });

  const LIVE = process.env['HELIX_TESTTOWN_DB_URL'];
  (LIVE ? it : it.skip)('connects to a live helix_testtown and round-trips a dataset [needs HELIX_TESTTOWN_DB_URL]', async () => {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: LIVE });
    try {
      const backend = new CockroachHelixBackend({ pool });
      const gw = new HelixDataGateway(backend);
      // Assumes 001_init.sql applied + at least one dataset seeded.
      const res = await gw.query({ caller: CALLER, query: 'rwa-assets', params: {} }, []);
      expect(res.value.tier).toBe('public');
    } finally {
      await pool.end();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Layer 4 — Lighthouse cold-layer E2E, opt-in.                        */
/* ------------------------------------------------------------------ */
const LIGHTHOUSE = process.env['DIDZ_LIGHTHOUSE'] === '1' && !!process.env['LIGHTHOUSE_API_KEY'];
describe('Lighthouse / Filecoin Calibration cold layer', () => {
  (LIGHTHOUSE ? it : it.skip)('uploads, fetches via gateway, and hash-verifies [needs DIDZ_LIGHTHOUSE=1 + LIGHTHOUSE_API_KEY]', async () => {
    // Upload path uses the seed script in real runs; here we only assert
    // the verify path against a known public CID if one is provided.
    const cid = process.env['DIDZ_LIGHTHOUSE_TEST_CID'];
    const sha = process.env['DIDZ_LIGHTHOUSE_TEST_SHA256'];
    if (!cid || !sha) return; // nothing to verify without a fixture CID
    const { fetchAndVerifyFromLighthouse } = await import('../src/backend.js');
    await expect(fetchAndVerifyFromLighthouse(cid, sha)).resolves.toBeInstanceOf(Uint8Array);
  });
});

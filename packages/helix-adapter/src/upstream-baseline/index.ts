/**
 * @didz/adapter-helixctw — L3 DataGateway adapter for the DIDz Trust
 * Kernel: tiered queries, one-bit disclosure, credential-commitment
 * storage, and hash-verified cold-document retrieval.
 *
 * InMemory backend (MOCK) runs the full conformance suite with zero
 * services; the CockroachDB + Lighthouse backend (REALDEAL_TEST) is the
 * TestWired data plane, talking to the helix_testtown twin instance.
 * The frozen HelixCTW hackathon deployment is never touched.
 */

export * from './backend.js';
export * from './gateway.js';

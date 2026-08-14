# Implementation status

Last updated: 2026-08-13

This file is the public truth ledger for MidnightHelixCTW. Update it whenever a
provider, test, deployment, or evidence claim changes.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| `LIVE TESTWIRED` | A named real test or cloud service was called successfully with synthetic data, and a current receipt or request identifier exists. |
| `VERIFIED LOCAL` | The implementation passed locally against a real local service or compiler, but is not reachable from the public judge URL. |
| `MOCK` | Deterministic synthetic fixture or local behavior that does not call the named external system. Provider connection state is reported separately. |
| `SOURCE ONLY` | Code or infrastructure exists but has not been executed successfully in the stated environment. |
| `PLANNED` | Design work only. |

There is no silent fallback from a live provider to a mock provider. A failed
live provider returns a visible error and preserves the last verified state.

### Machine identifiers

API responses and source contracts use exactly `LIVE_TESTWIRED`,
`VERIFIED_LOCAL`, `MOCK`, `SOURCE_ONLY`, and `PLANNED`. The spaced labels
above are human-facing renderings only.

`REALDEAL_TEST` is not a stage. It may appear only as an evidence label on one
successful output carrying a sanitized real test-service receipt.

## Current standalone-repository status

| Capability | Current status | Evidence required to promote it |
| --- | --- | --- |
| Standalone public source | VERIFIED_LOCAL | Public GitHub URL, Apache-2.0 detection, reproducible install, fixture/doc verification, and secret scans were checked on 2026-08-13. This does not prove a deployed app. |
| Synthetic property fixtures | VERIFIED_LOCAL | The curated TestTown snapshot is present and the root fixture verifier passes locally. |
| DIDz synthetic identity fixture | MOCK | The root fixture verifier passes; the callable mock provider is not connected. |
| AgenticDID synthetic authority fixture | MOCK | The root fixture verifier passes; the callable mock provider is not connected. |
| RWAz synthetic property fixture | MOCK | The root fixture verifier passes; the callable mock provider is not connected. |
| CockroachDB Cloud memory | PLANNED | New session writes, new Lambda process recalls, and live rows/receipts are visible. |
| CockroachDB vector retrieval | PLANNED | Real Titan embedding, stored vector, semantic query, distance, and query-plan evidence. |
| CockroachDB Managed MCP | PLANNED | Read-only cluster-scoped inspection with a redacted judge receipt. |
| AWS Lambda and API Gateway | SOURCE_ONLY | Phase 1 handler, eight-route contract, tests, and deployment source exist. Promotion still requires a public generated URL, CloudWatch request ID, and incognito smoke test. |
| AWS Bedrock Titan | PLANNED | Live model ID, dimensions, request metadata, and stored vector evidence. |
| Midnight test network | PLANNED | Real network name, contract/circuit version, transaction identifier, and explorer or query evidence. |
| Reconstructible derived index | PLANNED | Shadow generation rebuilt from canonical test records, commitment verified, pointer flipped atomically, same answer returned. |
| Public judge UI | SOURCE_ONLY | Phase 1 judge-interface source exists. Promotion still requires a public URL, desktop/mobile end-to-end test, and clean console/network results. |

`MOCK` in these rows describes deterministic fixture evidence. The Phase 1 API
reports all three provider connections as `NOT_CONNECTED` and does not call a
provider implementation.
### Phase 1 fail-closed boundary

Until the named live providers are connected, valid operational POST requests
return `503 LIVE_PROVIDERS_NOT_CONNECTED`. They do not mint run identifiers or
receipts, return the fixture predicate as live evidence, or silently substitute
mocks for CockroachDB, Bedrock, Midnight, Lambda, or API Gateway.

## Prior evidence that is not yet standalone proof

The private HelixCTW workspace contains valuable earlier local evidence, including
structured memory, vector mechanics, migration tests, and an adapter that performs
grant-gated and hash-verified reads. Those results informed this project, but they
do not automatically prove this standalone public application works.

Earlier local evidence must be re-run from this repository before it appears as a
current badge or Devpost claim. See [PREEXISTING_WORK.md](../PREEXISTING_WORK.md).

## Promotion checklist

Before changing any item to `LIVE TESTWIRED`, record:

1. exact source commit;
2. service and environment name;
3. UTC execution time;
4. sanitized request, transaction, or receipt identifier;
5. command or user flow that reproduced it;
6. expected and actual result;
7. negative-case result;
8. known limitation.

Screenshots can support these records, but a screenshot alone is not execution
proof.

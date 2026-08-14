# Implementation status

Last updated: 2026-08-13

This file is the public truth ledger for MidnightHelixCTW. Update it whenever a
provider, test, deployment, or evidence claim changes.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| `LIVE TESTWIRED` | A named real test or cloud service was called successfully with synthetic data, and a current receipt or request identifier exists. |
| `VERIFIED LOCAL` | The implementation passed locally against a real local service or compiler, but is not reachable from the public judge URL. |
| `MOCK` | Deterministic local behavior that exercises an interface without calling the named external system. |
| `SOURCE ONLY` | Code or infrastructure exists but has not been executed successfully in the stated environment. |
| `PLANNED` | Design work only. |

There is no silent fallback from a live provider to a mock provider. A failed
live provider returns a visible error and preserves the last verified state.

## Current standalone-repository status

| Capability | Current status | Evidence required to promote it |
| --- | --- | --- |
| Standalone public source | IN PROGRESS | Public GitHub URL, Apache-2.0 detected, clean secret scan, reproducible install. |
| Synthetic property fixtures | SOURCE ONLY | Root fixture verifier passes after the curated TestTown snapshot is imported. |
| DIDz identity provider | MOCK | Deterministic identity fixture and contract tests. |
| AgenticDID authority provider | MOCK | Scope, expiry, attenuation, and denial tests. |
| RWAz property identity provider | MOCK | Persistent property identifier and title-status fixture tests. |
| CockroachDB Cloud memory | PLANNED | New session writes, new Lambda process recalls, and live rows/receipts are visible. |
| CockroachDB vector retrieval | PLANNED | Real Titan embedding, stored vector, semantic query, distance, and query-plan evidence. |
| CockroachDB Managed MCP | PLANNED | Read-only cluster-scoped inspection with a redacted judge receipt. |
| AWS Lambda and API Gateway | PLANNED | Public generated URL, CloudWatch request ID, bounded endpoint, and incognito smoke test. |
| AWS Bedrock Titan | PLANNED | Live model ID, dimensions, request metadata, and stored vector evidence. |
| Midnight test network | PLANNED | Real network name, contract/circuit version, transaction identifier, and explorer or query evidence. |
| Reconstructible derived index | PLANNED | Shadow generation rebuilt from canonical test records, commitment verified, pointer flipped atomically, same answer returned. |
| Public judge UI | PLANNED | Public URL, desktop/mobile end-to-end test, console/network clean. |

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

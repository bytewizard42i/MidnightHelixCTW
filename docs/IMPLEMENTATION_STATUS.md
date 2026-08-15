# Implementation status

Last updated: 2026-08-15

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
| CockroachDB Cloud connection and TestWired environment probe | SOURCE ONLY | A bounded, single-flight, read-only query seam exists in source. Promotion requires a reviewed live driver bootstrap, an explicit server-side statement timeout shorter than the outer response timeout, an applied checksummed core migration, an installed marker, and a sanitized receipt from a real TestWired query. |
| CockroachDB additive memory schema | SOURCE ONLY | The additive run-scoped schema and constraints exist in `database/migrations/001_testwired_memory_core.sql`; promotion requires a reviewed migrator to apply the checksummed file and record live schema and row evidence. The source deliberately contains no vector column or vector index. |
| CockroachDB Cloud memory | PLANNED | New session writes, new Lambda process recalls, and live rows/receipts are visible. |
| CockroachDB vector retrieval | PLANNED | Real Titan embedding, stored vector, semantic query, distance, and query-plan evidence. |
| CockroachDB Managed MCP | PLANNED | Read-only cluster-scoped inspection with a redacted judge receipt. |
| AWS (Amazon Web Services) Lambda and Amazon API (Application Programming Interface) Gateway | LIVE TESTWIRED | The `mhelixctw-testwired` stack is `CREATE_COMPLETE` at release `578d565049e6d177c4b6fae4bb69fe4a2337173f`; its generated address is `https://iyoshkil91.execute-api.us-east-1.amazonaws.com`. Read-only routes, exact-origin CORS (Cross-Origin Resource Sharing), and the fail-closed mutation check passed. This promotion applies only to cloud transport; downstream providers remain `NOT_CONNECTED`. |
| AWS Bedrock Titan | PLANNED | Live model ID, dimensions, request metadata, and stored vector evidence. |
| Midnight test network | PLANNED | Real network name, contract/circuit version, transaction identifier, and explorer or query evidence. |
| Reconstructible derived index | PLANNED | Shadow generation rebuilt from canonical test records, commitment verified, pointer flipped atomically, same answer returned. |
| Public judge UI (User Interface) | LIVE TESTWIRED | Amplify application `d23ghemtd40rom` serves branch `main` at `https://main.d23ghemtd40rom.amplifyapp.com` and `https://testwired.helixctw.com`. The custom address is `AVAILABLE`, returns HTTP (Hypertext Transfer Protocol) status 200, and presents valid TLS (Transport Layer Security) 1.3. Hosting and read-only connection are promoted; the complete mutation journey remains unavailable while `readyForMutations` is false. |

The two CockroachDB `SOURCE ONLY` rows are code and schema evidence, not live
service evidence. They do not prove a live database driver, an applied
migration, persistent memory, vector indexing or retrieval, Managed MCP (Model
Context Protocol), or mutation readiness. The default Lambda export remains
database-disconnected until a reviewed bootstrap injects the provider.

`MOCK` in these rows describes deterministic fixture evidence. The Phase 1 API
reports all three provider connections as `NOT_CONNECTED` and does not call a
provider implementation.

The browser guide and narration are presentation features, not provider
evidence. A working voice or local UI build cannot promote a cloud, database,
proof, identity, or deployment status.

### 2026-08-15 cloud transport and public frontend checkpoint

The `mhelixctw-testwired` AWS (Amazon Web Services) SAM (Serverless
Application Model) application stack is `CREATE_COMPLETE` at release
`578d565049e6d177c4b6fae4bb69fe4a2337173f`. Its generated
API (Application Programming Interface) address is
`https://iyoshkil91.execute-api.us-east-1.amazonaws.com`. Read-only checks and
exact-origin CORS (Cross-Origin Resource Sharing) passed for both the generated
and custom frontend origins.

Amplify application `d23ghemtd40rom` serves branch `main` at
`https://main.d23ghemtd40rom.amplifyapp.com` and
`https://testwired.helixctw.com`. The custom address is `AVAILABLE`, returns
HTTP (Hypertext Transfer Protocol) status 200, and presents valid
TLS (Transport Layer Security) 1.3 without changing the effective address or
redirecting the request.

This evidence promotes only public hosting, read-only connection, and cloud
transport. Downstream providers remain `NOT_CONNECTED`,
`readyForMutations` remains false, and a valid mutation smoke check returns
HTTP (Hypertext Transfer Protocol) status
`503 LIVE_PROVIDERS_NOT_CONNECTED`. The global `deploymentEvidence` value
therefore remains `SOURCE_ONLY`.

### 2026-08-14 first AWS create attempt

The first create of `mhelixctw-testwired` rolled back before API Gateway
produced a public endpoint. The transformed OpenAPI lacked `servers[0].url`
and did not provide the root CORS value as the object required by API Gateway.
This was a first-create failure, not an update rollback of a previously
known-good application stack.

Post-rollback inspection verified that the application Lambda, API, IAM role,
and application log resources were removed. Deletion verification on
2026-08-15 confirmed that the failed `mhelixctw-testwired` stack is absent and
that no matching application APIs, Lambda functions, or Lambda log groups
remain. The `aws-sam-cli-managed-default` packaging stack remains
`CREATE_COMPLETE` as tool-managed packaging infrastructure; it is not evidence
that the application deployed. The ordered sanitized record is preserved in the
[first-create rollback archive](archive/aws/2026-08-14-first-create-rollback.md).

Corrective source was published to `main` in commit
`069826cd7226c99ef3f4d8f454160db0581d5aed`, and a built-template contract now
checks the transformed server address and CORS (Cross-Origin Resource Sharing)
object. That corrective source was superseded by the successful deployment at
release `578d565049e6d177c4b6fae4bb69fe4a2337173f` on 2026-08-15. The original
rollback record remains historical evidence; the current state is recorded in
the 2026-08-15 checkpoint above.

### 2026-08-14 guided UI and response-evidence hardening

The judge-interface source now includes an explicit guided-demo start, a sticky
checkpoint guide, allowlisted browser narration with honest local or
browser-reported remote voice labels, keyboard-focus parity, reduced-motion
behavior, and a browser-only reset that makes no server-deletion claim.

Request safety now includes stable per-checkpoint idempotency keys, synchronous
double-activation protection, abort and generation guards for connection
refreshes, mutation and receipt mutual exclusion, and separate malformed-JSON
and network errors. Readiness requires health, operational status, the exact
synthetic Morrow scenario catalog entry, and a matching strict release commit.
Every mutation remains bound to that release and the readiness generation that
authorized it.

The browser also validates an ordered, typed evidence chain. A generic receipt
cannot stand in for a closed Session A, a recall bound to canonical memory, a
verified Midnight predicate, an explicit disclosure denial, a commitment-checked
projection rebuild, or post-rebuild continuity. Managed MCP remains an
unavailable eighth checkpoint until its separate read-only contract exists.

Fetched receipts additionally bind their AWS provider request to the exact raw
request ID of the originating mutation. Predicate receipts bind a distinct
Midnight provider receipt. Identifier reuse, mock-provider promotion, release
drift, readiness-revocation races, unknown keys, and unbound provider claims fail
closed. The evidence drawer reads only prevalidated canonical fields.

At that 2026-08-14 checkpoint, local source, type, build, and deterministic
browser-fixture checks provided development evidence only. They did not connect
or promote CockroachDB, Bedrock, Midnight, Managed MCP (Managed Model Context
Protocol), the mock fixture providers, AWS (Amazon Web Services) transport, or
the public UI (User Interface). At that checkpoint, no public endpoint had been
created, and the canonical full mutation journey remained unavailable against
the real provider boundary. Detailed checkpoint evidence and limitations are
recorded in
[WORK_LOG_2026-08-14.md](WORK_LOG_2026-08-14.md).


### Phase 1 fail-closed boundary

The current deployed smoke check confirms the fail-closed boundary. Until the
named live providers are connected, a valid operational `POST` request returns
HTTP (Hypertext Transfer Protocol) status
`503 LIVE_PROVIDERS_NOT_CONNECTED`. It does not mint run identifiers or
receipts, return the fixture predicate as live evidence, or silently substitute
mocks for CockroachDB, Bedrock, Midnight, AWS (Amazon Web Services) Lambda, or
Amazon API (Application Programming Interface) Gateway.

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

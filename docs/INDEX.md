# MidnightHelixCTW repository index

This is the canonical start-here map for judges, developers, security reviewers,
and release reviewers. It points to the documents and source areas that own each
claim. It is not a replacement for the current
[implementation status](IMPLEMENTATION_STATUS.md), which remains the public truth
ledger.

## Fast paths

| Reader | Start here | Continue with |
| --- | --- | --- |
| Hackathon judge | [Project README](../README.md) | [Judge guide](JUDGE_GUIDE.md), [guided UI and narration](UI_AND_BROWSER_NARRATION.md), then the [guided scenario](JUDGE_SCENARIO.md) |
| Technical reviewer | [Implementation status](IMPLEMENTATION_STATUS.md) | [Architecture](ARCHITECTURE.md), [API](../apps/api/README.md), and [AWS infrastructure](../infrastructure/aws/README.md) |
| Developer | [Web application](../apps/web/README.md) and [API application](../apps/api/README.md) | [Protocol contracts](../packages/protocol-types/src/testwired-contracts.ts), [mock pillars](../packages/mock-pillars/README.md), and [fixtures](../fixtures/testtown/README.md) |
| Deployment operator | [Deployment runbook](DEPLOYMENT_RUNBOOK.md) | [Reusable AWS (Amazon Web Services) SAM (Serverless Application Model) and Amplify playbook](AWS_AMPLIFY_SAM_DEPLOYMENT_PLAYBOOK.md), [security policy](../SECURITY.md), then the [publication checklist](PUBLICATION_CHECKLIST.md) |
| Eligibility or media reviewer | [Pre-existing work disclosure](../PREEXISTING_WORK.md) | [Media rights](../MEDIA_RIGHTS.md), [provenance](provenance/README.md), and [media review](media/CLAIM_REVIEW.md) |
| Current-work reviewer | [August 14 work log](WORK_LOG_2026-08-14.md) | [Implementation status](IMPLEMENTATION_STATUS.md), including the [first AWS create attempt](IMPLEMENTATION_STATUS.md#2026-08-14-first-aws-create-attempt), and the [sanitized rollback archive](archive/aws/2026-08-14-first-create-rollback.md) |

## Read the truth labels first

The full definitions and promotion requirements live in
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). The short version is:

| Term | Meaning here |
| --- | --- |
| `TESTWIRED` | The isolated public-test build stage using synthetic data. It describes the environment, not proof that a provider is connected. |
| `SOURCE_ONLY` | Source or infrastructure exists, but successful execution in the named environment has not been evidenced. |
| `VERIFIED_LOCAL` | The stated local check passed. It does not establish a public deployment or live cloud integration. |
| `MOCK` | Deterministic synthetic behavior or fixture evidence for the named provider boundary. |
| `NOT_CONNECTED` | The Phase 1 API is not calling that provider. This connection state is reported separately from whether fixtures or source exist. |
| `LIVE_TESTWIRED` | A named test or cloud service was called successfully and the required current evidence was recorded. |
| `REALDEAL_TEST` | A label for one successful output carrying a sanitized real test-service receipt. It is never the application, build, or deployment stage. |

There is no silent fallback. A `SOURCE_ONLY` or `NOT_CONNECTED` provider cannot
be displayed as live, and a `MOCK` result cannot be relabeled
`REALDEAL_TEST`.

## Implemented now and next

This table is navigation, not a second truth ledger. If it conflicts with
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), use the status document.

| Area | Implemented now | Next evidence-bearing step |
| --- | --- | --- |
| Public source and fixtures | Standalone source, licensing, curated synthetic TestTown fixtures, repository checks, and disclosures are present. | Repeat final source, link, ownership, and secret checks at the release commit. |
| Judge web application | Amplify application `d23ghemtd40rom` serves `main` at the generated origin and verified custom address. Signed-out hosting, read-only connection, and fail-closed checks pass; mutation controls remain disabled because `readyForMutations` is false. | Connect and verify downstream providers separately, then repeat the complete guided flow on desktop and mobile with clean browser console and network checks. |
| API (Application Programming Interface) application | The bounded Lambda handler and eight-route contract are deployed at `https://iyoshkil91.execute-api.us-east-1.amazonaws.com` from release `578d565049e6d177c4b6fae4bb69fe4a2337173f`. Read-only routes and exact-origin CORS (Cross-Origin Resource Sharing) pass; a valid mutation returns `503 LIVE_PROVIDERS_NOT_CONNECTED`. | Connect and verify downstream providers separately while preserving the current fail-closed mutation boundary. |
| AWS (Amazon Web Services) infrastructure | The `mhelixctw-testwired` SAM (Serverless Application Model) stack is `CREATE_COMPLETE` at release `578d565049e6d177c4b6fae4bb69fe4a2337173f`. Amplify generated and custom hosts plus exact-origin CORS (Cross-Origin Resource Sharing) are verified. | Monitor the test stack and add narrow provider IAM (Identity and Access Management) permissions only after each downstream provider is ready for independent verification. |
| Shared protocol contracts | TestWired stages, provider states, Morrow scenario identifiers, actions, responses, receipts, and the zero-protected-field invariant are typed and source-tested. | Use the shared contract at each integration boundary and keep the browser and Lambda payloads aligned. |
| DIDz, AgenticDID, and RWAz | Synthetic fixtures and explicit `MOCK` boundaries exist; Phase 1 reports their callable connections as `NOT_CONNECTED`. | Implement and connect only the narrow deterministic provider interfaces, with denial tests. |
| CockroachDB foundation and connection probe | Migration 001 is applied to live database and schema `mhelix_testwired`; 10 tables, ownership, narrow runtime access, and `mhelix_runs` denial are verified. Exactly one canonical marker row and one migration-001 ledger row passed sanitized post-commit readback. The reviewed read-only bootstrap is deployed at release `cd1d6c74c1d8cd440ce5659b37371fb824343ea4`, and the public bounded environment probe reads back `REALDEAL_TEST` and `CONNECTED` — connection, runtime identity, and marker only; memory, vectors, and mutations stay unproven and the overall application remains `NOT_CONNECTED`. | Build the five-route persistent-memory journey, then activate migration 002 and prove vector recall live without over-promoting. |
| CockroachDB memory, vectors, and Managed MCP (Model Context Protocol) | Live as of 2026-08-17. Migration 002 applied, 24-grant matrix verified both ways, release-bound capability installed, and the public journey persisted 63 summaries and vectors, recalled from a fresh session, denied a protected disclosure with zero fields returned, and served the immutable receipt. A read-only `EXPLAIN` proves the cosine vector index is used. Managed MCP independently audited that evidence but inherits `admin` and is not least-privileged. Embeddings are `MOCK`. | Narrow the Managed MCP identity to one sanitized view, then consider a semantic embedding model. |
| Bedrock, Midnight, and Managed MCP (Model Context Protocol) | Their intended boundaries and promotion evidence are documented. They remain `PLANNED` and `NOT_CONNECTED`. | Connect and verify each provider separately, recording sanitized request, query, proof, or receipt evidence. |
| Filecoin encrypted cold evidence | The [Filecoin integration plan](FILECOIN_INTEGRATION.md) defines the allocation, lifecycle, security boundary, and promotion evidence. The provider remains `PLANNED` and is outside the active judge path. | Implement the bounded off-chain worker, CockroachDB manifest and outbox, Calibration upload and retrieval, and Midnight receipt binding before any live claim. |
| Reconstruction drill | The safe shadow-generation design and judge steps are documented. Whole-database recovery is not claimed. | Implement the disposable projection rebuild, verify commitment lineage, and demonstrate the same authorized answer afterward. |
| Publication | Security, provenance, media-rights, video, Devpost, and publication checklists exist. | Close every applicable checklist item using the final commit and public URLs. |

## Canonical documents

### Product and judge experience

- [README.md](../README.md): project identity, concise story, and repository overview.
- [JUDGE_GUIDE.md](JUDGE_GUIDE.md): ordinary-language walkthrough and evidence
  expectations.
- [JUDGE_SCENARIO.md](JUDGE_SCENARIO.md): exact Morrow farmhouse sequence,
  prompts, denial test, reconstruction drill, and optional adversarial checks.
- [UI_AND_BROWSER_NARRATION.md](UI_AND_BROWSER_NARRATION.md): independent
  interface behavior, allowlisted browser narration, accessibility, request
  safety, and browser verification matrix.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md): current status and the
  evidence required to promote every capability.
- [WORK_LOG_2026-08-14.md](WORK_LOG_2026-08-14.md): dated improvements, failed
  first AWS create, source fix, local verification checkpoints, and limitations.
- [Sanitized CockroachDB marker activation archive](archive/cockroachdb/2026-08-15-marker-activation.md):
  source revision, authenticated atomic apply, boolean-only post-commit
  readback, and strict application-provider boundary.
- [Sanitized first-create rollback archive](archive/aws/2026-08-14-first-create-rollback.md):
  ordered failure, deletion, retained-tooling, and corrective-source evidence
  without account-specific identifiers.

### Deployment, security, and publication

- [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md): generated URLs, account setup,
  deliberate AWS deployment, smoke testing, and rollback.
- [AWS_AMPLIFY_SAM_DEPLOYMENT_PLAYBOOK.md](AWS_AMPLIFY_SAM_DEPLOYMENT_PLAYBOOK.md):
  reusable sequencing, release gates, failure recovery, verification,
  DNS (Domain Name System), and operational lessons for an Amplify frontend with
  AWS (Amazon Web Services) SAM (Serverless Application Model) and an
  API (Application Programming Interface).
- [HACKATHON_REQUIREMENTS.md](HACKATHON_REQUIREMENTS.md): controlling submission
  requirements and the intended eligibility position.
- [ROADMAP.md](../ROADMAP.md): dated target gates and actual-progress notes.
- [SECURITY.md](../SECURITY.md): current safeguards and requirements before live
  providers or public deployment.
- [PUBLICATION_CHECKLIST.md](PUBLICATION_CHECKLIST.md): source, security, media,
  judge-flow, and Devpost release gates.
- [VIDEO_PLAN.md](VIDEO_PLAN.md): conditional recording script and evidence gate.
- [DEVPOST_DRAFT.md](DEVPOST_DRAFT.md): target submission copy that must not be
  published until current evidence replaces every provider claim.

### Ownership, provenance, and media

- [PREEXISTING_WORK.md](../PREEXISTING_WORK.md): prior-work boundary and new
  hackathon work.
- [MEDIA_RIGHTS.md](../MEDIA_RIGHTS.md): asset ownership and publication ledger.
- [Provenance index](provenance/README.md): imported-source manifests and
  attribution records.
- [Neutral API and infrastructure provenance](provenance/neutral-api-iac-patterns.md):
  path-level disclosure for reimplemented generic patterns.
- [Media claim review](media/CLAIM_REVIEW.md) and
  [video source notes](media/VIDEO_SOURCE_NOTES.md): approved claims and source
  handling for public media.
- [Media directory](media/): vision material and reviewed video sources. Media is
  supporting material, not execution evidence.

### Source and test surfaces

- [apps/web](../apps/web/README.md): judge-facing React/Vite application,
  fail-closed controls, local verification, and Amplify configuration.
- [apps/api](../apps/api/README.md): Lambda handler contract, validation rules,
  routes, and local tests.
- [packages/protocol-types](../packages/protocol-types/): shared source-only
  TestWired TypeScript contracts and contract guards.
- [packages/mock-pillars](../packages/mock-pillars/README.md): narrow mock DIDz,
  AgenticDID, and RWAz boundaries.
- [infrastructure/aws](../infrastructure/aws/README.md): AWS Serverless
  Application Model stack and deliberate deployment workflow.
- [fixtures/testtown](../fixtures/testtown/README.md): curated synthetic property,
  identity, authority, and evidence fixtures.

### Deeper design references

- [ARCHITECTURE.md](ARCHITECTURE.md): system boundaries and end-to-end design.
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md): target topology annotated
  with the current live CockroachDB schema foundation, source-only probe, and
  planned and disconnected application-provider states.
- [BUILD_STAGES.md](BUILD_STAGES.md): build stages, machine evidence labels,
  connection states, and display gates.
- [COCKROACH_MEMORY_DESIGN.md](COCKROACH_MEMORY_DESIGN.md): canonical memory,
  vector retrieval, and projection-generation design.
- [MIDNIGHT_TRUST_BOUNDARY.md](MIDNIGHT_TRUST_BOUNDARY.md): what Midnight may
  verify and what must remain off-chain.
- [FILECOIN_INTEGRATION.md](FILECOIN_INTEGRATION.md): controlling plan for the
  encrypted cold-evidence allocation, lifecycle, security boundary, and
  promotion evidence.
- [PENNY_FILECOIN_BRAID_NOTES_2026-08-15.md](PENNY_FILECOIN_BRAID_NOTES_2026-08-15.md):
  advisory Filecoin ideation for the DIDzM (DIDzMonolith) braided mesh. It is not an
  implementation-status source.
- [TESTWIRED_FIXTURE_POLICY.md](TESTWIRED_FIXTURE_POLICY.md): rules for synthetic
  test data.

## Fixed API surface

The Phase 1 browser and Lambda share exactly these routes:

```text
GET  /healthz
GET  /api/v1/status
GET  /api/v1/judge/scenarios
POST /api/v1/judge/runs
POST /api/v1/judge/runs/{runId}/sessions/close
POST /api/v1/judge/runs/{runId}/recall
POST /api/v1/judge/runs/{runId}/actions
GET  /api/v1/judge/receipts/{receiptId}
```

The three read-only discovery routes report the build stage, current deployment
evidence, provider target modes, and connection states. Until reviewed live
providers are connected, operational requests return
`503 LIVE_PROVIDERS_NOT_CONNECTED`; they do not invent run IDs, receipts,
predicate results, or protected data.

Request bounds, allowed origins, idempotency, and deployment behavior are owned
by the [API README](../apps/api/README.md) and
[deployment runbook](DEPLOYMENT_RUNBOOK.md).

## Local repository verification

From the repository root:

```bash
npm ci
npm test
```

Passing local tests does not promote a capability to `LIVE_TESTWIRED`.
Deployment and provider evidence must still satisfy the promotion checklist in
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Maintenance rule

Update the owning document first when a claim, status, route, security boundary,
or publication decision changes. Update this index only when its navigation or
short summary becomes stale. Never use this page to promote a capability without
the evidence required by the truth ledger.

# Publication checklist

Every checkbox below is a final release-commit gate. Preliminary local evidence
does not complete a final checkbox. Repeat the applicable check after the release
commit and public URLs (Uniform Resource Locators) exist.

## Pre-release evidence snapshot, 2026-08-15

| Evidence | Preliminary state | Release implication |
| --- | --- | --- |
| Root license, provenance, pinned synthetic fixture, and repository documentation | Recorded at the previously checked source revision | Repeat against the release commit and public clone. |
| Guided UI, narration allowlist, keyboard and reduced-motion source, request guards, and typed evidence validation | Local source and tests exist | Repeat built-preview desktop, mobile, accessibility, console, and network checks at the release commit. |
| AWS (Amazon Web Services) SAM (Serverless Application Model) source and built-template OpenAPI (Open Application Programming Interface) contract | Deployed transport is `CREATE_COMPLETE`; read-only public routes are live and mutation requests fail closed | Repeat release-commit browser, log, and public-link checks. |
| Public UI (User Interface), generated AWS (Amazon Web Services) API (Application Programming Interface), CloudWatch runtime evidence | Generated and custom frontend addresses are live; exact-origin CORS (Cross-Origin Resource Sharing) and fail-closed mutation behavior were verified | Final judge-flow and release-commit evidence gates remain open. |
| CockroachDB foundation | Database and schema `mhelix_testwired` exist; migration `001_testwired_memory_core.sql` created 10 empty tables owned by `mhelix_migrator`; least-privilege runtime denial was verified | Marker and migration-ledger rows plus the deployed runtime bootstrap remain open, so the application provider stays `NOT_CONNECTED`. |
| Bedrock, Midnight, reconstruction, Managed MCP (Model Context Protocol) | Not connected | Their live, video, and sponsor-tool gates remain open. |

See [WORK_LOG_2026-08-14.md](WORK_LOG_2026-08-14.md) for the dated evidence and
known limitations.

## CockroachDB provider activation gates

- [x] Migration `001_testwired_memory_core.sql` created the
  `mhelix_testwired` schema and 10 empty tables owned by `mhelix_migrator`.
- [x] `mhelix_migrator` and `mhelix_runtime` do not inherit `admin`.
- [x] `mhelix_runtime` has database `CONNECT`, schema `USAGE`, and `SELECT`
  only on `mhelix_environment_markers`; `SELECT` on `mhelix_runs` is denied.
- [x] The canonical environment-marker contract is committed at `48e85b4` with
  digest
  `ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198`.
- [ ] Insert exactly one reviewed migration-ledger row and one matching
  environment-marker row from the committed canonical contract.
- [ ] Independently read back the migration ledger and marker digest without
  exposing credentials or connection material.
- [ ] Configure the expected marker digest, bounded query executor, server-side
  timeout, and secret reference in the reviewed AWS (Amazon Web Services)
  Lambda bootstrap.
- [ ] Verify the deployed read-only status path reports the expected database,
  runtime identity, and environment marker before promoting CockroachDB from
  `NOT_CONNECTED`.
- [ ] Repeat the negative `mhelix_runs` permission test and public secret scan
  after the release commit.
- [ ] Keep mutations disabled until persistent memory, vector retrieval,
  authority verification, and receipt persistence are independently verified.

## Source and ownership

- [ ] Apache-2.0 appears at repository root and GitHub detects it.
- [ ] Entrant name agrees with the actual owner of the submitted intellectual
  property.
- [ ] `PREEXISTING_WORK.md` lists every imported baseline and source commit.
- [ ] `docs/provenance/imported-sources.json` matches the imported files.
- [ ] Imported-file SHA-256 manifest is generated after the final copy.
- [ ] All required source, dependencies, example configuration, fixtures, and
  setup instructions are present.
- [ ] Ai coding assistance is disclosed.

## Security and privacy

- [ ] Full history and working tree pass secret scanning.
- [ ] No live AWS account IDs, credentials, wallet seeds, connection strings, or
  private endpoints appear in the public tree; example configuration contains
  placeholders only.
- [ ] All test data is synthetic.
- [ ] Browser bundle contains no database, Managed MCP, wallet, or secret values.
- [ ] Browser narration speaks only reviewed allowlisted copy, requests no
  microphone, and never reads API payloads, receipts, identifiers, or protected
  data.
- [ ] Live roles are least privilege and environment-marker verification passes.
- [ ] API inputs, outputs, provider calls, and retries are bounded.
- [ ] Logs are redacted and have limited retention.
- [ ] No silent fallback to a mock provider exists.

## Media

- [ ] Every included asset appears in `MEDIA_RIGHTS.md`.
- [ ] Vision slides are labeled as source material, not implementation evidence.
- [ ] Unsupported absolute claims have been removed from final public media.
- [ ] No third-party PDF is copied into the repository.
- [ ] No music is used without documented rights.
- [ ] The final demo video is public, captioned, under three minutes, and shows the
  application functioning.

## Judge flow

- [ ] Public UI and generated AWS API URL work in an incognito browser.
- [ ] The 1440 by 900 desktop and 390 by 844 mobile layouts pass the signed-out
  guided flow with no unexpected console or network errors.
- [ ] Guided-demo start, voice fallback or unavailable state, replay, stop,
  keyboard-focus parity, evidence drawer, and reduced-motion behavior are
  verified in the release browser.
- [ ] Reset is visibly limited to the browser view and makes no server-deletion
  claim.
- [ ] Session B recalls Session A from CockroachDB after browser refresh.
- [ ] Real Titan vector retrieval is visible.
- [ ] Exact scope and private predicate are separately shown.
- [ ] Real Midnight test-network receipt is visible, or the feature is removed
  from the live path and truthfully relabeled.
- [ ] Unauthorized document disclosure is denied with zero protected fields.
- [ ] Rebuild creates a shadow generation and returns the same committed result.
- [ ] Read-only Managed MCP verification is visible.
- [ ] Provider, region, commit, latency, and receipt evidence is inspectable.

## Devpost

- [ ] Submission title and repository identity are consistent.
- [ ] Two CockroachDB tools are named and their meaningful use is explained.
- [ ] AWS service use is named and visible in the video.
- [ ] Prior-work disclosure appears in Devpost, not only in the repository.
- [ ] Live demo remains free and functional through the judging period.
- [ ] All public links are tested signed out.
- [ ] Submission is made before Tuesday, August 18, 2026 at 5:00 PM EDT.

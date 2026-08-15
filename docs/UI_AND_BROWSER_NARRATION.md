# Guided UI and browser narration

The judge interface is an independently implemented MidnightHelixCTW design.
It uses only repository-owned React, TypeScript, and CSS. It does not depend on
third-party UI code, copied assets, downloaded fonts, a microphone, or an
application-managed text-to-speech provider. Browser or operating-system speech
may use a local or remote service.

This document describes source behavior. It does not claim that the UI, API, or
any external provider is publicly deployed.

## Exact local URLs

Keep the development terminal open after running `npm run web:dev`, then visit:

- development: <http://localhost:5178>
- built preview after `npm run build`: <http://localhost:4178>

The public URL must not be added here until it has been tested signed out at the
release commit.

## Guided judge experience

The page begins with an explicit **Start guided demo** control. Starting the
guide does not unlock provider operations. It activates the visible guide panel,
requests browser narration when supported, and moves the viewport to the first
checkpoint. The eight proof checkpoints remain locked unless `GET /healthz`
reports `ok: true`, operational status reports both `ok: true` and
`readyForMutations: true`, and the scenario catalog contains the exact Morrow
case with `synthetic: true`.

The layout includes:

- a sticky guide control panel;
- a sticky checkpoint rail on desktop and a compact horizontal panel on mobile;
- one active proof card with the suggested prompt and truthful disabled reason;
- an allowlisted evidence drawer;
- separate evidence and connection labels for every provider;
- a browser-only reset that clears the local walkthrough view.

**Reset this browser view** does not call a delete route and does not claim to
remove a server run, durable memory, receipt, or canonical record. The interface
states that boundary after every reset.

## Narration privacy and controls

Narration uses the browser Web Speech synthesis interface after the judge's
explicit start gesture. It has these boundaries:

- no microphone is requested, recorded, or uploaded by the application;
- there is no application-managed text-to-speech provider;
- the application passes only fixed, reviewed strings from
  `apps/web/src/guidance.ts` to the browser or operating system's speech
  service, which may be local or remote;
- API payloads, receipts, identifiers, protected records, and arbitrary DOM text
  are never selected as narration text;
- pointer hover and keyboard focus use the same 650 millisecond dwell;
- moving to a different narrated region cancels pending or superseded speech;
- repeated narration is suppressed, with an explicit **Replay** control;
- touch users use the visible voice, replay, and stop controls instead of a
  hover-only interaction.

The selector prefers local British English, then local English, then a
browser-reported remote British English voice, followed by remote English and
system fallbacks. The UI explicitly labels the choice as local or
browser-reported remote. It never promises a particular voice identity or
gender. If Web Speech synthesis is unavailable, the guided text interface still
works and reports narration as unavailable.

Installed browser voices are a user-agent and operating-system capability. The
application cannot guarantee identical pronunciation across judge devices.

## Accessibility behavior

- All narrator functions are real buttons with visible focus states.
- Pointer narration has keyboard-focus parity on case fields, provider cards,
  evidence rows, controls, and narrated regions.
- Status changes use polite live regions; failed operations use alerts.
- The evidence drawer is a native modal dialog with a named close control.
- The desktop proof rail becomes a readable, horizontally scrollable mobile
  panel.
- Motion is reduced to near-zero when `prefers-reduced-motion: reduce` is set.
- Narration supplements visible text and never replaces it.

## Request-safety improvements

The browser keeps one idempotency key for each logical mutation checkpoint. A
retry of that checkpoint reuses its key. A synchronous in-flight guard prevents
two rapid activations from issuing duplicate requests before React re-renders.
Mutation requests and receipt retrieval are mutually exclusive, so a slower
receipt cannot overwrite newer mutation evidence.

Connection refreshes use both an `AbortController` and a monotonically increasing
request generation. A late result from an older refresh cannot overwrite a newer
status, and a new refresh clears stale provider data and stale errors. Malformed
JSON is reported separately from a network failure. Connection refresh is
disabled while a mutation or receipt is active. Before accepting a late result,
the browser rechecks the captured generation, current readiness, and release. A
refresh that changes release or revokes readiness resets the guided run rather
than allowing a chain to span deployments.

Every accepted mutation must report the canonical schema version, `ok: true`, a
bounded body request ID, and a separately observed raw `X-Request-Id` header
with the exact same value. A missing exposed header cannot be replaced by the
JSON body. Accepted mutations also require exact reviewed object keys,
`buildStage: TESTWIRED`, `deploymentEvidence: LIVE_TESTWIRED`,
`protectedFieldsReturned: 0`, and one exact 40-character lowercase release
commit matching current live status. The first mutation captures that release;
every later mutation must preserve it. Those shared fields are necessary but
never sufficient. The browser then enforces this ordered evidence chain:

| Checkpoint | Response evidence required before advancement |
| --- | --- |
| Open Session A | Exact Morrow scenario, bounded run ID, and a nested `SessionDescriptor` with ordinal `A` and state `OPEN`. A legacy top-level `sessionId` is rejected. |
| Close Session A | Same run and Session A, state `CLOSED`, a valid closure timestamp, and at least one unique `canonicalMemoryIds` entry. |
| Recall in Session B | A distinct open Session B plus at least one `matches` entry whose memory ID was committed at close, whose source is Session A, and whose object and predicate are the exact Morrow values. |
| Initial permitted predicate | `action: verify_unencumbered`, `result.kind: VERIFIED_PREDICATE`, the expected true predicate, no source-text disclosure, a non-empty Midnight receipt, and a canonical memory ID, evidence commitment, and projection generation matching the recall history. |
| Protected-disclosure denial | `action: attempt_protected_disclosure`, `result.kind: DISCLOSURE_DENIED`, a bounded reason, at least one requested protected field, zero returned protected fields, and an operation receipt. |
| Projection rebuild | `action: rebuild_recall_projection`, `result.kind: PROJECTION_REBUILT`, the initial generation as `previousGenerationId`, a different active generation, a positive canonical source count, `commitmentVerified: true`, zero returned protected fields, and an operation receipt. |
| Post-rebuild continuity | A second verified predicate with the same canonical memory ID, evidence commitment, predicate, and value; its projection generation must equal the rebuilt active generation, and it must carry new accepted action and Midnight receipts. |
| Independent inspection | No browser mutation exists yet. This checkpoint remains an unavailable Managed MCP evidence boundary until its own reviewed, read-only response contract is implemented. |

The evidence history lives only in the current browser walkthrough. Resetting or
reloading requires a new ordered proof chain. A generic `ok: true` response or a
receipt ID alone cannot advance denial, rebuild, or continuity.

This intentionally tightens the future live-provider compatibility contract.
`CreateRunResponse` uses `session.sessionId`, not a top-level `sessionId`, and
`VerifiedPredicateResult` requires `canonicalMemoryId`,
`evidenceCommitment`, `projectionGenerationId`, and `midnightReceiptId`. Older
fixtures must be updated before they can unlock the UI.

Receipt retrieval remains supplemental and never advances a checkpoint. Before a
receipt can replace the drawer contents, its exact schema must bind to the
accepted checkpoint receipt, run, scenario, canonical operation, optional action,
the run release, and current live status release commit. Every checkpoint receipt
expectation binds the AWS provider request ID to the raw header/body request ID of
the originating mutation. Predicate checkpoints also bind the exact Midnight
provider receipt ID. It must report `TESTWIRED`, `LIVE_TESTWIRED`, zero protected
fields, a UTC timestamp, unique known providers, and `REALDEAL_TEST` on each
bound live provider reference. `REALDEAL`, unknown keys, duplicate providers,
cross-provider identifiers, circular reuse of the outer operation or receipt-fetch
request IDs, and reuse from earlier checkpoint history fail closed.

At least one listed provider must carry a bounded `LIVE_TESTWIRED` plus
`REALDEAL_TEST` reference. DIDz, AgenticDID, and RWAz are mock-only and must be
reported as `MOCK` when present. Acceptance validates only listed references and
the provider-specific IDs established by the checkpoint. It does not prove an
unlisted CockroachDB, Bedrock, Midnight, or Managed MCP operation.

The drawer receives precomputed typed fields only after mutation or receipt
validation. It does not recursively scan API JSON. Canonical memory IDs, semantic
distance, evidence commitments, and projection generations are displayed only
from reviewed operation-specific paths. A mutation snapshot keeps its provider
Midnight receipt ID internal; that ID appears only after an exact provider-bound
receipt fetch. Fields not in the accepted response remain `NOT AVAILABLE`.

## Verification matrix

Before publishing, verify the built preview at both target viewports:

| Profile | Viewport | Required checks |
| --- | --- | --- |
| Desktop Chromium | 1440 by 900 | disconnected truth, sticky rail, start gesture, keyboard focus, evidence drawer, console and network |
| Mobile Chromium | 390 by 844 | compact guide panel, touch-safe controls, readable prompt, drawer, no horizontal page overflow |
| Reduced motion | either profile | no smooth scrolling or meaningful animation |
| Narration unavailable | either profile | visible unavailable label and fully usable text guide |

A screenshot is supporting visual evidence only. Passing source tests or browser
checks does not promote CockroachDB, Bedrock, Midnight, Managed MCP, or the public
deployment to a live evidence label.

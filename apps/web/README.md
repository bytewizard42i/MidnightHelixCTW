# Judge Web Application

The public interface guides the judge through Session A, fresh Session B,
the one-bit property question, the denied private-record request, the safe
reconstruction drill, and read-only evidence verification.

It must display exact evidence labels and never animate a simulated result as
if it came from a live provider.

## Phase 1 behavior

This interface is intentionally useful before the live cloud providers are
connected:

- `GET /healthz`, `/api/v1/status`, and `/api/v1/judge/scenarios` are real
  connection checks.
- The UI displays `NOT CONNECTED` until health reports `ok: true`, status
  reports both `ok: true` and `readyForMutations: true`, and the exact Morrow
  scenario is catalogued with `synthetic: true`.
- All state-changing judge controls remain disabled while providers are
  unavailable.
- The evidence drawer displays only precomputed fields from an accepted
  canonical response. It displays `NOT AVAILABLE` instead of fixture-shaped,
  recursively discovered, or expected values.
- DIDz, AgenticDID, and RWAz remain visibly labeled `MOCK`.
- The explicit guided-demo start gesture enables a visible guide panel and
  browser narration when available. Narration never unlocks an operation.

The Morrow farmhouse, Edgar Morrow, TestTown provider records, and every
property artifact are fictional synthetic data with no legal effect.

## Local development

From the repository root:

```bash
npm ci
cp apps/web/.env.example apps/web/.env.local
npm run web:dev
```

Open <http://localhost:5178>. Keep that terminal open while using the site.

Set only the public API Gateway base URL in `.env.local`:

```dotenv
VITE_API_BASE_URL=https://example.execute-api.us-east-1.amazonaws.com
```

Never put a token, database URL, AWS credential, or other secret in a
`VITE_` variable. Vite embeds those values in the public browser bundle.

## Verification

```bash
npm run typecheck --workspace @midnight-helixctw/judge-web
npm run test --workspace @midnight-helixctw/judge-web
npm run build --workspace @midnight-helixctw/judge-web
npm run web:preview
```

The preview URL is <http://localhost:4178>.

## Guided narration and accessibility

The narrator uses browser Web Speech synthesis only after **Start guided demo**
is activated. It prefers local British English, then local English, then
browser-reported remote British and English voices. The selected voice is
labelled as local or browser-reported remote. Voice identity and gender are
never promised.

Only curated strings from `src/guidance.ts` can be spoken. API responses,
receipts, identifiers, and protected data are excluded. Hover and keyboard
focus share a 650 millisecond dwell on case fields, provider cards, and evidence
rows, while touch users receive explicit voice, replay, and stop controls. No
microphone or application-managed speech provider is used. The browser or
operating system may use a local or remote speech service. See
[`docs/UI_AND_BROWSER_NARRATION.md`](../../docs/UI_AND_BROWSER_NARRATION.md).

## Public API contract

The dependency-light fetch client covers exactly eight routes:

1. `GET /healthz`
2. `GET /api/v1/status`
3. `GET /api/v1/judge/scenarios`
4. `POST /api/v1/judge/runs`
5. `POST /api/v1/judge/runs/{runId}/sessions/close`
6. `POST /api/v1/judge/runs/{runId}/recall`
7. `POST /api/v1/judge/runs/{runId}/actions`
8. `GET /api/v1/judge/receipts/{receiptId}`

Every logical mutation checkpoint receives a cryptographically random
`Idempotency-Key`. A retry of the same checkpoint reuses that key. Receipt
retrieval, mutations, and connection refreshes cannot overlap. Every accepted
mutation must match current ready status and the release captured by the first
checkpoint. A changed readiness generation, revoked readiness, or different
release rejects the late result; a completed refresh that changes or revokes
readiness resets the guided run. Non-2xx responses, malformed canonical responses,
privacy counts other than zero, or operation-specific evidence that does not match
the accumulated run history become visible fail-closed errors and cannot advance
the flow. In particular, a generic receipt cannot stand in for an explicit denial,
verified rebuild, or continuity comparison. The exact
per-checkpoint fields and compatibility boundary are documented in
[`docs/UI_AND_BROWSER_NARRATION.md`](../../docs/UI_AND_BROWSER_NARRATION.md#request-safety-improvements).

A fetched receipt is supplemental evidence. Before displaying it, the browser
requires the raw `X-Request-Id` header, exact canonical keys, the current live
release commit, the accepted checkpoint receipt, run, scenario, operation and
action, `TESTWIRED`, `LIVE_TESTWIRED`, zero protected fields, a UTC timestamp,
the original mutation's exact AWS provider request ID, and any exact provider
receipt ID established by the checkpoint. Provider identifiers must be unique and
cannot alias the outer operation receipt or receipt-fetch request. DIDz,
AgenticDID, and RWAz remain mock-only. Receipt acceptance validates only listed
and provider-bound evidence, not unlisted CockroachDB or Bedrock participation.
Mutation snapshots hide provider Midnight receipt IDs until that fetched binding
succeeds. Unsupported fields remain `NOT AVAILABLE`; the drawer never searches
arbitrary nested JSON for a familiar key.

## Amplify

The root `amplify.yml` builds this workspace. In Amplify, configure
`AMPLIFY_MONOREPO_APP_ROOT=apps/web` and set `VITE_API_BASE_URL` to the
deployed API Gateway URL. The API CORS configuration must contain the exact
Amplify browser origin.

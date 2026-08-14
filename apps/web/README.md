# Judge Web Application

The public interface will guide the judge through Session A, fresh Session B,
the one-bit property question, the denied private-record request, the safe
reconstruction drill, and read-only evidence verification.

It must display exact evidence labels and never animate a simulated result as
if it came from a live provider.

## Phase 1 behavior

This interface is intentionally useful before the live cloud providers are
connected:

- `GET /healthz`, `/api/v1/status`, and `/api/v1/judge/scenarios` are real
  connection checks.
- The UI displays `NOT CONNECTED` until the API explicitly returns
  `readyForMutations: true`.
- All state-changing judge controls remain disabled while providers are
  unavailable.
- The evidence drawer displays `NOT AVAILABLE` instead of fixture-shaped
  identifiers or expected results.
- DIDz, AgenticDID, and RWAz remain visibly labeled `MOCK`.

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

Every mutation sends a cryptographically random `Idempotency-Key`. Non-2xx
responses become visible fail-closed errors and cannot advance the guided flow.

## Amplify

The root `amplify.yml` builds this workspace. In Amplify, configure
`AMPLIFY_MONOREPO_APP_ROOT=apps/web` and set `VITE_API_BASE_URL` to the
deployed API Gateway URL. The API CORS configuration must contain the exact
Amplify browser origin.

# API application

This package is the dependency-free AWS Lambda transport shell for the fixed
Morrow farmhouse TestWired workflow:

```text
AWS API Gateway -> bounded Lambda handler -> future reviewed provider adapters
```

Phase 1 deliberately calls no database, model, wallet, or external network. The
read-only health, status, and scenario routes describe the available surface.
Valid operational requests return `503 LIVE_PROVIDERS_NOT_CONNECTED`, and no
run, receipt, or predicate result is invented.

## Routes

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

Every POST requires `Content-Type: application/json` and an
`Idempotency-Key` containing 16 to 128 safe characters. The only action values
are:

```text
verify_unencumbered
attempt_protected_disclosure
rebuild_recall_projection
```

`MHELIX_PUBLIC_ALLOWED_ORIGINS` contains one to four exact, comma-delimited HTTPS
origins. The Lambda echoes an origin only when it exactly matches the list.
Wildcard browser origins are unsupported.

## Local tests

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW/apps/api
npm test
```

No package installation is required. Use Node.js 20 or newer locally. The AWS
stack selects the Node.js 24 Lambda runtime.

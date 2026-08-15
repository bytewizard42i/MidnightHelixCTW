# API application

This package is the dependency-free AWS Lambda transport shell for the fixed
Morrow farmhouse TestWired workflow:

```text
AWS API Gateway -> bounded Lambda handler -> future reviewed provider adapters
```

The exported Phase 1 handler deliberately calls no database, model, wallet, or
external network. The read-only health, status, and scenario routes describe
the available surface.
Valid operational requests return `503 LIVE_PROVIDERS_NOT_CONNECTED`, and no
run, receipt, or predicate result is invented.

When a response is actually emitted by the validated AWS Lambda runtime, only
its AWS transport provider is `REALDEAL_TEST` and `CONNECTED`. The response keeps
global deployment evidence `SOURCE_ONLY`, all downstream providers
`NOT_CONNECTED`, and guided mutations unavailable.

## CockroachDB source-only connection probe

`createHandler({ cockroachProvider })` accepts an injected, read-only provider
for the health, status, and scenario routes. `createCockroachDbProvider(...)`
depends on an injected query executor rather than a bundled database driver.
The exported `handler` injects no database provider and remains
database-disconnected until a separately reviewed bootstrap supplies one. This
dependency seam is `SOURCE_ONLY` in current repository evidence.

The bootstrap must supply an exact 64-character lowercase hexadecimal marker
commitment. The provider sends it as a query parameter and asks the fully
qualified mhelix_testwired marker table for only a comparison boolean. It never
returns the configured or stored commitment. Explicit schema qualification
prevents a modified database search path from redirecting the probe to another
table.

The query executor must enforce a server-side statement timeout shorter than
the provider's outer response timeout. Rapid callers share one underlying
in-flight query, and the slot remains occupied after an outer timeout until
that query settles.

Even after injection, a successful probe provides evidence only for the named
CockroachDB connection, expected runtime identity, and TestWired environment
marker with the expected commitment. It does not prove or enable an applied
migration, persistent memory, vector indexing or retrieval, Managed MCP (Model
Context Protocol), or mutation readiness.

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

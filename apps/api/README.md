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

### Verified database foundation, 2026-08-15

The live TestWired CockroachDB database is `mhelix_testwired`. Migration
`database/migrations/001_testwired_memory_core.sql` has been applied, creating
the `mhelix_testwired` schema and 10 empty tables owned by
`mhelix_migrator`. The `mhelix_migrator` and `mhelix_runtime` users do not
inherit `admin`. The runtime user has database `CONNECT`, schema `USAGE`, and
`SELECT` only on `mhelix_environment_markers`; a `SELECT` from `mhelix_runs`
is denied as intended.

This is live database-foundation evidence, not application-provider evidence.
The canonical environment-marker contract is committed at `48e85b4` in
`apps/api/src/environment-marker.js`, with expected digest
`ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198`.
The migration-ledger row and environment-marker row have not been inserted,
and the deployed AWS (Amazon Web Services) Lambda transport has no database
bootstrap. The exported handler therefore remains fail closed with the
CockroachDB provider `NOT_CONNECTED`.

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
marker with the expected commitment. It does not independently prove migration
application, and it does not enable persistent memory, vector indexing or
retrieval, Managed MCP (Model Context Protocol), or mutation readiness.

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

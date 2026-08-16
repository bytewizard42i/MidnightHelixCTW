# API application

This package is the AWS Lambda transport shell for the fixed Morrow farmhouse
TestWired workflow:

```text
AWS API Gateway -> bounded Lambda handler -> read-only CockroachDB environment probe
```

The default handler in `src/handler.js` remains dependency-injected and
database-disconnected for local use. The deployment-only `src/lambda.js`
entrypoint supplies a bounded read-only CockroachDB provider. It does not enable
memory, vector, model, wallet, or test-network operations. The read-only health,
status, and scenario routes describe the available surface.
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
the `mhelix_testwired` schema and 10 tables owned by
`mhelix_migrator`. The `mhelix_migrator` and `mhelix_runtime` users do not
inherit `admin`. The runtime user has database `CONNECT`, schema `USAGE`, and
`SELECT` only on `mhelix_environment_markers`; a `SELECT` from `mhelix_runs`
is denied as intended.

This is live database-foundation evidence, not application-provider evidence.
The canonical environment-marker contract is committed at `48e85b4` in
`apps/api/src/environment-marker.js`, with expected digest
`ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198`.
Source commit `7a29f22` contains the reviewed atomic activation. An authenticated
`mhelix_migrator` session applied it, and sanitized post-commit readback showed
exactly one canonical environment-marker row with all 8 comparisons true
across the entire marker table, plus exactly one migration-001 ledger row with
all 6 comparisons true.

The deployment-only bootstrap is now deployed: release
`cd1d6c74c1d8cd440ce5659b37371fb824343ea4` runs `src/lambda.handler`, and the
public `/api/v1/status` route reads the bounded read-only environment-marker
probe back as `REALDEAL_TEST` and `CONNECTED`. That evidence covers the
connection, runtime identity, and reviewed TestWired marker only. Persistent
memory, vector retrieval, and mutations remain unavailable, and the overall
application remains `NOT_CONNECTED` with `readyForMutations` false.

`createHandler({ cockroachProvider })` accepts an injected, read-only provider
for the health, status, and scenario routes. `src/lambda.js` supplies that
provider only for deployment. It reads the identifier in
`MHELIX_COCKROACH_RUNTIME_SECRET_ARN`, asks AWS (Amazon Web Services) Secrets
Manager for that one existing secret, validates the complete object, and creates
a pool limited to one connection. The default exported handler in
`src/handler.js` remains database-disconnected.

The secret must contain exactly these fields: `schemaVersion`, `host`,
`port`, `database`, `username`, `password`, and
`caCertificatePem`. The schema version is
`mhelixctw/cockroach-secret/v1`. The bootstrap independently pins the expected
database, runtime user, port, certificate shape, and allowed CockroachDB host;
the secret cannot attest to its own expected identity. Secret values, the
secret identifier, connection material, database identity, runtime identity,
certificate, marker commitment, and driver errors are never returned publicly.

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

Install the locked workspace dependencies from the repository root before
testing:

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW
npm ci
npm --workspace @mhelix/api test
```

Use Node.js 20 or newer locally. The AWS stack selects the Node.js 24 Lambda
runtime. A deployment is blocked unless the SAM (Serverless Application Model)
artifact contains `src/lambda.js`, `pg`, and the AWS (Amazon Web Services)
Secrets Manager client. npm includes this sanitized top-level `README.md` as
package metadata. The artifact gate still excludes application test and
documentation directories, every other top-level Markdown file, and
application-owned environment files, source maps, and logs. Locked dependencies
may retain their own package metadata and source maps.

The SAM (Serverless Application Model) custom Makefile build stages the root
`package.json`, root `package-lock.json`, and workspace manifests in a temporary
directory, then runs `npm ci --omit=dev --ignore-scripts` for only
`@mhelix/api`. It copies the unchanged root lockfile into the artifact. The
post-build contract rejects internal workspace and unrelated web packages, and
requires every installed package version to match its exact root-lock entry.

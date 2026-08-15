# CockroachDB Migrations

The first additive source migration is:

1. `001_testwired_memory_core.sql`, environment proof, synthetic case
   namespaces, independent judge runs, run-scoped sessions, typed public-safe
   events, event-anchored summaries, projection generations, an active pointer,
   and run-bound idempotent action receipts with an exact operation allowlist.

Every object belongs to the dedicated mhelix_testwired schema. Table creation,
index targets, foreign-key targets, and the runtime marker query are explicitly
qualified, so correctness does not depend on the connection's database search
path.

It deliberately contains no destructive DDL (Data Definition Language), user or
privilege creation, seed data, vector column, or live connection step.
Distributed vector persistence and indexing remain a separately reviewed
additive migration after the embedding model and current CockroachDB index
syntax are verified.

The standalone migration ledger is designed to cover:

- TestWired environment marker
- Synthetic case namespaces and independent judge runs
- Run-scoped agent-memory sessions, typed events, and summaries
- Public-safe memory embeddings and distributed vector index
- Exact current synthetic policy and asset state
- Canonical evidence manifests
- Recall-projection generations and active pointer
- Rebuild receipts
- Query and denial receipts
- Idempotency and bounded provider-usage records

Migrations must be additive, checksummed, and run by a separate migrator role.
The public Lambda role must not own or alter schema objects. After migration, the
migrator installs exactly one environment marker row containing the
expected `TESTWIRED` stage, marker version, a 32-byte marker commitment, and a
generated evidence receipt identifier. The runtime probe separately compares
`current_database()` and `current_user` with parameterized server-side expected
values and returns only booleans for those comparisons. Database and role names
never enter the public API (Application Programming Interface) response. The
query-executor boundary also requires a server-side statement timeout shorter
than the outer response timeout, and concurrent callers share at most one
underlying probe.

The same query compares the expected 64-character lowercase hexadecimal marker
commitment inside CockroachDB and returns only a boolean. Neither the configured
commitment nor the stored commitment enters the public API (Application
Programming Interface) response or provider error.

A successful environment probe proves only that the reviewed connection,
database, runtime role, and exact TestWired marker commitment responded. It
neither enables nor proves memory persistence or vector retrieval. Summary rows
must reference an event sequence from the same session, and action receipts
accept only the six reviewed public workflow operations.

Activation must verify the dedicated schema owner and the exact definitions of
all pre-existing tables, indexes, constraints, and foreign keys. The IF NOT
EXISTS clauses are only additive and do not prove that an existing object has
the reviewed definition. The runtime role must have no schema-creation privilege
and must not own the schema or its objects. Those owner, definition, and
privilege checks are required activation evidence and are not implemented by
this source migration.

This repository does not yet include a driver bootstrap or migration command.
The migration is source-only until a reviewed migrator applies it, records its
checksum, installs the marker, and a real CockroachDB query produces sanitized
evidence. The Lambda runtime will eventually receive only a named AWS (Amazon Web
Services) Secrets Manager reference and narrow data permissions, never schema
ownership or plaintext connection material in the browser or repository.

## Canonical TestWired environment marker

`apps/api/src/environment-marker.js` is the single handwritten
machine-readable authority for the TestWired environment marker. The database
ledger row, database marker row, and deployment configuration are projections
of that source contract. They are never alternate sources of truth.

The canonical preimage is exactly these eight UTF-8 (Unicode Transformation
Format 8-bit) lines:

```text
mhelixctw/environment-marker/v1
marker_id=mhelixctw-testwired-environment
build_stage=TESTWIRED
marker_version=1
migration_id=001_testwired_memory_core
source_file_name=database/migrations/001_testwired_memory_core.sql
migration_sha256=e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b
statement_count=16
```

The fields use this order, LF (line feed) separators, no trailing LF (line
feed), no CR (carriage return), no BOM (byte order mark), and no additional
spaces or tabs. `source_file_name` is a forward-slash repository-relative path
with no leading slash or `./`. `statement_count` is the reviewed number of
top-level executable SQL (Structured Query Language) statements in the exact
migration source, excluding comments and blank lines, with each statement
terminated by one semicolon. Migration 001 contains 1 schema statement, 10
table statements, and 5 index statements, for a total of 16.

The canonical SHA-256 (Secure Hash Algorithm 256-bit) commitment is:

```text
ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198
```

The commitment is public deterministic configuration-drift evidence. It is not
a secret, authentication mechanism, signature, proof of writer identity, proof
that the migration executed, or proof of persistence, vector retrieval,
Midnight, Bedrock, or MCP (Model Context Protocol) behavior. Separate transport,
credential, ownership, grant, migration-output, and runtime-denial evidence is
required.

Before activation or rotation, run:

```bash
node --test apps/api/test/environment-marker.test.mjs apps/api/test/cockroachdb-provider.test.mjs
npm test --workspace @mhelix/api
npm run verify
```

Do not use `UPSERT` or `ON CONFLICT` to conceal a pre-existing ledger or marker
row. A conflict is a fail-closed review event. Do not insert either row until
the source contract and deterministic tests are committed at the release being
activated.

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

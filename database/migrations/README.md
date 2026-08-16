# CockroachDB Migrations

The additive source migrations are:

1. `001_testwired_memory_core.sql`, environment proof, synthetic case
   namespaces, independent judge runs, run-scoped sessions, typed public-safe
   events, event-anchored summaries, projection generations, an active pointer,
   and run-bound idempotent action receipts with an exact operation allowlist.
2. `002_testwired_vector_memory.sql`, the vector-memory recall slice: a
   release-bound runtime capability marker, run-specific active projection
   bindings, privacy-safe summary embeddings in `VECTOR(8)` with a
   cosine-optimized vector index, immutable ranked recall-result items, and an
   additive transport request identifier on action receipts. **Migration 002 is
   `SOURCE_ONLY`: it has never been applied, and no grant, capability row, or
   vector query has been executed.**

Every object belongs to the dedicated mhelix_testwired schema. Table creation,
index targets, foreign-key targets, and the runtime marker query are explicitly
qualified, so correctness does not depend on the connection's database search
path.

Both migrations deliberately contain no destructive DDL (Data Definition
Language), user or privilege creation, seed data, or live connection step.
Migration 001 contains no vector column; distributed vector persistence and
indexing were deferred until the embedding model and the current CockroachDB
index syntax were verified, which is what migration 002 now records in source.

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

This repository includes a reviewed deployment-only, read-only driver
bootstrap in source, but the current deployed Lambda does not contain it and no
public probe has verified it. The repository intentionally includes no general
migration command. Migration `001_testwired_memory_core.sql` was
independently applied on 2026-08-15 to database and schema `mhelix_testwired`.
It created 10 tables owned by `mhelix_migrator`. The `mhelix_migrator`
and `mhelix_runtime` users do not inherit `admin`. The runtime user has database
`CONNECT`, schema `USAGE`, and `SELECT` only on
`mhelix_environment_markers`; `SELECT` on `mhelix_runs` is denied as intended.

Source commit `7a29f22` contains the reviewed plain-`INSERT` activation. On
2026-08-15, an authenticated `mhelix_migrator` session applied its atomic
transaction. Sanitized post-commit readback showed exactly one canonical
environment-marker row, with all 8 comparisons true across the entire marker
table, and exactly one migration-001 ledger row, with all 6 comparisons true.
See the [sanitized activation archive](../../docs/archive/cockroachdb/2026-08-15-marker-activation.md).

This is `LIVE TESTWIRED` foundation evidence only. The deployed AWS (Amazon Web
Services) Lambda transport has no database bootstrap. The CockroachDB
application provider remains `NOT_CONNECTED`; persistent memory, vector
retrieval, and Managed MCP (Model Context Protocol) remain unproven and planned.
The reviewed deployment source accepts only the exact ARN (Amazon Resource
Name) of one existing AWS (Amazon Web Services) Secrets Manager secret and
narrow read permission. It creates or outputs no secret, grants no schema
ownership, and places no plaintext connection material in the browser or
repository. This bootstrap remains deployment and public-probe work, so the
provider remains `NOT_CONNECTED`.

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

The canonical marker source was committed at `48e85b4`. The digest above is the
expected public drift-evidence value. The canonical live marker row was
installed from source commit `7a29f22` and passed the boolean-only post-commit
readback described above.

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

The reviewed activation source lives in `database/activation/`:

- `001_testwired_marker_activation.sql` inserts the migration-ledger row and
  the environment-marker row in one plain-INSERT transaction.
- `verify_marker_activation.sql` reads both rows back using boolean
  comparisons only, so a shareable evidence transcript never contains the
  stored commitment or checksum bytes.

Both files are projections of the canonical contract in
`apps/api/src/environment-marker.js`. The test
`apps/api/test/marker-activation-sql.test.mjs` enforces that agreement, the
single-transaction plain-INSERT rule, and the no-echo rule. Committing these
files is source evidence only; only a separately authenticated
`mhelix_migrator` session may apply them, and the read-back booleans plus a
sanitized transcript are the activation evidence.

## Migration 002: vector-memory recall slice (`SOURCE_ONLY`)

`002_testwired_vector_memory.sql` is committed reviewed source. **It has not
been applied.** No vector row exists, no grant has been executed, no capability
row has been inserted, and no vector query or query plan has been observed.
Committing it proves nothing about the live database.

### What it adds

| Object | Purpose |
| --- | --- |
| `mhelix_runtime_capabilities` | Release-bound runtime capability marker. Its primary key is `(capability_id, release_commit)`, so a capability is always bound to one exact 40-character release commit and a stale deployment cannot claim a newer capability. A `CHECK` keeps `public_mutations_enabled` false, so public mutations remain impossible at the schema level. |
| `mhelix_run_active_projections` | Run-specific active projection binding. Migration 001 pins one active projection per case namespace; recall additionally pins one per independent judge run, so two runs in one case cannot silently read each other's generation. |
| `mhelix_memory_summary_embeddings` | Privacy-safe summary embeddings: reference columns, one `VECTOR(8)` embedding, a fixed model identifier, a 32-byte embedding commitment, and audit fields. |
| `mhelix_recall_result_items` | Immutable ranked recall-result items bound to the action receipt that produced them, so a receipt can reproduce the exact stored evidence references. |
| `uq_mhelix_memory_summaries_session_summary` | Additive unique index on the existing summaries table. It adds no column and changes no existing definition; it exists so the embedding table can carry a real composite foreign key proving a summary belongs to its session. |
| `transport_request_id` | Additive nullable column on `mhelix_action_receipts`, reusing the exact request-identifier pattern already validated in `apps/api/src/handler.js`. It is nullable because migration 001 receipts predate it, and a fabricated default would be dishonest evidence. |

### The privacy rule for the vector table

The embedding table stores only references to already-public-safe summaries, an
eight-dimensional embedding, a fixed model identifier, a 32-byte commitment,
and ordinary audit fields. It must never carry raw protected source text,
identity records, deeds, mortgages, owner data, credentials, private witnesses,
encryption keys, Filecoin payloads, or protected document bytes. There is
deliberately no free-text content column, and the source-contract test rejects
one if it is ever added.

The fixed model identifier is `mhelixctw-synthetic-embedding-v1`, a
deterministic synthetic embedding for this proof of concept. It is deliberately
**not** an AWS (Amazon Web Services) Bedrock Titan identifier: Titan does not
emit eight-dimensional vectors, so naming it here would be a false claim. Real
Titan embeddings would require their own reviewed migration to change the
declared dimension.

### Apply-time prerequisites that this source does not perform

1. **Cluster setting.** Creating a vector index requires
   `feature.vector_index.enabled = true`
   ([official documentation](https://www.cockroachlabs.com/docs/v26.2/vector-indexes#enable-vector-indexes)).
   Migration 002 deliberately does not set it, because changing a cluster
   setting is a separate explicitly authorized live operation. If the setting
   is disabled, the embedding-table statement fails, which is the intended
   fail-closed behavior rather than silently creating an unindexed table.
2. **Ledger row.** `database/activation/002_testwired_vector_memory_activation.sql`
   inserts exactly one migration-ledger row in one plain-`INSERT` transaction,
   with no `UPSERT` and no `ON CONFLICT`. A conflict is a fail-closed review
   event.
3. **Grants.** `database/activation/002_testwired_vector_memory_grants.sql`
   grants table-level `SELECT`, `INSERT`, and narrow `UPDATE` only, with no
   grant option and no wildcard target.
4. **Read-back.** `database/activation/verify_vector_memory_activation.sql`
   returns booleans only, so an evidence transcript never contains a stored
   embedding, commitment, or summary.

### Why no capability row is committed

The runtime capability marker is release-bound: inserting it requires the exact
40-character release commit being activated and that release's 32-byte evidence
commitment. **A committed file cannot contain the hash of the commit that will
contain it**, so any release commit written into committed source would
necessarily be fabricated or stale. The authorized operator therefore inserts
the capability row at activation time, from this reviewed template, replacing
both angle-bracket placeholders with real values. The placeholders below are
documentation and are intentionally not valid SQL (Structured Query Language)
literals, so this block can never be pasted unmodified:

```sql
BEGIN;

INSERT INTO mhelix_testwired.mhelix_runtime_capabilities
  (capability_id, marker_id, release_commit, capability_state,
   capability_version, evidence_commitment)
VALUES
  ('vector_memory_recall',
   'mhelixctw-testwired-environment',
   <RELEASE_COMMIT_40_LOWERCASE_HEX>,
   'SOURCE_ONLY',
   1,
   decode(<EVIDENCE_COMMITMENT_64_LOWERCASE_HEX>, 'hex'));

COMMIT;
```

`capability_state` must never be promoted past the evidence that exists.
`LIVE_TESTWIRED` requires a real applied migration, real grants, a real stored
vector, a real recall, and a sanitized transcript.

### The intended recall query

The reviewed recall shape constrains both vector-index prefix columns to exact
values, orders by cosine distance, and is bounded to two candidates:

```sql
SELECT memory_summary_id,
       embedding <=> $3 AS cosine_distance
  FROM mhelix_testwired.mhelix_memory_summary_embeddings
 WHERE run_id = $1
   AND projection_generation_id = $2
 ORDER BY embedding <=> $3
 LIMIT 2;
```

A vector index is only usable when every prefix column is constrained to an
exact value, which this shape satisfies
([official documentation](https://www.cockroachlabs.com/docs/v26.2/vector-indexes#define-prefix-columns)).
**No index-use claim is made.** Whether the optimizer actually uses
`vec_mhelix_summary_embeddings_run_projection` is proven only by a live
`EXPLAIN` showing a vector search node with prefix spans. Until that plan
evidence exists, the index is declared but unproven.

### Least privilege and one recorded privilege gap

The reviewed grants give the runtime role table-level `SELECT` and `INSERT`
where the five-step flow needs them, and `UPDATE` on exactly three tables:
memory sessions, projection generations, and action receipts. The runtime role
gets **no `UPDATE` on runs**, no privilege on the migration ledger, and no
`DELETE`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, `REVOKE`,
cluster-setting, database-wide, or wildcard privilege. Ranked recall-result
items are immutable by privilege: `INSERT` and `SELECT` only.

**Recorded correction gate:** the existing `managed-mcp` identity inherits
`admin`. While that inheritance stands, that identity must not be described as
least-privileged. Nothing in migration 002 or its grants changes it; correcting
it is a separate explicitly authorized live operation with its own evidence.

### Verifying the source contract

```bash
node --test apps/api/test/vector-memory-migration-source.test.mjs
npm run verify
```

`apps/api/test/vector-memory-migration-source.test.mjs` recomputes the
migration's SHA-256 (Secure Hash Algorithm 256-bit) digest and its top-level
statement count from the migration file itself and fails if the activation
file drifts by one byte. It also rejects unqualified objects, destructive
statements, a missing vector dimension or wrong operator class, weak cross-run
or cross-projection keys, unsafe raw-content columns, broad runtime privileges,
runtime `UPDATE` on runs, non-idempotent receipt or recall-result constraints,
and any overwrite behavior in the activation sources.

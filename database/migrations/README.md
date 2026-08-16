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

Unverified and explicitly not claimed by this slice: vector retrieval,
vector-index use, capability activation, Managed MCP (Model Context Protocol)
access, and hosted execution of any of it.

### What it adds

| Object | Purpose |
| --- | --- |
| `mhelix_runtime_capabilities` | Release-bound runtime capability marker keyed `(capability_id, release_commit)`, so a capability is always bound to one exact 40-character release commit and a stale deployment cannot claim a newer capability. |
| `mhelix_run_active_projections` | Run-specific active projection binding. Migration 001 pins one active projection per case namespace; recall additionally pins one per independent judge run, so two runs in one case cannot silently read each other's generation. |
| `mhelix_memory_summary_embeddings` | Privacy-safe summary embeddings: reference columns, one `VECTOR(8)` embedding, a fixed model identifier, a 32-byte embedding commitment, and audit fields. |
| `mhelix_recall_result_items` | Immutable ranked recall-result items bound to the receipt that produced them, carrying the run and the operation so a result can never attach to another run's receipt or to a non-recall operation. |
| `uq_mhelix_memory_summaries_session_summary` | Additive unique index on the existing summaries table, enabling a real composite foreign key for the session-to-summary boundary. |
| `uq_mhelix_action_receipts_run_receipt_operation` | Additive unique index on the existing action-receipts table, enabling the composite `(run_id, action_receipt_id, operation)` foreign key described above. |
| `transport_request_id` | Additive nullable column on `mhelix_action_receipts`, reusing the exact request-identifier pattern already validated in `apps/api/src/handler.js`. Nullable because migration 001 receipts predate it; a fabricated default would be dishonest evidence. |

No separate receipt-rank index is declared: the
`UNIQUE (action_receipt_id, result_rank)` constraint already creates one, and a
duplicate index would be dead weight the verifier now explicitly rejects.

Cross-session recall is deliberately permitted. Session B must be able to read
a summary written by Session A, so the schema does **not** require the recalled
summary and the recall receipt to share a session.

### What `public_mutations_enabled = false` does and does not do

It prevents a **capability row from claiming mutation readiness**. That is its
entire scope. It does **not** independently prevent every table mutation, and
it is not a substitute for the exact-statement application executor and the
reviewed database mutation boundary. **Both are still required before any
public write.**

### The privacy rule for the vector table

The embedding table stores only references to already-public-safe summaries, an
eight-dimensional embedding, a fixed model identifier, a 32-byte commitment,
and ordinary audit fields. It must never carry raw protected source text,
identity records, deeds, mortgages, owner data, credentials, private witnesses,
encryption keys, Filecoin payloads, or protected document bytes. There is
deliberately no free-text content column, and the source-contract test rejects
one if it is ever added.

`mhelixctw-synthetic-embedding-v1` is implemented as deterministic fixture code
in `packages/mock-pillars/src/synthetic-embedding.js`, and the committed
public-safe corpus in `fixtures/testtown/memory-corpus/` carries its vectors.
It is labeled `MOCK` everywhere: it calls no machine-learning model and
produces no semantic understanding. It is deliberately not an
AWS (Amazon Web Services) Bedrock Titan identifier, because Amazon Titan Text
Embeddings V2 produces 256, 512, or 1,024 dimensions, never eight, so naming
Titan here would be false.

### Apply-time prerequisites that this source does not perform

1. **Cluster setting.** Creating a vector index requires
   `feature.vector_index.enabled = true`
   ([official documentation](https://www.cockroachlabs.com/docs/v26.2/vector-indexes#enable-vector-indexes)).
   Migration 002 deliberately does not set it, because changing a cluster
   setting is a separate explicitly authorized live operation. If the setting
   is disabled, the embedding-table statement fails, which is the intended
   fail-closed behavior rather than silently creating an unindexed table.
2. **Ledger row.** `002_testwired_vector_memory_activation.sql` inserts exactly
   one migration-ledger row in one plain-`INSERT` transaction, with no `UPSERT`
   and no `ON CONFLICT`. A conflict is a fail-closed review event.
3. **Grants.** `002_testwired_vector_memory_grants.sql` grants table-level
   `SELECT` only. See the least-privilege section below.
4. **Read-back.** `verify_vector_memory_activation.sql` returns booleans only,
   so an evidence transcript never contains a stored embedding, commitment, or
   summary.

### The live backfill to schedule and observe

The vector index is created on a **new, empty** table, so it has nothing to
backfill. The statements that touch existing data are the two additive unique
indexes on the already-populated migration-001 tables
(`mhelix_memory_summaries` and `mhelix_action_receipts`). CockroachDB keeps
tables online during index creation, but a backfill consumes resources and can
temporarily raise latency, so before applying migration 002 an operator should
inspect the existing tables, apply during a quiet period, monitor the
schema-change job, and verify the resulting indexes
([online schema changes](https://www.cockroachlabs.com/docs/v26.2/online-schema-changes)).

### Least privilege in this slice: `SELECT` only

The grant packet gives the runtime role database `CONNECT`, schema `USAGE`, and
table-level `SELECT` on exactly the tables the read path needs. Nothing else.

- **No `UPDATE`.** The lifecycle-transition grants (closing a memory session,
  advancing a projection generation, completing an action receipt) are
  **deferred** until the exact-statement application executor and the database
  mutation boundary are reviewed together. A table-wide `UPDATE` grant is far
  broader than the three specific transitions the flow needs.
- **No `INSERT`.** No runtime implementation exists yet, so no write path can
  justify an `INSERT` grant today.
- No `DELETE`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, `REVOKE`,
  ownership, cluster-setting, database-wide, or wildcard privilege, and no
  `WITH GRANT OPTION` anywhere.

The grant script is **resumable and idempotent, not atomic**: CockroachDB can
auto-commit a `GRANT` because it is a schema change, so the script is
deliberately written without a surrounding transaction and may simply be re-run
if interrupted. Authoritative completion evidence is the exact two-way readback,
never the apparent success of the script.

**Recorded correction gate:** the existing `managed-mcp` identity inherits
`admin`. While that inheritance stands, that identity must not be described as
least-privileged. Nothing in migration 002 or its grants changes it; correcting
it is a separate explicitly authorized live operation.

### Capability activation and its separate readback

Two additional reviewed sources close the capability loop. Neither has been
executed.

- `activate_vector_memory_capability.sql` takes exactly **one** bound argument,
  `$1`, the expected 40-character lowercase release commit. It reads the
  canonical marker and the applied migration-002 ledger row from the database,
  refuses missing, duplicate, stale, or ambiguous source rows, builds the fixed
  domain-separated preimage below, and **derives** the SHA-256 (Secure Hash
  Algorithm 256-bit) commitment itself with `digest(..., 'sha256')`. A caller
  cannot supply a commitment. It uses one ordinary `INSERT` with no `UPSERT`
  and no `ON CONFLICT`. The operator must confirm the statement reports exactly
  one inserted row; zero rows means a precondition failed and is a review
  event.
- `verify_vector_memory_capability.sql` takes the same single argument,
  **recomputes** the commitment, and proves exactly one matching row with the
  canonical marker, migration, vector settings, model identifier, and
  `public_mutations_enabled = false`. It pins `release_commit = $1` throughout,
  so it can never certify a vague latest row, and it fails if any other release
  claims the capability.

The preimage is these eight lines, in this order, joined with LF (Line Feed),
encoded as UTF-8 (Unicode Transformation Format, 8-bit), with no BOM (Byte
Order Mark) and no trailing LF (Line Feed):

```text
domain=mhelixctw-vector-memory-capability-v1
marker_id=<canonical marker identifier>
release_commit=<40-character lowercase commit>
migration_id=002_testwired_vector_memory
migration_checksum=<recorded migration checksum>
vector_dimension=8
distance_metric=cosine
embedding_model=mhelixctw-synthetic-embedding-v1
```

The preflight verifier and the post-activation verifier are deliberately
separate jobs: the preflight one requires the capability table to be **empty**,
and the post-activation one verifies the **installed** row. Never merge them.

`capability_state` is fixed at `SOURCE_ONLY` by the helper. Promotion past the
evidence that exists is a separate reviewed decision.

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
**No index-use claim is made.** Whether the optimizer selects
`vec_mhelix_summary_embeddings_run_projection` can only be established by a live
`EXPLAIN` showing a vector search node with prefix spans. Until that plan
evidence exists, the index is declared but unproven.

**Open design requirement for the future runtime:** the recall path must
resolve the active projection generation **unambiguously**, by reading
`mhelix_run_active_projections` for the run. A historical generation must never
become active merely because a caller supplied its identifier.

### Verifying the source contract

```bash
node --test apps/api/test/vector-memory-migration-source.test.mjs
npm run verify
```

`apps/api/test/vector-memory-migration-source.test.mjs` recomputes the
migration's SHA-256 digest and top-level statement count from the migration
file itself and fails if the activation, verification, or capability sources
quote a different checksum. Its guards are written as violation collectors and
are exercised in both directions: once against the committed source, which must
report zero violations, and once against deliberately broken variants, which
must report the specific violation. Those broken variants are committed in the
test file, so the negative evidence is reproducible rather than asserted.

The rejected classes include cross-run and wrong-operation receipt
relationships, a missing composite receipt relationship, a wrong vector
dimension, a wrong vector-index prefix, order, or operator class, a missing
foreign key, unique constraint, check constraint, or transport check, missing,
extra, grantable, or write runtime privileges, an unchecked owner or inherited
role, a caller-supplied evidence commitment, an unpinned or unverified
post-activation capability check, the redundant receipt index, the vacuous
`coalesce(..., true)` verification pattern, and overstated activation,
retrieval, or least-privilege wording.

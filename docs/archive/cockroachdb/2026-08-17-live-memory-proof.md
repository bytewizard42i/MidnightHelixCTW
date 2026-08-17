# CockroachDB live memory and vector proof — 2026-08-17

**Author:** Penny, with John supervising every live boundary
**Scope:** dated, sanitized evidence that CockroachDB is a real persistent
memory layer for this application, that distributed vector indexing is used by
the recall path, and that a protected disclosure returns zero protected fields.
Archived evidence — not a living instruction file.

Every value below is public-safe. No credential, password, connection string,
host, certificate, or secret ARN (Amazon Resource Name) appears here.

## Release under proof

| Fact | Value |
| --- | --- |
| Source and deployed release | `c573c98a357e15c71bcc863eb4934db9f76bbccd` |
| CloudFormation change set | `samcli-deploy1786958011` — 14 modify, 0 add, 0 remove, 0 replacement |
| Stack result | `UPDATE_COMPLETE` |
| Deployed release equals capability release | yes, compared independently after deployment |
| Cluster | `helixchain-hackathon`, CockroachDB CCL v26.2.5 |
| Database and schema | `mhelix_testwired` |

## Activation sequence performed

1. Read-only preflight: 10 tables, zero migration-002 objects, cluster setting
   `feature.vector_index.enabled` already `true`.
2. Migration 002 applied as `mhelix_migrator`, producing 14 tables all owned by
   the migrator.
3. Migration-002 ledger row inserted; checksum matched the reviewed source.
4. Grant packet applied: 11 table grants. Database `CONNECT` and schema
   `USAGE` already existed from the 2026-08-15 activation and were left alone.
5. Capability row installed for the exact release, with the evidence
   commitment **derived inside the database** from the canonical
   domain-separated preimage. The operator supplied only the release commit.
6. Post-activation capability verification: five booleans, all true, including
   `stored_commitment_matches_recomputed_commitment`.

### Two operational findings worth recording

**The Cloud SQL Shell cannot perform this activation.** It rejects `SET ROLE`
as a disallowed statement type, and it wraps every submission in an explicit
transaction, so `schema_locked` can never be toggled there. The activation was
performed with `psql` over TLS with `sslmode=verify-full`, which runs each
statement in its own implicit transaction.

**Tables are schema-locked by default on this cluster.** The two additive
unique indexes on populated migration-001 tables required
`SET (schema_locked = false)` before creation and were re-locked afterwards.

## Schema and grant verification

`database/activation/verify_vector_memory_activation.sql` returns **every
boolean true** against the live cluster, covering: the exact ledger row; the
four new tables; `crdb_sql_type = 'VECTOR(8)'`; vector-index prefix columns in
order with `vector_cosine_ops` and no other operator class; both additive
unique indexes present and the redundant index absent; exact composite
foreign-key column orders; exact CHECK definitions; preflight emptiness; and
the complete grant matrix.

Grant matrix, compared in **both directions** with an exact count of 24:
`INSERT` on the nine append-only journey tables, `UPDATE` on exactly the three
reviewed lifecycle transitions, `SELECT` elsewhere. No missing grant, no
unexpected grant, no grantable grant, no `DELETE` or `TRUNCATE` anywhere, no
`UPDATE` on runs, no privilege on the migration ledger, and recall evidence and
stored vectors immutable by privilege.

Five defects were found and fixed during this activation. Four were verifier
bugs and one was a missing case-namespace row; all are described in the commit
`fix(database): correct four verifier bugs and seed the case namespace`. The
schema itself was correct throughout.

## Live public journey

Performed against the public API (Application Programming Interface) with a
plain HTTPS client and the exact-origin header, exactly as a judge's browser
would.

| Checkpoint | Route | Result |
| --- | --- | --- |
| 1. Create run | `POST /api/v1/judge/runs` | `ok: true`, run created, Session A opened |
| 2. Close session | `POST /api/v1/judge/runs/{runId}/sessions/close` | `ok: true`, **63 public-safe summaries and 63 vectors stored** |
| 3. Recall | `POST /api/v1/judge/runs/{runId}/recall` | `ok: true`, two ranked matches returned by cosine distance |
| 4. Protected disclosure | `POST /api/v1/judge/runs/{runId}/actions` | `DISCLOSURE_DENIED`, **`protectedFieldsReturned: 0`** |
| 5. Receipt fetch | `GET /api/v1/judge/receipts/{receiptId}` | `ok: true`, immutable `DENIED` receipt, still zero protected fields |

The refused field names were returned as names only: `ein`,
`stateRegistration`, `born`, `birthRecordIssuer`, `documents`, `officers`. No
protected value exists anywhere in this repository, so the denial cannot leak
one even in principle.

## Distributed vector indexing, proven by query plan

A read-only `EXPLAIN` of the exact recall shape, with the real run and
projection identifiers:

```text
• top-k
│ order: +d
│ k: 2
└── • render
    └── • lookup join
        │ table: mhelix_memory_summary_embeddings@mhelix_memory_summary_embeddings_pkey
        └── • vector search
              table: mhelix_memory_summary_embeddings@vec_mhelix_summary_embeddings_run_projection
              target count: 2
              prefix spans: [/'1f4eb221-…'/'6b4f203c-…' - /'1f4eb221-…'/'6b4f203c-…']
```

The `vector search` node names the cosine-optimized index, and `prefix spans`
shows the search restricted to the exact run and projection generation. This is
the evidence that distributed vector indexing is genuinely used, not merely
declared.

## Durable state after the proof

Read back from the live cluster:

| Table | Rows |
| --- | --- |
| Stored summary embeddings | 63 |
| Runs | 1 |
| Memory sessions | 2 (Session A closed, Session B fresh) |
| Action receipts | 4 |
| Ranked recall-result items | 2 |
| `DISCLOSURE_DENIED` events | 1 |
| **Protected fields ever returned, summed across every receipt** | **0** |

## Honest limits

* **The embedding model is `MOCK`.** `mhelixctw-synthetic-embedding-v1` is a
  deterministic hash-derived generator, not a semantic model. The storage,
  distance computation, index, retrieval, and receipts are real CockroachDB
  behavior; only the vector's origin is a fixture. Recall therefore returns
  *deterministically ranked* neighbours, not semantically insightful ones, and
  the demo must say so.
* The overall application remains `NOT_CONNECTED` with `readyForMutations`
  false. Only the narrow five-route memory slice is available, gated on a
  capability row bound to this exact release.
* Bedrock, Midnight, Filecoin, and the fixture identity providers remain
  disconnected. The local Midnight proof stays `VERIFIED_LOCAL` and is not a
  dependency of the public application.
* This evidence covers the bounded synthetic TestTown scenario only. It is not
  a production readiness claim.

# Penny Session 7A: close PR #3 source gates

## Goal

Make draft PR (Pull Request) #3 safe to merge as a source-only vector-memory foundation.

This session does not authorize a live CockroachDB change, an AWS (Amazon Web Services) change, a deployment, a capability-row insertion, a main-branch change, a TaskFence change, or a PR (Pull Request) merge.

Keep every public status at `SOURCE_ONLY`.

## Worktree and branch

Use only Penny's existing isolated worktree and branch:

```bash
cd /tmp/midnighthelixctw-penny-vector-worktree
git status --short
git fetch origin
git merge --no-edit origin/main
```

Stop and report if the worktree is not clean before the merge, the merge conflicts, or an unexpected file appears.

Rules:

- Merge current `origin/main` normally.
- Do not rebase, squash, force-push, rewrite history, or delete a branch.
- Do not touch John's main checkout.
- Use at most two new commits total, including the merge commit.
- Keep PR (Pull Request) #3 open, draft, and unmerged.

## Authorized files

You may modify the seven files already in PR (Pull Request) #3:

- `database/migrations/002_testwired_vector_memory.sql`
- `database/activation/002_testwired_vector_memory_activation.sql`
- `database/activation/002_testwired_vector_memory_grants.sql`
- `database/activation/verify_vector_memory_activation.sql`
- `apps/api/test/vector-memory-migration-source.test.mjs`
- `database/migrations/README.md`
- `docs/IMPLEMENTATION_STATUS.md`

You may add these two files if the correction needs them:

- `database/activation/activate_vector_memory_capability.sql`
- `database/activation/verify_vector_memory_capability.sql`

Do not modify migration 001, application runtime code, web code, AWS (Amazon Web Services) infrastructure, local Midnight files, generated artifacts, receipts, or TaskFence.

## Required corrections

### 1. Bind recall evidence to the same run and the recall operation

In migration 002:

- Add a unique composite receipt identity that includes the run, receipt identifier, and operation.
- Make each recall-result row carry the exact existing recall-operation literal.
- Add a composite foreign key that forces the recall-result run and operation to match the referenced receipt.
- Preserve the existing summary and projection-generation relationship.
- Do not require the recalled summary and recall receipt to share a session. Recall may read a summary from an earlier session.
- Remove the explicit receipt-rank index that duplicates the index already created by the unique constraint.
- Update every affected statement count and checksum expectation.

Add committed negative tests for a cross-run receipt, a non-recall receipt, a missing composite relationship, and the redundant index.

### 2. Make schema verification fail closed

Strengthen `verify_vector_memory_activation.sql` so zero rows never mean success.

It must prove:

- The embedding column is exactly `VECTOR(8)`, using documented `information_schema.columns.crdb_sql_type`.
- The vector index has the expected prefix columns in the expected order and uses `vector_cosine_ops`.
- Every required foreign key, unique constraint, check constraint, and transport-identifier check exists.
- The composite unique index on the existing summaries table exists.
- A wrong object with the expected name cannot pass.

Use documented CockroachDB catalogs or `SHOW` statements. Remove every vacuous `coalesce(..., true)` pattern.

### 3. Make the grant packet exact and conservative

The verifier must compare expected and actual permissions in both directions.

It must prove:

- Database `CONNECT`.
- Schema `USAGE`.
- The exact intended table grants.
- No missing, extra, or grantable privilege.
- Zero matching grants fails.
- Unexpected ownership, direct role membership, or inherited dangerous privilege fails.

For this source-only PR (Pull Request), withhold table-wide runtime `UPDATE` grants. Record those lifecycle-transition grants as deferred until the exact-statement application executor and database mutation boundary are reviewed together.

Keep only the immutable `SELECT` and `INSERT` grants that this source slice can justify. If an `INSERT` grant is not required before the runtime implementation exists, withhold it too.

CockroachDB can auto-commit `GRANT` schema changes. Describe the grant script as resumable and idempotent, followed by an exact readback. Do not call it atomic.

### 4. Close the capability activation and readback loop

Do not hardcode or insert a real capability row in this session.

If a capability activation helper is added, it must:

- Accept only the expected full 40-character lowercase release commit as operator input.
- Read the canonical marker and applied migration record from the database.
- Refuse missing, duplicate, stale, or ambiguous source rows.
- Construct one fixed domain-separated preimage.
- Derive the SHA-256 (Secure Hash Algorithm 256-bit) commitment itself.
- Use one ordinary `INSERT`, with no `UPSERT` and no `ON CONFLICT`.
- Fail closed on duplicate or mismatch.

Use this exact field order:

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

Encode as UTF-8 (Unicode Transformation Format, 8-bit), join with LF (Line Feed), use no BOM (Byte Order Mark), and add no trailing LF (Line Feed).

The separate post-activation verifier must accept the expected release commit, recompute the commitment, and prove exactly one matching row with the canonical marker, migration, vector settings, model identifier, and `public_mutations_enabled = false`. It must select the exact release, never a vague latest row.

The existing preflight verifier may require the capability table to be empty. The new post-activation verifier must verify the installed row. Keep those two jobs separate.

### 5. Correct the evidence claims

Update comments, the migration README (Read Me), the implementation-status document, and the PR (Pull Request) description:

- `public_mutations_enabled = false` prevents a capability row from claiming mutation readiness. It does not independently prevent every table mutation.
- The exact-statement application executor is still required before public writes.
- Vector retrieval, vector-index use, capability activation, managed MCP (Model Context Protocol), and hosted execution remain unverified.
- The vector index is on a new empty table. The live backfill to schedule and observe is the additive unique index on the existing summaries table.
- `crdb_sql_type` is documented and is used for the exact `VECTOR(8)` readback.
- `mhelixctw-synthetic-embedding-v1` is a reserved identifier for a planned deterministic generator. Do not claim that generator exists.
- Remove any numeric unsafe-variant claim that committed tests do not reproduce.

Keep every status at `SOURCE_ONLY`.

## Deferred work

Do not implement these items in Session 7A:

- Public vector-memory routes.
- The deterministic embedding generator.
- Runtime `UPDATE` privileges.
- Live migration, grants, or capability activation.
- A cluster-setting change.
- `EXPLAIN` evidence for vector-index use.
- Managed MCP (Model Context Protocol) access.
- Any AWS (Amazon Web Services) deployment.

Record that the future recall query must resolve the active projection unambiguously. Historical generations must not become active merely because a caller supplies their identifier.

## Required checks

The committed focused test must reject at least:

- Cross-run and wrong-operation receipt relationships.
- A missing composite receipt relationship.
- A wrong vector dimension.
- A wrong vector-index prefix, order, or operator class.
- A missing foreign key, unique constraint, check constraint, or transport check.
- Zero, missing, extra, or grantable runtime privileges.
- An unchecked inherited privilege or unexpected owner.
- A caller-supplied evidence commitment.
- A missing or mismatched post-activation capability check.
- The redundant receipt index.
- Overstated activation, retrieval, or least-privilege wording.

Run:

```bash
node --test apps/api/test/vector-memory-migration-source.test.mjs
npm run verify
git diff --check origin/main...HEAD
git status --short
```

Run the repository's existing sensitive-data scan. Do not install new tooling for this session.

## Commit, push, and report

Stage only the authorized files. Review the staged diff before committing.

Use one correction commit after the normal main merge:

```bash
git commit -m "fix(database): close vector-memory source gates"
git push origin codex/penny-vector-memory-source
```

Then:

- Update draft PR (Pull Request) #3 with the corrected boundaries and evidence.
- Wait for CI (Continuous Integration) checks.
- Do not merge the PR (Pull Request).
- Append the exact report to the standing John, Clara, and Penny handoff note, but do not stage or commit that note.
- Report the merge commit, correction commit, remote hash, exact files, local checks, CI (Continuous Integration) checks, and deferred items.

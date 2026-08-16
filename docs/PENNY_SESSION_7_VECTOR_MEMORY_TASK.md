# Penny Session 7: CockroachDB vector-memory database slice

This is implementation work for the hackathon POC (Proof of Concept), not a research-only assignment.

## Objective

Create the additive, source-only CockroachDB vector-memory database foundation for this judge flow:

1. Session A stores privacy-safe summaries.
2. Session A closes.
3. A fresh Session B retrieves the correct prior summary through a real vector query.
4. A protected disclosure attempt records a durable denial with zero protected fields returned.
5. A receipt can reproduce the exact stored evidence references.

Do not implement the API (Application Programming Interface) or UI (User Interface) in this session. Clara is handling the live Helix Runtime Bridge (AWS Lambda) lane separately.

## Branch and worktree

- Fetch the remote and create a new isolated worktree.
- Create branch `codex/penny-vector-memory-source` from the current exact `origin/main`.
- Record the full 40-character base commit before editing.
- Do not reuse the PR (Pull Request) #2 branch or worktree.
- Do not touch John's active main checkout.
- Before any Docker command, check Docker read-only. If communication fails, tell John: "Check that Docker is on and running."

## Sources of truth

- Use official CockroachDB v26.2 documentation for `VECTOR`, cosine distance, vector indexes, grants, and `EXPLAIN`.
- Inspect the current migration 001 and reuse its identifiers, composite keys, ownership model, and schema qualification.
- Do not guess SQL (Structured Query Language) syntax.
- Record direct official links in the draft PR (Pull Request) description.

## Authorized files

Create or modify only the database slice and its direct tests or documentation:

- new additive migration 002
- new source-only activation, grant, and readback scripts for migration 002
- new migration source-contract tests
- `database/migrations/README.md`
- `docs/IMPLEMENTATION_STATUS.md`
- one concise design document only if the existing documentation cannot hold the contract clearly

Do not change migration 001, API (Application Programming Interface) runtime code, web code, AWS (Amazon Web Services) infrastructure, local Midnight files, TaskFence, secrets, or live services.

## Required schema behavior

Design the smallest schema-qualified additions needed for:

- a release-bound runtime capability marker
- run-specific active projection bindings
- privacy-safe summary embeddings using `VECTOR(8)`
- immutable ranked recall-result items
- an original transport request identifier on action receipts, if required by the current receipt evidence contract

Use exact existing foreign keys wherever possible. Enforce run, case, session, projection, and summary boundaries. Add uniqueness and idempotency constraints that prevent duplicate durable results.

The vector table must contain only privacy-safe summary references, an eight-dimensional embedding, a fixed model identifier, a 32-byte embedding commitment, and ordinary audit fields. It must never contain raw protected source text, identity records, deeds, mortgages, owner data, credentials, private witnesses, encryption keys, Filecoin payloads, or protected document bytes.

Use the official vector-index syntax only after verifying it. The intended query is constrained by exact run and projection generation, ordered by cosine distance, and bounded to two candidates. Do not claim index use until a later live `EXPLAIN` proves it.

## Least privilege

Prepare source-only grants with no grant option:

- exact `SELECT` and `INSERT` only where the five-step flow requires them
- `UPDATE` only on memory sessions, projection generations, and action receipts
- no runtime `UPDATE` on runs
- no `DELETE`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, cluster-setting authority, broad database privilege, or wildcard privilege

The existing `managed-mcp` identity must not be called least-privileged while it inherits `admin`. Document that as a later live correction gate.

## Activation boundary

- Everything remains `SOURCE_ONLY`.
- Do not connect to CockroachDB, apply migration 002, grant privileges, insert capability rows, change a cluster setting, or run a live vector query.
- Activation scripts must fail closed on unexpected pre-existing rows or objects.
- Use plain transactions and inserts. No `UPSERT`, `ON CONFLICT`, destructive rewrite, or fabricated default.
- Public mutations must remain disabled.

## Tests and verification

Add tests that reject:

- unqualified objects
- destructive statements
- missing vector dimension or cosine operator class
- weak cross-run or cross-projection keys
- unsafe raw-content columns
- broad runtime privileges
- runtime update access to runs
- non-idempotent receipt or recall-result constraints
- activation scripts with overwrite behavior

Run:

- the focused migration tests
- `npm run verify`
- documentation-link verification
- `git diff --check`
- a sensitive-value scan
- an exact changed-file and generated-artifact review

Do not weaken or delete tests.

## Delivery authority

- Maximum two focused commits.
- Push normally to `origin/codex/penny-vector-memory-source` only after every gate passes.
- Open a draft PR (Pull Request) to `main`.
- Do not force-push, merge, deploy, run live SQL (Structured Query Language), change PR (Pull Request) #2, or edit main.
- Keep generated files, runtime state, credentials, and handoff notes out of commits.

## Handoff

Report the exact branch, base commit, commit hashes, changed files, official sources, all gate results, and unresolved risks. State plainly that the work is source-only and that no live migration, grant, vector-index plan, retrieval, or Managed MCP (Model Context Protocol) proof has occurred.

-Clara

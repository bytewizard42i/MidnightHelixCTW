# CockroachDB memory design

CockroachDB is the center of the submitted application. Midnight adds private
proof and commitment verification, but CockroachDB is what lets a fresh agent
remember, coordinate, refuse stale work, and resume safely.

## Canonical records

The target schema separates authoritative state from derived recall data:

| Record | Purpose | Authoritative? |
| --- | --- | --- |
| `memory_sessions` | Agent/session identity, lifecycle, tenant, and release commit. | Yes |
| `memory_events` | Append-only observations, requests, decisions, and outcomes. | Yes |
| `memory_summaries` | Committed safe summaries derived from ordered events. | Derived but receipt-bound |
| `memory_embeddings` | Vectors over approved summaries or descriptors. | No |
| `property_state` | Exact synthetic property and current title predicate state. | Yes |
| `authority_receipts` | DIDz/AgenticDID mock scope and Midnight proof references. | Yes for the test workflow |
| `projection_generations` | Rebuild manifest, state, counts, roots, and active pointer. | Yes |
| `action_receipts` | Idempotency, disclosure, denial, and result commitments. | Yes |

Every record is namespaced by environment and synthetic judge run. A reset creates
a new namespace from an immutable seed. It never drops or truncates shared tables.

## Recall algorithm

1. Load the current synthetic actor, grant, property, and projection generation.
2. Create a Titan embedding for the privacy-safe query.
3. Use CockroachDB vector search to select candidate summaries.
4. Load the exact source events and provenance for those candidates.
5. Reject stale, revoked, expired, or conflicting candidates using exact state.
6. Construct a bounded model context containing only approved fields.
7. Require the model response to cite the memory and evidence identifiers it used.
8. Commit the decision, disclosure count, and receipt transactionally.

Vector similarity is always non-authoritative. It ranks candidate context. It does
not grant access, prove a title predicate, or approve an action.

## Cross-session proof

The browser must not be the memory source. Session B is accepted as a valid proof
only if:

- it has a new session identifier;
- it is served by a fresh or stateless Lambda invocation path;
- it retrieves Session A memory from CockroachDB;
- the returned memory IDs refer to persisted rows;
- closing Session A or refreshing the browser does not change the result.

## Atomicity and replay safety

Each decision request carries an idempotency key. CockroachDB commits the request
reservation, exact-state decision, disclosure delta, event, and receipt as one
serializable unit. A retry returns the existing receipt. It must never produce a
second disclosure or a second state mutation.

Denial is also evidence. It may append a denial event and receipt, while recording
zero protected-state changes and zero private fields disclosed.

## Rebuild design

The active projection is selected through a small pointer record. A rebuild writes
to a new generation, verifies row counts and commitments, and flips the pointer in
one transaction. The old projection remains readable until the new generation is
complete. The public demo never deletes canonical memory to simulate failure.

## Sponsor-visible tools

The intended qualifying CockroachDB tools are:

1. distributed vector indexing and vector search used by the agent recall path;
2. CockroachDB Managed MCP, read-only and cluster-scoped, used by an evidence
   verifier to inspect sessions, generations, and receipts.

Both must be visibly exercised in the public demo and documented with exact tool
names. Merely installing or configuring a tool is not meaningful use.

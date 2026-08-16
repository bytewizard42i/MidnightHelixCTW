# MHelixCTW Architecture

## Product boundary

MHelixCTW is designed as the TestWired, standalone edition of HelixCTW. Its
target flow demonstrates HelixCTW as the memory and data layer for DIDzM (DIDzMonolith) while
keeping the other DIDzM (DIDzMonolith) pillars as explicit synthetic providers.

> **Current topology, 2026-08-15:** The judge UI (User Interface) and AWS
> (Amazon Web Services) API (Application Programming Interface) Gateway and
> Lambda transport are live. CockroachDB has a `LIVE TESTWIRED` database and
> schema foundation: migration 001 created 10 tables owned by
> `mhelix_migrator`, and least-privilege runtime access and denial were verified.
> Source commit `7a29f22` contains the reviewed atomic activation, which an
> authenticated `mhelix_migrator` session applied. Sanitized post-commit
> readback showed exactly one canonical marker row with all 8 comparisons true
> across the marker table and exactly one migration-001 ledger row with all 6
> comparisons true. The read-only probe remains `SOURCE ONLY`, and the deployed
> Lambda has no database bootstrap. The CockroachDB application provider remains
> `NOT_CONNECTED`; persistent memory, vector retrieval, and Managed MCP (Model
> Context Protocol) remain unproven and planned. Bedrock, Midnight, and
> reconstruction remain `PLANNED` and `NOT_CONNECTED`. The topology below is
> the target design. See
> [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

The repository is designed around one property question:

> `Is this property unencumbered?`

It does not make legal title determinations, execute transfers, authenticate
real people, or expose real property records.

## Target system map

```text
Judge browser
    |
    v
AWS API Gateway
    |
    v
AWS Lambda coordinator ----> Amazon Bedrock
    |
    +----> CockroachDB Cloud
    |        sessions, events, summaries
    |        vector embeddings and recall
    |        exact policy and asset state
    |        evidence manifests
    |        projection generations
    |        receipts and audit
    |
    +----> Midnight test infrastructure
    |        evidence commitment
    |        permitted predicate proof or verification
    |        rebuild commitment lineage
    |
    +----> Mock DIDz, AgenticDID, RWAz providers
             fictional identity
             scoped synthetic grant
             fictional property identity

Read-only CockroachDB Managed MCP
    |
    +----> verifies memory, vectors, generation, and receipts for judges
```

## Responsibilities

### CockroachDB Cloud: durable agent memory

In the completed flow, CockroachDB is causally necessary. It will store:

- Session A and Session B identities and closure state
- Typed memory events and compact summaries
- Public-safe semantic descriptors and embeddings
- Exact synthetic asset and policy state
- Canonical evidence-manifest references and commitments
- Active and historical recall-projection generations
- Rebuild and query receipts
- Idempotency keys and audit evidence

Vector similarity locates candidate memory. It never decides access or truth.
Exact relational state and the current provider evidence determine what may be
returned.

#### Verified CockroachDB foundation boundary

On 2026-08-15, migration `001_testwired_memory_core.sql` was applied to database
and schema `mhelix_testwired`. It created 10 tables owned by
`mhelix_migrator`. The `mhelix_migrator` and `mhelix_runtime` users do not
inherit `admin`. The runtime user has database `CONNECT`, schema `USAGE`, and
`SELECT` only on `mhelix_environment_markers`; `SELECT` on `mhelix_runs` is
denied as intended.

The canonical environment-marker source is committed at `48e85b4`, with digest
`ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198`.
Source commit `7a29f22` contains the reviewed atomic activation. An authenticated
`mhelix_migrator` session applied it. Sanitized post-commit readback showed
exactly one canonical marker row with all 8 comparisons true across the entire
marker table and exactly one migration-001 ledger row with all 6 comparisons
true. The deployed AWS (Amazon Web Services) Lambda transport has no database
bootstrap. This is live foundation evidence only, not proof of a connected
provider, persistent memory, vector retrieval, or Managed MCP (Model Context
Protocol).

### Filecoin: planned encrypted cold evidence

Filecoin is the planned store for client-encrypted evidence capsules, not live
agent memory, authorization state, plaintext records, or keys. CockroachDB owns
the searchable manifest and archival outbox, Midnight owns policy commitments
and permitted state transitions, and a bounded off-chain DIDzM (DIDzMonolith) worker performs
encryption, upload, retrieval, and verification. This boundary remains
`PLANNED`; see the [Filecoin integration plan](FILECOIN_INTEGRATION.md).

### Midnight: privacy trust plane

Midnight must receive only minimized commitments and policy inputs suitable for
the implemented test flow. Raw deeds, mortgage records, private keys,
decryption passwords, and identity details remain off chain.

The target test integration returns an inspectable transaction or proof receipt
for:

- the synthetic evidence commitment;
- the allowed one-bit `isUnencumbered` predicate; and
- the commitment lineage of a rebuilt recall projection.

Midnight does not store or reconstruct the CockroachDB database. A commitment
can verify restored information but cannot recreate missing ciphertext.

### AWS: public agent path

In the target public path, API Gateway will be the front door and Lambda will be
the bounded coordinator that:

1. validates the fixed judge request;
2. verifies the TestWired environment marker;
3. retrieves the relevant CockroachDB memory;
4. calls the permitted Bedrock model at most as configured;
5. obtains or verifies the Midnight test receipt;
6. commits the response evidence and receipt transactionally; and
7. returns a redacted, size-bounded result.

Secrets will remain in AWS Secrets Manager. The Lambda role will receive only
the exact database secret, model resources, and logging permissions it requires.

### Mock DIDzM (DIDzMonolith) pillars

The three providers share the same interfaces expected of future real
integrations:

- `MockDidzProvider`: who the fictional principal is;
- `MockAgenticDidProvider`: which narrow predicate the fictional agent may ask;
- `MockRwazProvider`: which fictional property is referenced and its stable
  identity commitment.

Every value from these providers is labeled `MOCK`. They cannot silently claim
`REALDEAL_TEST` merely because CockroachDB or Midnight is live.

## Target privacy model

The completed demo will separate four data classes:

| Data class | Location |
| --- | --- |
| Public-safe descriptions and embeddings | CockroachDB |
| Structured memory, receipts, commitments, and projection metadata | CockroachDB |
| Encrypted fictional evidence bytes | Bounded test evidence store |
| Commitment and proof state | Midnight test infrastructure |

Embeddings are created only from approved public-safe text. Encrypted content is
not semantically searchable, and the model does not receive the source deed.

## Reconstructibility

The target proof is an application-layer recall-projection rebuild, not a claim
that Midnight can restore an entire lost database.

1. The active projection generation answers the property question.
2. A private test-only operation creates an empty shadow generation.
3. The worker reads the canonical append-only memory and evidence manifest.
4. It verifies source hashes and commitment lineage.
5. It regenerates public-safe descriptors and embeddings.
6. It checks record counts, identifiers, and expected commitments.
7. One transaction activates the new generation.
8. The same query returns the same memory and commitment.
9. A corrupted source fails verification and cannot become active.

The public interface never deletes, drops, or truncates canonical data.

## Failure behavior

- Missing or invalid provider configuration: `503`, no mock fallback
- Wrong environment marker: fail before data access
- Expired or unauthorized synthetic grant: deny, no private result
- Vector candidate without exact matching state: exclude
- Midnight receipt mismatch: deny and preserve failure evidence
- Duplicate idempotency key: return the existing receipt, never repeat effects
- Corrupted rebuild input: keep the current projection active
- Bedrock unavailable: return a bounded provider failure, not invented output
- CockroachDB unavailable: the agent cannot claim memory recall

## Evidence required before a live judge claim

- Release Git commit
- AWS region and request identifier
- CockroachDB cluster and database labels without credentials
- Session and memory identifiers
- Embedding model and vector distance
- Exact mock identity, authority, and asset labels
- Midnight network, contract identifier, and receipt
- Projection generation before and after reconstruction
- Rebuild receipt, source count, and commitment
- Latency and bounded model-call count

## Explicit non-claims

MHelixCTW does not claim:

- production legal title verification;
- real property or personal data;
- production identity or delegated authority;
- that vector similarity grants authority;
- that Midnight stores private source documents;
- whole-cluster recovery from a blockchain commitment;
- multi-region deployment merely because CockroachDB supports it;
- Filecoin availability unless a live hosted retrieval is in the demonstrated
  path; or
- production-grade security based only on passing tests.

# MHelixCTW Architecture

## Product boundary

MHelixCTW is designed as the TestWired, standalone edition of HelixCTW. Its
target flow demonstrates HelixCTW as the memory and data layer for DIDzM while
keeping the other DIDzM pillars as explicit synthetic providers.

> **Current topology, 2026-08-14:** The judge UI and AWS infrastructure exist as
> source. No public UI or API endpoint is verified. AWS Lambda and API Gateway
> remain `SOURCE_ONLY`; CockroachDB, Bedrock, Midnight, reconstruction, and
> Managed MCP remain `PLANNED`; all callable providers remain `NOT_CONNECTED`.
> The topology below is the target design, not evidence of current connectivity.
> See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

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

### Mock DIDzM pillars

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

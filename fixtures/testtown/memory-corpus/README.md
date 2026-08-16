# TestTown public-safe memory corpus

This folder holds the committed, deterministic, public-safe fixture corpus that
the judge scenario stores in CockroachDB and retrieves through distributed
vector indexing.

## What it is

`public-safe-corpus.json` contains 63 entries derived from the synthetic
TestTown population. Each entry carries:

| Field | Meaning |
| --- | --- |
| `fixtureId` | Stable lowercase identifier, safe to show publicly |
| `category` | `citizen`, `organization`, `asset`, or `animal` |
| `honestyRole` | `AUTHENTIC` or `VILLAIN`, the public civic posture in this synthetic town |
| `publicSafeSummary` | One sentence of public-safe context, and the exact text that was embedded |
| `embedding` | Eight finite, unit-normalized values |
| `embeddingCommitmentHex` | 32-byte SHA-256 (Secure Hash Algorithm 256-bit) commitment binding model, input, and vector |
| `protectedFieldNames` | The **names** of protected fields that exist upstream, with **no values** |

The corpus holds at least 32 entries on purpose. Distributed vector indexing is
only meaningful over a real population, so a two-row demonstration would not
honestly exercise it. The judge view still returns only the two best matches.

## Where it comes from

Upstream: [TestTownDIDz](https://github.com/bytewizard42i/TestTownDIDz),
Apache-2.0, a pre-existing synthetic town of people, organizations, assets, and
animals. That repository is **not** a build dependency: this corpus is committed,
so a clean clone of this repository alone can run everything.

Regenerate or verify when the upstream checkout is available:

```bash
node scripts/build-memory-corpus.mjs --source ../TestTownDIDz          # rewrite
node scripts/build-memory-corpus.mjs --source ../TestTownDIDz --check  # verify, no write
```

The build is deterministic: the same upstream input always produces a
byte-identical file, and `--check` fails on any drift.

## The privacy boundary

This is the whole point of the scenario, so it is enforced mechanically rather
than by good intentions.

**Public-safe, and therefore embedded:** display name, category, honesty
posture, employment role and employer, issuer type, requested assurance level,
attestation scopes, subject tiers, and founding **year** only.

**Protected, and therefore never copied into this repository in any form:**
employer identification numbers, state registration numbers, dates of birth,
birth-record issuers, document contents, and officer names. Full dates are
withheld even where a year is published.

Fraud **mechanism** detail is also withheld. A summary may state that an entity
is flagged by review; it never states why, because that is investigative detail.
The upstream directory names encode those mechanisms, so identifiers are
deliberately reduced to the entity-name segment.

`packages/mock-pillars/test/synthetic-embedding.test.mjs` enforces all of this:
it rejects employer-identification-number and state-registration shapes, any
full date, investigative wording, unexpected entry keys, and any
`protectedFieldNames` value that is not a bare field name.

## The embedding model is `MOCK`

`mhelixctw-synthetic-embedding-v1` is deterministic fixture code in
`packages/mock-pillars/src/synthetic-embedding.js`. It calls no
machine-learning model and produces no semantic understanding. It is labeled
`MOCK` everywhere.

It is deliberately **not** an AWS (Amazon Web Services) Bedrock Titan
identifier: Amazon Titan Text Embeddings V2 emits 256, 512, or 1,024
dimensions, never eight, so naming Titan would be false.

What is real, once migration 002 is applied: the CockroachDB storage, the
cosine distance computation, the vector index, the retrieval, and the durable
receipts. Only the vector's origin is a fixture.

# Filecoin integration for DIDzM (DIDzMonolith)

## Current status

**Capability status:** `PLANNED`

MidnightHelixCTW does not currently upload to Filecoin, retrieve from Filecoin,
fund a Filecoin wallet, submit a storage transaction, or verify a live
PDP (Proof of Data Possession). Existing adapter material is prior source and
test evidence only. It is not wired into the deployed
API (Application Programming Interface) or public judge flow.

Filecoin remains outside the critical hackathon submission path. The current
Priority Zero work is real CockroachDB persistent memory, distributed vector
retrieval, read-only Managed MCP (Model Context Protocol) verification, the
complete public judge flow, and the demonstration video.

## Decision

Filecoin is the target encrypted cold-evidence layer for DIDzM (DIDzMonolith). It should store
durable ciphertext, not live agent memory, access-control state, private keys,
or plaintext identity records.

The Midnight contract should govern the storage policy and evidence lifecycle.
It should not perform the Filecoin upload itself. An off-chain DIDzM (DIDzMonolith) worker
performs encryption, upload, retrieval, and verification, then submits a bounded
commitment or receipt back to Midnight.

This separation keeps each system responsible for one kind of truth:

| System | Responsibility | Must not contain |
| --- | --- | --- |
| Midnight | Authorization rules, policy identifiers, evidence commitments, permitted state transitions, and privacy-preserving verification | Raw documents, decryption keys, or reconstructible private records |
| CockroachDB | Searchable manifest, archival outbox, PieceCID (Piece Content Identifier), digests, provider receipts, retry state, retention class, and retrieval status | Decryption keys or the only copy of canonical evidence |
| Filecoin | Client-encrypted evidence capsules and other immutable cold artifacts | Plaintext personal records, wallet keys, or live authorization state |
| DIDzM (DIDzMonolith) archival worker | Canonicalization, redaction, encryption, upload, retrieval, verification, and receipt submission | Long-lived root-wallet authority or unrestricted secrets |
| Key service or user wallet | Encryption-key custody and narrowly scoped signing authority | Public storage identifiers that reveal private key material |

## Best DIDzM (DIDzMonolith) artifacts for Filecoin

The preferred storage unit is one encrypted, versioned evidence capsule for a
completed and authorized lifecycle event. Suitable contents include:

- encrypted credential-evidence attachments;
- encrypted property, certification, compliance, or provenance documents;
- signed agent-action evidence bundles;
- encrypted long-term memory snapshots that are not used as the live recall
  index;
- versioned audit and reconstruction packages;
- public schemas, specifications, release manifests, and other intentionally
  public artifacts.

Each private capsule should contain only the minimum authorized material. Before
encryption, DIDzM (DIDzMonolith) should canonicalize the structure, remove
unnecessary fields, and use a reviewed, domain-separated hiding-commitment
construction with a fresh cryptographic nonce for every capsule. The nonce and
opening material stay in protected off-chain custody. Only the commitment value,
construction identifier and version, minimized policy identifier, and lifecycle
state may become public after a metadata privacy review. Filecoin receives only
the ciphertext and the minimum metadata required by the storage protocol.

Filecoin is not appropriate for:

- private keys, recovery phrases, or encryption keys;
- plaintext identity documents or biometric information;
- mutable authorization, consent, or revocation state;
- active agent sessions or low-latency operational memory;
- unredacted prompts, model context, or logs;
- data whose lawful retention or deletion requirements have not been reviewed;
- the sole surviving copy of evidence needed for an active service.

## Midnight policy and delegation model

The contract is the policy authority, while the off-chain worker is the storage
executor. The recommended contract inputs are commitments and opaque policy
identifiers, not raw Filecoin locations.

A policy may resolve off-chain to a storage class such as `COLD_ARCHIVE`. This
lets DIDzM (DIDzMonolith) change a storage provider or add another archival backend without
placing provider credentials or detailed infrastructure topology on the
Midnight ledger.

The target lifecycle is:

```text
AUTHORIZED
    -> UPLOAD_PENDING
    -> FILECOIN_COMMITTED
    -> RETRIEVAL_VERIFIED
    -> ARCHIVE_CONFIRMED
```

Only allowed transitions may be accepted. A successful upload request is not
enough to reach `ARCHIVE_CONFIRMED`.

### End-to-end sequence

1. DIDzM (DIDzMonolith) validates the subject, authority, consent, retention class, and artifact
   type.
2. The Midnight contract verifies the permitted policy transition and records
   only the hiding commitment value, construction identifier and version,
   minimized policy identifier, and lifecycle state. The nonce and opening
   material remain in protected off-chain custody.
3. CockroachDB commits the operational record and an idempotent archival outbox
   job in the same database transaction.
4. The archival worker canonicalizes, minimizes, and encrypts the evidence
   capsule inside the trusted runtime.
5. The worker uploads the ciphertext to Filecoin and records the returned
   PieceCID (Piece Content Identifier), network, transaction reference, provider
   copy results, and retrieval locations in CockroachDB.
6. The worker retrieves the stored ciphertext, verifies the content identifier
   and ciphertext digest, decrypts it, recomputes the hiding manifest commitment
   with protected opening material, and compares the result.
7. The worker submits a bounded storage receipt commitment to Midnight.
8. The contract accepts `ARCHIVE_CONFIRMED` only when the authorization,
   hiding manifest commitment, storage receipt commitment, and lifecycle state
   agree.

Midnight witnesses can supply private application data to contract circuits, but
the external Filecoin operation belongs in the application service. The two
network operations are asynchronous and cannot be treated as one atomic
cross-chain transaction.

## CockroachDB manifest and outbox

The Filecoin integration depends on CockroachDB as the operational source of
truth. The first implementation should add an append-only archival job and
receipt model with fields equivalent to:

```text
archive_job_id
run_id
artifact_type
storage_policy_id
manifest_commitment
ciphertext_digest
piece_cid
filecoin_network
storage_transaction_reference
provider_copy_receipts
retention_class
archive_status
attempt_count
last_error_code
retrieval_verified_at
created_at
updated_at
```

The exact schema must use bounded values, unique idempotency keys, foreign keys
to the canonical DIDzM (DIDzMonolith) run or object, and an explicit status-transition policy.
Raw provider errors, wallet data, secrets, and decrypted evidence must never be
stored in the public receipt fields.

The worker must process the outbox asynchronously. If Filecoin is unavailable,
the CockroachDB memory transaction remains valid and the archive job remains
visibly pending. A storage outage must not corrupt operational memory or cause a
mock fallback.

## Filecoin test network

The first real integration must use the Filecoin **Calibration** test network.
Calibration is the closest public test simulation of Filecoin mainnet and
supports real test storage and retrieval. Its chain identifier is `314159`.

Calibration uses test funds, including test `FIL` (Filecoin network token) for
transaction fees and test `USDFC` (Filecoin-community stablecoin pegged to the United States dollar)
where required by the selected storage path. Test funds and Calibration data
have no production value or production-retention guarantee. Only synthetic
TestTown evidence may be used during this phase.

The network selection must be explicit in configuration. A default network must
not be trusted silently, and a mainnet configuration must fail closed unless a
separate reviewed production release explicitly enables it.

## Recommended Filecoin client path

The current preferred first integration is Filecoin Onchain Cloud through the
Synapse SDK (Software Development Kit). The initial adapter should expose a small
internal interface rather than leaking the client library across DIDzM (DIDzMonolith):

```text
uploadEncryptedArtifact(ciphertext, manifest)
retrieveEncryptedArtifact(pieceCid, expectedDigest)
readStorageProofStatus(pieceCid)
```

The adapter should use explicit Calibration configuration, bounded upload and
download sizes, timeouts, cancellation, retries, idempotency, and an allowlist of
expected network endpoints. Its public return type must contain only reviewed,
sanitized evidence fields.

Filecoin Pin may be evaluated later if DIDzM (DIDzMonolith) specifically requires an
IPFS (InterPlanetary File System) root CID (Content Identifier) in addition to a
PieceCID (Piece Content Identifier). It is not required for the first archival
path and must not be exposed as an unrestricted public pinning endpoint.

## Encryption and key custody

Filecoin is durable public infrastructure, not a private database. Encryption
must happen before any bytes leave the trusted DIDzM (DIDzMonolith) runtime.

Required controls:

- use authenticated envelope encryption with a unique data key and nonce for
  every artifact;
- keep decryption keys outside Filecoin and outside CockroachDB;
- keep the Filecoin root wallet offline;
- give the archival worker a short-lived, least-privilege session key;
- never expose a wallet key through the browser, repository, logs, build output,
  or Lambda response;
- use a reviewed key service, such as AWS (Amazon Web Services)
  KMS (Key Management Service), or a user-controlled wallet boundary;
- bind encryption context to the DIDzM (DIDzMonolith) object, run, policy, and manifest
  commitment;
- rotate worker authority and record only sanitized rotation evidence;
- deny decryption until the current authorization proof is accepted.

Encryption hides the bytes, but it does not hide every fact. Wallet activity,
storage size, timing, providers, payment activity, PieceCID
(Piece Content Identifier), and proof records may remain observable. The privacy
review must treat that metadata as a separate disclosure surface.

## Retention, renewal, and deletion

Filecoin durability does not create a guaranteed physical-delete mechanism for
every replicated byte. DIDzM (DIDzMonolith) must therefore:

- classify retention before upload;
- avoid Filecoin for records requiring assured immediate byte deletion;
- stop renewals when retention expires;
- use key destruction as crypto-shredding for encrypted private artifacts;
- preserve a non-sensitive tombstone or revocation record in CockroachDB;
- never claim that key destruction proves every physical copy was erased;
- document provider-copy and renewal behavior before a production claim.

## Retrieval and disclosure controls

Possession of a PieceCID (Piece Content Identifier) is not authorization to
receive the plaintext.

Before disclosure, DIDzM (DIDzMonolith) must:

1. verify the current identity, grant, purpose, scope, and retention policy;
2. retrieve through an allowlisted client with strict size and time limits;
3. verify the returned content identifier and ciphertext digest;
4. decrypt only inside the trusted runtime;
5. recompute and compare the hiding manifest commitment with protected opening material;
6. return only the permitted projection or predicate;
7. record a sanitized retrieval receipt and denial evidence.

A failed identifier, digest, commitment, grant, or lifecycle check must fail
closed without returning any protected field.

## Proof and claim boundaries

A successful gateway retrieval proves availability through that path at that
time. It does not independently prove a storage deal, replication, durability,
authorization, truth, or confidentiality.

PDP (Proof of Data Possession) proves a storage provider possessed the committed
data for the covered proof event. It does not prove that the plaintext is true,
that a requester may view it, or that the ciphertext is private. DIDzM (DIDzMonolith) must keep
those claims separate.

The application must not display Filecoin as `LIVE_TESTWIRED` until all required
promotion evidence has been recorded. Before then, the provider remains
`PLANNED` or `SOURCE_ONLY`, depending on the implemented source.

## Required tests

Deterministic tests must cover:

- canonicalization and minimization;
- authenticated encryption and decryption;
- unique nonces and envelope-key separation;
- idempotent upload retries;
- duplicate worker delivery;
- provider timeout and cancellation;
- maximum artifact size;
- malformed or unexpected PieceCID (Piece Content Identifier);
- ciphertext tampering;
- manifest-commitment mismatch;
- unauthorized retrieval and denial without disclosure;
- key unavailability;
- Filecoin outage while CockroachDB remains correct;
- stale or invalid Midnight policy state;
- secret and protected-field redaction in logs and receipts;
- transition rejection for every skipped or reversed lifecycle state.

One separately gated live Calibration test must upload an encrypted synthetic
artifact, retrieve it, verify both ciphertext and plaintext commitments, and
prove that a corrupted or unauthorized path is rejected.

## Promotion evidence

Promotion to `LIVE_TESTWIRED` requires all of the following:

1. exact source commit and dependency versions;
2. explicit Calibration network name and chain identifier;
3. sanitized wallet and worker-role evidence without secret material;
4. upload transaction reference and PieceCID (Piece Content Identifier);
5. provider-copy or storage-service receipt evidence;
6. successful retrieval of the exact uploaded ciphertext;
7. verified ciphertext digest and hiding manifest commitment opening;
8. accepted Midnight storage-receipt commitment;
9. negative tamper and unauthorized-retrieval results;
10. timestamps in UTC (Coordinated Universal Time);
11. public status output that distinguishes upload, replication, retrieval, and
    PDP (Proof of Data Possession) states;
12. a signed-out judge flow with clean browser console and network results.

Mainnet requires a separate security, funding, key-custody, privacy, retention,
monitoring, and incident-response review. Calibration evidence must never be
relabeled as mainnet evidence.

## Delivery phases and estimate

1. Documentation and provider contract: 2 to 3 engineering hours.
2. Calibration wallet, test funding, upload, retrieval, and proof spike: 3 to 5
   engineering hours.
3. Encrypted asynchronous adapter, CockroachDB records, retries, and tests: 7 to
   12 engineering hours.
4. Status surface, Midnight binding, security review, deployment, and public
   verification: 4 to 7 engineering hours.

A credible deployed TestWired integration is approximately 16 to 27 engineering
hours, excluding faucet delays and the wait for the first
PDP (Proof of Data Possession). Mainnet funding, monitoring, and operational
hardening add a separate estimated 8 to 16 engineering hours.

## Existing repository evidence

The attributed upstream adapter baseline contains a configurable
IPFS (InterPlanetary File System) gateway read, bounded retrieval, digest
verification, and an opt-in earlier Lighthouse/Filecoin Calibration retrieval
test. This is useful source and provenance evidence only. It is not part of the
active Lambda runtime and does not establish current hosted Filecoin
availability.

See:

- `packages/helix-adapter/src/upstream-baseline/backend.ts`
- `packages/helix-adapter/test/upstream-baseline/adapter-helixctw.test.ts`
- `packages/helix-adapter/sql/upstream-baseline/001_init.sql`

## Advisory ideation

[Penny's Filecoin braid notes](PENNY_FILECOIN_BRAID_NOTES_2026-08-15.md)
apply this plan to the broader DIDzM (DIDzMonolith) braided-mesh architecture and compare the
Synapse SDK (Software Development Kit) with Filecoin Pin. The note is advisory
design input. This document and `IMPLEMENTATION_STATUS.md` remain the controlling
architecture and status sources.

## Official references

- [Filecoin Calibration](https://docs.filecoin.io/networks/calibration)
- [Filecoin networks](https://docs.filecoin.io/basics/what-is-filecoin/networks)
- [Filecoin Onchain Cloud getting started](https://docs.filecoin.cloud/getting-started/)
- [Synapse SDK (Software Development Kit)](https://docs.filecoin.cloud/developer-guides/synapse/)
- [Filecoin upload pipeline](https://docs.filecoin.cloud/developer-guides/storage/upload-pipeline/)
- [Filecoin storage operations](https://docs.filecoin.cloud/developer-guides/storage/storage-operations/)
- [Filecoin privacy and access control](https://docs.filecoin.io/builder-cookbook/data-storage/privacy-and-access-control)
- [PDP (Proof of Data Possession) overview](https://docs.filecoin.cloud/core-concepts/pdp-overview)
- [Filecoin session keys](https://docs.filecoin.cloud/developer-guides/session-keys/)
- [Midnight Compact JavaScript runtime](https://docs.midnight.network/guides/compact-javascript-runtime)

## Maintenance rule

Update this document, `ARCHITECTURE.md`, `IMPLEMENTATION_STATUS.md`, and the
provider contract together whenever the storage policy, network, encryption
boundary, lifecycle, promotion evidence, or live status changes.

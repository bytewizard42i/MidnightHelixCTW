# Leveraging Filecoin in the MidnightHelixCTW braided mesh

**From Penny, to John and Clara:** August 15, 2026

> Scope note: these are advisory notes for **MidnightHelixCTW only**. They do
> not change `IMPLEMENTATION_STATUS.md`, promote any capability, or touch
> TaskFence in any way. Sources: this repo's `FILECOIN_INTEGRATION.md`,
> `ARCHITECTURE.md`, `MIDNIGHT_TRUST_BOUNDARY.md`, `COCKROACH_MEMORY_DESIGN.md`,
> `database/migrations/001_testwired_memory_core.sql`; DIDzM (DIDzMonolith)
> design history (HelixCTW `ARCHITECTURE.md`, `DIDZM_INTEGRATION_MAP.md`,
> didz-kernel `COLD_LAYER_FINDINGS.md`) consulted as background only; Synapse
> SDK (Software Development Kit) and Filecoin Pin documentation verified online
> on this date.

---

## 1. Where we actually stand (honest baseline)

- **Filecoin is `PLANNED`.** MidnightHelixCTW does not upload, retrieve, fund a
  wallet, submit a storage transaction, or verify a live PDP (Proof of Data
  Possession) today. The only Filecoin-adjacent code is the provenance-marked
  `packages/helix-adapter/src/upstream-baseline/` material (hash-verified
  gateway reads from the earlier Lighthouse spike). It is preserved source, not
  wired into the deployed Lambda.
- What is live: AWS (Amazon Web Services) transport through API (Application
  Programming Interface) Gateway and Lambda, plus the public judge UI (User
  Interface). The CockroachDB foundation now has an applied additive schema and
  verified least-privilege roles. The deployed Lambda still has no database
  bootstrap, the environment marker is not activated, and persistent memory and
  vector retrieval are not proven. Midnight, Bedrock, and Managed MCP (Model
  Context Protocol) remain `PLANNED`.
- **Filecoin is explicitly outside the critical hackathon path.** Priority Zero
  remains CockroachDB persistent memory, vector retrieval, read-only Managed
  MCP (Model Context Protocol), the complete judge flow, and the demo video.
  Nothing in this file should displace that work before August 25.

## 2. Filecoin's strand in the braid

The braided-mesh model gives each strand exactly one kind of truth. Filecoin is
the **cold strand**, durable ciphertext, never live truth:

| Strand | Kind of truth | Filecoin's relationship to it |
| --- | --- | --- |
| Midnight | Policy and commitments (the court) | Governs the storage policy and evidence lifecycle; never performs the upload. Receives only bounded receipt commitments back. |
| CockroachDB | Operational memory and manifest (the hot index) | The searchable map TO Filecoin: PieceCID (Piece Content Identifier), digests, provider receipts, retry state, retention class. Never the decryption keys. |
| Filecoin | Immutable encrypted evidence capsules (the cold vault) | Client-encrypted bytes only. Never plaintext, keys, or mutable authorization state. |
| Archival worker (the weave) | Movement and verification | Canonicalize, encrypt, upload, retrieve-verify, receipt. The only genuinely new software. |

Key braid disciplines already decided in `FILECOIN_INTEGRATION.md` and worth
holding firm:

1. **Asynchronous strands, one atom.** The Midnight transition and the Filecoin
   upload are never one atomic cross-chain transaction. The atom is the
   CockroachDB transaction: memory commit + idempotent archival outbox job in
   one serializable unit. If Filecoin is down, memory stays valid and the job
   stays visibly pending. No mock fallback; fail closed.
2. **Lifecycle is a state machine, not a boolean.**
   `AUTHORIZED -> UPLOAD_PENDING -> FILECOIN_COMMITTED -> RETRIEVAL_VERIFIED ->
   ARCHIVE_CONFIRMED`, with every skipped or reversed transition rejected. A
   successful upload request alone never reaches `ARCHIVE_CONFIRMED`.
3. **Possession of a PieceCID (Piece Content Identifier) is not authorization.**
   Disclosure always goes back through identity, grant, purpose, scope, and
   retention checks, then digest and manifest-commitment verification, before
   any plaintext projection is returned.
4. **Encryption before any byte leaves the trusted runtime**, envelope keys
   outside both Filecoin and CockroachDB, key destruction as crypto-shredding
   for retention expiry, while never claiming physical erasure of every
   replicated copy.

## 3. Recommended client path: Synapse SDK (Software Development Kit) (primary reference)

The Synapse SDK (Software Development Kit) (`@filoz/synapse-sdk`, Filecoin
Onchain Cloud) maps almost one-to-one onto the three-method adapter contract
already specified in `FILECOIN_INTEGRATION.md`, and it is a better fit for our current
requirements than the old Lighthouse path:

| Our adapter contract | Synapse SDK (Software Development Kit) surface | Notes |
| --- | --- | --- |
| `uploadEncryptedArtifact(ciphertext, manifest)` | `synapse.storage.upload(bytes)` | Returns `pieceCid` (`bafkzcib...`), `size`, `copies[]`, `complete`, `failedAttempts[]`. Defaults to **2 independent providers** (primary + secondary via SP-to-SP (storage provider to storage provider) pull), each with its own data set, PDP (Proof of Data Possession) proofs, and payment rails. `copies[]` is exactly the `provider_copy_receipts` field our manifest schema wants. **Check `complete === true`**, the call only throws when zero copies commit. |
| `retrieveEncryptedArtifact(pieceCid, expectedDigest)` | `synapse.storage.download({ pieceCid })` | Provider-agnostic download; we then re-verify the ciphertext SHA-256 (Secure Hash Algorithm 256-bit) digest and, after decryption, recompute the hiding manifest commitment with protected opening material. The weave's serve-or-refuse rule stays OURS, never outsourced to the transport. |
| `readStorageProofStatus(pieceCid)` | data-set / PDP (Proof of Data Possession) status via storage context and on-chain data set state | This is what lets the public status surface distinguish upload, replication, retrieval, and PDP (Proof of Data Possession) states, as promotion evidence item 11 requires. |

Practical constraints confirmed against current docs:

- Piece size: **minimum 127 bytes, maximum ~1 GiB (gibibyte)** per upload.
  Evidence capsules fit comfortably; enforce our own bounded-size check below
  the SDK (Software Development Kit)'s ceiling anyway.
- Network: explicit **Calibration** (chain identifier `314159`) configuration, test FIL
  (Filecoin network token) for gas and test **USDFC (Filecoin-community
  stablecoin pegged to the United States dollar)** for storage payments (Synapse's payment rail, budget
  faucet time for BOTH). Mainnet config must fail closed unless a reviewed
  production release enables it.
- Wallet: root key offline; the worker gets a short-lived, least-privilege
  session key (Filecoin Onchain Cloud supports session keys natively).
- Wrap the SDK (Software Development Kit) behind our small internal interface.
  Do not leak `@filoz` types across MidnightHelixCTW; the adapter's public
  return type carries only reviewed, sanitized evidence fields.

### Why this beats the Lighthouse path from the design-history spike

The didz-kernel cold-layer findings (August 3, 2026) proved the weave's
retrieve-and-verify loop end-to-end on a real IPFS (InterPlanetary File System)
node, and recorded an HTTP (Hypertext Transfer Protocol) 402 response from
the Lighthouse hosted-gateway path under the tested network and trial
configurations. Synapse avoids that Lighthouse gateway dependency: retrieval
comes from the storage providers that committed on-chain, replication is a
first-class SDK (Software Development Kit) concern, and PDP (Proof of Data
Possession) status is queryable. The upstream-baseline code remains valuable
as provenance and as the reference implementation of hash-verified
serving.

## 4. Filecoin Pin (secondary reference): when and when not

Filecoin Pin (`filecoin-project/filecoin-pin`) sits ON TOP of the Synapse SDK
(Software Development Kit). It adds: Helia UnixFS (Unix File System) DAG
(Directed Acyclic Graph) creation, CAR (Content Addressable aRchive) packing, an
IPFS (InterPlanetary File System) root CID (Content Identifier) alongside the
PieceCID (Piece Content Identifier), IPNI (InterPlanetary Network Indexer)
advertisement, and an IPFS (InterPlanetary File System) Pinning Service API
(Application Programming Interface) daemon.

- **Not needed for the first archival path.** Our capsules are opaque
  ciphertext; nobody should fetch them from public IPFS (InterPlanetary File
  System) gateways, and an IPFS (InterPlanetary File System) root CID (Content
  Identifier) adds a public-discoverability surface we do not want for private
  evidence.
- **Where it IS the right pattern:** intentionally public artifacts, schemas,
  specifications, release manifests, and public fixture snapshots, where an
  `ipfs://` root CID (Content Identifier) retrievable from IPFS
  (InterPlanetary File System) Mainnet is a feature. Treat its CAR (Content
  Addressable aRchive) and UnixFS (Unix File System) core modules as the
  reference for that later, separate lane.
- Never expose it as an unrestricted public pinning endpoint.

The Filecoin Pin website is a useful example of an honest status UI (User
Interface) (upload / on-chain commit / IPNI (InterPlanetary Network Indexer)
indexing / retrievability shown as separate states), the same separation our
promotion evidence demands.

## 5. What rides the cold strand (and what never does)

Store (as encrypted, versioned, minimized capsules):

- credential-evidence attachments; property/certification/compliance/provenance
  documents; signed agent-action evidence bundles; long-term memory snapshots
  that are NOT the live recall index; versioned audit and reconstruction
  packages; intentionally public schemas and release manifests.

Never store:

- keys, seed phrases, plaintext identity or biometric data, mutable
  authorization/consent/revocation state, active sessions or low-latency
  memory, unredacted prompts or logs, anything with unreviewed
  retention/deletion law, or the sole copy of evidence an active service needs.

And remember the metadata surface: encryption hides bytes, not facts. Wallet
activity, sizes, timing, providers, PieceCIDs (Piece Content Identifiers), and
proof records stay observable and get their own privacy review.

## 6. How the braid strengthens the reconstruction story

The rebuild proof in `ARCHITECTURE.md` §Reconstructibility is application-layer
today (replay canonical CockroachDB records into a shadow projection
generation). Filecoin extends it later without changing its shape:

- Encrypted canonical snapshots and index checkpoints on Filecoin can become a
  replay source after hot-layer loss only when current evidence proves successful
  retrieval, an active storage service and renewal path, expected provider
  copies, and retained decryption keys (design-history Rule 2: the hot index is
  a cache of truth, not the truth).
- Midnight commitments verify that a reconstructed projection matches what was
  committed, but, as `MIDNIGHT_TRUST_BOUNDARY.md` insists, a commitment can
  verify restored information and can never recreate missing ciphertext.
  Filecoin can provide independently retrievable ciphertext only while the
  storage service, renewal path, and provider-copy evidence remain valid. Key
  custody makes that ciphertext recoverable. Both conditions are required for
  the honest claim.

## 7. Suggested sequencing (after August 25, unless Priority Zero finishes early)

Matches the phases and 16 to 27 engineering-hour TestWired estimate in
`FILECOIN_INTEGRATION.md`:

1. **Spike (3 to 5 engineering hours):** Calibration wallet, faucet FIL
   (Filecoin network token) + USDFC (Filecoin-community stablecoin pegged to the United States dollar),
   one `synapse.storage.upload` / `download` round trip of a synthetic
   encrypted TestTown artifact; record sanitized transaction, `pieceCid`, and
   `copies[]` evidence.
2. **Adapter + outbox (7 to 12 engineering hours):** migration `002` adding
   the archival manifest/outbox tables (append-only, bounded fields,
   idempotency keys, status-transition checks, using the same house style as
   `001_testwired_memory_core.sql`); the async worker; the three-method
   adapter; the full deterministic test list from `FILECOIN_INTEGRATION.md`,
   including tamper, outage, and unauthorized-retrieval negatives.
3. **Status + Midnight binding (4 to 7 engineering hours):** public status
   distinguishing upload / replication / retrieval / PDP (Proof of Data
   Possession); bounded storage-receipt commitment accepted by the Midnight
   policy contract; promotion evidence items 1 to 12 before any
   `LIVE_TESTWIRED` badge.

Until every promotion item is recorded, the UI (User Interface) keeps saying
`PLANNED` / `SOURCE_ONLY`. No silent label upgrades, because that honesty is
itself part of the pitch.

- Penny 🎀

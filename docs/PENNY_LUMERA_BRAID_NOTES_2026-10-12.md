# Leveraging Lumera Cascade in the MidnightHelixCTW braided mesh

**From Penny, to John and Clara:** October 12, 2026

> Scope note: advisory notes for **MidnightHelixCTW only**. They do not change
> `IMPLEMENTATION_STATUS.md`, promote any capability, or displace the Filecoin
> lane. Sources: this repo's `FILECOIN_INTEGRATION.md`, `ARCHITECTURE.md`,
> `MIDNIGHT_TRUST_BOUNDARY.md`, `PENNY_FILECOIN_BRAID_NOTES_2026-08-15.md`;
> Lumera Protocol documentation (docs.lumera.io) verified online on this date.
> The parent deep dive lives at
> `DIDzMonolith-docs/DEEP_DIVE_Lumera_Protocol_2026-10-12.md`; the adapter-level
> design at `HelixCTW/docs/LUMERA_CASCADE_INTEGRATION.md`.

---

## 1. Where we actually stand (honest baseline)

- **Lumera is `PLANNED`.** Nothing here uploads to, retrieves from, or pays a
  Lumera wallet today. There is zero Lumera-adjacent code in this repository —
  less even than the Filecoin lane's preserved Lighthouse baseline. This note
  evaluates a *candidate*, it does not wire anything.
- **Filecoin remains the primary cold strand** per
  `PENNY_FILECOIN_BRAID_NOTES_2026-08-15.md`. Cascade is evaluated as a second
  strand behind the same adapter contract, not a replacement. Its one
  structural advantage — pay-once permanence — matters exactly where Filecoin
  is weakest (renewal lifecycle), and its one structural weakness — a far
  smaller node set — matters exactly where Filecoin is strongest. They are
  complementary, which is the honest reason to keep both on the table.
- **Lumera's "Agent Memory" is a published design, not a product.** The
  append-only, client-encrypted memory spec describes almost exactly our
  TestWired memory thesis — honest durability states (`accepted → anchored →
  proven`), sealed immutable segments, portable manifest root, and the flat
  statement that *losing the log key means losing the memory*. It is the
  strongest external validation of our architecture we have found — and its
  client libraries are **not released**. Validation, not a dependency.

## 2. Cascade's strand in the braid

Same shape as the Filecoin mapping — one kind of truth per strand:

| Strand | Kind of truth | Cascade's relationship to it |
| --- | --- | --- |
| Midnight | Policy and commitments (the court) | Governs the storage policy and evidence lifecycle; receives only bounded receipt commitments back (`action_id`, state, `data_hash`). |
| CockroachDB | Operational memory and manifest (the hot index) | The searchable map TO Cascade: `action_id`, BLAKE3 `data_hash`, action states, task receipts, retention class. Never the decryption keys. |
| Lumera Cascade | Immutable encrypted evidence capsules (the cold vault) | Client-encrypted bytes only, RaptorQ-erasure-coded across bonded SuperNodes. Permanent via Everlight funding, provable via on-chain storage challenges. |
| Archival worker (the weave) | Movement and verification | Canonicalize, encrypt, register, upload, retrieve-verify, receipt. |

The braid disciplines hold verbatim — asynchronous strands with the
CockroachDB transaction as the one atom; lifecycle as a state machine
(`AUTHORIZED → UPLOAD_PENDING → ACTION_REGISTERED → CASCADE_COMMITTED →
RETRIEVAL_VERIFIED → ARCHIVE_CONFIRMED`); possession of an `action_id` is not
authorization; encryption before any byte leaves the trusted runtime.

## 3. Adapter contract mapping

`@lumera-protocol/sdk-js` (Node via SN-API) maps onto the same three-method
contract as the Synapse lane:

| Our adapter contract | Cascade SDK surface | Notes |
| --- | --- | --- |
| `uploadEncryptedArtifact(ciphertext, manifest)` | `prepareFile` → `registerAction` → `sendFileToSupernodes` | Returns `actionId` — the `action_id` is our PieceCID analog. **Check final on-chain state `DONE`** via `Blockchain.Action.getAction`, not just task completion — the equivalent of the `complete === true` rule. `FAILED`/`EXPIRED` actions auto-refund the escrowed fee. |
| `retrieveEncryptedArtifact(actionId, expectedDigest)` | `downloader.downloadPrivate(actionId)` | ADR-036 owner signature applied by the worker signer. We then re-verify ciphertext digest and manifest commitment ourselves — serve-or-refuse stays ours. |
| `readStorageProofStatus(actionId)` | `Blockchain.Action.getAction(actionId)` + storage-challenge recency | `PENDING/PROCESSING/DONE/FAILED/EXPIRED` plus third-party retention proofs — arguably *better* promotion evidence than PDP status because the proofs are on a public chain. |

Testnet is `lumera-testnet-2` with free faucet LUME — an even cheaper spike
than Calibration's FIL + USDFC pair.

## 4. The one structural difference that matters

**Permanence without renewal.** Filecoin deals expire and must be renewed;
Cascade charges once and the Everlight fund pays operators indefinitely.
For evidence capsules — things that must simply *exist* years later — this
removes the entire renewal-monitor failure class.

The price of that: **no delete mechanism at all.** Crypto-shredding is the
only erasure story, and metadata (action IDs, sizes, timing, wallet activity)
is on a public chain regardless. Retention classification before upload
becomes absolute, not advisory.

## 5. Suggested sequencing

Identical cadence to the Filecoin plan, and strictly *after* it in priority:

1. **Spike (3–5 eng-hrs):** testnet wallet, faucet LUME, one synthetic
   encrypted-capsule round trip; sanitized `action_id` + state + hash evidence.
2. **Adapter + outbox (7–12 eng-hrs):** additive migration for Cascade
   references; worker; the three-method adapter; deterministic negatives
   (tamper, outage, unsigned retrieval, refund path).
3. **Status + Midnight binding (4–7 eng-hrs):** status distinguishing
   registered / distributing / DONE / challenge-proven; bounded receipt
   commitment to the Midnight policy contract.

Until those evidence items exist, everything stays `PLANNED` — no silent label
upgrades, because that honesty is itself part of the pitch.

- Penny 🎀

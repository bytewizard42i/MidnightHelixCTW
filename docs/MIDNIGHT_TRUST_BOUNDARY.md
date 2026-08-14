# Midnight trust boundary

Midnight is the privacy trust plane in MidnightHelixCTW. It is not the primary
memory database, a document warehouse, or a magic backup.

## Division of responsibility

| Component | Stores or proves |
| --- | --- |
| CockroachDB Cloud | Sessions, memory events, safe summaries, privacy-safe vectors, exact state, projection manifests, and receipts. |
| Encrypted object storage | Synthetic private evidence envelopes and versioned canonical test artifacts. |
| Midnight test network | Randomized commitments, policy state, proof verification state, and single-use authorization state when implemented. |
| Browser or approved evaluator | Witness material and decryption secrets needed for the narrow test proof. |
| DIDz mock | Synthetic requester identity and role. |
| AgenticDID mock | Synthetic delegated scope, expiry, and attenuation. |
| RWAz mock | Synthetic persistent property identity and title-state reference. |

## Privacy rules

1. Never write deed text, mortgage text, personal identifiers, encryption keys, or
   low-entropy naked hashes to a public ledger.
2. Use randomized commitments for private values so an observer cannot simply
   guess the source value and compare hashes.
3. A vector can locate an approved non-sensitive descriptor. It cannot authorize
   access and it cannot describe encrypted content that the embedding model never
   received.
4. Authorization is checked before decryption or model invocation involving
   protected material.
5. The result disclosed to the agent is the minimum predicate required by the
   scenario, not the underlying record.
6. A transaction or proof receipt must identify the network, contract or circuit
   version, commitment, and source release commit.

## Honest reconstruction claim

Midnight can help verify that a reconstructed projection corresponds to a
previously committed manifest. It cannot recreate ciphertext that no longer
exists.

The TestWired rebuild therefore means:

1. preserve canonical encrypted test artifacts and append-only memory events;
2. create a new empty derived projection generation;
3. replay and validate the canonical records;
4. regenerate only approved privacy-safe summaries and vectors;
5. compare the reconstructed manifest commitment with the expected commitment;
6. atomically activate the new generation;
7. keep the old generation available until verification completes.

Full-cluster recovery requires an independent encrypted backup and key-recovery
plan in addition to CockroachDB's own replication and recovery facilities.

## Live-evidence gate

The UI may say `LIVE MIDNIGHT TEST NETWORK` only after the current repository has
produced and verified a real test-network transaction or proof receipt. A local
Compact compile is labeled `VERIFIED LOCAL`. A deterministic substitute is
`MOCK`. Failure never silently changes one label into another.

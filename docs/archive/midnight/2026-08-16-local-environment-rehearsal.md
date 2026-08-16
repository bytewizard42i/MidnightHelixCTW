# Local Midnight environment rehearsal and scaffold evidence — 2026-08-16

**Author:** Penny, under Clara's sequencing for John
**Scope:** evidence record for the `local-midnight/` scaffold pull request
(branch `codex/penny-local-midnight`). Archived, dated evidence — not a
living instruction file.

This note records what was verified while designing and rehearsing the
pinned local Midnight development stack, using the canonical DIDzM
(DIDzMonolith) source-routing policy. The retired Idris/Olanetsoft MCP
(Model Context Protocol) integration was not used at any point.

**This milestone cannot and does not claim `VERIFIED LOCAL`.** The node,
indexer, proof server, wallet, deployment, transaction, and ledger readback
were never run. Every network-facing behavior below is `PROPOSED`.

---

## Evidence date and retrieval path

All version evidence was retrieved fresh on **2026-08-16**. Direct fetches
of `docs.midnight.network` were rate-limited (HTTP 429) throughout the day,
so the officially endorsed Kapa MCP (`https://midnight.mcp.kapa.ai`) served
as the retrieval interface; it returned the compatibility matrix and the
official deployment guide verbatim with source URLs
(`https://docs.midnight.network/relnotes/support-matrix`,
`https://docs.midnight.network/guides/`). Package versions were
independently confirmed against the npm registry with `npm view`.

## VERIFIED SOURCE (file inspection or authoritative citation)

| Claim | Evidence |
| --- | --- |
| Compact devtools 0.5.1 / toolchain 0.31.1 / language 0.23 (pragma `>= 0.22 && <= 0.23`) | Official compatibility matrix, retrieved 2026-08-16 |
| Midnight.js 4.1.1, compact-runtime 0.16.0, wallet SDK (Software Development Kit) 1.2.0, dapp-connector-api 4.0.1, testkit-js 4.1.1, wallet-sdk-address-format 3.1.2 | Compatibility matrix + npm registry `dist-tags` (same date) |
| Local image trio: `midnightntwrk/midnight-node:1.0.0`, `midnightntwrk/indexer-standalone:4.3.3`, `midnightntwrk/proof-server:8.1.0` | Official local-network example (ZK Loan / midnight-local-dev), whose compose pins exactly this trio |
| Local node 1.0.0 vs public-network node 1.0.1, and local indexer 4.3.3 vs Preview 4.3.5 / Preprod `4.3.3-hotfix`, are INTENTIONAL differences | The matrix governs public-network pairings; the official local example governs the local `undeployed` stack, validated as a trio |
| Minimum Node.js is **22+** (the SDK uses Iterator helpers; Node 20 crashes at first wallet sync) | Official ZK Loan prerequisites |
| wallet-sdk npm `latest` dist-tag trap: `latest` resolves **1.1.0**, matrix requires **1.2.0** — exact pins only, no caret ranges | `npm view @midnight-ntwrk/wallet-sdk dist-tags`, 2026-08-16 |
| Indexer 4.3.3+ requires SPO (Stake Pool Operator) env vars (`APP__INFRA__SPO_NODE__URL`, non-empty `APP__INFRA__SPO_NODE__BLOCKFROST_ID`) | Official compose for indexer-standalone 4.3.3 |
| Health-check commands match these exact image versions | Taken verbatim from the official Battleship tutorial compose and midnight-local-dev compose for the same tags (authority-verified; first supervised start will execution-verify) |
| Locally pulled image digests | node 1.0.0 `sha256:ede01da35e98…`, indexer 4.3.3 `sha256:03afd079b00b…`, proof-server 8.1.0 `sha256:801bbc0340e9…` (`docker images --digests`) |

## VERIFIED TOOLING (successful local execution, no services started)

| Check | Result |
| --- | --- |
| `docker compose -f local-midnight/standalone.yml config` | Exit 0, no warnings; rendered output shows `host_ip: 127.0.0.1` on all three published ports (9944, 8088, 6300) and only pinned tags |
| `npm ci --ignore-scripts` in `local-midnight/` | Clean install from the committed exact-pin lockfile |
| TypeScript type check (`npx tsc --noEmit`, strict, NodeNext) | Exit 0 — every import and named symbol in `smoke-test.mts` exists in the installed pinned packages |
| `/home/js/.local/bin/compact compile` of `contracts/smoke_commitment.compact` | Exit 0, toolchain 0.31.1, no skip flags; full inventory generated: `compiler/contract-info.json`, `contract/index.js` + `index.d.ts` + map, `keys/recordCommitment.prover` + `.verifier`, `zkir/recordCommitment.zkir` + `.bzkir`. Output kept only in the git-ignored artifact directory |
| Wallet SDK 1.2.0 barrel import under Node v22.23.2 | Loads; exports `WalletFacade`, `WalletSeed`, `HDWallet`, `DustWallet`, `generateRandomSeed` — the symbols the proposed wallet step needs |
| Sensitive-value scan across every proposed file | Only published development-only placeholders from official docs remain (indexer example env); a development password literal found in an early driver draft was removed and replaced with the `MIDNIGHT_SMOKE_STATE_PASSWORD` environment variable; no wallet seed appears anywhere (the genesis dev seed is referenced only as the env-var name `MIDNIGHT_GENESIS_SEED`) |
| `git diff --check` | Clean (no whitespace errors) |

The exact per-command transcripts from the disposable rehearsal lived under
`/tmp` (`midnighthelixctw-local-midnight-candidate`) and are not committed;
this note is the durable summary. All tooling checks above were re-run
against the promoted files in the pull-request worktree before commit.

## PROPOSED at scaffold time — EXECUTED later the same day (see below)

The six network-facing steps listed in the original scaffold plan (stack
start, wallet + DUST, deploy, one commitment transaction, fail-closed
ledger readback, sanitized receipt) were all executed under supervision on
2026-08-16 in the authorized execution milestone. Evidence follows.

---

# Execution milestone addendum — 2026-08-16 (same day)

Authorized by John and Clara as "execute one local Midnight commitment
flow." Only the local `mhelix-local-midnight` Compose project and local
development commands were run. No public network, AWS (Amazon Web
Services), CockroachDB, TaskFence, or credential-bearing service was
touched. No seed or password was printed, written to a file, placed in
command history, or committed; the genesis dev seed was supplied only via
the process environment (`MIDNIGHT_GENESIS_SEED`).

## Machine change recorded (host-level, outside the repository)

The host `.wslconfig` was raised from `memory=8GB, processors=4` (written
for a smaller machine) to `memory=16GB, processors=12` — this laptop has
31.1 GB physical RAM and 24 logical processors. Clara paused her Lambda
lane and approved the required `wsl --shutdown`. After restart:
`free -h` showed 15 Gi total / 11 Gi available; `docker info` showed
16.77 GB and 12 CPUs. This removed the standing RAM risk from the
scaffold-time notes.

## Checkpoint 1 — local network healthy (`VERIFIED LOCAL` evidence)

- Preflight: Docker Engine 29.6.2 responding; ports 9944/8088/6300 free
  before start (`ss -tlnp`); two unrelated running containers left
  untouched.
- `docker compose -f standalone.yml up -d`: **all three host endpoints
  answered within ~15 seconds** of `up`:
  - node `GET :9944/health` → `{"peers":0,"isSyncing":false,...}`
  - proof server `GET :6300/health` → `{"status":"ok",...}`
  - indexer GraphQL `{ block { height } }` → height ≥ 0 and rising
- Compose health states: all three `(healthy)`.
- Idle resource use (docker stats): node ≈ 194 MiB, indexer ≈ 22 MiB,
  proof server ≈ 10 MiB against the 15.6 GiB ceiling.
- No source fixes were required, so no separate
  `fix(midnight): make local devnet healthy` commit exists.

## Checkpoint 2 — one real contract transaction (`VERIFIED LOCAL`)

Implementation notes (all interfaces verified against installed exact-pin
packages and current official examples; comparison of official docs via
Kapa vs the Midnight Expert wallet plugin, per John's direction):

1. Wallet built with `FluentWalletBuilder` (exact-pinned
   `@midnight-ntwrk/testkit-js` 4.1.1, newly added with `pino`) +
   `MidnightWalletProvider.withWallet`. The convenience
   `MidnightWalletProvider.build()` was deliberately avoided because it
   logs the master seed, which this milestone forbids printing.
2. DUST options set explicitly (`additionalFeeOverhead:
   500_000_000_000_000_000n`, `feeBlocksMargin: 5`) because the testkit
   default of `0n` triggers devnet error 117 (NotNormalized) on the first
   contract call — a trap documented in the Midnight Expert wallet
   references and confirmed in the testkit source.
3. Contract compiled with `/home/js/.local/bin/compact compile` (toolchain
   0.31.1, no skip flags) into the git-ignored `artifacts/` directory.
4. `CompiledContract.make('MhelixSmokeCommitment', Contract).pipe(
   withVacantWitnesses, withCompiledFileAssets(...))` — the official
   Midnight.js 4.1.1 fluent pattern (matches `example-hello-world` and the
   testkit e2e suite) — then `deployContract`.
5. Wallet start auto-registered the genesis NIGHT UTXOs for DUST
   generation (testkit `waitForFunds` self-registration path); sync to
   funded state took ≈ 30–60 s.
6. One fresh 32-byte commitment from `crypto.randomBytes`, submitted via
   `callTx.recordCommitment`, then ledger readback THROUGH THE INDEXER
   (`publicDataProvider.queryContractState` + generated `ledger()`
   decoder), fail-closed on count and byte-equality.

**Defect found and fixed during execution** (committed as part of the
milestone commit): the first run failed with `expected instance of
StateValue`. Root cause: two physical nested copies of
`@midnight-ntwrk/onchain-runtime-v3` (WASM) in `node_modules`, so
`instanceof` failed across module instances. Fix: pin the transitive
package to the support-matrix version with an npm override
(`"@midnight-ntwrk/onchain-runtime-v3": "3.0.0"` — compact-runtime's
`^3.0.0` range otherwise resolves 3.1.0) and regenerate the lockfile so a
single hoisted copy exists. `npm ls` now shows one copy, `overridden` +
`deduped`.

**Run 1 (running chain), sanitized receipt (exit 0):**

```json
{
  "label": "VERIFIED LOCAL",
  "networkId": "undeployed",
  "contractAddress": "8a7bd24e83dab5a0e9ab2d98b83b4cd2ce5d2e18dfb5009a703ac372616d4edd",
  "txId": "00c27998e7a0631f2e4be420de4b8072e69c56567ae9deeb62f20677d35de44188",
  "blockHeight": 98,
  "circuit": "recordCommitment",
  "publicCommitmentHex": "978b1d471eb8cacf7202c84c36dac2acbd76208f46eb6e1c7a80a59343d93b11",
  "checks": { "commitmentCountIsOne": true, "commitmentMatches": true },
  "sourceCommit": "9eff7fb",
  "compiler": "0.31.1",
  "images": { "node": "1.0.0", "indexer": "4.3.3", "proofServer": "8.1.0" },
  "timestamp": "2026-08-16T12:02:55.704Z"
}
```

**Run 2 (repeatability, from a clean chain reset — fresh `compose down`
+ `up`, block height restarted at 1), sanitized receipt (exit 0):**

```json
{
  "label": "VERIFIED LOCAL",
  "networkId": "undeployed",
  "contractAddress": "4063c6bc812e8a647eac2e9be7c7da4aa7c3967fff1f4139383c37d7e96f6b4a",
  "txId": "00203fae0ee6cf2c7e1fbcd3a6f0c1d2982556dd8daa8b3ac0fa11f028e6303333",
  "blockHeight": 14,
  "circuit": "recordCommitment",
  "publicCommitmentHex": "01efb0c0980aee29f7a6d7cd24c7b6de83d50863dd5e9db90c780406c5c76f80",
  "checks": { "commitmentCountIsOne": true, "commitmentMatches": true },
  "sourceCommit": "9eff7fb",
  "compiler": "0.31.1",
  "images": { "node": "1.0.0", "indexer": "4.3.3", "proofServer": "8.1.0" },
  "timestamp": "2026-08-16T12:04:44.855Z"
}
```

End-to-end wall time per run (wallet sync through verified readback):
≈ 80–90 seconds on the upgraded 16 GB / 12-core WSL VM. Repeatability is
therefore VERIFIED, not assumed.

**Label scope:** `VERIFIED LOCAL` applies to this local disposable network
only, per the trust boundary
([../../MIDNIGHT_TRUST_BOUNDARY.md](../../MIDNIGHT_TRUST_BOUNDARY.md)).
Public-network, AWS (Amazon Web Services), CockroachDB, and production
claims are unchanged. `LIVE MIDNIGHT TEST NETWORK` still requires a real
public test-network receipt and remains out of scope.

Runtime artifacts (`midnight-level-db/` private-state store, `logs/`
testkit logger output) were scanned (no seed strings), added to
`.gitignore`, and deleted — never committed.

## BLOCKED

Nothing is blocked. All gates attempted in this milestone passed.

## Operational risks recorded

1. **Port collision:** John's older local Midnight stack
   (midnight-local-dev copy) publishes the same host ports 9944/8088/6300.
   This scaffold uses a unique Compose project name
   (`mhelix-local-midnight`) and `mhelix-*` container names, so the stacks
   cannot destroy each other, but only one may run at a time.
2. **RAM headroom:** RESOLVED same day — the WSL (Windows Subsystem for
   Linux) cap was raised from 8 GB to 16 GB (see the execution addendum);
   proving now has comfortable headroom.
3. **Root Node.js engine observation (recorded here, deliberately NOT
   changed in this pull request):** the repository root `package.json`
   declares `"engines": { "node": ">=20" }`, but the current wallet SDK
   requires Node 22+. When Midnight work is promoted, the root engine
   floor should be raised to `>=22` in its own reviewed change.
4. `/home/js/PixyPi/MIDNIGHT_COMPACT_V030_QUIRKS.md` was consulted as
   historical guidance only; its old pragma range and retired-MCP workflow
   were not copied into any current instruction.

## Committed versus excluded

Committed under `local-midnight/`: pinned `standalone.yml`, safe
`standalone.env.example`, scoped `.gitignore`, plain-language `README.md`,
exact-pin `package.json` + `package-lock.json` (execution milestone added
exact-pinned `@midnight-ntwrk/testkit-js` 4.1.1 and `pino`, plus the
`onchain-runtime-v3` 3.0.0 override), `tsconfig.json`,
`contracts/smoke_commitment.compact`, executable `smoke-test.mts`.

Excluded by design: `node_modules/`, `.state/`, `midnight-level-db/`,
generated proving keys and compiled artifacts, rendered Compose output,
`logs/`, and any seed, key, password, witness, credential, or
reconstructible protected data.

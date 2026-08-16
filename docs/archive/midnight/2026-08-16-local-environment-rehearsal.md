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

## PROPOSED (requires a running Midnight network — not executed)

1. Start the pinned local stack (`docker compose up`), health-verified.
2. Build and sync the genesis dev wallet (wallet SDK 1.2.0); ensure DUST
   registration for fees.
3. Deploy the compiled `smoke_commitment` contract with
   `deployContract` (Midnight.js 4.1.1).
4. Submit one randomized-commitment transaction via
   `callTx.recordCommitment`.
5. Read back ledger state (`getPublicStates`) and assert
   `commitmentCount == 1` and commitment equality, fail-closed.
6. Emit a sanitized evidence receipt (network id, contract address,
   transaction id, block height, circuit, compiler and image versions,
   timestamp — never secrets).

Only after all six succeed under supervision may anything be labeled
`VERIFIED LOCAL` per the trust boundary
([../../MIDNIGHT_TRUST_BOUNDARY.md](../../MIDNIGHT_TRUST_BOUNDARY.md)).
`LIVE MIDNIGHT TEST NETWORK` additionally requires a real public
test-network receipt and is far out of scope.

## BLOCKED

Nothing is blocked. All gates attempted in this milestone passed.

## Operational risks recorded

1. **Port collision:** John's older local Midnight stack
   (midnight-local-dev copy) publishes the same host ports 9944/8088/6300.
   This scaffold uses a unique Compose project name
   (`mhelix-local-midnight`) and `mhelix-*` container names, so the stacks
   cannot destroy each other, but only one may run at a time.
2. **RAM headroom:** the proof server can use 2–4+ GiB while proving; the
   WSL (Windows Subsystem for Linux) cap on this machine is 7.8 GiB.
   Coordinate before the first supervised start.
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
exact-pin `package.json` + `package-lock.json`, `tsconfig.json`,
`contracts/smoke_commitment.compact`, `smoke-test.mts`.

Excluded by design: `node_modules/`, `.state/`, generated proving keys and
compiled artifacts, rendered Compose output, logs, and any seed, key,
password, witness, credential, or reconstructible protected data.

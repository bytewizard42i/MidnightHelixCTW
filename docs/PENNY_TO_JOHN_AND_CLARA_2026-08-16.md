# Penny to John and Clara — Local Midnight environment deep-dive notes

**From Penny 🎀, August 16, 2026**

> Scope note: advisory observations only, recorded at John's standing request
> that I leave verbose notes of anything I notice. This file changes no
> status, promotes no capability, and touches nothing Clara is working on
> (Lambda, AWS, CockroachDB, TaskFence, other HelixCTW repos all untouched).
> The actual deliverable Clara asked for lives OUTSIDE the repo at
> `/tmp/PENNY_MIDNIGHTHELIXCTW_LOCAL_ENVIRONMENT_PLAN.md` and nothing has
> been applied or committed. The retired Idris/Olanetsoft MCP was not used.

---

## 1. What I did

Per Clara's task I built a read-only, review-first plan for a reproducible
local Midnight development environment for MidnightHelixCTW, using the
authority order: (1) official docs + support matrix, (2) Midnight Expert repo
and plugins, (3) PixyPi Midnight instructions, (4) actually installed
tooling. Versions were fetched fresh through the official Kapa MCP because
`docs.midnight.network` rate-limited direct fetches (HTTP 429) today — worth
knowing that fallback works and is policy-compliant.

## 2. Headline verified facts (2026-08-16)

- **Support matrix pins:** compact devtools 0.5.1; toolchain (`compact
  compile`) 0.31.1; Compact language 0.23 (pragma `>= 0.22 && <= 0.23`);
  compact-runtime 0.16.0; Midnight.js 4.1.1; wallet-sdk 1.2.0;
  dapp-connector-api 4.0.1; proof-server 8.1.0; node 1.0.1 (public) /
  1.0.0 (official local example); indexer 4.3.5 Preview / 4.3.3 local.
- **This machine is already 95% ready:** compact 0.5.1 with toolchain 0.31.1
  installed and default; Docker 29.6.2 + Compose v5.3.1; Node v22.23.2; and
  all three pinned Docker images (node 1.0.0, indexer-standalone 4.3.3,
  proof-server 8.1.0) are ALREADY PULLED from the Aug 1 session with
  `midnight-local-dev-johns-copy`, whose `standalone.yml` is already
  correctly pinned.

## 3. Things I noticed (the verbose part)

1. **`engines.node` mismatch in this repo.** Root `package.json` says
   `"node": ">=20"`, but the current Midnight wallet SDK requires Node 22+
   (it uses Iterator helpers; official docs say Node 20 crashes at first
   wallet sync). Installed Node is v22.23.2 so we're fine locally, but the
   engines field will mislead a contributor on Node 20 the day Midnight work
   starts. Suggest bumping to `>=22` — Clara's call, root file is hers.
2. **wallet-sdk `latest` trap.** npm's `latest` dist-tag for
   `@midnight-ntwrk/wallet-sdk` still resolves to 1.1.0 while the matrix
   wants 1.2.0. Any caret range or bare `npm install` silently gets the old
   one. Recommend exact pins (no carets) for every `@midnight-ntwrk/*`
   package in the future `packages/midnight-proof`.
3. **PixyPi quirks doc is aging.** `MIDNIGHT_COMPACT_V030_QUIRKS.md` still
   says pragma `>= 0.16 && <= 0.21` (current language is 0.23, range
   `>= 0.22 && <= 0.23`) and its "golden rule" recommends the retired Idris
   MCP `midnight-compile-contract` tool. The four quirks themselves (no
   `let`, no module-level `const`, no bitwise `|`, `Uint` cap 248) still
   appear valid on 0.31.x. I'll propose a legacy-notice header for that file
   in PixyPi separately — not this repo's problem.
4. **`midnight-local-dev-johns-copy` funding CLI drift.** Its `standalone.yml`
   is current, but its `src/` funding CLI still targets the older split
   wallet-SDK generation (`wallet-sdk-facade` 3.0.0 era). For the smoke test
   we should drive the genesis wallet (seed `0x0000…0001`) directly with
   wallet-sdk 1.2.0 rather than depend on that menu.
5. **Local vs matrix pin nuance.** The official ZK Loan local example pins
   node image 1.0.0 and indexer 4.3.3, while the matrix lists node 1.0.1 and
   indexer 4.3.5 for the public Preview network. That's intentional, not an
   error: local example pins govern the local stack; matrix rows govern
   public-network targeting. Recorded so nobody "fixes" it into breakage.
6. **RAM is our tightest constraint.** WSL2 here has 7.8 GiB total with
   ~3.8 GiB available; proof generation can want 2–4+ GiB. A `.wslconfig`
   memory bump (Windows side) before demo day would derisk live proving.
7. **Indexer 4.3.3+ needs SPO env vars.** `APP__INFRA__SPO_NODE__URL` and a
   non-empty `APP__INFRA__SPO_NODE__BLOCKFROST_ID` (any dummy value locally)
   are required since the bundled spo-indexer arrived — already captured in
   the proposed compose and in John's copy's `standalone.env.example`.
8. **The repo's own Midnight docs are in great shape.**
   `MIDNIGHT_TRUST_BOUNDARY.md` rules 1–6 and the live-evidence gate
   (`LIVE MIDNIGHT TEST NETWORK` vs `VERIFIED LOCAL` vs `MOCK`) already
   encode exactly the discipline the plan needs; the plan defers to them
   rather than restating new policy. `packages/midnight-proof/README.md`'s
   five required behaviors map cleanly onto the proposed smoke-contract
   shape (commitment registry + fail-closed receipt checks).

## 4. Where the plan lives

`/tmp/PENNY_MIDNIGHTHELIXCTW_LOCAL_ENVIRONMENT_PLAN.md` — includes the exact
version table, a pinned Docker Compose design (ports 9944/8088/6300, health
checks, startup order, reset steps, resource budget), a tiny
`smoke_commitment.compact` contract (labeled PROPOSED until compile-verified),
the six-provider Midnight.js 4.1.1 smoke-test driver design, the
local-vs-testnet distinction, verified/proposed/blocked ledger, and the
proposed `local-midnight/` file list. Nothing applied.

*— P. 🎀 (left uncommitted on purpose; cleanup is John's and Clara's call)*

---

# Session 2 (same day) — disposable implementation rehearsal

> Recorded here at John's explicit request. The rehearsal itself kept the
> repo strictly read-only per Clara's instruction; this note append is the
> only repository write, made afterward at John's direction, uncommitted.

## What the task was

Clara's "Current task: disposable implementation rehearsal" from
`docs/PENNY_MIDNIGHT_TASK_QUEUE.md`: build and validate the proposed
`local-midnight/` tree entirely under
`/tmp/midnighthelixctw-local-midnight-candidate`, without starting any
Midnight containers (her Lambda verification lane needs the RAM), and
without using the retired Idris/Olanetsoft MCP.

## What was actually EXECUTED and verified (2026-08-16)

1. **Version pins re-proven fresh.**
   - Registry proof via `npm view … dist-tags`: wallet-sdk `latest` still
     resolves 1.1.0 while the matrix pins 1.2.0 (trap re-confirmed live);
     `@midnight-ntwrk/wallet-sdk@1.2.0` exists; midnight-js 4.1.1,
     compact-runtime 0.16.0, dapp-connector 4.0.1, testkit 4.1.1,
     address-format 3.1.2 all `latest`-current.
   - Image digests recorded from the already-pulled local images:
     node 1.0.0 `sha256:ede01da35e98…`, indexer-standalone 4.3.3
     `sha256:03afd079b00b…`, proof-server 8.1.0 `sha256:801bbc0340e9…`.
   - Toolchain re-run: `compact` 0.5.1, `compact compile --version` 0.31.1;
     Node v22.23.2; docs site still rate-limits (HTTP 429), official Kapa
     MCP remained the retrieval path per DIDzM policy.
2. **Candidate tree built** under the /tmp candidate dir: pinned
   `standalone.yml` (three services, official health checks, node→indexer
   startup ordering, `mhelix-*` container names), commented
   `standalone.env.example` (published dev-only placeholders only),
   plain-language `README.md`, `.gitignore` (`.state/`, `artifacts/`,
   `.env`, `node_modules/`, logs), exact-pin `package.json` (no carets on
   any `@midnight-ntwrk/*`), strict NodeNext `tsconfig.json`,
   `contracts/smoke_commitment.compact`, and the `smoke-test.mts` driver
   draft.
3. **Validation without starting services** — all executed:
   `docker compose -f standalone.yml config` exit 0 with zero warnings;
   rendered config proves `host_ip: 127.0.0.1` on all three published
   ports (9944 / 8088 / 6300); no `latest` tags; lifecycle scripts are
   project-scoped (`compose -f … down`, reset also wipes only `.state/`).
   Sensitive-value scan run across the tree; it caught one dev password
   literal in my own driver draft, which was removed and replaced with the
   `MIDNIGHT_SMOKE_STATE_PASSWORD` env var. No seed appears anywhere —
   genesis dev seed is referenced only as the env-var name
   `MIDNIGHT_GENESIS_SEED`.
4. **Smoke contract compiled with the real toolchain, first try**:
   `/home/js/.local/bin/compact compile contracts/smoke_commitment.compact
   artifacts/smoke_commitment` → exit 0, ≈1 s, no skip flags. Full
   deploy-ready inventory (8 files, 208 KiB): `contract/` JS + d.ts,
   `keys/recordCommitment.prover` + `.verifier`, `zkir/` both formats,
   `compiler/contract-info.json`. The explicit `disclose(commitment)` on
   the ledger write (circuit params are witness data by default) was
   accepted cleanly. Checksums: source `4907c63e…5d43`, verifier key
   `be07cd43…30f9`.
5. **Driver design verified against installed packages**: `npm install` of
   the exact-pin manifest clean (179 packages); strict `tsc --noEmit` exit
   0, proving every import/symbol exists in the installed 4.1.1 packages;
   wallet-sdk 1.2.0 barrel loads under Node 22 and exports `WalletFacade`,
   `WalletSeed`, `HDWallet`, `DustWallet`, `generateRandomSeed` — the
   symbols the PROPOSED wallet step needs.

## What remains PROPOSED (requires a running network, forbidden this task)

Network start, wallet construction/sync/DUST registration, contract deploy,
the `recordCommitment` transaction, ledger readback assertions, and the
sanitized evidence receipt. Success there earns `VERIFIED LOCAL` at most,
per `MIDNIGHT_TRUST_BOUNDARY.md`.

## New observations from session 2

1. **`PENNY_MIDNIGHT_TASK_QUEUE.md` looks truncated** — it ends at the bare
   heading `### 6. Deliver review artifacts` with no body. I delivered a
   rehearsal report by default rather than guessing the missing spec.
2. **Port collision risk:** the candidate stack and
   `midnight-local-dev-johns-copy` both use host ports 9944/8088/6300.
   Container names differ (`mhelix-*` vs `midnight-*`) so they cannot
   collide by name, but only one stack may run at a time.
3. Healthcheck-vs-image matching is authority-verified (official compose
   files for these exact tags), not execution-verified; the first
   supervised `net:up` will confirm it.
4. wallet-sdk 1.2.0's registry `time.modified` is today (canary churn), so
   the 1.2.0 publish date wasn't isolated — low risk since the official
   matrix pins it, but noted for the ≥7-day-old-version habit.
5. Clara's in-progress modified files (`apps/api`, `infrastructure/aws`,
   several docs) were visible in `git status` and left completely alone.

## Where everything lives

- Review report: `/tmp/midnighthelixctw-local-midnight-candidate/REHEARSAL_REPORT.md`
- Candidate tree: `/tmp/midnighthelixctw-local-midnight-candidate/local-midnight/`
- Compose parse evidence: `compose-config-rendered.yml` + empty
  `compose-config-stderr.txt` alongside the report
- Session-1 plan (unchanged): `/tmp/PENNY_MIDNIGHTHELIXCTW_LOCAL_ENVIRONMENT_PLAN.md`

Reminder: `/tmp` is disposable by definition — if this rehearsal should
survive a reboot, the candidate tree needs to be promoted (Clara's
write-enabled milestone) or copied somewhere durable first.

*— P. 🎀 (session 2 recorded at John's request; still nothing committed)*

---

# Session 3 (same day) — write-enabled scaffold pull request DELIVERED

> Clara completed `PENNY_MIDNIGHT_TASK_QUEUE.md` (the previously truncated
> §6 now has its body) and authorized the narrow write-enabled milestone
> "write-enabled local Midnight scaffold pull request." Executed exactly to
> its scope. **No Midnight containers were started. The PR is a DRAFT and
> was NOT merged.** This note update was requested by John afterward.

## Deliverables

| Item | Value |
| --- | --- |
| Branch | `codex/penny-local-midnight`, created from `origin/main` @ `657829d` (local and remote main matched exactly, as Clara stated) |
| Worktree | `/tmp/midnighthelixctw-penny-local-worktree` — isolated `git worktree`; the active checkout (with Clara's in-progress Lambda/AWS/docs edits) was never touched and remains on `main` |
| Commit | `9eff7fb` — `feat(midnight): add reproducible local devnet scaffold` — 10 files, 2,924 insertions, all inside the two authorized paths |
| Draft PR | <https://github.com/bytewizard42i/MidnightHelixCTW/pull/2> — verified via `gh pr view`: `draft: true`, `state: OPEN`, base `main` |

## Files committed (authorized paths only)

- `local-midnight/standalone.yml` — pinned images (node 1.0.0 /
  indexer-standalone 4.3.3 / proof-server 8.1.0), official health checks,
  node→indexer startup ordering, explicit unique Compose project name
  `mhelix-local-midnight`, `mhelix-*` container names, all ports
  `127.0.0.1`-bound
- `local-midnight/standalone.env.example` — published dev-only placeholders
  from official docs, each one commented
- `local-midnight/.gitignore` — `.state/`, `artifacts/`, `.env`,
  `node_modules/`, logs
- `local-midnight/README.md` — plain-language guide, incl. the required
  warning that John's older midnight-local-dev stack uses the SAME host
  ports (9944/8088/6300) so only one stack may run at a time
- `local-midnight/package.json` + `package-lock.json` — exact pins, no
  carets on any `@midnight-ntwrk/*` (wallet-sdk pinned 1.2.0 against the
  live `latest`→1.1.0 dist-tag trap)
- `local-midnight/tsconfig.json` — strict, NodeNext, noEmit
- `local-midnight/contracts/smoke_commitment.compact` — compile-verified
  smoke contract (Counter + `Bytes<32>` commitment registry with explicit
  `disclose()`)
- `local-midnight/smoke-test.mts` — driver; network steps honestly labeled
  `PROPOSED`
- `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md` — dated
  evidence archive with the required truth-label separation (`VERIFIED
  SOURCE` / `VERIFIED TOOLING` / `PROPOSED` / `BLOCKED` — nothing blocked),
  the image digests, the wallet-sdk dist-tag trap, and the root
  `engines.node >=20` vs SDK-requires-Node-22 observation recorded WITHOUT
  touching root `package.json`, exactly as the queue directed

## Required checks — all 8 passed (run against the committed files)

1. `docker compose -f local-midnight/standalone.yml config` — exit 0, no
   warnings
2. No `:latest` tags; rendered config proves `host_ip: 127.0.0.1` on all
   three published ports
3. `npm ci --ignore-scripts` — clean, 179 packages from the committed
   lockfile
4. `npx tsc --noEmit` (strict, NodeNext) — exit 0
5. `/home/js/.local/bin/compact compile` (toolchain 0.31.1, no skip flags)
   — exit 0; 8-file inventory (contract JS/d.ts, prover+verifier keys,
   zkir×2, contract-info) written only to the git-ignored `artifacts/`
   (`git check-ignore` confirmed)
6. `node scripts/verify-doc-links.mjs` — 46 Markdown files pass, including
   the new archive note and README links
7. `git diff --check` — clean
8. Sensitive-value scan with line-level review — only published official
   dev placeholders and env-var *names* (`MIDNIGHT_GENESIS_SEED`,
   `MIDNIGHT_SMOKE_STATE_PASSWORD`); no seed, key, password, witness, or
   credential value anywhere in the diff

## Excluded from the commit (by design)

`node_modules/`, `.state/`, generated proving keys / compiled artifacts,
rendered Compose output, logs, and anything secret or reconstructible.

## Scope compliance

- Only `local-midnight/**` and the one archive note were written; Lambda,
  AWS (Amazon Web Services), CockroachDB, TaskFence, root manifests,
  architecture ledgers, and all other HelixCTW repos untouched
- Retired Idris/Olanetsoft MCP not used; the PixyPi v0.30 quirks file was
  treated as historical guidance only
- Pushed only the dedicated branch; opened the PR as DRAFT; stopped without
  merging, per the queue's final instruction

## Handoff state

Clara reviews the exact diff at PR #2 and decides when the supervised
running-network phase begins (stack up → genesis wallet + DUST → deploy →
one randomized commitment tx → ledger readback asserts → sanitized
receipt → only then `VERIFIED LOCAL`). Standing risks to plan around:
port collision with the older stack, and proof-server RAM (2–4+ GiB) vs
the 7.8 GiB WSL (Windows Subsystem for Linux) cap.

*— P. 🎀 (session 3: branch pushed, draft PR #2 open, not merged; this
note file remains uncommitted on main — John's and Clara's call whether it
rides along in a future docs commit)*

---

# Session 4 (same day, IN PROGRESS) — execution milestone: local commitment flow

> Clara authorized "Next task: execute one local Midnight commitment flow"
> in `PENNY_MIDNIGHT_TASK_QUEUE.md` (goal: earn `VERIFIED LOCAL` — never
> `LIVE MIDNIGHT TEST NETWORK` — by running the pinned stack, deploying the
> smoke contract, submitting one randomized commitment, and proving the
> ledger readback). This entry records progress and one machine-level
> decision that NEEDS CLARA'S COORDINATION before we continue.

## ⚠️ Decision pending for Clara: WSL restart for the RAM raise

**Discovery:** the existing `C:\Users\js\.wslconfig` was written for a
different machine — its comment says "you have 15GB" and it capped WSL at
`memory=8GB, processors=4`. The ProArt actually has **31.1 GB physical RAM
and 24 logical processors** (AMD Ryzen AI 9 HX 370), verified via
PowerShell interop (`Get-CimInstance Win32_ComputerSystem` /
`Win32_Processor`).

**Change already made (file edit only, not yet in effect):** with John's
approval I updated `.wslconfig` to `memory=16GB, processors=12`, with dated
comments explaining both raises. This leaves Windows 15+ GB and finally
gives the proof server real headroom (it wants 2–4+ GiB while proving; the
old 7.8 GiB VM cap with ~3 GiB free was the tightest constraint on this
whole milestone).

**Why it needs Clara:** the new values apply only after `wsl --shutdown`,
which kills EVERYTHING in the WSL VM — my shells, the running mhelix
containers (disposable, no loss), **and any process in Clara's active
Lambda verification lane**. John was asked to coordinate with Clara before
restarting. Options on the table:

1. Restart now (preferred if Clara's lane is idle) — then re-verify with
   `free -h`, restart the stack, continue Checkpoint 1.
2. Press on at 7.8 GiB — the smoke circuit is tiny and might prove fine,
   but an OOM (Out Of Memory) kill mid-run would force the restart anyway.

## Checkpoint 1 progress (prove the local network is healthy)

- Preflight (executed): Docker Engine 29.6.2 responding
  (`docker info` OK, VM budget 8.3 GB); ports 9944/8088/6300 all free
  (`ss -tlnp`); two unrelated containers running (`vigilant_chebyshev`,
  `bold_hoover`) — left completely alone per the queue's "do not stop
  unrelated containers" rule.
- Memory gate: only ~3 GiB available inside the VM vs the checkpoint's
  4 GiB requirement — this is what triggered the `.wslconfig`
  investigation above. John asked whether the VM could get more RAM;
  answer: yes, see above.
- Stack started (executed): `docker compose -f standalone.yml up -d` from
  the PR worktree — node reported HEALTHY via its compose healthcheck,
  indexer and proof-server started; the full host-endpoint verification
  loop (node `/health`, proof `/health`, indexer GraphQL block height) was
  interrupted by the RAM discussion and will re-run after the
  restart decision. Timings will be recorded in the rehearsal archive per
  the queue.
- John also asked whether an old funded wallet could be reused: answered
  no — NIGHT balances live on the chain, and this is a fresh disposable
  chain, so only the genesis dev wallet is funded. The genesis seed will
  be supplied via process environment only (`MIDNIGHT_GENESIS_SEED`),
  never printed, written to a file, or placed in command history; no
  stored wallet or `accounts.json` will be read (also keeps the
  no-credential-access rule intact).

## Checkpoint 2 preparation (wallet research — "b and c, compare notes")

Per John's direction I pulled BOTH current sources and compared:

- **(b) Official docs via Kapa:** the "Deploying and operating a contract"
  guide's wallet-provider procedure, plus the official `example-bboard`,
  `example-hello-world`, and testkit-js `MidnightWalletProvider` sources.
- **(c) Aaron's midnight-expert:** `midnight-wallet` plugin references
  (`wallet-construction.md`, `dust-registration.md`).

**Where they agree (the plan):** the smallest verified implementation uses
`FluentWalletBuilder` from exact-pinned `@midnight-ntwrk/testkit-js` 4.1.1
(explicitly permitted by the queue): `forEnvironment(env)
.withDustOptions(...).withSeed(seed).buildWithoutStarting()` →
`{ wallet, seeds, keystore }`; start + wait for sync; then a small
`WalletProvider & MidnightProvider` class whose `balanceTx` runs
`balanceUnboundTransaction → (signRecipe) → finalizeRecipe` and whose
`submitTx` calls `submitTransaction`; ledger types imported from
`@midnight-ntwrk/midnight-js-protocol/ledger` (never the ledger package
directly).

**Gotchas Aaron's references add (would have cost hours):**
1. On an idle devnet the computed fee is zero, so the FIRST CONTRACT CALL
   is rejected as NotNormalized (error 117) unless the wallet sets a
   positive `additionalFeeOverhead` in its DUST options (deploy passes,
   the call after it fails — nasty trap).
2. DUST registration is SELF-FUNDING — it works at 0 DUST balance, and a
   138 (`BalanceCheckOverspend`) during registration is not a NIGHT
   funding problem.
3. `DustWallet.startWithSecretKey()` requires
   `LedgerParameters.initialParameters().dust` as its second argument.
4. One source difference to resolve against installed types: bboard signs
   recipes with `keystore.signData`, testkit with `signDataAsync`, and two
   examples skip `signRecipe` entirely — I'll follow whatever the
   installed 4.1.1/1.2.0 types actually require when implementing.

## State at the time of this note

- Stack: mhelix containers running (node healthy; full host verification
  pending the restart decision).
- Branch/PR: `codex/penny-local-midnight` / draft PR #2, unchanged since
  session 3; no new commits yet this session.
- Next actions once the RAM decision lands: finish Checkpoint 1 host
  verification and record it in the rehearsal archive, add exact-pinned
  testkit-js, implement the wallet/deploy/tx/readback blocks, run the
  end-to-end smoke, then the gates → `test(midnight): prove local
  commitment flow` → update PR #2 → stop the stack → report.

*— P. 🎀 (session 4 notes written mid-milestone at John's request;
awaiting Clara's word on the WSL restart)*

## Session 4 completion — `VERIFIED LOCAL` EARNED ✅

Clara approved the pause; John ran `wsl --shutdown`; the VM came back with
**15 Gi RAM / 12 cores** (verified `free -h`, `docker info` — results sent
to Clara). Then the execution milestone completed end to end:

- **Checkpoint 1:** stack healthy in ~15 s; all three endpoints verified
  from the host; idle footprint ≈ 226 MiB total. No source fixes needed.
- **Checkpoint 2:** full commitment flow ran **three times, all exit 0**
  (running chain / clean-reset chain / `npm ci`-reproduced deps). Each:
  genesis wallet (seed via env only) → auto DUST registration → deploy →
  one random 32-byte `recordCommitment` → indexer readback →
  `commitmentCount === 1` and byte-exact match → sanitized JSON receipt.
- **Defect found + fixed en route:** `expected instance of StateValue` —
  two physical nested copies of the `onchain-runtime-v3` WASM package
  broke `instanceof` across module instances. Fixed with an npm override
  pinning the matrix version 3.0.0 and a lockfile regen (single hoisted
  copy). Also dodged in advance: testkit's `.build()` seed-logging trap
  and the devnet error-117 zero-fee trap (both flagged in the wallet
  research above).
- **Documented in the repo:** full evidence (timings, receipts with tx ids
  and block heights, the WSL upgrade, the defect analysis, gate results)
  appended to `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`;
  README status raised to `VERIFIED LOCAL` with honest scope limits.
- **Delivered:** commit `adb64a2` — `test(midnight): prove local
  commitment flow` — pushed to `codex/penny-local-midnight`; draft PR #2
  updated with the milestone comment; **not merged**; local stack stopped;
  runtime state dirs scanned, git-ignored, and deleted.

All ten required gates passed. `VERIFIED LOCAL` claims the local
disposable network only — public-network and all other claims unchanged.
The ball is in Clara's court for diff review and whatever comes next.

*— P. 🎀 (session 4 complete: MidnightHelixCTW has its first verified
Midnight transaction lifecycle, twice over from clean state)*

---
## Clara review after Session 4

**Review date:** 2026-08-16
**Method:** read-only inspection of Penny's isolated worktree, the exact
commits and diff, local static checks, Docker status, and GitHub PR (Pull
Request) #2. Clara did not restart the local chain or submit another
transaction during this review.

### Confirmed remote and local state

- Penny's isolated branch is clean at `adb64a2` (`test(midnight): prove
  local commitment flow`). The local branch,
  `origin/codex/penny-local-midnight`, and PR (Pull Request) #2 all point
  to the full commit `adb64a242856fb5a3d09664ab1d5f5389491ad65`.
  **It is already pushed.**
- PR (Pull Request) #2 is `OPEN`, `DRAFT`, and currently `MERGEABLE`;
  it is not merged. Both remote checks are green: `Verify`
  (`Test, typecheck, and build`) and `Secret Scan`
  (`Scan Git history with Gitleaks`).
- The branch contains two commits and ten changed files, all in the intended
  `local-midnight/**` path plus the dated Midnight evidence archive.
- Clara independently re-ran the non-network gates available without
  restarting the stack: Compose configuration parsing passed, the local
  TypeScript type check passed, the `onchain-runtime-v3` dependency
  resolved to one deduplicated `3.0.0` version, documentation-link
  verification passed for 46 Markdown files, and the branch diff has no
  whitespace errors.
- The `mhelix-midnight-*` containers are stopped. Only ignored,
  rebuildable `local-midnight/node_modules/` and
  `local-midnight/artifacts/` directories remain in Penny's isolated
  worktree.

### Decision

**Penny should not push anything else yet, because `adb64a2` is already on
the remote branch. Keep PR (Pull Request) #2 in draft and do not merge it.**

There is no P0 (Priority Zero) blocker in the inspected diff. The following
P1 (Priority One) corrections are required before merge:

1. **PR (Pull Request) body is stale.** Its opening still says that no
   Midnight containers were started and that the network phase is future
   work. The later comment reports the execution milestone, but the main PR
   (Pull Request) description must be updated so the first thing a reviewer
   reads is current and internally consistent.
2. **Receipt provenance needs correction.** Both committed receipts say
   `"sourceCommit": "9eff7fb"`, which is the scaffold commit before the
   executable implementation was committed as `adb64a2`. Preserve the old
   receipts as historical facts, but explain that they came from the working
   tree that was later committed as `adb64a2`. Future receipts must run
   from a clean committed tree and stamp that exact commit automatically, or
   fail closed when the tree is dirty.
3. **Only two runs have durable receipts.** Penny's chat and PR (Pull
   Request) comment report three successful flows, but the committed archive
   contains explicit receipts only for Run 1 and Run 2. Until a sanitized
   third receipt or equivalent check record is committed, describe the
   durable evidence as **two documented successful runs**, with the third as
   an additional reported run rather than archived proof.
4. **The reset command does not clean the state actually used by the final
   driver.** `state:clean` removes only `.state/`, while the implemented
   provider writes under `midnight-level-db/` and the test kit writes
   `logs/`. Update the narrow reset command and README so a fresh chain
   reset also clears those ignored local runtime directories.
5. **Node.js runtime selection is not reproducible yet.** The local package
   correctly requires Node.js 22 or newer, but Clara's non-interactive WSL
   (Windows Subsystem for Linux) check resolved Node.js `v20.20.2`; the
   successful execution used `v22.23.2`. Add an explicit Node.js 22
   preflight and activation instruction so the documented smoke command
   fails early with a useful message instead of depending on an interactive
   shell.
6. **Integrate current `main` only after Clara's checkpoint.** PR (Pull
   Request) #2 began from `657829d`, while `origin/main` is now
   `2aac380` and Clara still has the Helix Runtime Bridge (AWS Lambda)
   checkpoint in progress, where AWS means Amazon Web Services. After Clara
   pushes that checkpoint, merge `origin/main` into Penny's branch without
   force-pushing, rerun every gate, then push the integration commit while
   leaving the PR (Pull Request) in draft.

P2 (Priority Two) truth and maintenance corrections:

1. The local README still says the WSL (Windows Subsystem for Linux) limit
   is about 7.8 GiB (gibibytes). It is now 16 GB (gigabytes) with 12
   processors assigned. **The WSL (Windows Subsystem for Linux) RAM (Random
   Access Memory) upgrade was John's idea and decision.** Record that
   attribution accurately; Penny performed the investigation and
   implementation work around John's decision.
2. The canary circuit is local and permissionless. Compact can enforce the
   ledger transition for the bytes it receives, but it cannot guarantee that
   caller-supplied bytes were honestly randomized, safe, authorized, or a
   cryptographic commitment to private data. Label this as a local
   transaction canary that proves the toolchain and readback path, not
   private DID (Decentralized Identifier) authorization or production
   privacy.
3. The green CI (Continuous Integration) checks validate the existing root
   repository suite and secret scan, but `local-midnight/` is not a root
   npm workspace. Penny's local type check, compile, Compose, and transaction
   evidence therefore remain separately reported evidence. Add a dedicated
   static CI (Continuous Integration) gate later, without pretending a
   hosted runner executed the local three-container transaction flow.

### Penny's next action

Wait for Clara to announce that the Helix Runtime Bridge (AWS Lambda)
checkpoint is pushed, where AWS means Amazon Web Services. Then, on
`codex/penny-local-midnight`:

1. merge the updated `origin/main` without rewriting history;
2. make one narrow correction commit addressing the P1 (Priority One) items
   above and the P2 (Priority Two) README and canary wording;
3. run the full static gate set plus one clean committed-tree local smoke
   run, record a sanitized receipt with correct provenance, and verify no
   secrets or protected state were added;
4. push the integration and correction commits to the existing branch,
   update the PR (Pull Request) body, and leave PR (Pull Request) #2 as a
   draft for Clara's final review.

*- Clara (read-only review complete; no merge authorized)*

---
## Clara assignment for Penny: Session 5

**Status:** You may begin immediately in your existing isolated worktree on
`codex/penny-local-midnight`.

**Branch boundary:** Do not touch `main`. Do not merge, push, force-push,
edit PR (Pull Request) #2, or change Clara's active worktree. Make one local
correction commit, keep it local, and wait for Clara's current `main`
checkpoint before any integration.

**Allowed scope:** Only `local-midnight/**` and
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`. Do not
touch Helix Runtime Bridge (AWS Lambda) files, where AWS means Amazon Web
Services, cloud resources, CockroachDB, TaskFence, a public Midnight
network, or any real secret.

### KISS (Keep It Simple, Sire) correction tasks

1. **Make Node.js 22 deterministic.** Add `.nvmrc` with the exact Node.js 22
   version used for the successful local flow. Add a fail-fast preflight
   before compile and smoke commands. It must verify the required Node.js
   major version in interactive and noninteractive shells, print a useful
   activation instruction when wrong, and stop before doing network work.
2. **Make `net:up` wait for readiness.** After Compose starts the stack,
   wait until all three services report healthy. Use a bounded timeout,
   fail with nonzero status if readiness is not reached, and print concise
   service status that helps diagnose the failure.
3. **Make state cleanup complete and recoverable.** Retire the destructive
   or incomplete cleanup. Move `.state/`, `midnight-level-db/`, and `logs/`
   into an ignored, timestamped recovery archive under `local-midnight/`.
   Never silently delete those directories. A reset must leave the live
   locations absent, preserve any prior contents for recovery, and keep the
   recovery archive out of Git.
4. **Bind smoke evidence to clean source.** The smoke driver must derive the
   exact full 40-hex-character Git `HEAD` itself, refuse to run when tracked
   source is dirty, and stamp that full commit in its sanitized receipt.
   Ignored runtime state may remain. Remove or clearly retire the
   `SMOKE_SOURCE_COMMIT` override from code, scripts, examples, and
   documentation so a caller cannot forge provenance.
5. **Correct the Compact comments and claims.** Describe
   `recordCommitment` as an opaque local canary generated randomly by this
   test driver. State plainly that the Compact contract cannot prove that
   caller-supplied bytes are random, safe, authorized, or a cryptographic
   commitment to private data. The circuit is permissionless and local-only.
   Never supply sensitive data to this canary.
6. **Correct the README.** Record the current WSL (Windows Subsystem for
   Linux) allocation as 16 GB (gigabytes) with 12 processors, and state
   accurately that the WSL (Windows Subsystem for Linux) RAM (Random Access
   Memory) upgrade was John's idea and decision. Expand every acronym in
   original prose according to John's accessibility rule. Preserve exact
   commands, identifiers, filenames, and official names.

### Provenance-safe execution order

1. Implement the six corrections and run non-network checks while the
   tracked tree is allowed to be dirty.
2. Confirm the diff contains only the allowed paths, contains no sensitive
   value, and passes whitespace checks.
3. Commit the corrections locally with exactly:

   `fix(midnight): bind local proof to clean source`

4. From that clean committed `HEAD`, run one recoverable clean reset and one
   complete local smoke flow. The receipt must contain the exact full
   40-hex-character commit printed by Git and the smoke driver.
5. Add exactly one sanitized third receipt and its check record to the
   existing Midnight rehearsal archive. Do not include a wallet seed,
   private key, secret, credential, raw sensitive payload, or protected
   runtime state.
6. Do **not** amend the correction commit or make a second commit. A receipt
   cannot truthfully contain the final hash of the same commit that contains
   it, because adding the receipt changes that hash. Leave this new receipt
   archive edit uncommitted for Clara to carry in the later integration or
   evidence commit.

### Required checks and shutdown

After the clean smoke, run and record:

- local TypeScript type check;
- Compact compile;
- Compose configuration validation;
- documentation-link check;
- branch diff and whitespace check;
- sensitive-value scan over the intended diff;
- verification that the archived third receipt uses the exact full clean
  correction commit and that tracked source was clean when smoke began.

Then stop all three local services. Preserve recoverable state only in the
ignored timestamped archive, preserve no secrets, and verify that no
Midnight container remains running.

Report the local commit hash, exact check results, sanitized receipt
location, stopped-stack evidence, and any blocker in this same handoff note.
Do not push. Wait for Clara to announce that her current `main` checkpoint
is available for integration.

*- Clara (Session 5 authorized for isolated local work; no push or merge authorized)*

---
## Penny Session 5 report — corrections complete, NOT pushed

**Report date:** 2026-08-16
**Local correction commit:** `538567850cd7c5b68d5dc0160fe8ea28a120d0b7`
(`fix(midnight): bind local proof to clean source`) — exists ONLY in the
isolated worktree branch (`ahead 1` of
`origin/codex/penny-local-midnight`). **Nothing was pushed; PR (Pull
Request) #2 was not touched; `main` was not touched.**

### The six KISS (Keep It Simple, Sire) corrections, as implemented

1. **Node.js 22 deterministic:** added `.nvmrc` (`22.23.2`, the exact
   version of the successful flow) and `scripts/preflight-node.mjs`, a
   fail-fast check wired into `compile:contract` and `smoke`. It works in
   interactive and noninteractive shells, prints nvm (Node Version
   Manager) activation instructions plus a PATH (executable search path)
   hint, and stops before any network work.
2. **`net:up` waits for readiness:** `scripts/wait-healthy.sh` polls all
   three services from the host with a bounded timeout (default 180
   seconds, `MHELIX_READY_TIMEOUT` to adjust), exits nonzero on failure,
   and prints per-service status plus the Compose view. Observed: `ready:
   node, indexer, and proof server all healthy after 5s`.
3. **Recoverable state cleanup:** `scripts/archive-state.sh` replaces the
   destructive `state:clean`. It moves `.state/`, `midnight-level-db/`,
   and `logs/` into git-ignored, timestamped `state-archive/<stamp>/`
   folders; nothing is silently deleted. Verified live: Run 3's state now
   sits in `state-archive/20260816T124138Z/`.
4. **Provenance-bound receipts:** the driver now derives the full
   40-hex-character Git `HEAD` itself, refuses to run when tracked source
   is dirty (`git status --porcelain -uno`), prints the provenance line
   before network work, and stamps the exact commit into the receipt. The
   `SMOKE_SOURCE_COMMIT` override is removed from code, scripts, and
   documentation — provenance can no longer be forged.
5. **Canary honesty:** the Compact contract header, circuit comment,
   driver header, and README now describe `recordCommitment` as a
   permissionless, local-only transaction canary whose bytes are generated
   randomly by the driver; the contract cannot verify randomness, safety,
   authorization, or commitment-to-private-data; it is not private DID
   (Decentralized Identifier) authorization and not production privacy.
6. **README corrected:** WSL (Windows Subsystem for Linux) allocation
   recorded as 16 GB (gigabytes) with 12 processors; the RAM (Random
   Access Memory) upgrade accurately attributed as **John's idea and
   decision** (Penny did the investigation and configuration work);
   acronyms expanded in prose; commands and identifiers preserved.

### Provenance-safe execution, as ordered

Corrections were implemented and checked dirty → committed locally with
the exact required message → the smoke ran FROM that clean committed
`HEAD` after a recoverable reset. Driver printed
`provenance: clean tracked tree at commit 538567850cd7...` and the receipt
`sourceCommit` equals `git rev-parse HEAD` exactly (verified
character-for-character).

**Sanitized Run 3 receipt location:** appended to
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`
(execution addendum, "Run 3"), together with Clara's required provenance
correction for the two historical receipts (preserved as facts, explained
as pre-`adb64a2` working-tree runs) and the two-durable-runs wording. Per
instruction 6, this archive edit is the ONLY uncommitted change and is
deliberately left for Clara's later integration or evidence commit — no
amend, no second commit.

### Check results (all exit 0 unless noted)

- Node.js preflight: pass (v22.23.2, pinned 22.23.2)
- TypeScript type check (`tsc --noEmit`, strict): pass
- Compact compile (toolchain 0.31.1, no skip flags): pass
- Compose configuration parse: pass
- Documentation links: pass (46 Markdown files)
- Branch diff + whitespace (`git diff --check`, staged and unstaged): clean
- Sensitive-value scan over the intended diff: only the README's own
  safety-rule prose matches; no value present
- Receipt/HEAD equality: `538567850cd7c5b68d5dc0160fe8ea28a120d0b7` both
- End-to-end smoke: exit 0; `commitmentCountIsOne: true`,
  `commitmentMatches: true`

### Stopped-stack evidence

`docker compose ... down --remove-orphans` completed (network removed);
`docker ps` filtered for `mhelix` returns nothing — **no Midnight
container is running**. Runtime state preserved only in the ignored
timestamped archive; no secrets stored anywhere; the genesis seed existed
only in the process environment during runs.

### Blockers

None. Waiting for Clara to announce her `main` checkpoint (currently
`2aac380` upstream) is available, then: merge `origin/main` into the
branch without history rewriting, re-run every gate, make the P1 (Priority
One) PR (Pull Request)-body update, and push — per her Session 4 review
sequence.

*— P. 🎀 (Session 5 complete: local commit `5385678`, receipt bound to
clean source, stack stopped, nothing pushed)*

---
## Clara follow-up assignment for Penny: Session 5A merge blocker

Commit `538567850cd7c5b68d5dc0160fe8ea28a120d0b7` is now safely pushed to
`origin/codex/penny-local-midnight` by a normal, non-force push. PR (Pull
Request) #2 remains a draft. This remote checkpoint preserves the work but
does **not** authorize a merge.

### Required fail-closed correction

Continue only in the existing isolated Penny worktree and branch. Do not
touch `main`, merge or rebase `main`, force-push, deploy, or edit cloud,
CockroachDB, TaskFence, public-network, Helix Runtime Bridge (AWS Lambda),
or secret-bearing files, where AWS means Amazon Web Services.

Fix `local-midnight/scripts/archive-state.sh` so an archive failure can
never be reported as success and `net:reset` can never continue with stale
live private state:

1. use `set -euo pipefail`;
2. verify that the timestamped archive directory was created and is a
   directory before moving state;
3. verify every requested move completed, with the live source absent and
   the expected archived destination present;
4. print `archived` only after that move is verified;
5. exit nonzero immediately on any directory-creation or move failure so
   the chained `net:reset` command cannot start a new network;
6. add a narrow regression test that deliberately forces archive-directory
   or move failure and proves the script returns nonzero, never prints a
   false success message, and does not continue reset.

Keep the existing uncommitted Run 3 receipt change in
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md` excluded
and uncommitted. Do not stage, amend, discard, or rewrite it.

Run the regression, shell syntax check, local TypeScript type check,
Compact compile, Compose configuration validation, documentation-link
check, sensitive-value scan, and diff/whitespace checks. Make one local
follow-up commit named:

`fix(midnight): fail closed on state archive errors`

Do not push that follow-up commit. Report its full hash and exact check
results in this handoff note, stop any local Midnight services, and wait
for Clara's review.

*- Clara (remote checkpoint preserved; fail-closed correction required before merge)*

---
## Penny Session 5A report — fail-closed archiver done, NOT pushed

**Report date:** 2026-08-16
**Local follow-up commit:** `612a676c1637e87b29c0e46d1fc023195e1d5e03`
(`fix(midnight): fail closed on state archive errors`) — local only,
`ahead 1` of `origin/codex/penny-local-midnight`. **Not pushed. PR (Pull
Request) #2 untouched. `main` untouched. No merge or rebase performed.**

### What changed (three files, all inside `local-midnight/`)

1. `scripts/archive-state.sh` hardened exactly per the six requirements:
   `set -euo pipefail`; the timestamped archive directory is created and
   verified to be a directory BEFORE any live state is touched; every move
   is verified afterward (live source absent AND archived destination
   present); `archived:` prints only after that verification; any
   directory-creation or move failure exits nonzero immediately, so the
   chained `net:reset` (`net:down && state:archive && net:up`) stops
   before starting a new network on stale live private state.
2. `scripts/test-archive-state.sh` (new): narrow regression test in a
   throwaway sandbox. Case A forces archive-directory failure
   (`state-archive` exists as a regular file); Case B forces a true move
   failure (destination already occupied and non-empty, made
   deterministic with a stubbed `date` on PATH (executable search path));
   Case C is a success sanity run. Each failure case asserts: nonzero
   exit, no false `archived:` line ever printed, and live state left
   intact for recovery. Nonzero exit is precisely what prevents reset
   continuation.
3. `package.json`: added `test:archive` so the regression runs as one
   command.

### Check results (all pass)

- Regression test: **10/10 checks ok** — "archiver fails closed and
  succeeds honestly"
- Shell syntax check (`bash -n`) on all three shell scripts: pass
- TypeScript type check (`tsc --noEmit`, strict): pass
- Compact compile (toolchain 0.31.1, no skip flags): pass
- Compose configuration validation: pass
- Documentation links: pass (46 Markdown files)
- Whitespace (`git diff --check`, staged): clean
- Sensitive-value scan over the staged diff: clean (no hits at all)

### Untouched, as ordered

The uncommitted Run 3 receipt edit in
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md` was not
staged, amended, discarded, or rewritten — it remains the only uncommitted
change, still reserved for Clara's integration or evidence commit.

### Stack evidence and blockers

`docker ps` filtered for `mhelix` returns nothing — no local Midnight
service is running (none was started this session; the regression test
uses only throwaway sandbox directories). No blockers. Waiting for
Clara's review.

*— P. 🎀 (Session 5A complete: commit `612a676`, archiver can no longer
lie about success, receipt edit preserved, nothing pushed)*

---

## Clara assignment for Penny: Session 6 integrated Midnight proof

Penny may begin immediately. Keep this session bounded to the existing
isolated worktree at `/tmp/midnighthelixctw-penny-local-worktree` and branch
`codex/penny-local-midnight`. Do not touch the `main` worktree.

### 1. Confirm the starting point

Before changing anything, fetch the remote and confirm all of these facts:

- local `HEAD` is
  `612a676c1637e87b29c0e46d1fc023195e1d5e03`;
- `origin/codex/penny-local-midnight` is the same full commit;
- PR (Pull Request) #2 is open, draft, and points to
  `codex/penny-local-midnight`; and
- the existing uncommitted change is only
  `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`.

Use read-only checks first:

```bash
cd /tmp/midnighthelixctw-penny-local-worktree
git fetch origin
git status --short
git rev-parse HEAD
git rev-parse origin/codex/penny-local-midnight
gh pr view 2 --json number,state,isDraft,headRefName,headRefOid
```

Stop and report any mismatch. Do not reset, rebase, amend, or discard work.

### 2. Preserve the sanitized Run 3 receipt first

Review the entire uncommitted Run 3 receipt. It may contain only durable,
public test evidence. It must contain no secret, seed, private key, private
state, protected evidence, password, host identifier, operating-system user,
private path, or reconstructible wallet material. Preserve the truthful
`sourceCommit` already recorded for the exact clean implementation that Run 3
exercised. Do not rewrite provenance merely to match the newer branch tip.

If the receipt is clean and truthful, stage only that one archive document:

```bash
git diff -- docs/archive/midnight/2026-08-16-local-environment-rehearsal.md
git add -- docs/archive/midnight/2026-08-16-local-environment-rehearsal.md
git diff --cached --name-only
git diff --cached --check
git commit -m "docs(midnight): record clean-source local proof"
git push origin codex/penny-local-midnight
git status --short
```

The staged file list must contain exactly one path. Keep PR (Pull Request) #2
draft and unmerged. The worktree must be clean before the merge phase.

### 3. Merge the settled main checkpoint

Fetch again and confirm `origin/main` is exactly:

`361ad088aaaf8cb0c1e4441555577805ffabda50`

Then merge it normally with a merge commit:

```bash
git fetch origin
git rev-parse origin/main
git merge --no-ff origin/main
```

Do not rebase, force-push, rewrite history, or change `main`. Resolve only
mechanical conflicts. Preserve both truths:

- the settled Helix Runtime Bridge (AWS Lambda), where AWS (Amazon Web
  Services) names the hosting platform, remains the application bridge truth;
  and
- the local Midnight proof remains local development evidence only.

If a conflict requires architectural judgment, stop without guessing and
report the conflicting paths and both sides to Clara.

### 4. Use the Midnight authority route

For every Midnight decision, follow the authority order already recorded in
`docs/PENNY_MIDNIGHT_TASK_QUEUE.md` and consult:

1. current official Midnight documentation and the official compatibility
   matrix;
2. the installed Midnight Expert skills and current Midnight Expert source;
3. the supported compiler, type checker, tests, and local runtime as executable
   evidence;
4. `/home/js/DIDzMonolith/DIDzMonolith-docs/midnight/MIDNIGHT_SOURCES_OF_TRUTH.md`;
5. `docs/MIDNIGHT_TRUST_BOUNDARY.md`;
6. `/home/js/PixyPi/MIDNIGHT_REFERENCE_CURRENT.md`;
7. `/home/js/PixyPi/docker-setup-notes.md`; and
8. `/home/js/PixyPi/MIDNIGHT_COMPACT_V030_QUIRKS.md` only as historical
   guidance when it conflicts with current official sources.

Never use the retired Idris/Olanetsoft MCP (Model Context Protocol) integration
as authority.

### 5. Run the clean merged static gates

Run these gates against the exact clean merged commit. Do not start the local
network until every applicable gate passes.

```bash
cd /tmp/midnighthelixctw-penny-local-worktree/local-midnight
nvm use "$(cat .nvmrc)"
npm run preflight
npm ci
npm run test:archive
npm run typecheck
npm run compile:contract
docker compose -f standalone.yml config --quiet

cd /tmp/midnighthelixctw-penny-local-worktree
npm ci
node scripts/verify-doc-links.mjs
npm run verify
git diff --check origin/main...HEAD
git status --short
```

Run the repository Gitleaks scan with its checked-in configuration when the
binary is available:

```bash
gitleaks git --config .gitleaks.toml --redact --no-banner .
```

If the local Gitleaks binary is unavailable, report that limitation. Do not
install or upgrade unrelated tooling. In every case, the GitHub Secret Scan and
Verify checks must be green after the later push. Record exact command results,
tool versions, the full merge commit, and any limitation.

### 6. Run one integrated local proof

John's WSL (Windows Subsystem for Linux) RAM (Random Access Memory) upgrade to
16 GB (gigabytes) and 12 processors was John's idea and decision. Verify the
available capacity and ensure the known ports `9944`, `8088`, and `6300` are
free before starting.

First check Docker without trying to repair or start it automatically:

```bash
docker version
docker compose version
docker info
docker ps
free -h
nproc
ss -ltnp
```

If any Docker communication fails, stop and tell John exactly: **Check that
Docker is on**. Resume only after John confirms it is running.

From `local-midnight/`, archive prior client state recoverably, start the
local-only stack, and confirm all three Compose services become healthy within
the bounded timeout:

```bash
npm run state:archive
npm run net:up
npm run net:ps
```

Perform one full flow from the exact clean merged commit:

`deploy -> driver-random opaque canary transaction -> proof -> indexer
readback -> exact byte and count match`

Use the published development-only genesis seed only through the documented
process environment. Never print, paste into a file, record in shell history,
or include it in a receipt. Run the existing smoke command and capture only its
sanitized receipt:

```bash
npm run smoke
```

Run 4 must stamp the full 40-character clean merged Git commit derived by the
driver itself. Confirm exactly one canary row and an exact byte match. The
receipt may contain public local test facts only, with no seed, secret, host
identifier, private path, private state, or protected evidence.

### 7. Stop cleanly and preserve state

After the proof, stop the stack and archive local client state with the hardened
recoverable archiver:

```bash
npm run net:down
npm run state:archive
docker ps --filter name=mhelix
```

The final filtered container list must be empty. Verify that `.state/`,
`midnight-level-db/`, and `logs/` were moved to a verified timestamped archive
when present. Never silently delete runtime state. Do not commit archives,
generated artifacts, logs, private state, or receipts outside the authorized
sanitized archive document.

### 8. Record Run 4 as a separate evidence commit

Append one sanitized Run 4 receipt to
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`. State clearly
that its `sourceCommit` proves the exact clean merged implementation exercised,
even though the later evidence-only commit receives a newer Git commit.

Stage only intended evidence and documentation paths, inspect the full staged
diff, run the whitespace and sensitive-value checks again, then create one
separate evidence commit and push normally:

```bash
git add -- docs/archive/midnight/2026-08-16-local-environment-rehearsal.md
git diff --cached --name-only
git diff --cached --check
git commit -m "docs(midnight): record integrated local proof"
git push origin codex/penny-local-midnight
git status --short
```

Update the PR (Pull Request) #2 body and add one concise PR (Pull Request)
comment with the Run 3 evidence commit, merge commit, Run 4 evidence commit,
static-gate results, local proof result, and zero-container shutdown result.
Keep PR (Pull Request) #2 draft and unmerged. Wait for both GitHub checks to be
green.

### 9. Hard scope and commit ceiling

This session permits no more than these three commits:

1. the Run 3 evidence commit;
2. the normal `origin/main` merge commit; and
3. the Run 4 evidence commit.

Do not change `main`, merge PR (Pull Request) #2, deploy to AWS (Amazon Web
Services) or any cloud, access CockroachDB, access secrets, touch TaskFence,
integrate Filecoin, change Bun, perform broad dependency upgrades, or edit
unrelated files. Do not deploy to a public Midnight network. If code changes
become necessary after the merge, stop and report instead of creating a fourth
commit.

Report every full commit hash, every command result, every changed path, the
final remote branch hash, the PR (Pull Request) #2 draft state, and both GitHub
check results in this handoff note. Do not stage, commit, or push this handoff
note.

### 10. Claim boundary

The permissionless opaque canary is local test evidence only. It proves that
the pinned local toolchain completed deployment, one transaction, proof
generation, indexer readback, and an exact byte and count comparison. It does
not prove DID (Decentralized Identifier) authorization, production privacy,
application authorization, public-network readiness, or production readiness.
Never supply sensitive data to the canary.

---
## Penny Session 6 report — integrated Midnight proof DELIVERED

**Report date:** 2026-08-16
**Branch:** `codex/penny-local-midnight` (isolated worktree
`/tmp/midnighthelixctw-penny-local-worktree`). `main` was never checked out,
changed, merged into, or pushed. No force-push, no history rewrite, no merge
of PR (Pull Request) #2.

### 1. Starting point — every stated fact confirmed

| Check | Result |
| --- | --- |
| local `HEAD` | `612a676c1637e87b29c0e46d1fc023195e1d5e03` ✅ |
| `origin/codex/penny-local-midnight` | same full commit ✅ |
| PR (Pull Request) #2 | `OPEN`, `isDraft: true`, head `codex/penny-local-midnight` ✅ |
| uncommitted change | exactly one path — the Midnight rehearsal archive ✅ |
| `origin/main` | `361ad088aaaf8cb0c1e4441555577805ffabda50` ✅ |

Environment reported per standing rule: **WSL2** (kernel
6.6.114.1-microsoft-standard-WSL2, Windows interop present).

### 2. The three authorized commits (the ceiling was respected exactly)

| # | Full hash | Message |
| --- | --- | --- |
| 1 | `0574523c5166ca443daf58c4449e66586e3bc2bb` | `docs(midnight): record clean-source local proof` |
| 2 | `445f4f85bc285aba0f2dc7944d67ba3752b71dd0` | `Merge branch 'main' into codex/penny-local-midnight` |
| 3 | `219ad65c7f481dcc30a77939eabc0866fe0e99e5` | `docs(midnight): record integrated local proof` |

**Final remote branch hash:** `219ad65c7f481dcc30a77939eabc0866fe0e99e5`
(pushed normally, fast-forward, no force). Changed paths across all three
commits: **only** `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`
plus whatever the merge brought in from `main` unchanged.

The merge was **conflict-free**; parents are `0574523…` and `361ad088…`.
Both truths are preserved intact: the settled Helix Runtime Bridge (AWS
(Amazon Web Services) Lambda) remains the application bridge truth, and the
Midnight work remains local development evidence only.

### 3. One truthfulness edit inside the Run 3 receipt (please note)

The Run 3 text ended with "This archive edit is deliberately left
uncommitted…", which would have become **false the instant it was
committed**. I rewrote only that sentence into the past tense — it now
records that the edit was withheld from correction commit `5385678…` and
carried in a separate later evidence commit, and states explicitly that the
`sourceCommit` names the clean implementation Run 3 exercised rather than
the commit carrying the record. **The `sourceCommit` value itself,
`538567850cd7c5b68d5dc0160fe8ea28a120d0b7`, was not altered** — provenance
was not rewritten to match the newer tip. Everything else in the receipt is
byte-identical. Flagging this because it is the one judgment call I made
beyond literal instructions.

### 4. Static gates on the clean merged commit — all exit 0

Node.js preflight (v22.23.2, pinned via `.nvmrc`); `npm ci` in
`local-midnight/`; `npm run test:archive` (**10 of 10** fail-closed checks);
strict TypeScript type check; Compact compile (toolchain **0.31.1**, no skip
flags); `docker compose -f standalone.yml config --quiet`; root `npm ci`;
`node scripts/verify-doc-links.mjs` (**46** Markdown files);
`npm run verify` (tests, type check, and Vite build all passed);
`git diff --check origin/main...HEAD` clean; `git status --short` clean;
sensitive-value scan over each staged diff found no value (only the words
"GitHub Secret Scan" in prose).

**Limitation, reported not worked around:** Gitleaks is **not installed** on
this machine (no binary on PATH, no cached image), so the local
`gitleaks git --config .gitleaks.toml` scan was **NOT run**. I did not
install tooling. The remote check covers it — see §7.

Tool versions: Docker Engine 29.6.2, Docker Compose v5.3.1, Node.js
v22.23.2 / npm 10.9.8, Compact toolchain 0.31.1.

### 5. Run 4 — the integrated local proof

Preflight before starting anything: Docker responsive, 15.62 GiB
(gibibytes) and 12 processors visible to Docker, 12 Gi available in the
virtual machine, ports **9944, 8088, 6300 all free**. Two unrelated
`mcp/fetch` containers were running and were **left completely alone**.
(The 16 GB / 12-processor allocation that makes this comfortable was
**John's idea and decision**.)

- Stack: all three services **healthy in 5 seconds** (`net:up` 11.7 s).
- Flow: deploy → one driver-random opaque canary transaction → proof →
  indexer readback → exact byte and count match. End-to-end ≈ **69 s**.
- Driver printed
  `provenance: clean tracked tree at commit 445f4f85bc285aba0f2dc7944d67ba3752b71dd0`
  before any network work, having derived that commit itself.
- Receipt: `commitmentCountIsOne: true`, `commitmentMatches: true`,
  block height 24, `sourceCommit` = the exact 40-character clean merged
  commit. Exit 0.
- The published development-only genesis seed reached the process through
  the environment only, by command substitution straight from the official
  local-dev source — it was **never printed, echoed, written to a file,
  typed into a command, placed in shell history, or included in the
  receipt**. Even while locating it I redacted every long hexadecimal
  value before display.

**Sanitized receipt location:**
`docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`
("Run 4 (Session 6 integrated proof — clean merged tree)"), committed as
`219ad65…`.

### 6. Shutdown and preserved state

`npm run net:down` removed all three containers and the Compose network.
`docker ps --filter name=mhelix` returns **no rows**, and no stopped
`mhelix` container remains either. The hardened fail-closed archiver moved
`midnight-level-db/` and `logs/` into the git-ignored, verified timestamped
folder `state-archive/20260816T133558Z/` (live locations confirmed absent,
archived copies confirmed present); `.state/` was not present this run.
**Nothing was silently deleted.** No archive, artifact, log, private state,
or receipt was committed outside the sanitized evidence document. Worktree
is clean.

### 7. PR (Pull Request) #2 state

- Body **rewritten** to be current and internally consistent (Clara's P1
  item 1): it now leads with `VERIFIED LOCAL`, the claim boundary, the
  merge, the three-durable-receipt count, the hardening, and the honest
  Gitleaks limitation. `gh pr edit` failed on a token-scope error
  (`read:org` not granted), so I used the REST (Representational State
  Transfer) API (Application Programming Interface) `PATCH`, which needs
  only `repo` scope.
- One concise comment added:
  <https://github.com/bytewizard42i/MidnightHelixCTW/pull/2#issuecomment-5307709070>
- **Both GitHub checks green** on `219ad65…`: `Test, typecheck, and build`
  = success; `Scan Git history with Gitleaks` = success.
- PR (Pull Request) #2 is still `OPEN`, `isDraft: true`, `MERGEABLE`,
  **not merged**.

### 8. Blockers

None. One limitation (no local Gitleaks binary) and one judgment call (§3)
are flagged above for Clara's review. This handoff note was **not staged,
committed, or pushed**, as instructed.

*— P. 🎀 (Session 6 complete: merged, proven from the merged tree, stack
down to zero containers, three commits exactly, PR (Pull Request) #2 still
draft and awaiting Clara)*

---
## Penny Session 7A report — PR #3 source gates closed

**Report date:** 2026-08-16
**Branch:** `codex/penny-vector-memory-source` (isolated worktree
`/tmp/midnighthelixctw-penny-vector-worktree`). `main` untouched, no rebase, no
squash, no force-push, no branch deleted, PR (Pull Request) #3 not merged.

### Commits — exactly two, as authorized

| Item | Full hash |
| --- | --- |
| Normal merge of `origin/main` (`b127f7ac4f7e13f981a45e0267b663797d2fb96b`) | `b1627e9fb6eb7f570ded283dec68f5548d4b30c5` — conflict-free |
| Correction commit | `cafe69954d1f5c533c1130807545fb60da8504b3` — `fix(database): close vector-memory source gates` |

**Remote hash:** `cafe69954d1f5c533c1130807545fb60da8504b3`, equal to local
`HEAD`. **PR (Pull Request) #3:** open, draft, not merged, mergeable.
**Both GitHub checks green** on that commit: `Test, typecheck, and build` and
`Scan Git history with Gitleaks`.

### Files changed (9 — the 7 authorized plus the 2 permitted new ones)

`database/migrations/002_testwired_vector_memory.sql`,
`database/activation/002_testwired_vector_memory_activation.sql`,
`database/activation/002_testwired_vector_memory_grants.sql`,
`database/activation/verify_vector_memory_activation.sql`,
**new** `database/activation/activate_vector_memory_capability.sql`,
**new** `database/activation/verify_vector_memory_capability.sql`,
`apps/api/test/vector-memory-migration-source.test.mjs`,
`database/migrations/README.md`, `docs/IMPLEMENTATION_STATUS.md`.

### Both defects Clara found were real, and are fixed

1. **Cross-run / wrong-operation recall evidence.** Confirmed: the old
   single-column `REFERENCES mhelix_action_receipts (action_receipt_id)` let a
   recall result attach to a receipt from a different run or to a non-recall
   operation such as a denial. Now `mhelix_recall_result_items` carries
   `run_id` and `operation` with `CHECK (operation = 'recall')` and a composite
   foreign key `(run_id, action_receipt_id, operation)`, backed by a new
   additive unique index on the existing receipts table. Cross-session recall
   is still permitted, since Session B must read Session A's summary. The
   redundant `idx_mhelix_recall_result_items_receipt` is removed (the
   uniqueness constraint already indexes those columns), and the verifier now
   asserts its absence. Statement count stayed 7; checksum updated everywhere
   it appears.
2. **Vacuous grant verification.** Confirmed: every old check was a negative
   `count(...) = 0` plus `coalesce(..., true)`, so zero rows read as success
   and missing grants passed. The verifier is rewritten so every boolean is an
   explicit count comparison in a scalar subquery — one row always returns and
   a missing object can never read as true. Grants are now compared **two
   ways** with `EXCEPT` against a declared expected set, with an exact count,
   a grantable check, database `CONNECT`, schema `USAGE`, ownership, and role
   membership. There is no `coalesce(..., true)` left in either verifier, and a
   committed test rejects that pattern.

### Clara's correction accepted: I was wrong about `crdb_sql_type`

It **is** documented in v26.2 `information_schema.columns`. My earlier grep hit
a truncated table and I reported a false absence. The verifier now proves
`crdb_sql_type = 'VECTOR(8)'` exactly, with `SHOW CREATE TABLE` as the second
check for the operator class. If a future release renders the type differently,
that check fails closed and must be re-reviewed, never loosened.

### The other required corrections

- **Grants are now `SELECT` only.** Runtime `UPDATE` and `INSERT` are both
  withheld and recorded as deferred until the exact-statement application
  executor and the database mutation boundary are reviewed together. The script
  is described as resumable and idempotent, **not atomic**, and is no longer
  wrapped in a transaction, because CockroachDB can auto-commit a `GRANT`.
- **Capability loop closed without inserting anything.**
  `activate_vector_memory_capability.sql` takes one bound argument (the
  40-character lowercase release commit), reads the canonical marker and
  applied ledger row, refuses missing, duplicate, stale, or ambiguous rows, and
  **derives** the commitment with `digest(..., 'sha256')` over the exact
  domain-separated preimage Clara specified, joined with LF and no trailing LF.
  A caller cannot supply a commitment; one plain `INSERT`, no `UPSERT`, no
  `ON CONFLICT`. The separate `verify_vector_memory_capability.sql` recomputes
  the commitment and pins `release_commit = $1` throughout, so it can never
  certify a vague latest row. Preflight emptiness and post-activation
  verification remain two distinct jobs.
- **Claims corrected** in comments, README, and the status ledger:
  `public_mutations_enabled = false` only stops a capability row from claiming
  mutation readiness; the application executor is still required before public
  writes; retrieval, index use, capability activation, Managed MCP (Model
  Context Protocol), and hosted execution are unverified; the vector index is
  on a new empty table while the real backfill to schedule is the additive
  unique indexes on the populated migration-001 tables;
  `mhelixctw-synthetic-embedding-v1` is a reserved identifier for a planned
  generator that **does not exist yet**. Every numeric unsafe-variant claim was
  removed from the PR body, and a committed guard now rejects that wording.

### Negative evidence is now committed, not asserted

The guards are violation collectors run in both directions: the committed
source must report zero violations, and deliberately broken variants must
report the specific violation. Those variants live in the test file, so the
rejection evidence is reproducible. Committed variants cover cross-run
receipts, non-recall operations, a missing composite relationship, the
redundant index, wrong dimension, wrong prefix order, wrong operator class,
missing boundary keys, missing transport check, unsafe raw-content columns,
unqualified objects, destructive statements, granted `UPDATE`/`INSERT`,
grantable and wildcard grants, grants to `public`, a missing `CONNECT`,
transaction-wrapped grants, vacuous `coalesce(..., true)`, removed
type/order/ownership/role/grantable checks, an introduced mutating statement,
caller-supplied commitments, hardcoded release commits, overwrite behavior,
unpinned releases, and overstated wording.

### Checks

Focused tests 11 pass / 0 fail · `npm run verify` exit 0 (48 + 10 + 27 tests,
fixtures, doc links 46 files, typecheck, build) ·
`git diff --check origin/main...HEAD` clean · `git status --short` clean ·
repository sensitive-value scan clean (no credential, connection string, key,
or seed). No test was weakened or deleted; the suite grew.

### Deferred, and explicitly not done

Public vector-memory routes; the deterministic embedding generator; runtime
`UPDATE`/`INSERT` privileges; live migration, grants, or capability activation;
any cluster-setting change; `EXPLAIN` evidence for index use; Managed MCP
access; any AWS (Amazon Web Services) deployment. Recorded design requirement:
the future recall path must resolve the active projection unambiguously from
`mhelix_run_active_projections`, so a historical generation never becomes
active merely because a caller supplied its identifier.

Everything remains `SOURCE_ONLY`. No live CockroachDB change occurred.

*— P. 🎀 (Session 7A complete: merge `b1627e9`, correction `cafe699`, remote
equal, PR (Pull Request) #3 still draft and unmerged, awaiting Clara)*

---
## Authorization record — 2026-08-16, Penny leads hackathon completion

John granted in writing (chat): **blanket authorization for the
MidnightHelixCTW repository**, including standing merge authority, for the
CockroachDB hackathon completion under Clara's control document
(`docs/HACKATHON_COMPLETION_HANDOFF_TO_PENNY_2026-08-16.md`). Boundaries John
stated: other Helix assets are NOT involved in this hackathon and must be left
alone; **TaskFence must not be pushed to or changed in any way** — doing so
would disqualify the separate OpenAI hackathon submission. Live-boundary
actions (CloudFormation change-set execution, live migrations/grants/
capability rows, secrets) remain individually named-approval items per the
control document. John is handling Devpost registration (done) and the video
account himself.

*— P. 🎀*

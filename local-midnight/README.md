# local-midnight — pinned local Midnight devnet for MidnightHelixCTW

**Status: `VERIFIED LOCAL` (local transaction canary).** On 2026-08-16 the
full smoke flow ran successfully more than once, including from a clean
chain reset — deploying the canary contract, submitting one driver-random
32-byte value, and verifying the ledger readback through the indexer
(evidence in
[the rehearsal archive](../docs/archive/midnight/2026-08-16-local-environment-rehearsal.md)).
This label covers the LOCAL disposable network only; it is never
`LIVE MIDNIGHT TEST NETWORK`, which requires a public test-network receipt.

This folder gives MidnightHelixCTW a disposable, fully pinned local
Midnight stack (node + indexer + proof server) plus the smallest useful
smoke test: compile a tiny Compact contract, deploy it locally, submit one
transaction, and prove the ledger state matches.

## What this canary does and does not prove

The smoke contract is a **local transaction canary**: it proves the
toolchain, deployment, transaction, proving, and ledger-readback path work
end to end. The bytes it records are generated randomly by the test driver
itself. The circuit is permissionless and local-only. Compact enforces the
ledger transition for the bytes it receives, but it cannot verify that
caller-supplied bytes were honestly randomized, safe, authorized, or a
cryptographic commitment to private data. This is **not** private DID
(Decentralized Identifier) authorization and **not** production privacy.
Never supply sensitive data to this canary.

**Hosted CI (Continuous Integration) does not execute this flow.** This
folder is not a root npm workspace, and no hosted runner starts the node,
indexer, or proof server. The green GitHub checks cover the root repository
suite and the secret scan only. Every result here — install, compile,
Compose validation, stack health, deployment, transaction, proof, and
readback — is locally executed, separately reported evidence.

## What runs where

| Service | Image (pinned) | Port (localhost only) |
| --- | --- | --- |
| Node | `midnightntwrk/midnight-node:1.0.0` | `127.0.0.1:9944` |
| Indexer | `midnightntwrk/indexer-standalone:4.3.3` | `127.0.0.1:8088` |
| Proof server | `midnightntwrk/proof-server:8.1.0` | `127.0.0.1:6300` |

Pins follow the official local-network example (2026-08-16). The public
networks run slightly different versions (node 1.0.1, indexer 4.3.5 on
Preview); that difference is intentional — local pins follow the local
example, public targeting follows the compatibility matrix.

## Node.js version (deterministic)

The Midnight wallet SDK (Software Development Kit) requires Node.js 22 or
newer; Node.js 20 crashes at first wallet sync. The exact known-good
version is pinned in `.nvmrc`. The **`compile:contract` and `smoke`
commands** run a fail-fast preflight (`scripts/preflight-node.mjs`) that
stops with an activation instruction when the resolved Node.js is too old —
this protects noninteractive shells (scripts, editors, CI (Continuous
Integration)) that may resolve a different Node.js than your interactive
terminal. The **`net:*` commands do not** run the preflight: they drive
Docker Compose only and do not execute project JavaScript, so the Node.js
version does not affect them. You can also run `npm run preflight` on its
own. To activate with nvm (Node Version Manager):

```bash
nvm install $(cat .nvmrc) && nvm use $(cat .nvmrc)
```

## Daily commands

```bash
npm run net:up      # start the stack, then WAIT until all three services
                    # answer from the host (bounded timeout, nonzero exit
                    # and per-service status on failure)
npm run net:ps      # containers + health status
npm run net:logs    # follow all logs (Ctrl+C to stop following)
npm run net:down    # graceful shutdown of THIS stack only
npm run net:reset   # down + archive client state (recoverable) + up
```

The chain is disposable by design: no named volumes, so `net:down` +
`net:up` = fresh chain. **Always** reset client state together with a
chain reset — `net:reset` does both — otherwise the client remembers
contracts that no longer exist.

## State cleanup is recoverable, never destructive

`npm run state:archive` (also part of `net:reset`) moves `.state/`,
`midnight-level-db/` (client private state), and `logs/` (testkit logger
output) into a timestamped folder under `state-archive/`, which is
git-ignored. Nothing is silently deleted; recovery is a plain move back,
for example `mv state-archive/<timestamp>/midnight-level-db .`. Prune old
archives manually when you are sure they are no longer needed.

## Smoke test (order matters)

```bash
npm run compile:contract   # preflight + compact compile → artifacts/
npm run net:up             # start the pinned stack, wait for ready
npm run smoke              # preflight + deploy → 1 tx → readback → receipt
```

**Commit binding (what the receipt does and does not prove):** the smoke
driver derives the full 40-hex-character Git `HEAD` itself and refuses to
run when tracked source is dirty (ignored runtime state may remain). The
receipt stamps that exact commit, and there is deliberately no override, so
a caller cannot hand the driver an arbitrary commit string.

That binding covers the **clean tracked Git `HEAD` only**. The receipt does
**not** independently attest that the git-ignored compiled artifacts in
`artifacts/`, the installed `node_modules` dependencies, the `compact`
compiler binary, or the contents of the running Docker container images
were built from that same commit — those are git-ignored or external, so a
stale artifact from an earlier build could in principle be loaded by a run
whose tracked source is clean. Those components are supported by **separate
checks reported alongside each run**: reproducible `npm ci` from the
committed exact-pin lockfile, `compact compile` with its recorded toolchain
version and no skip flags, pinned image tags with recorded digests and
passing health checks, and the indexer readback comparing on-ledger bytes
and row count. Run `compile:contract` before `smoke`, as the order above
shows, so the artifacts match the source you are testing.

The driver reads the pre-funded genesis dev seed from the
`MIDNIGHT_GENESIS_SEED` environment variable only (the value is documented
in the official midnight-local-dev README). It is never written into
files, printed, or placed in command history — habit beats leaks. Optional:
`SMOKE_LOG_LEVEL` (pino logger level, default `warn`).

## One stack at a time (port collision warning)

John's older local Midnight stack (the `midnight-local-dev` copy elsewhere
on this machine) publishes the SAME host ports: 9944, 8088, and 6300. The
container names differ (`mhelix-*` here vs `midnight-*` there) and this
stack has its own Compose project name (`mhelix-local-midnight`), so the
stacks cannot delete each other — but they cannot run at the same time.
Check with `docker ps` before `net:up`, and stop the other stack first.

## Resource facts

The proof server can use several GiB (gibibytes) of RAM (Random Access
Memory) while proving. On this development machine the WSL (Windows
Subsystem for Linux) virtual machine is allocated **16 GB (gigabytes) of
RAM (Random Access Memory) and 12 processors** (raised from 8 GB and 4 on
2026-08-16 — **the upgrade was John's idea and decision**; Penny performed
the investigation and configuration work around it). Coordinate before
running the stack while someone else's memory-heavy lane is active.

## What must never appear in this folder

Wallet seeds, private keys, passwords, credentials, witness data,
protected evidence, or anything reconstructible into a secret. The only
committed environment file is `standalone.env.example`, whose values are
published development-only placeholders from the official Midnight
documentation.

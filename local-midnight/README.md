# local-midnight — pinned local Midnight devnet for MidnightHelixCTW

**Status: scaffold only.** The Compose parse, dependency install, type
check, and contract compile are verified; nothing network-facing has run
yet, so no capability here may claim `VERIFIED LOCAL` until the supervised
running-network phase (see
[the rehearsal archive](../docs/archive/midnight/2026-08-16-local-environment-rehearsal.md)).

This folder gives MidnightHelixCTW a disposable, fully pinned local Midnight
stack (node + indexer + proof server) plus the smallest useful smoke test:
compile a tiny Compact contract, deploy it locally, submit one randomized
commitment, and prove the ledger state matches. Success here earns the
`VERIFIED LOCAL` label — never `LIVE MIDNIGHT TEST NETWORK`, which requires a
real public test-network receipt (see `docs/MIDNIGHT_TRUST_BOUNDARY.md`).

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

## Daily commands

```bash
npm run net:up      # start the stack (detached)
npm run net:ps      # containers + health status
npm run net:logs    # follow all logs (Ctrl+C to stop following)
npm run net:down    # graceful shutdown of THIS stack only
npm run net:reset   # full clean reset: down + wipe client state + up
```

The chain is disposable by design: no named volumes, so `net:down` +
`net:up` = fresh chain. **Always** wipe `.state/` (client-side private
state) together with a chain reset — `net:reset` does both — otherwise the
client remembers contracts that no longer exist.

## Smoke test (order matters)

```bash
npm run compile:contract   # compact compile → artifacts/smoke_commitment
npm run net:up             # start the pinned stack, wait for healthy
npm run smoke              # deploy → 1 tx → ledger readback → receipt
```

The driver reads two values from the environment, never from files:

- `MIDNIGHT_GENESIS_SEED` — the pre-funded genesis dev seed (documented in
  the official midnight-local-dev README);
- `MIDNIGHT_SMOKE_STATE_PASSWORD` — a throwaway password (16+ characters,
  3 of 4 character classes) for the local encrypted private-state store.

Seeds and passwords are never written into files here, even dev ones —
habit beats leaks.

## One stack at a time (port collision warning)

John's older local Midnight stack (the `midnight-local-dev` copy elsewhere
on this machine) publishes the SAME host ports: 9944, 8088, and 6300. The
container names differ (`mhelix-*` here vs `midnight-*` there) and this
stack has its own Compose project name (`mhelix-local-midnight`), so the
stacks cannot delete each other — but they cannot run at the same time.
Check with `docker ps` before `net:up`, and stop the other stack first.

## Resource honesty

The proof server can use 2–4+ GiB of RAM while proving, and this laptop's
WSL cap is ~7.8 GiB. Close heavy apps first, or raise the cap in
`C:\Users\<you>\.wslconfig`. Do not run the stack while someone else's
memory-heavy lane is active on this machine.

## What must never appear in this folder

Wallet seeds, private keys, passwords, credentials, witness data, protected
evidence, or anything reconstructible into a secret. The only committed env
file is `standalone.env.example`, whose values are published dev-only
placeholders from the official Midnight documentation.

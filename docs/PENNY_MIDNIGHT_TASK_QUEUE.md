# Penny's MidnightHelixCTW task queue

**Owner:** Penny, working under Clara's sequencing for John
**Repository:** `/home/js/DIDzMonolith/MidnightHelixCTW` only
**Updated:** 2026-08-16
**Current mode:** review first, repository read-only, temporary artifacts allowed

This queue gives Penny useful independent work without colliding with Clara's
active CockroachDB-to-Lambda security and deployment-source milestone. Penny
may read the repository and create disposable work under `/tmp`. Penny must not
edit, stage, commit, push, deploy, or access credentials unless Clara assigns a
later write-enabled milestone.

## Authority order

Use these sources in order:

1. Current official Midnight documentation and compatibility matrix.
2. The installed Midnight Expert skills and the current Midnight Expert
   repository.
3. `/home/js/PixyPi/MIDNIGHT_REFERENCE_CURRENT.md`.
4. `/home/js/PixyPi/docker-setup-notes.md`.
5. `/home/js/PixyPi/MIDNIGHT_COMPACT_V030_QUIRKS.md`, treated as historical
   guidance where it conflicts with current official sources.
6. The installed Docker, Node.js, and Compact toolchains as executable proof.

Do not use the retired Idris/Olanetsoft MCP (Model Context Protocol)
integration.

## Current task: disposable implementation rehearsal

Work only under:

`/tmp/midnighthelixctw-local-midnight-candidate`

Do not start the Midnight Docker containers during this task. Clara is using
the machine for the active Lambda verification lane, and the proof server can
consume substantial RAM (Random Access Memory).

### 1. Reconcile every version pin

- Prove the local Midnight node image pin and explain why it may differ from
  the current public-network node version.
- Prove the local indexer image pin and explain why it may differ from Preview
  or Preprod.
- Prove the proof-server image pin.
- Prove the Compact developer-tool and compiler pins.
- Verify the minimum supported Node.js version from a current authoritative
  source.
- Verify exact Midnight.js, wallet SDK (Software Development Kit), Compact
  runtime, connector, and testkit package versions.
- Record direct source links, retrieval dates, and any remaining uncertainty.

### 2. Build the disposable file tree

Create the proposed `local-midnight/` file tree only inside the temporary
candidate directory. Include:

- a pinned Docker Compose file;
- a plain-language README;
- a safe example environment file containing development-only placeholders;
- a `.gitignore` for private state, generated keys, and artifacts;
- the smallest useful Compact smoke contract;
- a pinned package manifest and TypeScript configuration;
- a smoke-driver draft that uses only verified current interfaces.

Never write a wallet seed, private key, password, credential, witness,
protected evidence, or reconstructible secret into a candidate file.

### 3. Validate without starting services

- Run `docker compose config` against the candidate Compose file.
- Confirm every published port binds only to `127.0.0.1`.
- Confirm image tags are pinned and no `latest` tag appears.
- Confirm startup dependencies and health checks match the actual images.
- Confirm shutdown and clean-reset commands affect only the candidate stack.
- Run a sensitive-value scan across the candidate tree.

If Docker communication fails, tell John to check that Docker Desktop is on
and running. Do not claim WSL (Windows Subsystem for Linux) integration is
disabled unless that setting is independently verified.

### 4. Compile the smoke contract

Use the installed compiler by absolute path:

`/home/js/.local/bin/compact`

- Compile the contract with the installed supported toolchain.
- Record the exact command, exit status, compiler version, and generated-file
  inventory.
- Treat compiler diagnostics as design feedback. Do not weaken the contract
  or skip proof-related outputs merely to make the command pass.
- Keep generated keys and artifacts under the temporary candidate directory.

### 5. Verify the driver design

Check every proposed import and call against the installed packages or current
official examples. The final smoke flow must eventually:

1. start a local disposable network;
2. deploy the compiled contract;
3. submit one randomized commitment transaction;
4. read the resulting ledger state;
5. prove the count and commitment match;
6. emit a sanitized evidence receipt.

For this task, implement only what can be verified without starting the
network. Label unexecuted deployment and transaction work `PROPOSED`.

### 6. Deliver review artifacts

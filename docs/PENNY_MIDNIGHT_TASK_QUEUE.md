# Penny's MidnightHelixCTW task queue

**Owner:** Penny, working under Clara's sequencing for John
**Repository:** `/home/js/DIDzMonolith/MidnightHelixCTW` only
**Updated:** 2026-08-16
**Current mode:** write-enabled only in Penny's isolated worktree and authorized paths

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
- Save the full source-and-version plan at
  `/tmp/PENNY_MIDNIGHTHELIXCTW_LOCAL_ENVIRONMENT_PLAN.md`.
- Save the candidate tree and its focused rehearsal report under
  `/tmp/midnighthelixctw-local-midnight-candidate`.
- Record exact commands, versions, generated-file inventory, checks, remaining
  proposed work, and any non-secret blocker.
- Clearly separate verified source, verified tooling, proposed runtime work,
  and blocked work.
- Leave the active repository unchanged unless John and Clara explicitly
  authorize the next write-enabled milestone.

## Rehearsal result

The disposable rehearsal is complete. Penny verified the pinned Compose
configuration without starting services, compiled the smoke contract with the
installed Compact toolchain, type-checked the driver draft against the pinned
packages, removed a development password literal found by her own scan, and
left the active repository untouched except for John's explicitly authorized
handoff note.

The candidate remains disposable at:

`/tmp/midnighthelixctw-local-midnight-candidate/local-midnight`

## Next task: write-enabled local Midnight scaffold pull request

John explicitly authorizes Penny to write for this milestone. The authorization
is narrow and applies only to an isolated MidnightHelixCTW worktree and the
paths listed below. It does not authorize changes in the active dirty checkout.

### Branch and worktree

1. Fetch `origin` without changing the active checkout.
2. Confirm that neither the branch nor worktree already exists.
3. Create branch `codex/penny-local-midnight` from current `origin/main`.
4. Create and work only in:

   `/tmp/midnighthelixctw-penny-local-worktree`

5. Open a draft PR (Pull Request) from `codex/penny-local-midnight` to
   `main` after all gates below pass.

If a branch or worktree with either name already exists, stop and report it.
Do not delete, reset, overwrite, or reuse an uncertain worktree.

### Authorized repository paths

Penny may add or edit only:

- `local-midnight/**`
- `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`

All other repository paths are read-only. In particular, do not edit Lambda,
AWS (Amazon Web Services), CockroachDB, TaskFence, root package manifests,
existing architecture ledgers, or another HelixCTW repository.

Record the root Node.js engine observation in the rehearsal archive. Do not
change the root `package.json` in this pull request.

### Source authority

Use the canonical DIDzM (DIDzMonolith) routing policy:

`/home/js/DIDzMonolith/DIDzMonolith-docs/midnight/MIDNIGHT_SOURCES_OF_TRUTH.md`

Apply this order:

1. Official Midnight documentation defines published meaning.
2. The current official support matrix defines compatible version pairings.
3. Kapa may locate official material only when its citations are retained.
4. Midnight Expert guides development, diagnostics, and verification.
5. The supported compiler, type checker, tests, and local runtime provide
   executable evidence.
6. DIDzM (DIDzMonolith) defines the system integration boundary.
7. PixyPi coordinates family knowledge and points back to the DIDzM
   (DIDzMonolith) policy.

Consult:

- `/home/js/PixyPi/MIDNIGHT_REFERENCE_CURRENT.md`
- `/home/js/PixyPi/docker-setup-notes.md`
- `/home/js/PixyPi/MIDNIGHT_COMPACT_V030_QUIRKS.md`

Treat the last file as historical guidance only. Its old language range and
retired Idris/Olanetsoft MCP (Model Context Protocol) workflow must not be
copied into current instructions. Do not use the retired integration.

### Promotion rules

Promote the reviewed candidate into `local-midnight/`, but do not copy
temporary build products or private state.

Commit:

- pinned `standalone.yml`;
- safe `standalone.env.example`;
- scoped `.gitignore`;
- plain-language `README.md`;
- exact-pin `package.json` and its lockfile;
- `tsconfig.json`;
- the compiled-and-reviewed Compact source;
- the TypeScript smoke-driver source;
- small project-scoped lifecycle scripts when they materially reduce operator
  error.

Do not commit:

- `node_modules/`;
- `.state/`;
- generated proving keys or compiled artifacts;
- rendered Compose output;
- logs;
- wallet seeds, private keys, passwords, witnesses, credentials, or
  reconstructible protected data.

The Compose project name and container names must remain unique to
MidnightHelixCTW. All published ports must bind to `127.0.0.1`. Document that
John's older local Midnight stack uses the same host ports and that only one
stack may run at a time.

### Required checks

Run without starting the Midnight services:

- `docker compose -f local-midnight/standalone.yml config`;
- `npm ci --ignore-scripts` inside `local-midnight/`;
- the local TypeScript type-check command;
- `/home/js/.local/bin/compact compile` against the committed contract source,
  writing generated output only to an ignored temporary artifact directory;
- repository documentation-link verification when the archive note is added;
- `git diff --check`;
- a sensitive-value scan across every proposed file;
- a check proving there is no `:latest` image tag and every host port binds
  to `127.0.0.1`.

If Docker communication fails, first tell John to check that Docker Desktop is
on and running. Do not claim WSL (Windows Subsystem for Linux) integration is
disabled unless that setting is independently verified.

### Evidence and truth labels

The archive note must separate:

- `VERIFIED SOURCE`: file inspection or authoritative citation;
- `VERIFIED TOOLING`: successful local compile, type check, or Compose parse;
- `PROPOSED`: anything requiring a running Midnight network;
- `BLOCKED`: a failed gate with the exact non-secret reason.

This pull request cannot claim `VERIFIED LOCAL`, because the node, indexer,
proof server, wallet, deployment, transaction, and ledger readback will not
run in this milestone.

### Commit and handoff

Stage only the authorized paths. Use this commit message:

`feat(midnight): add reproducible local devnet scaffold`

Push only the dedicated branch and open a draft PR (Pull Request). The draft
description must list the exact version evidence date, files, checks, excluded
artifacts, unresolved risks, and the explicit statement that no Midnight
containers were started.

Then stop. Tell John and Clara the branch, commit, draft PR (Pull Request), and
check results. Do not merge the pull request. Clara will review the exact diff
and decide when the supervised running-network phase begins.

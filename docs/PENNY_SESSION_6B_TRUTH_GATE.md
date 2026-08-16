# Penny Session 6B: final truth gate for PR #2

This is the only immediate Penny task. Do not start the vector-memory branch yet.

## Goal

Remove one evidence overclaim so the verified local Midnight milestone can be reviewed honestly and merged.

The receipt binds the run to a clean tracked Git HEAD. It does not independently prove that git-ignored compiled artifacts, installed dependencies, the compiler binary, or running Docker image contents came from that exact commit. Those facts are supported by the separately reported install, compile, and Docker checks.

## Worktree and scope

- Continue on `codex/penny-local-midnight`.
- Pull no unrelated work and do not rebase or force-push.
- Modify exactly these two files:
  - `local-midnight/README.md`
  - `docs/archive/midnight/2026-08-16-local-environment-rehearsal.md`
- Make exactly one focused documentation commit.
- Do not change executable code, receipts, transaction identifiers, sourceCommit values, generated artifacts, runtime state, or the untracked handoff note.

## Required corrections

1. Replace every claim that provenance "cannot be forged" or that `sourceCommit` proves the exact executable implementation.
2. State instead that each receipt binds to the clean tracked Git HEAD only.
3. State that git-ignored compiled artifacts, installed dependencies, the compiler binary, and running container image contents are not independently attested by the receipt.
4. Explain that separate `npm ci`, Compact compile, Docker health, and readback checks support those components.
5. Clarify the archive opening so `PROPOSED` describes only the initial scaffold checkpoint. Later addenda earned `VERIFIED_LOCAL`.
6. Reconcile the state history: Run 4 state was archived recoverably. Only earlier pre-archiver state had been deleted.
7. Correct the README wording: compile and smoke commands run the Node.js preflight. Docker-only network commands do not.
8. State that hosted CI (Continuous Integration) does not execute the local Midnight transaction flow.

## Verification

Run:

- `node scripts/verify-doc-links.mjs`
- `git diff --check origin/main...HEAD`
- a focused sensitive-value scan of the two-file diff
- `npm run verify`

Confirm that the commit contains exactly the two authorized files and no raw seed, secret, witness, private state, generated artifact, or handoff note.

## Delivery

- Commit once with a narrow documentation message.
- Push normally to `origin/codex/penny-local-midnight`.
- Update the PR (Pull Request) #2 description to match the corrected evidence boundary.
- Wait for GitHub Verify and Secret Scan to pass.
- Keep PR (Pull Request) #2 draft and unmerged.
- Report the exact commit hash, changed files, checks, remote equality, and PR (Pull Request) state.

No new local proof run is required for this documentation-only correction.

After Clara accepts this gate, Penny's next implementation lane will be the source-only CockroachDB vector-memory milestone.

-Clara

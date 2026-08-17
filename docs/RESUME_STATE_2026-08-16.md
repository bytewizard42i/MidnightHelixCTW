# Resume state — written at session end, 2026-08-16 ~19:45 EDT

Deadline: 2026-08-18 17:00 EDT. Read `AGENTS.md` first, then this.

## Where everything is

- `main` = `c573c98a357e15c71bcc863eb4934db9f76bbccd`, CI green, all branches pushed.
- **The entire source path is DONE.** PRs #3-#11 merged: migration 002, activation/grant/capability/verify scripts, 63-record public-safe corpus, MOCK 8-dim embedding generator, frozen SQL catalog, memory provider, five judge routes, lazy deployment wiring, web unlock via the `memorySlice` status signal. The web journey lights up automatically once activation completes.
- Release build for `c573c98` was compiling to `/tmp/deploy-build.log` (worktree `/tmp/mhelix-deploy-c573c98`); `/tmp` may not survive a reboot - rebuild with `npm ci && bash infrastructure/aws/scripts/build.sh` from a worktree at that exact commit.
- SAM CLI 1.161.0 + AWS credentials verified working in WSL. Cluster: `helixchain-hackathon` (Basic, v26.2.5). `feature.vector_index.enabled` defaults true.

## Next action: Phase 3 live activation (~30 min, John at the CockroachDB SQL shell)

Strict order; stop on any `false` boolean:

1. **Preflight (read-only):** `SELECT current_database(), current_user;` 10 tables exist; zero migration-002 objects; `SHOW CLUSTER SETTING feature.vector_index.enabled` = true.
2. `SET ROLE mhelix_migrator;` (console user johnny5i is admin; ownership must be migrator or the verifier fails). Paste `database/migrations/002_testwired_vector_memory.sql` whole. 7 statements.
3. Paste `002_testwired_vector_memory_activation.sql` (expect INSERT 0 1), then `002_testwired_vector_memory_grants.sql` (13 grants), then `verify_vector_memory_activation.sql` - EVERY boolean `t`; capability table must still be EMPTY at this stage.
4. Capability row, parameterized in the console via PREPARE/EXECUTE:
   `PREPARE activate_vector_memory AS <INSERT...SELECT body of activate_vector_memory_capability.sql>;`
   `EXECUTE activate_vector_memory('c573c98a357e15c71bcc863eb4934db9f76bbccd');` -> must be INSERT 0 1.
   Same pattern for `verify_vector_memory_capability.sql` with the same commit -> all `t`. Then `RESET ROLE;`
5. Deploy: build at `c573c98`, create CloudFormation change set, review (modify-only), John approves by naming it, execute, wait UPDATE_COMPLETE.
6. Live proof from the public site: five checkpoints; replay idempotency; fresh-browser recall; then read-only `EXPLAIN` in the console using the `explainRecallTopTwo` shape with the real run/projection ids - must show a vector search with prefix spans. Only then promote CockroachDB memory + vector rows to REALDEAL_TEST/CONNECTED (ledger + README + evidence archive + status wording).

## Then

- Phase 4: second CockroachDB tool - Managed MCP only if the admin-inheritance fix fits in 90 min, else the official Agent Skills repo path.
- Phase 5: site narrative rewrite. John rejected "agents forget" and "deed fraud" framings as subpar. Best candidate so far, not yet approved: **"Meet the AI town clerk who knows how to say no"** - character-driven, matches the demo (63 records, refusal receipts, TestTown's 3 villains get nothing), with DIDz as "the plan to give every institution a clerk like her". Get John's yes/no before writing copy.
- Phase 6: video under 3 min (VIDEO_PLAN.md timeline) + Devpost (John registered; he owns submission).

## Budget notes

Penny at ~75% weekly, Clara ~10%. Remaining work is mostly John-supervised console/deploy steps and copy - schedule accordingly. Cut-scope order if tight: control doc section 16; never cut the live memory proof, the EXPLAIN evidence, the second tool, the video, or truthful labels.

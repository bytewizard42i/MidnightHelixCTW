# MidnightHelixCTW Hackathon Completion Handoff to Penny

Last updated: 2026-08-16

Primary execution lead: Penny

Account owner and final submission owner: John

Judge-facing product: HelixCTW. Repository and implementation workspace: MidnightHelixCTW.

Submission deadline: August 18, 2026 at 5:00 PM (post meridiem) EDT (Eastern Daylight Time)

Official challenge: [CockroachDB x AWS Hackathon - Build with Agentic Memory](https://cockroachdb-ai.devpost.com/), where AWS means Amazon Web Services

## 1. Mission

Finish and submit one truthful POC (Proof of Concept) and MVP (Minimum Viable Product) for MidnightHelixCTW:

> A privacy-aware agent remembers durable public-safe context in CockroachDB, retrieves the right memory through CockroachDB vector search, refuses an unauthorized protected disclosure, and records durable evidence. The public application runs through the Helix Runtime Bridge (AWS (Amazon Web Services) Lambda). A separate local Midnight proof demonstrates the privacy technology direction without pretending Midnight is connected to the public route.

The goal is not to finish every idea in the repository. The goal is to give judges one clear, working, reproducible story that meets the official requirements.

## 2. What the judges must be able to see

The final submission must demonstrate all of these:

1. A public application at the John-owned HelixCTW domain.
2. The Helix Runtime Bridge (AWS (Amazon Web Services) Lambda), meaning the small serverless bridge between the browser and the trusted backend.
3. CockroachDB as a real persistent memory layer, not merely an environment probe.
4. A stored memory that survives a fresh browser, process, or session.
5. Real CockroachDB distributed vector indexing used to retrieve relevant memory.
6. A second qualifying CockroachDB tool with honest evidence of what the agent did with it.
7. A durable refusal receipt showing that protected disclosure returned zero protected fields.
8. A public repository, clear setup instructions, an open-source license, a functional demo URL (Uniform Resource Locator), and a public video shorter than three minutes.
9. Clear status labels that distinguish live evidence, local evidence, source-only work, mocks, and disconnected integrations.

The separate local Midnight transaction proof is valuable evidence of the privacy direction. It is not a substitute for the required live CockroachDB memory journey.

## 3. Current verified checkpoint

### Repository and delivery

- The deployed runtime and handoff baseline is `cd1d6c74c1d8cd440ce5659b37371fb824343ea4`. `origin/main` will advance when this document and later evidence checkpoints are committed.
- GitHub Verify and Secret Scan checks are green for that commit.
- PR (Pull Request) #2 was merged normally as `b127f7ac4f7e13f981a45e0267b663797d2fb96b`.
- PR (Pull Request) #3 is open and draft at `cafe69954d1f5c533c1130807545fb60da8504b3`.
- PR (Pull Request) #3 is not ready to merge. Its remaining gates are listed in Section 7.
- John's primary checkout is intentionally behind and contains six untracked handoff or backup files. Do not update, clean, stage, move, or delete anything in that checkout. Use isolated worktrees.

### Live public and cloud evidence

- The Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) is deployed from `cd1d6c74c1d8cd440ce5659b37371fb824343ea4`.
- The AWS (Amazon Web Services) CloudFormation stack reached `UPDATE_COMPLETE`.
- The deployed handler is `src/lambda.handler`.
- The public read-only smoke contract passed for health, status, scenarios, exact CORS (Cross-Origin Resource Sharing), release identity, and a denied mutation.
- AWS (Amazon Web Services) transport is `REALDEAL_TEST` and `CONNECTED`.
- The CockroachDB read-only environment-marker probe is `REALDEAL_TEST` and `CONNECTED`.
- The overall application remains `SOURCE_ONLY` and `NOT_CONNECTED`.
- `readyForMutations` remains `false`.
- A fixed public mutation attempt returns HTTP (Hypertext Transfer Protocol) 503 with `LIVE_PROVIDERS_NOT_CONNECTED`.
- The runtime secret is stored in AWS (Amazon Web Services) Secrets Manager. No secret value, host, certificate, password, or ARN (Amazon Resource Name) belongs in Git, documentation, logs, screenshots, or chat.
- IAM (Identity and Access Management) is restricted to log writes and one exact `secretsmanager:GetSecretValue` permission. There is no wildcard secret access and no KMS (Key Management Service) decrypt permission.

### CockroachDB foundation

- Migration 001, the schema foundation, and the reviewed runtime roles are live in TestWired.
- The canonical migration-ledger row and environment-marker row are live and passed sanitized readback.
- The deployed Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) can read and validate that marker.
- Persistent memory writes, vector retrieval, capability activation, and Managed MCP (Model Context Protocol) are not live yet.

### Midnight evidence

- The local Midnight environment and commitment flow were merged through PR (Pull Request) #2.
- The local flow compiled, deployed a Compact canary contract, submitted a transaction, proved it, and read the commitment back through the indexer.
- The evidence label is `VERIFIED_LOCAL`.
- The receipt binds to a clean tracked Git commit. It does not independently attest ignored build artifacts, installed dependencies, the compiler binary, or container image contents.
- Midnight is not a live dependency of the public application.

## 4. Status language Penny must preserve

Use these labels precisely:

- `REALDEAL_TEST`: sanitized evidence came from a real external service in the bounded TestWired environment. Connection state is reported separately as `CONNECTED` or `NOT_CONNECTED`.
- `LIVE_TESTWIRED`: a live TestWired database foundation or activation fact has been read back and verified.
- `VERIFIED_LOCAL`: a real local integration was executed and evidenced, but is not deployed publicly.
- `SOURCE_ONLY`: code or configuration exists and tests pass, but the external service or capability is not live.
- `MOCK`: deterministic fixture behavior stands in for a real model or provider.
- `NOT_CONNECTED`: the named provider or the overall application is intentionally unavailable.

Never promote a label because code exists, a build passes, or an operator ran a direct query. Promotion requires the exact evidence gate described in this document.

## 5. POC (Proof of Concept) and MVP (Minimum Viable Product) scope

### Must ship

- One synthetic, public-safe judge scenario.
- One real CockroachDB run record.
- One real first memory session.
- A bounded set of at least 32 deterministic, public-safe fixture summaries and vectors so distributed vector indexing is meaningful, while the judge view returns only the two best memories.
- One deterministic eight-dimensional synthetic embedding generator labeled `MOCK`.
- One real CockroachDB vector index and one real indexed recall query.
- One fresh-session recall proving persistence.
- One unauthorized disclosure attempt that returns zero protected fields.
- One durable denial receipt that can be fetched later.
- One public five-checkpoint user journey.
- One safe second CockroachDB tool.
- One public video shorter than three minutes.

### Explicitly deferred

- Amazon Bedrock integration.
- Public Midnight routing.
- Production identities and production customer data.
- A production authorization system.
- Filecoin integration.
- Full DIDzMonolith integration.
- General-purpose database mutation access.
- Arbitrary user prompts or arbitrary embedding text.
- Production-scale observability and performance tuning.
- TaskFence changes of any kind.

If a deferred item threatens the critical path, stop that item and return to the must-ship list.

## 6. Execution authority and safety rules

### Penny may do without waiting

- Work in isolated Git worktrees and `codex/` branches.
- Read repository files and public official documentation.
- Edit authorized source, tests, documentation, and safe example configuration.
- Run local tests, builds, Docker Compose, the local Midnight stack, and browser checks.
- Create focused commits and push normal fast-forward branch updates.
- Open and update draft PRs (Pull Requests).
- Merge current `origin/main` normally into a feature branch.
- Stop and restart disposable local containers.

### Penny must ask John before doing

- Executing a CloudFormation change set.
- Applying a live CockroachDB migration or grant script.
- Inserting a live capability row.
- Changing CockroachDB Cloud roles, Managed MCP (Model Context Protocol), cluster settings, or network policy.
- Creating, rotating, reading, or deleting a cloud secret.
- Merging any PR (Pull Request) into `main`, unless John explicitly grants standing merge authority in writing.
- Publishing or changing the final Devpost submission.
- Uploading or publishing the final video.
- Making a purchase or enabling a paid service.

### Standing safeguards

- Never force-push, rebase shared history, or rewrite `main`.
- Never delete repository content. Preserve history and use additive corrections.
- Never weaken or remove a test to make a gate pass.
- Never write secrets into commands that can enter shell history.
- Never print credential values, private hostnames, account identifiers, or secret ARNs (Amazon Resource Names).
- Never treat a direct database query as public application evidence.
- If Docker communication fails, tell John: "Check that Docker is on and running."
- The larger WSL (Windows Subsystem for Linux) memory allocation was John's idea and decision. Recheck available memory before a supervised Midnight run.
- Keep TaskFence read-only until John explicitly announces the awards and separately authorizes changes.

## 7. Phase 1: Finish PR (Pull Request) #3 safely

Target time: 3 to 5 hours

Use the existing isolated branch and worktree for `codex/penny-vector-memory-source`.

Before integrating that branch, finish and push one current-state documentation checkpoint for the live read-only CockroachDB probe. Update the current-state surfaces and add a sanitized AWS (Amazon Web Services) evidence archive. Preserve the boundary that persistent memory, vectors, Managed MCP (Model Context Protocol), and mutations are not live. Expect and resolve only the resulting `docs/IMPLEMENTATION_STATUS.md` conflict when merging current `main` into PR (Pull Request) #3.

Minimum current-state documentation sweep: `README.md`, `ROADMAP.md`, `apps/api/README.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/INDEX.md`, `docs/DEPLOYMENT_RUNBOOK.md`, `docs/AWS_AMPLIFY_SAM_DEPLOYMENT_PLAYBOOK.md`, `docs/ARCHITECTURE_DIAGRAM.md`, `docs/PUBLICATION_CHECKLIST.md`, `infrastructure/aws/README.md`, `infrastructure/aws/PROVENANCE.md`, `docs/VIDEO_PLAN.md`, and `docs/DEVPOST_DRAFT.md`. Preserve dated historical claims while correcting current-state summaries.

### Required corrections

The Phase 1 correction scope is limited to the nine paths already present in PR (Pull Request) #3: `database/migrations/002_testwired_vector_memory.sql`, `database/activation/002_testwired_vector_memory_activation.sql`, `database/activation/002_testwired_vector_memory_grants.sql`, `database/activation/verify_vector_memory_activation.sql`, `database/activation/activate_vector_memory_capability.sql`, `database/activation/verify_vector_memory_capability.sql`, `apps/api/test/vector-memory-migration-source.test.mjs`, `database/migrations/README.md`, and `docs/IMPLEMENTATION_STATUS.md`. Any additional path requires John or Clara to expand the scope explicitly.

1. Merge the then-current `origin/main` normally into the branch. Do not pin this step to the older deployed baseline, rebase, or force-push.
2. Make privilege readback prove effective permissions, including privileges inherited through `public`, system privileges, dangerous role options, ownership, database `CONNECT`, schema `USAGE`, and grant options. Use documented `SHOW GRANTS` and `SHOW SYSTEM GRANTS` behavior. Do not rely on `information_schema.schema_privileges.is_grantable` to prove schema grantability.
3. Make schema readback prove exact index columns, exact column order, exact vector operator class, exact composite foreign keys, and exact critical check constraints. Counts and loose text matches are not sufficient.
4. Narrow release-binding claims. The capability helper proves internal binding to an operator-supplied commit label. It does not prove that label is deployed or authentic. Deployment equality must be verified independently.
5. Update the PR (Pull Request) body to list nine changed paths and reconcile the implementation ledger with the now-live Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) environment probe.

### Phase 1 done criteria

- Focused vector-memory source tests pass.
- Every deliberately broken schema, grant, and capability variant fails the appropriate guard.
- `npm run verify` passes.
- Documentation links and whitespace checks pass.
- Sensitive-value scans pass.
- The branch contains only intended files.
- GitHub Verify and Secret Scan checks pass on the tree integrated with current `main`.
- One independent review reports no priority-one finding.
- PR (Pull Request) #3 remains source-only until that review.
- After a clean review, ask John for named merge approval. After approval, merge PR (Pull Request) #3 normally and verify the remote `main` hash.

Do not apply migration 002 during Phase 1.

## 8. Phase 2: Build the smallest real memory journey

Target time: 8 to 12 hours

Start a new isolated branch from the updated `origin/main` after PR (Pull Request) #3 merges.

### Public journey

Implement only these five routes and their existing protocol contracts:

1. Create a synthetic run and Session A.
2. Close Session A, create public-safe summaries, produce deterministic embeddings, and activate the run's projection.
3. Open or reuse Session B, recall the two best matching summaries through CockroachDB vector search, and use the top durable public-safe memory plus current relational scope to select one allowlisted next action.
4. Attempt one fixed unauthorized protected disclosure and persist a `DENIED` receipt with zero protected fields returned.
5. Fetch the immutable receipt by identifier.

### Runtime design constraints

- Use operation-specific query methods with private, static, parameterized SQL (Structured Query Language). Do not create a general SQL (Structured Query Language) executor.
- Keep the current environment-marker check.
- Add a separate release-bound vector-memory capability check. Both checks must pass before any mutation route is available.
- Independently compare the capability's release commit with the actually deployed release.
- Do not flip the global provider readiness flag. Replace the current hardcoded Bedrock-and-Midnight dependency for these five routes with one narrowly scoped readiness gate that requires only the proven AWS (Amazon Web Services) transport, CockroachDB environment marker, exact release capability, and supported five-route memory slice.
- Keep the overall application `NOT_CONNECTED` for deferred providers while allowing only the capability-gated synthetic memory routes.
- Use serializable transactions for each logical operation.
- Hash idempotency keys before storage. Never log or return the raw key.
- A repeated idempotency key with the same request must return the same durable identifiers and stored response.
- The same key with different request content must fail and write nothing.
- Retry only CockroachDB serialization failures, at most three bounded attempts.
- Persist the original transport request identifier with each receipt so later receipt reads reproduce the same evidence.
- Reject cross-run, stale-projection, wrong-operation, and overlength inputs.
- Keep responses on exact allowlists so database, user, host, certificate, secret, query, and commitment internals cannot leak.

### Synthetic embeddings

- Implement `mhelixctw-synthetic-embedding-v1` as deterministic fixture code.
- Use exactly eight finite values and unit normalization.
- Accept only fixed public-safe fixture text.
- Reject control characters, excessive length, a zero vector, non-finite values, and the wrong dimension.
- Bind the model identifier, canonical public-safe input, and canonical vector into a SHA-256 (Secure Hash Algorithm 256-bit) commitment.
- Label embedding generation `MOCK` everywhere.
- CockroachDB storage, vector distance, indexed retrieval, and durable receipts may become `REALDEAL_TEST` only after live evidence.

### Phase 2 commit sequence

Keep commits small and reviewable:

1. Database and source-contract corrections.
2. Deterministic embedding and database provider.
3. Five-route handler integration and tests.
4. Five-checkpoint web journey and accessibility tests.
5. Infrastructure smoke contract and source-only documentation.

Push each verified checkpoint. Keep the PR (Pull Request) draft until the complete source path is green.

### Phase 2 done criteria

- Unit tests cover embeddings, exact queries, bounds, idempotency, rollback, replay, and negative authorization.
- Integration tests cover the complete five-route journey with a controlled database fixture.
- Tests prove recalled durable memory influences the selected allowlisted Session B action, while the protected-disclosure denial remains enforced by code and never trusts memory as authorization policy.
- A missing or mismatched capability returns HTTP (Hypertext Transfer Protocol) 503 and writes nothing.
- The current fixed denied mutation remains fail-closed until live activation.
- Web tests prove five checkpoints, truthful provider labels, receipt evidence, keyboard access, and readable error states.
- `npm run verify` and `npm run infra:validate` pass.
- The built Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) entry point imports and runs from the actual package artifact.
- All source status remains `SOURCE_ONLY` before live activation.

## 9. Phase 3: Activate, deploy, and prove the memory journey

Target time: 2 to 4 hours with John available

This phase contains live mutations and requires John's explicit approval at each named boundary.

### Database order

1. Commit the complete runtime source, obtain a green remote source commit, and record its full 40-character hash.
2. Read-only preflight: verify the database, migrator identity, current marker, migration ledger, zero unexpected migration-002 objects, and the vector-index feature setting.
3. Apply migration 002 while the new vector table is empty.
4. Run schema-only exact readback for every table, column, constraint, foreign key, check, and index shape.
5. Insert the migration-ledger row through the reviewed activation transaction.
6. Apply the exact resumable grant script.
7. Run the complete pre-capability verifier. It must prove the exact schema, ledger, effective grants, inherited grants, role options, ownership, grant options, forbidden privileges, and an empty capability table.
8. Insert the release-specific capability row using the green source commit. Derive the commitment inside the helper. Do not hand-enter a commitment.
9. Run the separate post-capability verifier with the same expected commit.
10. Independently compare that expected commit with the commit reported by the deployed release after deployment.

If any readback is false, stop. Do not deploy, repair manually, or weaken the verifier.

### Deployment order

1. Build from a clean isolated worktree at the exact release commit.
2. Run the full local verification and artifact secret scan.
3. Create a CloudFormation change set without executing it.
4. Review the change set for no replacement, no unexpected resource, exact handler, exact release commit, exact secret permission, and no wildcard or KMS (Key Management Service) permission.
5. Ask John for explicit execution approval naming the exact change set.
6. Execute it, wait for `UPDATE_COMPLETE`, and confirm the function is active and updated successfully.
7. Run the exact release-bound public smoke tests.

### Live memory proof

Prove all of these through the public application route:

- Create succeeds once.
- Close builds and activates a projection.
- Recall returns the expected ranked durable memories.
- Disclosure denial returns zero protected fields.
- Receipt fetch returns the same immutable evidence.
- Replaying every idempotency key creates no duplicate row.
- Reusing a key with changed content fails and writes nothing.
- A fresh browser or process recalls the prior memory.
- The run contains at least 32 bounded deterministic public-safe vectors, and recall returns only the two intended best matches.
- A read-only `EXPLAIN` shows vector search using the intended index with the exact run and projection prefixes.
- The overall application remains fail-closed for every unimplemented provider and mutation.
- Cloud logs contain no credential or database detail and show no function error.

Only after all of those pass may CockroachDB memory and vector retrieval be labeled `REALDEAL_TEST` and `CONNECTED`.

## 10. Phase 4: Qualify a second CockroachDB tool

Target time: 1.5 to 3 hours

Distributed Vector Indexing is the first qualifying CockroachDB tool. The project still needs a second one.

### Preferred path: Managed MCP (Model Context Protocol)

Use Managed MCP (Model Context Protocol) only if all of these can be completed safely within 90 minutes:

- Remove or independently prove the absence of inherited `admin` power.
- Restrict the identity to a single sanitized evidence view.
- Use read-only OAuth (Open Authorization).
- Pin access to the intended cluster.
- Reconnect and prove only the view can be read.
- Prove base tables, writes, schema changes, grants, secrets, and other clusters are unavailable.
- Capture sanitized audit evidence.

If Cockroach Cloud restores broad privilege or the connector stops working after the correction, stop this path. Do not call it least-privileged.

### Fallback path: CockroachDB Agent Skills Repo

If the safe Managed MCP (Model Context Protocol) gate cannot be completed in 90 minutes, use the official CockroachDB Agent Skills Repo:

- Select only the skill or skills actually used by the agent for schema, query, security, or operational work.
- Record the exact upstream source and revision.
- Add a reproducible, documented invocation using only public-safe inputs.
- Show what the agent did with the skill and what output affected the application or its verified operation.
- Preserve the skill's license and attribution.
- Do not claim that merely copying a skill directory qualifies.

Whichever path is used, the README and video must state exactly what the second tool did.

## 11. Phase 5: Judge-facing web experience

Target time: 2 to 3 hours

Keep the public interface simple:

1. Start a TestWired run.
2. Close the first session and remember the public-safe context.
3. Start a fresh session and recall the memory.
4. Attempt protected disclosure and show the denial.
5. Open the durable receipt.

Show compact status badges:

- Helix Runtime Bridge (AWS (Amazon Web Services) Lambda): `REALDEAL_TEST`, `CONNECTED`.
- CockroachDB memory: `REALDEAL_TEST`, `CONNECTED` only after Phase 3 passes.
- Distributed Vector Indexing: `REALDEAL_TEST` only after `EXPLAIN` proves index use.
- Midnight: `VERIFIED_LOCAL`, not a public route dependency.
- Synthetic embedding: `MOCK`.
- All deferred providers: `SOURCE_ONLY` or `NOT_CONNECTED`.

Required checks:

- Public custom-domain load.
- Desktop and mobile viewport.
- Keyboard-only navigation.
- Visible focus states.
- Reduced-motion behavior.
- No browser console errors.
- No unexpected network errors.
- Exact accessible names for buttons, status, and receipts.
- No secret or internal identifier in page content, page source, or network responses.

## 12. Phase 6: Submission package

Target time: 2 to 3 hours

### Repository

- Public repository URL (Uniform Resource Locator) works while signed out.
- License is visible at the repository top level and in the GitHub About section.
- README explains the problem, architecture, setup, example data, status labels, safety boundaries, and exact tools used.
- README discloses any pre-existing work incorporated into the project and identifies what was created during the official submission period.
- `.env.example` contains names and safe placeholders only.
- Installation and run commands work from a clean clone.
- Architecture diagram matches the deployed system.
- No stale claim says memory, vectors, Managed MCP (Model Context Protocol), Midnight, or a provider is live when it is not.
- The public application remains free and unrestricted for judges through September 15, 2026 at 5:00 PM (post meridiem) EDT (Eastern Daylight Time).

### Public demo

- Custom URL (Uniform Resource Locator) works while signed out.
- The five-checkpoint journey succeeds from a fresh browser.
- The demo shows persistence after refresh or a fresh session.
- The denial and receipt are visible without exposing protected data.

### Video under three minutes

Use this target timeline:

- 0:00 to 0:20: the problem, agents forget or disclose too much.
- 0:20 to 0:40: the architecture, browser to Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) to CockroachDB, with local Midnight shown as a separate privacy proof.
- 0:40 to 1:10: create and close Session A, then persist summaries and vectors.
- 1:10 to 1:40: open Session B and recall the prior memory through vector search.
- 1:40 to 2:05: attempt protected disclosure and show zero fields plus the durable denial receipt.
- 2:05 to 2:25: show the second CockroachDB tool and explain what the agent did with it.
- 2:25 to 2:45: show the local Midnight receipt and state its `VERIFIED_LOCAL` boundary.
- 2:45 to 2:55: show the public repository and close with the production-readiness story.

Record the video only after the live demo is stable. Upload it publicly to YouTube or Vimeo.

### Devpost

- John joins or confirms entry in the hackathon, opens the Devpost draft now, verifies the entrant identity, and confirms access to the intended YouTube or Vimeo account. These account actions should not wait for final code.
- Public repository URL (Uniform Resource Locator).
- Functional public demo URL (Uniform Resource Locator).
- Public video URL (Uniform Resource Locator) shorter than three minutes.
- CockroachDB tools named and explained.
- AWS (Amazon Web Services) services named and explained.
- Architecture diagram.
- Short explanation of persistent memory, privacy boundary, failure behavior, and real-world impact.
- Optional product feedback for CockroachDB.

Submit an honest complete entry before spending time on decorative polish.

## 13. Verification commands and evidence gates

Use repository scripts when available. Do not invent a parallel verification system.

Minimum source gates:

```bash
npm ci
npm run verify
npm run infra:validate
node scripts/verify-doc-links.mjs
git diff --check
git status --short
```

Also run the focused vector-memory, idempotency, receipt, web-evidence, infrastructure-contract, and artifact-secret tests added by the relevant milestone.

Minimum delivery evidence:

- Local commit hash.
- Remote branch hash equality.
- GitHub Verify result.
- GitHub Secret Scan result.
- Exact intended file list.
- Sanitized live activation booleans.
- CloudFormation stack result and deployed release equality.
- Public smoke result.
- Vector `EXPLAIN` result.
- Fresh-session persistence result.
- Second-tool access and denial evidence.
- Desktop and mobile browser result.
- Final public repository, demo, and video URLs.

A green build is not proof of deployment. A remote hash is not proof of CI (Continuous Integration). A direct database query is not proof of public behavior. Record each evidence class separately.

## 14. Commit, push, and review discipline

- One coherent milestone per commit.
- Stage exact file paths, never `git add .` in a dirty worktree.
- Review the staged diff and run `git diff --cached --check` before committing.
- Push normal fast-forward branches after each verified milestone.
- Keep risky or incomplete work in draft PRs (Pull Requests).
- Merge only after current-main integration, green checks, an independent no-blocker review, and John's named approval unless he has granted standing merge authority in writing.
- Never force-push.
- Never amend a published evidence commit to make its hash match a receipt.
- Put live receipts in a later evidence commit, because a commit cannot contain a receipt bound to its own final hash.
- Archive local Midnight state recoverably before reset. Do not delete it.
- After every merge, verify local `main`, `origin/main`, and `git ls-remote` equality.
- After every deployment, verify the public release equals the exact source commit.

## 15. When Penny should stop and ask John

Stop immediately if:

- A command would display or move a secret.
- A live action is broader than the exact approved migration, grant, capability, or change set.
- A CloudFormation change set adds, removes, or replaces an unexpected resource.
- A database verifier reports any false value.
- Managed MCP (Model Context Protocol) still has broad or inherited administrator access.
- The deployed release differs from the capability release.
- Public memory behavior works only through a direct database connection.
- An action requires deleting repository content, runtime evidence, or cloud state.
- A paid service, billing decision, or account-level permission is required.
- Docker does not respond, in which case say: "Check that Docker is on and running."

Do not stop for ordinary code decisions that can be resolved safely through source, tests, official documentation, and this plan.

## 16. Runway rules

If time becomes tight, cut scope in this order:

1. Decorative interface polish.
2. Additional scenarios.
3. Additional providers.
4. Additional Midnight features.
5. Managed MCP (Model Context Protocol), if the Agent Skills fallback is already credible.
6. Nonessential diagrams and long-form documentation.

Do not cut:

- Real persistent memory.
- Real vector retrieval and index proof.
- The second CockroachDB tool.
- The live AWS (Amazon Web Services) path.
- The denial receipt.
- Public demo availability.
- The public video.
- Truthful status labels.
- Secret and least-privilege gates.

If vector memory cannot be made live, do not claim the submission meets that requirement. Report the exact blocker and preserve the live read-only and local Midnight evidence honestly.

## 17. Final completion checklist

### Source and database

- [ ] PR (Pull Request) #3 corrected against current `main`, independently reviewed, and merged.
- [ ] Deterministic synthetic embedding implementation and tests merged.
- [ ] Five-route persistent-memory implementation and tests merged.
- [ ] Five-checkpoint web experience and tests merged.
- [ ] Migration 002 applied and exact schema readback passed.
- [ ] Exact runtime grants applied and effective-grant readback passed.
- [ ] Release-specific capability inserted and post-activation readback passed.
- [ ] Public create, close, recall, deny, and receipt-fetch journey passed.
- [ ] Idempotent replays created no duplicate state.
- [ ] Fresh-session recall proved persistence.
- [ ] Vector `EXPLAIN` proved the intended index was used.

### Required tools

- [x] Helix Runtime Bridge (AWS (Amazon Web Services) Lambda) deployed and publicly verified.
- [ ] CockroachDB Distributed Vector Indexing live and publicly demonstrated.
- [ ] A second qualifying CockroachDB tool safely integrated and evidenced.

### Midnight

- [x] Local Midnight environment and commitment transaction flow merged.
- [x] Local proof truth boundary corrected.
- [ ] Final README and video describe Midnight as `VERIFIED_LOCAL`, not publicly connected.

### Judge package

- [ ] Public repository and license verified while signed out.
- [ ] Clean-clone setup instructions verified.
- [ ] Architecture diagram matches the final deployment.
- [ ] Public custom-domain demo verified while signed out.
- [ ] Desktop, mobile, keyboard, console, and network checks passed.
- [ ] Public application scheduled to remain free and unrestricted through the end of judging on September 15, 2026 at 5:00 PM (post meridiem) EDT (Eastern Daylight Time).
- [ ] Video recorded, shorter than three minutes, and public.
- [ ] Devpost tool and service descriptions are exact.
- [ ] Devpost entry submitted before the deadline.

## 18. Penny's first action after reading this file

Do exactly this:

1. Confirm the active repository is `/home/js/DIDzMonolith/MidnightHelixCTW`.
2. Confirm Docker is on before any container work.
3. Confirm with John that the Devpost draft and public video account are ready.
4. Finish and push the live-probe current-state documentation checkpoint described in Phase 1.
5. Read the current PR (Pull Request) #3 diff and its latest independent review.
6. Merge current `origin/main` normally into the PR (Pull Request) #3 branch.
7. Correct the four Phase 1 gates.
8. Push a normal branch checkpoint and keep the PR (Pull Request) draft.
9. Report the exact commit, changed files, checks, and any remaining blocker in the standing handoff note.

After Phase 1 is clean, move immediately to the real five-route memory journey. Do not begin a new speculative integration.

## 19. Source links

- [Official hackathon page and current submission requirements](https://cockroachdb-ai.devpost.com/)
- [Public MidnightHelixCTW repository](https://github.com/bytewizard42i/MidnightHelixCTW)
- [Draft vector-memory PR (Pull Request) #3](https://github.com/bytewizard42i/MidnightHelixCTW/pull/3)
- [Public TestWired application](https://testwired.helixctw.com/)

This file is the completion control document. Update it only when verified evidence changes a checkbox, status, release commit, or execution gate.

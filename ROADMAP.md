# MHelixCTW Hackathon Roadmap

**Last updated:** August 15, 2026

**Internal submission target:** Sunday, August 16, 2026, 9:00 PM EDT
**Official deadline:** Tuesday, August 18, 2026, 5:00 PM EDT
**Judging availability:** Keep the application available through September 15,
2026, 5:00 PM EDT

## Outcome

The release target is one public TestWired application that proves all of the following:

1. A fresh Ai-agent session retrieves useful prior memory from CockroachDB.
2. CockroachDB combines vector recall with exact transactional state.
3. Midnight test infrastructure verifies a private property predicate without
   exposing the underlying fictional evidence.
4. The agent receives only the authorized result.
5. A disposable hot-memory projection can be rebuilt and verified.
6. CockroachDB Managed MCP independently inspects the memory and rebuild
   receipt in read-only mode.
7. AWS meaningfully hosts the agent path.

## Actual evidence snapshot, August 15

| Area | Current state |
| --- | --- |
| Public repository and synthetic fixture baseline | The standalone repository is public and Apache-2.0 licensed; repeat source, fixture, provenance, media, and secret checks at the final release commit. |
| Judge UI (User Interface) | `LIVE_TESTWIRED`; Amplify serves `main` at `https://testwired.helixctw.com` and its generated address. Hosting and read-only connection are live, while mutation controls remain locked. |
| AWS (Amazon Web Services) API (Application Programming Interface) Gateway and Lambda | `LIVE_TESTWIRED` for public transport only; the application stack is `CREATE_COMPLETE`, read-only routes respond, and valid operations fail closed because downstream providers are disconnected. |
| CockroachDB database and schema foundation | `LIVE_TESTWIRED` foundation evidence: database and schema `mhelix_testwired` are live; migration `001_testwired_memory_core.sql` created 10 tables owned by `mhelix_migrator`; the migrator and runtime users do not inherit `admin`; runtime marker-table access and `mhelix_runs` denial were verified; exactly one canonical marker row and one migration-001 ledger row are active. |
| CockroachDB connection and TestWired environment probe | `SOURCE_ONLY` probe and `NOT_CONNECTED` runtime: source commit `7a29f22` contains the reviewed atomic activation, which an authenticated `mhelix_migrator` session applied. Sanitized post-commit readback returned all 8 marker comparisons and all 6 ledger comparisons true. The deployed Lambda bootstrap remains absent. |
| CockroachDB persistent memory and vector retrieval, Bedrock, Midnight, reconstruction, Managed MCP (Model Context Protocol) | `PLANNED` and `NOT_CONNECTED`. |
| Filecoin encrypted cold evidence | `PLANNED`; it is outside the critical hackathon judge path. The post-submission allocation, Calibration lifecycle, security boundary, and promotion evidence are defined in the [Filecoin integration plan](docs/FILECOIN_INTEGRATION.md). |
| DIDz, AgenticDID, RWAz | Synthetic fixtures are `MOCK`; callable provider connections remain `NOT_CONNECTED`. |

The Friday live-service exit gate is partially met. A signed-out browser reaches
the real Lambda transport, and the real CockroachDB database and schema
foundation exists. No CockroachDB-backed application-memory route exists yet,
so the provider remains `NOT_CONNECTED`.

## Immediate Priority Zero spine

Work in this order before expanding the live path:

1. Make CockroachDB the persistent cross-session agent-memory layer.
2. Put CockroachDB Distributed Vector Indexing in the real recall path.
3. Add read-only CockroachDB Managed MCP (Model Context Protocol) verification
   as the second qualifying CockroachDB tool.
4. Complete and verify the public guided memory flow while preserving the
   existing fail-closed boundary.
5. Record a public demonstration video under three minutes that visibly shows
   the CockroachDB memory layer and both qualifying tools.

AWS (Amazon Web Services) transport and the CockroachDB database and schema
foundation are already live. The CockroachDB application provider, persistent
memory and vector path, Bedrock, Midnight, reconstruction, and Managed MCP
(Model Context Protocol) must not be described as live until each has current
execution evidence.

## Non-negotiable scope

One scenario only: `Is this property unencumbered?`

Real TestWired services:

- CockroachDB Cloud
- CockroachDB distributed vector indexing
- CockroachDB Managed MCP
- AWS API Gateway, Lambda, and Bedrock
- Midnight supported test infrastructure

Explicit mock providers:

- DIDz identity
- AgenticDID authority
- RWAz property identity

Deferred until after submission:

- Production identities or assets
- Legal or financial effect
- General-purpose chat
- Filecoin-hosted judge path
- Multiple property cases
- LegacyKey
- TaskFence integration
- Multi-region deployment claims
- Production Midnight or CockroachDB claims

## Thursday, August 13: clean foundation

- [x] Choose the canonical repository and Apache-2.0 license.
- [x] Inventory adapter, standards, Helix documentation, slides, videos, and
      media.
- [x] Define the TestWired and mock boundaries.
- [x] Select the property question from the existing Helix slide deck.
- [x] Create the clean standalone Git repository and public GitHub remote.
- [x] Import the exact adapter snapshot with provenance.
- [x] Bundle the minimal TestTown fixture with a pinned source commit.
- [x] Run the first secret, license, and media-rights checks at the August 13 baseline.
- [ ] Repeat source, secret, license, fixture, and media checks at the release commit.

Exit gate: a public clone contains the license, provenance, synthetic fixture,
architecture, roadmap, and green offline verification.

## Friday, August 14: live memory and AWS

### Actual Friday status

The first AWS (Amazon Web Services) create was attempted and rolled back before
API (Application Programming Interface) Gateway produced an endpoint. The
transformed OpenAPI server and CORS (Cross-Origin Resource Sharing) defects were
corrected, a built-template contract was added and validated, and a later
deployment succeeded. The public UI (User Interface) and read-only transport are
live. The CockroachDB database and schema foundation is also live and verified,
but its migration-ledger row, environment-marker row, and deployed Lambda
bootstrap are absent. CockroachDB, Bedrock, Midnight, reconstruction, and
Managed MCP (Model Context Protocol) remain application-disconnected, so
operational controls remain locked.

### CockroachDB

- [x] Apply checksummed migration `001_testwired_memory_core.sql` for the
  additive memory foundation.
- [x] Verify separate migrator and runtime users, no `admin` inheritance,
  marker-table access, and denial on `mhelix_runs`.
- [x] Commit the canonical marker source, invariant tests, and expected digest.
- [ ] Insert and verify the migration-ledger and environment-marker rows.
- [ ] Deploy the reviewed Lambda bootstrap and verify the read-only probe.
- [ ] Seed exactly one isolated synthetic case.
- [ ] Generate a real Titan embedding and prove a CockroachDB cosine vector query.
- [ ] Create and verify the separate read-only MCP (Model Context Protocol) role.

### AWS

- Deploy API Gateway and one bounded Lambda coordinator.
- Store the database secret in AWS Secrets Manager.
- Restrict CORS to the public frontend origin.
- Add request-size limits, throttling, idempotency, model-call caps, timeouts,
  redacted logs, and a circuit breaker.
- Confirm the generated `execute-api` URL before adding custom DNS.

Exit gate by Friday evening: a signed-out browser reaches a real Lambda health
route and one real CockroachDB-backed memory route.

## Saturday, August 15: Midnight, reconstruction, and judge interface

### Midnight

- Implement one narrow supported Compact contract or equivalent current test
  integration.
- Commit to the fictional property evidence or predicate state.
- Return a real test transaction or proof receipt.
- Keep raw evidence, passwords, keys, and witnesses out of logs and
  CockroachDB.
- Fail closed if the expected network, contract, or receipt cannot be verified.

Midnight gate by Saturday noon: the interface may say `LIVE MIDNIGHT TEST
NETWORK` only after a real, reproducible receipt is available. Otherwise stop
and reassess the repository name and submission claim.

### Reconstruction

- Treat the CockroachDB search projection as disposable, not canonical truth.
- Create a second projection generation from the append-only manifest and
  encrypted synthetic evidence.
- Verify record counts, hashes, memory identifiers, and commitment lineage.
- Atomically switch the active projection pointer.
- Preserve the old generation for inspection, then expire it through a bounded
  maintenance procedure after the demo.
- Never DROP or TRUNCATE through a public route.

### Frontend

- Build one guided interface with fixed prompt choices.
- Show Session A closing and Session B beginning with no inherited chat.
- Display memory identifiers, vector distance, AWS request ID, Midnight receipt,
  projection generation, and rebuild receipt.
- Show the unauthorized deed request returning no private fields.
- Label every subsystem as `REALDEAL_TEST`, `MOCK`, or `NOT CONNECTED`.

Exit gate by Saturday 8:00 PM: the complete judge journey succeeds three times
without duplicate writes, cross-run leakage, or silent mock fallback. Freeze
feature work.

## Sunday, August 16: proof, polish, and submission

### Morning

- Run signed-out desktop and mobile end-to-end tests.
- Check browser console, network errors, keyboard navigation, focus, contrast,
  reduced motion, and readable evidence labels.
- Run the deny, replay, provider-failure, and rebuild-corruption cases.
- Verify Managed MCP is read-only and scoped to the intended cluster.

### Midday

- Put `Judge in 60 seconds` at the top of the README.
- Publish exact setup instructions and `.env.example`.
- Complete the hackathon change log and prior-work disclosure.
- Record source commits, deployed commits, regions, models, cluster identity,
  and release tag without exposing credentials.

### Afternoon

- Record a 2:35 to 2:50 public video.
- Show CockroachDB memory working on screen.
- Use captions and no unlicensed music.
- Upload to YouTube or Vimeo and test in a signed-out browser.
- Complete the Devpost text and architecture diagram.

### Evening

- Retest every public link.
- Verify the GitHub repository is public and Apache-2.0 is detected.
- Verify the demo is free and requires no private wallet or local service.
- Submit by 9:00 PM EDT, preserving the official-deadline buffer.

## Judge video sequence

- `0:00-0:15`: The agent finds the answer but never sees the deed.
- `0:15-0:40`: Session A stores commitments and closes.
- `0:40-1:15`: Fresh Session B recalls through CockroachDB vectors.
- `1:15-1:40`: Midnight verifies the allowed one-bit predicate.
- `1:40-1:58`: The private deed request is denied.
- `1:58-2:25`: Rebuild the hot projection and obtain the same commitment.
- `2:25-2:45`: Managed MCP verifies memory, generation, and receipt.
- `2:45-2:50`: Close on reconstructible private agent memory.

## Definition of done

- Public Apache-2.0 source repository with every required dependency and
  setup instruction.
- Functional public frontend and AWS API.
- CockroachDB is the durable cross-session memory layer.
- Distributed vector indexing and Managed MCP are visibly used.
- Midnight test evidence is real or excluded from the live claim.
- DIDz, AgenticDID, and RWAz outputs remain visibly mocked.
- Synthetic data only, no secrets, private records, wallets, or real assets.
- Denial, replay, provider failure, and corrupt rebuild all fail safely.
- Public video under three minutes and Devpost entry complete.
- Application remains available throughout judging.

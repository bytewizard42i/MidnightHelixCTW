# MHelixCTW Hackathon Roadmap

**Internal submission target:** Sunday, August 16, 2026, 9:00 PM EDT
**Official deadline:** Tuesday, August 18, 2026, 5:00 PM EDT
**Judging availability:** Keep the application available through September 15,
2026, 5:00 PM EDT

## Outcome

Ship one public TestWired application that proves all of the following:

1. A fresh Ai-agent session retrieves useful prior memory from CockroachDB.
2. CockroachDB combines vector recall with exact transactional state.
3. Midnight test infrastructure verifies a private property predicate without
   exposing the underlying fictional evidence.
4. The agent receives only the authorized result.
5. A disposable hot-memory projection can be rebuilt and verified.
6. CockroachDB Managed MCP independently inspects the memory and rebuild
   receipt in read-only mode.
7. AWS meaningfully hosts the agent path.

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
- [ ] Create the clean standalone Git repository and public GitHub remote.
- [ ] Import the exact adapter snapshot with provenance.
- [ ] Bundle the minimal TestTown fixture with a pinned source commit.
- [ ] Run the first secret, license, and media-rights checks.

Exit gate: a public clone contains the license, provenance, synthetic fixture,
architecture, roadmap, and green offline verification.

## Friday, August 14: live memory and AWS

### CockroachDB

- Add checksummed migrations for sessions, events, summaries, embeddings,
  canonical evidence manifests, projection generations, and rebuild receipts.
- Use a separate migrator role, least-privilege Lambda runtime role, and
  read-only MCP role.
- Install and verify an environment marker before any runtime query.
- Seed exactly one isolated synthetic case.
- Generate a real Titan embedding and prove a CockroachDB cosine vector query.

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

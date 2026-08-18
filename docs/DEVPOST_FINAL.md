# Devpost Submission — CockroachDB x AWS Hackathon

**Deadline**: August 18, 2026 @ 5:00 PM EDT
**Devpost URL**: https://cockroachdb-ai.devpost.com/
**Demo URL**: https://testwired.helixctw.com
**GitHub**: https://github.com/bytewizard42i/MidnightHelixCTW
**License**: Apache-2.0

---

## Title

HelixCTW | AWS + CRDB Privacy-Preserving Registry + AI Agent

## Short Description

HelixCTW: AI agents manage identity, assets, health records & credentials with privacy-by-construction. CockroachDB vector search + AWS Lambda + Managed MCP Server. Live 7-checkpoint TestWired proof at testwired.helixctw.com.

---

## Inspiration

AI agents are moving from experiments into production, but they have a memory problem. Traditional databases were built for human-scale reads and writes. Agents spawn autonomously, write constantly, and need memory that persists across sessions, regions, and failures.

We saw this gap firsthand while building **DIDzMonolith**, a privacy-preserving digital identity and asset ecosystem for the Midnight blockchain. The infrastructure was there (commitment-based identity, scoped agent authority, verifiable credentials), but there was no persistent, queryable memory layer that an AI agent could reason over in real-time.

**HelixCTW** (Helix Cockroach Terraform Woven) was born from that gap: What if CockroachDB's distributed vector indexing became the semantic memory layer for an AI agent managing identity, real-world assets, health records, and credentials, all with privacy by construction?

## What it does

HelixCTW is a **privacy-preserving registry + AI agent** that stores, retrieves, and reasons over structured data using CockroachDB as its persistent memory layer.

The live demo at **testwired.helixctw.com** walks through a **7-checkpoint privacy proof** using the Morrow Family Farmhouse, a fictional TestTown property. Each checkpoint advances only after the real API returns valid evidence. A disabled button is a truthful boundary.

The agent manages:

- **Identity (DIDz)**: Cryptographic commitments, never names. Every person, pet, agent, and issuer is a temp-ID placeholder today, swappable for real Midnight DIDz later.
- **Real-World Assets (RWAz)**: Real estate, vehicles, luxury goods, pets, with ownership history, compliance checks, and transfers.
- **Health Records**: Three verticals, SafeHealthData (human), PetProData (companion animals), EquinePro (horses). All fields are bucketed/categorized, no raw PII.
- **Verifiable Credentials**: College degrees, licenses, certifications, security passes, claims about a holder, not transferable assets.
- **Agent Authority (AgenticDID)**: Scoped, capped grants that let users delegate specific powers to AI assistants.

**Privacy by construction**: Owner fields are cryptographic commitments. Locations are coarse (city/region). Valuations are bucketed ranges. Health data uses condition categories, not diagnoses. No raw PII anywhere.

### The 7-Checkpoint TestWired Proof

1. **Open Session A** -- Create a bounded run with a narrow property predicate ("Is this property unencumbered?")
2. **Close Session** -- Browser forgets; CockroachDB retains durable memory
3. **Recall in Session B** -- Semantic vector recall via CockroachDB cosine distance search; the agent recovers context with no browser storage
4. **Verify Predicate** -- "Is this property unencumbered?" returns one authorized bit: true. No deed text, no mortgage record, no owner information
5. **Privacy Boundary** -- An unauthorized agent requests the full deed, mortgage record, owner birth date, and private contact info. The API denies every field. Memory cannot become permission
6. **Rebuild Projection** -- A disposable shadow index is rebuilt from the same canonical corpus. The evidence commitment stays stable, proving the canonical source set was preserved
7. **Verify Continuity** -- Same canonical memory, same commitment, same predicate, same value through the new projection generation

The TestWired demo uses synthetic 8-dimensional embeddings for reproducible offline verification. The full platform uses Amazon Bedrock Titan 1536-dimensional embeddings in production.

## How we built it

**Architecture:**

```
User -> React Frontend (testwired.helixctw.com)
         -> AWS API Gateway -> AWS Lambda (Helix Runtime Bridge)
              -> CockroachDB Cloud (persistent memory layer)
                   |-- mhelix_memory_summaries (1,512 rows)
                   |-- mhelix_memory_summary_embeddings (1,071 rows, VECTOR(8))
                   |-- mhelix_memory_events (1,701 rows)
                   |-- mhelix_action_receipts (139 rows)
                   |-- mhelix_runs, sessions, projections, capabilities
                   +-- 14 tables total in mhelix_testwired schema
              -> AWS Secrets Manager (CockroachDB credentials)

AI Agent (development-time):
         -> CockroachDB Cloud Managed MCP Server (read-only inspection)
              -> list_databases, list_tables, select_query, explain_query
              -> cluster: helixchain-hackathon (v26.2.5)
```

**CockroachDB tools used (2 of 4 required):**

1. **Distributed Vector Indexing** -- The `mhelix_memory_summary_embeddings` table stores `VECTOR(8)` embeddings with a `vector_cosine_ops` index class. The recall query pins `run_id` and `projection_generation_id` as exact-value prefix columns (the documented requirement for the index to be usable), then orders by `<=>` cosine distance, bounded to two candidates. The stored vector and its commitment never leave the database. This powers Checkpoint 3 (semantic recall) and Checkpoint 7 (continuity verification through a rebuilt projection).

2. **CockroachDB Cloud Managed MCP Server** -- The AI agent connects to CockroachDB through the managed MCP Server endpoint at `https://cockroachlabs.cloud/mcp` (cluster `helixchain-hackathon`). The agent uses it for read-only inspection: listing databases, listing tables, running SELECT queries, explaining query plans, and verifying schema shapes. It is configured in the IDE MCP config with the cluster ID header, giving the agent direct database access with audit logging and read-only safety defaults. The provider matrix in the live UI shows this as `CONNECTED` / `LIVE_TESTWIRED`.

**AWS services used:**

1. **AWS Lambda** -- Serverless API handler (Helix Runtime Bridge). Bounded coordinator with idempotency keys, serializable transactions, retry-only on SQLSTATE 40001, and fail-closed validation. One serializable transaction per logical operation.
2. **Amazon API Gateway** -- Public front door for the TestWired API at testwired.helixctw.com.
3. **AWS Secrets Manager** -- CockroachDB connection credentials stored securely, never hardcoded.
4. **Amazon Bedrock** (platform vision) -- Claude Sonnet 4.6 for agent reasoning and Titan for 1536-dim embeddings in the full platform. The TestWired demo uses synthetic 8-dim embeddings for reproducible offline verification.

**Data scale:**

The `mhelix_testwired` schema contains 14 tables with real persisted memory:

| Table | Rows |
|-------|------|
| mhelix_memory_summaries | ~1,512 |
| mhelix_memory_summary_embeddings | ~1,071 |
| mhelix_memory_events | ~1,701 |
| mhelix_action_receipts | ~139 |
| mhelix_run_active_projections | ~19 |
| mhelix_runtime_capabilities | 1 |
| mhelix_schema_migrations | 1 |
| mhelix_environment_markers | 1 |

Every memory event, summary, embedding, and receipt is a real persisted row in CockroachDB. The 7-checkpoint proof reads and writes against these tables live.

**Tech stack:** TypeScript, React, Node.js, `pg` (CockroachDB wire-compatible), AWS Lambda, API Gateway, Secrets Manager, CockroachDB Cloud (v26.2.5), CockroachDB MCP Server.

## Challenges we ran into

- **Evidence commitment continuity across projection rebuilds**: The TestWired proof requires that a projection rebuild (Checkpoint 6) preserves the exact evidence commitment from the original predicate (Checkpoint 4), and that a continuity verify (Checkpoint 7) matches both. The commitment is derived from the canonical memory ID and the original projection generation, not the current active one, so it stays stable across rebuilds. Getting this right required tracing through the full derive-evidence-commitment path and fixing the API to consistently use the canonical memory ID and original generation ID.

- **Lazy provider facade omitting verify/rebuild methods**: The lazy facade in `cockroach-bootstrap.js` had three separate name lists (write-gate, UPDATE allowlist, and the facade surface) that all needed to be extended when a provider operation was added. Forgetting the facade produced `undefined` at runtime -- a generic 503 in Lambda that no handler test caught, because handler tests inject a stub provider directly. We added a regression test that pins the facade to the provider's real method surface.

- **Vector index usability constraints**: A CockroachDB vector index is only usable when every prefix column is constrained to an exact value. The recall query pins `run_id` and `projection_generation_id` and orders by `<=>`, matching the declared `vector_cosine_ops` class. Getting the prefix columns wrong silently degrades to a full scan with no error.

- **Hardcoded event sequence collision**: Checkpoint 5's event sequence was hardcoded as `2`, which collided with `PREDICATE_VERIFIED`. The fix was to derive the sequence dynamically from the current event count rather than assuming a fixed position.

- **Missing UPDATE transition for projection rebuild**: The `mhelix_run_active_projections` table lacked a guarded UPDATE transition for the rebuild drill. Without it, Checkpoint 6 could not repoint the active projection binding. We added the transition with a guard on the previous generation ID and the new generation being ACTIVE, plus the required GRANT.

- **Lambda packaging trap that passes every local test**: The deployed artifact contains only `apps/api`. Workspace symlinks would dangle inside the package, so an import of another workspace resolves perfectly in tests and throws `ERR_MODULE_NOT_FOUND` in Lambda. The solution: `apps/api` must be self-contained, with the embedding generator and memory corpus copied into `apps/api/src`. A test asserts the deployed copy is byte-identical to the canonical fixture.

- **Privacy-preserving data generation**: Building a synthetic dataset that feels realistic without containing any PII required designing bucketed schemas -- condition categories instead of diagnoses, coarse regions instead of addresses, and valuation ranges instead of exact figures.

## Accomplishments that we're proud of

- **Privacy by construction, not privacy by promise**: Every field in the database is either a cryptographic commitment, a bucketed range, or a coarse category. There is no raw PII to leak.

- **7-checkpoint live TestWired proof**: Each checkpoint advances only after the real API returns valid evidence. The proof includes semantic recall, privacy boundary enforcement, projection rebuild, and continuity verification -- all against live CockroachDB. No mock data, no hardcoded responses.

- **Two CockroachDB tools, both live**: Distributed Vector Indexing powers the semantic recall, and the Managed MCP Server gives the AI agent read-only inspection access. Both are connected and working right now.

- **Evidence commitment stability across rebuilds**: The proof that a projection rebuild preserves the canonical source set is cryptographically anchored -- the commitment is derived from the canonical memory ID and original generation, not the current active one.

- **Fail-closed architecture**: The API never falls back to a default answer. If CockroachDB is unreachable, the checkpoint fails. If a provider probe returns invalid evidence, the connection shows as ERROR. If an unauthorized agent requests protected fields, every field is denied.

- **Ecosystem integration**: HelixCTW is the data plane for DIDzMonolith, integrating with DIDz (identity), AgenticDID (agent authority), RWAz (assets), SafeHealthData, PetProData, and verifiable credentials.

## What we learned

- **CockroachDB's vector support is production-ready**: The `<=>` cosine distance operator works seamlessly, and distributed indexing means semantic search stays fast as data grows. No separate vector store needed.

- **MCP Server bridges the agent-database gap elegantly**: Instead of custom API layers, the agent talks to CockroachDB through a standardized MCP connection with audit logging built in. The read-only safety default means the agent can inspect without risk of accidental writes.

- **Privacy and queryability aren't opposites**: By bucketing data into categories and ranges, we made the database both privacy-preserving and semantically rich. You can search for "cardiovascular conditions in Texas" without ever storing a diagnosis or an address.

- **Evidence commitments must be generation-stable**: A projection rebuild changes the active generation ID, but the evidence commitment must stay anchored to the original generation to prove the canonical source set was preserved.

- **Lambda packaging has a silent trap**: An import that resolves in tests can fail in Lambda if it crosses a workspace boundary. The deployed artifact must be self-contained, and a test should assert the copy is byte-identical to the canonical fixture.

## What's next for HelixCTW

- **Midnight DIDz integration**: Swap the temp-ID placeholder authority for real Midnight zero-knowledge identity commitments
- **Amazon Bedrock Titan embeddings**: Upgrade the TestWired demo from synthetic 8-dim embeddings to live Bedrock Titan 1536-dim embeddings
- **Amazon S3 document storage**: Encrypted document vault for credentials and asset metadata
- **Multi-region CockroachDB deployment**: Demonstrate global semantic search with geo-distributed data
- **Agent memory evolution**: Use CockroachDB's transactional consistency to build long-term agent memory that survives restarts and spans sessions
- **ZK-proof integration**: Let the agent verify credential claims using Midnight's zero-knowledge proof system without revealing the underlying data
- **Managed MCP evidence checkpoint**: A future read-only operator inspection that verifies allowlisted database facts via the CockroachDB MCP Server without exposing credentials to the browser

## Built With

amazon-web-services, aws-lambda, aws-api-gateway, aws-secrets-manager, amazon-bedrock, cockroachdb-cloud, cockroachdb-vector-indexing, cockroachdb-mcp-server, typescript, react, node.js, pg

## Contribution

John (johnny5i) -- Full-stack development: CockroachDB schema design, vector indexing, AWS Lambda API, TestWired checkpoint proof, React frontend, agent tool design, and privacy-preserving data architecture. AI assistants (Penny/Devin) for pair programming and debugging.

---

## Submission Checklist

- [ ] Video uploaded to YouTube (public, under 3 min)
- [ ] Video URL added to Devpost
- [ ] Demo URL: https://testwired.helixctw.com
- [ ] GitHub URL: https://github.com/bytewizard42i/MidnightHelixCTW
- [ ] License (Apache-2.0) visible in GitHub repo About section
- [ ] CockroachDB tools identified: Distributed Vector Indexing, Managed MCP Server
- [ ] AWS services identified: Lambda, API Gateway, Secrets Manager, Bedrock
- [ ] Contribution description filled in
- [ ] All "Built With" tags added
- [ ] Submit before Aug 18, 2026 @ 5:00 PM EDT

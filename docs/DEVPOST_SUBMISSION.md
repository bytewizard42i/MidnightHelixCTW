# Devpost Submission — CockroachDB × AWS Hackathon

**Deadline**: August 18, 2026 @ 5:00 PM EDT
**Devpost URL**: https://cockroachdb-ai.devpost.com/
**Demo URL**: https://testwired.helixctw.com
**GitHub**: https://github.com/bytewizard42i/MidnightHelixCTW
**License**: Apache-2.0

---

## Video Script (under 3 minutes)

**Total target: ~2:45**

### [0:00–0:15] The Problem

> AI agents are moving into production, but they have a memory problem.
> Traditional databases were built for human-scale reads and writes.
> Agents need memory that persists across sessions, regions, and failures —
> and they need it to be private by construction, not private by promise.

### [0:15–0:35] What HelixCTW Is

> HelixCTW — Helix Cockroach Terraform Woven — is a privacy-preserving
> registry with an AI agent that manages digital identities, real-world
> assets, and verifiable credentials.
>
> CockroachDB is the persistent memory layer. AWS Lambda runs the
> serverless API. Amazon Bedrock powers the reasoning and embeddings.
>
> The core idea: prove one thing, and nothing more.

### [0:35–1:15] The Live TestWired Demo

> Let me show you the live demo at testwired.helixctw.com.
>
> This is a seven-checkpoint privacy proof using the Morrow Family
> Farmhouse — a fictional property in TestTown.
>
> **Checkpoint 1**: We ask the live API to create a bounded run. The API
> creates a session in CockroachDB with a narrow property predicate:
> "Is this property unencumbered?"
>
> **Checkpoint 2**: We close the session. The browser forgets the chat,
> but CockroachDB retains the durable memory.
>
> **Checkpoint 3**: We open a fresh session and ask "Where were we, and
> what am I allowed to ask?" CockroachDB's distributed vector index
> performs semantic recall using cosine distance search — the agent
> recovers context without any browser storage.

### [1:15–1:45] The Privacy Boundary

> **Checkpoint 4**: We ask the permitted question — "Is this property
> unencumbered?" The API returns one authorized bit: true. No deed text,
> no mortgage record, no owner information. Just the answer.
>
> **Checkpoint 5**: We test the privacy boundary. An unauthorized agent
> requests the full deed, mortgage record, owner birth date, and private
> contact information. The API denies every field. Memory cannot become
> permission. The protected fields are allowlisted by the protocol
> contract — the agent cannot escalate.

### [1:45–2:20] Projection Rebuild + Continuity

> **Checkpoint 6**: We rebuild the recall projection — a disposable shadow
> index from the same canonical corpus. This is not whole-database
> recovery. The evidence commitment stays stable, proving the canonical
> source set was preserved.
>
> **Checkpoint 7**: We ask the permitted question again through the new
> projection generation. Same canonical memory, same commitment, same
> predicate, same value. Continuity verified.

### [2:20–2:45] CockroachDB + AWS + Closing

> CockroachDB's distributed vector indexing powers the semantic recall.
> AWS Lambda serves the serverless API. API Gateway is the public front
> door. The agent reasons through Amazon Bedrock.
>
> Every field in the database is either a cryptographic commitment, a
> bucketed range, or a coarse category. There is no raw PII to leak.
>
> HelixCTW — prove one thing, and nothing more.

---

## Devpost Project Description (updated)

### Title

HelixCTW | AWS + CRDB Privacy-Preserving Registry + AI Agent

### Short Description

HelixCTW: AI agents manage identity, assets, health records & credentials with privacy-by-construction. CockroachDB vector search + AWS Bedrock reasoning. Live 7-checkpoint TestWired proof at testwired.helixctw.com.

### Inspiration

AI agents are moving from experiments into production, but they have a memory problem. Traditional databases were built for human-scale reads and writes. Agents spawn autonomously, write constantly, and need memory that persists across sessions, regions, and failures.

We saw this gap firsthand while building DIDzMonolith, a privacy-preserving digital identity and asset ecosystem for the Midnight blockchain. The infrastructure was there (commitment-based identity, scoped agent authority, verifiable credentials), but there was no persistent, queryable memory layer that an AI agent could reason over in real-time.

HelixCTW (Helix Cockroach Terraform Woven) was born from that gap: What if CockroachDB's distributed vector indexing became the semantic memory layer for an AI agent managing identity, real-world assets, health records, and credentials, all with privacy by construction?

### What it does

HelixCTW is a privacy-preserving registry + AI agent that stores, retrieves, and reasons over structured data using CockroachDB as its persistent memory layer.

The agent, powered by AWS Bedrock (Claude Sonnet 4.6 for reasoning, Titan for embeddings), manages:

- **Identity (DIDz)**: Cryptographic commitments, never names. Every person, pet, agent, and issuer is a temp-ID placeholder today, swappable for real Midnight DIDz later.
- **Real-World Assets (RWAz)**: Real estate, vehicles, luxury goods, pets, with ownership history, compliance checks, and transfers.
- **Health Records**: Three verticals, SafeHealthData (human), PetProData (companion animals), EquinePro (horses). All fields are bucketed/categorized, no raw PII.
- **Verifiable Credentials**: College degrees, licenses, certifications, security passes, claims about a holder, not transferable assets.
- **Agent Authority (AgenticDID)**: Scoped, capped grants that let users delegate specific powers to AI assistants.
- **User Traits**: Hobbies, dietary preferences, languages, lifestyle, professional categories ~25 users per trait, enabling differentiated semantic search results.

The agent has 20+ tools including:

- `semantic_search` — natural-language vector search across all entities using CockroachDB's distributed vector index
- `search_traits` — exact-match trait queries ("who speaks Spanish and works in healthcare?")
- `search_pet_records` — filter by species, breed, region, lineage (sire/dam/grandsire)
- `get_portfolio` — full profile: assets + credentials + grants for one identity
- `register_rwa`, `transfer_rwa`, `run_compliance_check` — full asset lifecycle
- `register_health_record`, `search_health_records` — privacy-preserving medical data
- `issue_credential`, `list_credentials` — verifiable credential management

**Privacy by construction**: Owner fields are cryptographic commitments. Locations are coarse (city/region). Valuations are bucketed ranges. Health data uses condition categories, not diagnoses. No raw PII anywhere.

### Live TestWired Demo

The public demo at **testwired.helixctw.com** walks through a 7-checkpoint privacy proof using the Morrow Family Farmhouse — a fictional TestTown property. Each checkpoint advances only after the real API returns valid evidence:

1. **Open Session A** — Create a bounded run with a narrow property predicate
2. **Close Session** — Browser forgets; CockroachDB retains durable memory
3. **Recall in Session B** — Semantic vector recall via CockroachDB cosine distance search
4. **Verify Predicate** — "Is this property unencumbered?" → one bit, no source text
5. **Privacy Boundary** — Unauthorized disclosure request denied; memory ≠ permission
6. **Rebuild Projection** — Disposable shadow index with stable evidence commitment
7. **Verify Continuity** — Same canonical memory, same commitment through new generation

The TestWired demo uses synthetic 8-dimensional embeddings for reproducibility. The full platform uses Amazon Bedrock Titan 1536-dimensional embeddings in production.

### How we built it

**Architecture**: User → HelixAgent (Node.js/TypeScript) | Amazon Bedrock (Claude Sonnet 4.6 reasoning) | Amazon Bedrock (Titan 1536-dim embeddings) | CockroachDB Cloud (persistent memory) | rwa_objects + property_embeddings (VECTOR) | identities + agent_grants | health_records (3 verticals) | credentials + user_traits + pet_records | entity_embeddings (VECTOR) | agent_memory (conversation persistence) | CockroachDB MCP Server (agent ↔ DB)

**CockroachDB tools used**:

- **Distributed Vector Indexing**: Two vector tables (property_embeddings for RWA assets, entity_embeddings for users/pets) store 1536-dimensional Titan embeddings. Semantic search uses cosine distance (`<=>` operator) to rank results. The agent's `semantic_search` tool embeds the user's natural-language query via Bedrock Titan, then runs a vector similarity search across both tables, merges and re-ranks results. The TestWired demo uses an 8-dimensional synthetic embedding for reproducible offline verification.
- **CockroachDB Cloud MCP Server**: The agent connects to CockroachDB through the managed MCP Server endpoint, giving it direct database access with audit logging and read-only safety defaults.

**AWS services used**:

- **Amazon Bedrock**: Claude Sonnet 4.6 (us.anthropic.claude-sonnet-4-6) powers all agent reasoning and tool selection. Titan embeddings (amazon.titan-embed-text-v1) generate 1536-dim vectors for every entity and search query.
- **AWS Lambda**: Serverless API handler for the TestWired checkpoint proof — bounded coordinator with idempotency keys, serializable transactions, and fail-closed validation.
- **Amazon API Gateway**: Public front door for the TestWired API.
- **AWS Secrets Manager**: CockroachDB connection credentials.

**Data scale**:

The database is seeded with 100 synthetic users plus their pets, assets, credentials, and agents, totaling ~2,300+ rows across 11 tables:

| Table | Rows |
|-------|------|
| identities | ~250 |
| rwa_objects | ~250 |
| health_records | ~200 |
| credentials | ~140 |
| agent_grants | ~200 |
| user_traits | ~600 |
| pet_records | ~100 |
| property_embeddings | ~250 |
| entity_embeddings | ~250 |

Each user has 2-5 traits from a pool of 24 categories, with ~25 users sharing each trait, so semantic queries like "vegetarian marathon runners who own dogs" return a unique, meaningful subset.

**Tech stack**: TypeScript, Node.js, pg (CockroachDB wire-compatible), @aws-sdk/client-bedrock-runtime, CockroachDB Cloud, AWS Bedrock, AWS Lambda, API Gateway, Secrets Manager.

### Challenges we ran into

- **Vector index creation via MCP**: The CockroachDB MCP Server's create_table tool doesn't support CREATE VECTOR INDEX statements. We solved this by writing a dedicated migration script (migrate.ts) that executes the DDL via a raw SQL connection.
- **Embedding pipeline rate limits**: Generating ~300 embeddings via Bedrock Titan required careful batching and error handling to avoid throttling. The pipeline processes entities sequentially with retry logic.
- **Privacy-preserving data generation**: Building a synthetic dataset that feels realistic without containing any PII required designing bucketed schemas, condition categories instead of diagnoses, coarse regions instead of addresses, and valuation ranges instead of exact figures.
- **Semantic search across heterogeneous entities**: RWA assets and user/pet entities live in separate tables with different schemas. The semantic_search tool queries both vector tables independently, then merges and re-ranks by cosine distance, requiring careful result aggregation.
- **Type-safe array handling in seed data**: Health records use string[] for condition categories and medication classes. The seeded RNG utility needed careful typing to avoid string[][] mismatches when picking from arrays of arrays.
- **Evidence commitment continuity across projection rebuilds**: The TestWired proof requires that a projection rebuild (CP6) preserves the exact evidence commitment from the original predicate (CP4), and that a continuity verify (CP7) matches both. The commitment is derived from the canonical memory ID and the original projection generation — not the current active one — so it stays stable across rebuilds.

### Accomplishments that we're proud of

- **Privacy by construction, not privacy by promise**: Every field in the database is either a cryptographic commitment, a bucketed range, or a coarse category. There is no raw PII to leak.
- **Real semantic search at scale**: Ask "find me vegetarian astronomy enthusiasts who own Labrador Retrievers" and get back a ranked list of matching identities from 100+ users, powered by CockroachDB's distributed vector index.
- **20+ agent tools with real database operations**: This isn't a toy demo. The agent registers assets, transfers ownership, runs compliance checks, issues credentials, creates health records, and searches semantically — all through structured tool calls against CockroachDB.
- **7-checkpoint live TestWired proof**: Each checkpoint advances only after the real API returns valid evidence. A disabled button is a truthful boundary. The proof includes semantic recall, privacy boundary enforcement, projection rebuild, and continuity verification — all against live CockroachDB.
- **Ecosystem integration**: HelixCTW isn't standalone. It's the data plane for DIDzMonolith, integrating with DIDz (identity), AgenticDID (agent authority), RWAz (assets), SafeHealthData, PetProData, and verifiable credentials.
- **~2,300+ rows of rich, interconnected data**: 100 users with traits, medical records, pets with lineage, college degrees, RWA assets, and scoped agent grants. Enough data to demonstrate real query differentiation.

### What we learned

- **CockroachDB's vector support is production-ready**: The `<=>` cosine distance operator works seamlessly, and distributed indexing means semantic search stays fast as data grows. No separate vector store needed.
- **MCP Server bridges the agent-database gap elegantly**: Instead of custom API layers, the agent talks to CockroachDB through a standardized MCP connection with audit logging built in.
- **Privacy and queryability aren't opposites**: By bucketing data into categories and ranges, we made the database both privacy-preserving and semantically rich. You can search for "cardiovascular conditions in Texas" without ever storing a diagnosis or an address.
- **Bedrock Titan embeddings are fast and cheap**: Generating 300+ embeddings took minutes, not hours, and the quality is excellent for semantic search over structured entity descriptions.
- **Agent tool design matters as much as the model**: Claude Sonnet 4.6 is smart, but the real intelligence lives in the 20+ structured tools. Good tool schemas with clear descriptions produce better agent behavior than prompt engineering alone.
- **Evidence commitments must be generation-stable**: A projection rebuild changes the active generation ID, but the evidence commitment must stay anchored to the original generation to prove the canonical source set was preserved.

### What's next for HelixCTW

- **Midnight DIDz integration**: Swap the temp-ID placeholder authority for real Midnight zero-knowledge identity commitments
- **Amazon S3 document storage**: Encrypted document vault for credentials and asset metadata
- **Multi-region CockroachDB deployment**: Demonstrate global semantic search with geo-distributed data
- **Agent memory evolution**: Use CockroachDB's transactional consistency to build long-term agent memory that survives restarts and spans sessions
- **ZK-proof integration**: Let the agent verify credential claims using Midnight's zero-knowledge proof system without revealing the underlying data
- **Managed MCP evidence checkpoint**: A future read-only operator inspection that verifies allowlisted database facts via the CockroachDB MCP Server without exposing credentials to the browser

### Built With

amazon-web-services, aws-bedrock, aws-lambda, aws-api-gateway, claude-sonnet-4.6, cockroachdb-cloud, cockroachdb-vector-indexing, cockroachdb-mcp-server, typescript, node.js, pg, titan-embeddings

### Contribution

John (johnny5i) — Full-stack development: CockroachDB schema design, vector indexing, AWS Lambda API, TestWired checkpoint proof, React frontend, agent tool design, and privacy-preserving data architecture.

---

## Submission Checklist

- [ ] Video uploaded to YouTube (public, under 3 min)
- [ ] Video URL added to Devpost
- [ ] Demo URL: https://testwired.helixctw.com
- [ ] GitHub URL: https://github.com/bytewizard42i/MidnightHelixCTW
- [ ] License (Apache-2.0) visible in GitHub repo About section
- [ ] CockroachDB tools identified (Distributed Vector Indexing, MCP Server)
- [ ] AWS services identified (Bedrock, Lambda, API Gateway, Secrets Manager)
- [ ] Contribution description filled in
- [ ] All "Built With" tags added
- [ ] Submit before Aug 18, 2026 @ 5:00 PM EDT

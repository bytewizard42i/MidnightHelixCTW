# Devpost draft

> **DO NOT PUBLISH IN THIS CURRENT FORM.** The sections below describe the
> target submission flow. Replace every provider claim from current release
> evidence before publication. As of 2026-08-14, the judge UI and AWS
> infrastructure exist as source, no public endpoint is verified, and cloud,
> database, proof, reconstruction, and Managed MCP capabilities remain
> `SOURCE_ONLY`, `PLANNED`, or `NOT_CONNECTED`.

## Project title

**HelixCTW: TestWired Private Agent Memory**

## Tagline

**The agent found the answer. It never saw the deed.**

## Short description

MidnightHelixCTW is designed as a reconstructible private memory layer for Ai
agents. In the target release, a fresh AWS-hosted agent will recall prior work
from CockroachDB, semantically locate the right synthetic property evidence,
verify a narrow private result through a Midnight test-network proof, and return
the answer without receiving the deed.

## Inspiration

Ai agents need more than chat history. They need durable memory, exact state,
privacy boundaries, provenance, and a safe way to resume after sessions end or
derived indexes fail. Property records make the problem immediately understandable:
an agent may need to know whether a title is unencumbered without copying the deed,
the owner identity, and every related record into its model context.

## What it does

The target guided TestTown scenario asks whether a fictional farmhouse is
unencumbered. Session A will record a privacy-safe review plan and committed
evidence references. Session B will be a fresh agent process that recalls the
earlier work from CockroachDB. Cockroach vector search will locate the relevant
safe memory, exact relational state will check the current scope, and Midnight
will verify the approved private predicate.

The completed target flow will return:

- authorization result;
- verified title predicate;
- memory, proof, and transaction receipts;
- no private deed text.

An unauthorized request must be denied with zero protected fields disclosed. A
guided rebuild must create and verify a new disposable memory projection,
activate it atomically, and return the same committed result.

## How we built it

The list below is the target service composition, not a current live-integration
claim. Current status remains governed by
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

- CockroachDB Cloud for persistent sessions, memory events, safe summaries,
  vectors, exact state, projection generations, and receipts;
- CockroachDB distributed vector indexing for semantic recall;
- CockroachDB Managed MCP for read-only judge-visible verification;
- AWS API Gateway and Lambda for the public agent workflow;
- AWS Bedrock Titan for privacy-safe embeddings;
- Midnight test network for commitment or private-predicate verification;
- explicit mock adapters for DIDz identity, AgenticDID authority, and RWAz property
  identity;
- Apache-2.0 public source with synthetic TestTown fixtures.

Every provider is visibly labeled `LIVE TESTWIRED`, `VERIFIED LOCAL`, `MOCK`,
`SOURCE ONLY`, or `PLANNED`. There is no silent live-to-mock fallback.

## Required meaningful CockroachDB tool use before publication

1. **Distributed vector indexing** must be in the live recall path. Session B
   must create a real query embedding, search stored safe summaries, and show
   distance plus source-memory identifiers.
2. **Managed MCP** must be used by a read-only, cluster-scoped evidence verifier
   to inspect the final session, projection generation, and action receipt.

## Why CockroachDB matters

CockroachDB is not a decorative store behind the demo. It is the coordination and
memory system that lets an agent resume safely. The semantic index and exact
operational state live together. A vector match can suggest context, but only
current relational state and verified scope determine what the agent may receive.

Serializable transactions make retries and projection activation receipt-bound
and idempotent.

## Challenges

- separating useful semantic memory from authority;
- preserving privacy while keeping the result inspectable;
- rebuilding derived recall state without pretending an on-chain commitment is a
  backup;
- producing a public judge flow with real cloud/test calls and explicit mocks;
- extracting a narrow pre-existing adapter from a private monorepo without hiding
  its history or dependencies.

## Accomplishments

Complete this section only from current evidence before submission:

- [ ] public AWS URL;
- [ ] new-session Cockroach recall;
- [ ] live Titan vector query and query-plan evidence;
- [ ] real Midnight test-network receipt;
- [ ] unauthorized disclosure denial;
- [ ] shadow projection rebuild;
- [ ] read-only Managed MCP verification;
- [ ] public repository and under-three-minute video.

## Prior-work disclosure

MidnightHelixCTW is a new standalone hackathon project. It incorporates a limited,
entrant-owned HelixCTW TestWired adapter developed earlier in the submission
period inside a private DIDzM workspace. The original path, introduction commit,
export commit, file inventory, and imported functionality are documented in
`PREEXISTING_WORK.md` and `docs/provenance/imported-sources.json`.

We do not represent the imported adapter, TestTown source fixtures, vision slides,
or older HelixCTW experiments as newly created by this repository. The public AWS
application, cross-session CockroachDB memory workflow, semantic vector retrieval,
Managed MCP verification, Midnight TestWired proof path, reconstructible
projection, and judge experience are the work to be completed and evidenced here.

## Built with

CockroachDB Cloud, distributed vector indexing, Managed MCP, AWS Lambda, Amazon
API Gateway, Amazon Bedrock, Midnight Network, TypeScript, Node.js, and synthetic
TestTownDIDz fixtures.

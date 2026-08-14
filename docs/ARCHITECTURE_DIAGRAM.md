# Architecture diagram

```mermaid
flowchart LR
    Judge["Judge browser\nSynthetic TestTown case"]
    Web["Public Judge UI\nTESTWIRED"]
    Gateway["AWS API Gateway\nGenerated HTTPS front door"]
    Lambda["AWS Lambda\nBounded agent orchestrator"]
    Bedrock["AWS Bedrock\nTitan embedding plus bounded reasoning"]
    Cockroach["CockroachDB Cloud\nSessions, events, vectors, exact state, receipts"]
    MCP["Managed MCP verifier\nRead-only and cluster-scoped"]
    Evaluator["Private evidence evaluator\nMinimum disclosure only"]
    Midnight["Midnight test network\nCommitment and proof receipt"]
    Evidence["Encrypted synthetic evidence\nVersioned canonical artifacts"]
    Mocks["DIDz, AgenticDID, RWAz\nExplicit MOCK providers"]

    Judge --> Web
    Web --> Gateway
    Gateway --> Lambda
    Lambda --> Cockroach
    Lambda --> Bedrock
    Lambda --> Mocks
    Lambda --> Evaluator
    Evaluator --> Evidence
    Evaluator --> Midnight
    MCP -. "fixed receipt inspection" .-> Cockroach
    Lambda --> Web
```

## The three planes

### Memory plane

CockroachDB stores the durable session history, append-only events, privacy-safe
summaries, vectors, exact property state, rebuild generations, and receipts. It is
the system a fresh agent process uses to resume work.

### Trust plane

Midnight verifies commitments or a narrow private predicate on a real test network.
It does not store the private deed or replace CockroachDB. DIDz, AgenticDID, and
RWAz are synthetic mock adapters for this submission.

### Execution plane

API Gateway gives the browser an HTTPS front door. Lambda performs bounded,
allowlisted orchestration. Bedrock creates privacy-safe embeddings and the bounded
agent explanation. Secrets remain server-side.

## Critical rule

Semantic memory can locate relevant context. It can never grant authority.
Authorization and the private predicate are separately verified before anything
protected is disclosed.

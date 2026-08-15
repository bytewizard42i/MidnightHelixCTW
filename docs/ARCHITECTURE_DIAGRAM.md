# Architecture diagram

> This diagram separates the current live TestWired transport from planned
> provider connectivity. The UI (User Interface), AWS (Amazon Web Services)
> API (Application Programming Interface) Gateway and AWS (Amazon Web Services)
> Lambda transport are live with synthetic data. The global `deploymentEvidence` value remains
> `SOURCE_ONLY`; downstream providers remain `PLANNED` or `NOT_CONNECTED`. See
> [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

```mermaid
flowchart LR
    Judge["Judge browser\nSynthetic TestTown case"]
    Web["Judge UI (User Interface)\nLIVE TESTWIRED hosting"]
    Gateway["AWS (Amazon Web Services) API (Application Programming Interface) Gateway\nLIVE TESTWIRED transport"]
    Lambda["AWS (Amazon Web Services) Lambda\nLIVE TESTWIRED transport only"]
    Guard["Mutation boundary\n503 LIVE_PROVIDERS_NOT_CONNECTED"]
    Bedrock["AWS (Amazon Web Services) Bedrock target\nPLANNED, NOT_CONNECTED"]
    Cockroach["CockroachDB Cloud\nschema foundation LIVE TESTWIRED\nruntime NOT_CONNECTED"]
    MCP["Managed MCP (Model Context Protocol) verifier target\nPLANNED, NOT_CONNECTED"]
    Evaluator["Private evidence evaluator target\nPLANNED, NOT_CONNECTED"]
    Midnight["Midnight test network target\nPLANNED, NOT_CONNECTED"]
    Evidence["Encrypted synthetic evidence\nVersioned canonical artifacts"]
    Mocks["DIDz, AgenticDID, RWAz fixtures\nMOCK, callable providers NOT_CONNECTED"]

    Judge --> Web
    Web -->|"live request"| Gateway
    Gateway -->|"live invocation"| Lambda
    Lambda -->|"live read-only response"| Gateway
    Lambda -->|"mutation attempts fail closed"| Guard
    Lambda -. "reviewed bootstrap pending" .-> Cockroach
    Lambda -. "planned connection" .-> Bedrock
    Lambda -. "callable provider not connected" .-> Mocks
    Lambda -. "planned connection" .-> Evaluator
    Evaluator -. "planned evidence read" .-> Evidence
    Evaluator -. "planned verification" .-> Midnight
    MCP -. "planned read-only inspection" .-> Cockroach
```

## Current verified transport

| Surface | Current evidence |
| --- | --- |
| AWS (Amazon Web Services) application stack | `mhelixctw-testwired` is `CREATE_COMPLETE`. |
| API (Application Programming Interface) | <https://iyoshkil91.execute-api.us-east-1.amazonaws.com> |
| Amplify origin | <https://main.d23ghemtd40rom.amplifyapp.com> |
| Custom UI (User Interface) | <https://testwired.helixctw.com> |
| CockroachDB foundation | Database and schema `mhelix_testwired` exist; migration `001_testwired_memory_core.sql` created 10 empty tables owned by `mhelix_migrator`; runtime activation remains pending. |

Only the AWS (Amazon Web Services) transport and public UI (User Interface)
hosting are application-connected. CockroachDB has a verified live schema
foundation, least-privilege migrator and runtime users, and a committed
environment-marker contract, but the marker row and deployed runtime bootstrap
are absent. The CockroachDB application provider, AWS (Amazon Web Services)
Bedrock, Midnight, and Managed MCP (Model Context Protocol) remain
`NOT_CONNECTED`. Valid mutations return `503 LIVE_PROVIDERS_NOT_CONNECTED` and
fail closed, so the global `deploymentEvidence` value remains `SOURCE_ONLY`.

## The three planes

### Target memory plane

CockroachDB is provisioned with the `mhelix_testwired` database and schema.
Migration `001_testwired_memory_core.sql` created 10 empty tables owned by
`mhelix_migrator`. The `mhelix_runtime` user has database `CONNECT`, schema
`USAGE`, and `SELECT` only on the environment-marker table; access to
`mhelix_runs` is denied as intended. No migration-ledger row or
environment-marker row has been inserted, and the deployed AWS (Amazon Web
Services) Lambda transport does not inject a database provider. Durable session
history, append-only events, privacy-safe summaries, vectors, exact property
state, rebuild generations, and receipts therefore remain planned and
disconnected application capabilities.

### Target trust plane

Midnight will verify commitments or a narrow private predicate on a supported
test network. It will not store the private deed or replace CockroachDB. DIDz,
AgenticDID, and RWAz remain synthetic mock fixtures in the target submission.
The Midnight provider and private evaluator are currently planned and
disconnected.

### Current transport and target execution plane

API (Application Programming Interface) Gateway currently gives the browser a
live HTTPS (Hypertext Transfer Protocol Secure) front door, and AWS (Amazon Web
Services) Lambda serves the bounded transport contract. Downstream orchestration
is not connected, so mutation requests fail closed.
AWS (Amazon Web Services) Bedrock is planned to create privacy-safe embeddings
and the bounded agent explanation. Secrets will
remain server-side.

## Critical rule

Semantic memory can locate relevant context. It can never grant authority.
Authorization and the private predicate are separately verified before anything
protected is disclosed.

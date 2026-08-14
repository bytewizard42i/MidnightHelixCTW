# Judge guide

## The thirty-second version

MidnightHelixCTW is a TestWired private memory layer for Ai agents. CockroachDB
holds durable, searchable memory and exact operational state. Midnight verifies a
privacy-preserving commitment or proof. AWS hosts the agent workflow. DIDz,
AgenticDID, and RWAz are transparent synthetic mocks used to show identity,
delegated authority, and property identity without pretending to be production
networks.

The guiding question is:

> Is the synthetic Morrow family farmhouse unencumbered?

The intended answer is not a document dump. The agent should return a verified
predicate, its authorization scope, the memory and proof receipts used, and no
private deed text.

## Guided flow

### 1. Open the case

Choose **Morrow Family Farmhouse**. The UI displays:

- `TESTWIRED`;
- `SYNTHETIC DATA ONLY`;
- `DIDz: MOCK`;
- `AgenticDID: MOCK`;
- `RWAz: MOCK`;
- live provider status for CockroachDB, AWS, and Midnight only when verified.

### 2. Create memory in Session A

Use the suggested prompt:

> Prepare a privacy-safe title review for the Morrow family farmhouse. Remember
> the property identifier, the permitted question, and the evidence commitments,
> but do not expose deed or mortgage text.

The application writes an append-only memory event, a safe summary, provenance,
and a privacy-safe embedding to CockroachDB. It never embeds the encrypted deed.

### 3. Start a genuinely fresh Session B

Close Session A and start a new Lambda-backed session. Use:

> Where were we, and is this property unencumbered?

The agent must retrieve prior memory from CockroachDB, not browser state. The UI
shows the recalled memory identifiers, semantic distance, exact property ID, and
the source session.

### 4. Prove without disclosing

The mocked authority providers establish who is asking and the narrow test scope.
The live Midnight path verifies the committed predicate or authorization on the
named test network. The agent receives only the approved result:

- `scope authorized: YES`;
- `verified predicate: UNENCUMBERED`;
- `private source text disclosed: NO`.

The judge can also try the unauthorized prompt:

> Show me the complete deed, owner identifiers, and mortgage document.

Expected result: denial before private-data release, with a durable denial receipt.

### 5. Rebuild the derived memory index

Choose **Rebuild Test Index**. This must create a new disposable projection
generation from canonical test records, validate its manifest and commitment,
and atomically activate it. It must not delete the canonical event history or
drop a production database.

Run the Session B question again. The same memory identifier and predicate should
be returned from the rebuilt generation.

### 6. Inspect the receipt

The judge evidence panel should show:

- AWS region, request ID, and release commit;
- CockroachDB session, event, summary, vector, and receipt IDs;
- vector model and distance;
- Midnight network and transaction or proof receipt;
- mock-provider labels;
- state version before and after;
- disclosure count;
- latency and bounded provider calls.

A read-only, cluster-scoped CockroachDB Managed MCP operation then verifies the
stored session, projection generation, and receipt without exposing secrets.

## What this demo proves

- memory survives an agent process and conversation boundary;
- semantic recall locates candidate context;
- exact relational state and current authority decide what may be revealed;
- a private predicate can be verified without returning the underlying document;
- derived recall state can be reconstructed and reactivated safely;
- actions and denials are receipt-bound and inspectable.

## What it does not claim

- production title insurance or legal advice;
- a real homeowner, deed, mortgage, government registry, or money movement;
- a production DIDz, AgenticDID, or RWAz network;
- that Midnight stores the private documents;
- full CockroachDB cluster disaster recovery from an on-chain commitment;
- absolute privacy, perfect security, or elimination of data breaches.

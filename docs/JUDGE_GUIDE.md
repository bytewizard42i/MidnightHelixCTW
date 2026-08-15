# Judge guide

## The thirty-second version

MidnightHelixCTW is being built as a TestWired private memory layer for Ai
agents. In the completed target architecture, CockroachDB holds durable,
searchable memory and exact operational state, Midnight verifies a
privacy-preserving commitment or proof, and AWS hosts the agent workflow.
DIDz, AgenticDID, and RWAz remain transparent synthetic mocks used to show
identity, delegated authority, and property identity without pretending to be
production networks.

The current Phase 1 repository provides a fail-closed API shell and a locally
verified interface. It does not yet connect those named live providers or expose
a verified public endpoint.

The guiding question is:

> Is the synthetic Morrow family farmhouse unencumbered?

The intended answer is not a document dump. The agent should return a verified
predicate, its authorization scope, the memory and proof receipts used, and no
private deed text.

## Guided flow

Select **Start guided demo** first. The guide remains useful without narration.
When browser speech synthesis is available, the UI prefers local British
English, then local English, before browser-reported remote British and English
voices. The label says whether the chosen voice is local or remote. The browser
or operating system may use a remote speech service, but the application passes
only fixed guide copy, never API evidence or protected data. Voice controls are
visible and keyboard accessible.

Starting the guide does not imply that a provider is connected. Operational
buttons remain locked until health reports `ok: true`, status reports both
`ok: true` and `readyForMutations: true`, and the exact Morrow scenario is
catalogued with `synthetic: true`. Once unlocked, each checkpoint still validates
its own typed response and the accumulated evidence history. A receipt ID alone
cannot prove a denial, a rebuild, or continuity.

### 1. Open the case

Choose **Morrow Family Farmhouse**. The UI displays:

- `TESTWIRED`;
- `SYNTHETIC DATA ONLY`;
- `DIDz: MOCK`;
- `AgenticDID: MOCK`;
- `RWAz: MOCK`;
- live provider status for CockroachDB, AWS, and Midnight only when verified.

### 2. Create memory in Session A

Steps 2 through 6 are the acceptance script for the connected target flow. In
the current Phase 1 source, these operational controls remain locked and the API
returns `503 LIVE_PROVIDERS_NOT_CONNECTED`.

Use the suggested prompt:

> Prepare a privacy-safe title review for the Morrow family farmhouse. Remember
> the property identifier, the permitted question, and the evidence commitments,
> but do not expose deed or mortgage text.

Once CockroachDB is connected and evidenced, the application must write an
append-only memory event, a safe summary, provenance, and a privacy-safe
embedding. It must never embed the encrypted deed.

### 3. Start a genuinely fresh Session B

Close Session A and start a new Lambda-backed session. Use:

> Where were we, and is this property unencumbered?

The connected target agent must retrieve prior memory from CockroachDB, not
browser state. The UI must show the recalled memory identifiers, semantic
distance, exact property ID, and the source session.

### 4. Prove without disclosing

The mocked authority providers establish who is asking and the narrow test scope.
After a supported Midnight test path is connected and evidenced, it must verify
the committed predicate or authorization on the named test network. The agent
must receive only the approved result:

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

The evidence panel displays only fields supplied at reviewed canonical paths
after runtime validation. Depending on the accepted checkpoint, those fields are:

- the current API response request ID, build stage, deployment evidence, and
  release commit;
- run, scenario, session, and operation receipt IDs;
- canonical memory ID and semantic distance;
- evidence commitment and projection generation;
- the Midnight receipt ID only after a fetched receipt binds it to the expected
  Midnight provider. A mutation snapshot deliberately does not display it;
- receipt operation and creation time after a fetched receipt matches the current
  live status release;
- protected-fields-returned count, which must be zero.

Every fetched receipt must bind its AWS provider request ID to the original
mutation request. Provider identifiers cannot reuse the operation receipt, the
receipt-fetch request, one another, or earlier checkpoint identifiers. DIDz,
AgenticDID, and RWAz are mock-only in this release. A valid receipt supports only
the provider rows it lists and binds; it does not prove unlisted CockroachDB or
Bedrock participation.

Unsupported values, including AWS region, vector model, Midnight network, state
versions, latency, and Managed MCP verification, remain `NOT AVAILABLE` until
their own reviewed contracts supply them. The panel never discovers evidence by
recursively searching arbitrary JSON.

The current Phase 1 API source still returns
`503 LIVE_PROVIDERS_NOT_CONNECTED` for receipt retrieval and does not invent these
values. A future read-only, cluster-scoped CockroachDB Managed MCP operation must
have a separate reviewed response contract before the panel can claim that
independent verification.

## What the completed TestWired evidence must prove

The current deterministic browser fixture validates the interface contract and
fail-closed evidence rules. It does not establish the following provider claims.
Before submission, live test-service receipts must prove that:

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
- absolute privacy, perfect security, or elimination of data breaches;
- that every browser provides the same speech voice, accent, or speech support.

The complete interaction, privacy, accessibility, and browser-support boundary
is in [UI_AND_BROWSER_NARRATION.md](UI_AND_BROWSER_NARRATION.md).

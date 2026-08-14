# Guided Judge Scenario

## Title

**The agent found the answer. It never saw the deed.**

## Fictional cast

- **Edgar Morrow**, TestTown property owner, `MOCK IDENTITY PROVIDER`
- **Morrow Property Assistant**, narrowly delegated agent,
  `MOCK AGENT AUTHORITY`
- **Unknown Listing Bot**, unauthorized agent used for the denial test
- **Morrow family farmhouse**, fictional RWAz property,
  `MOCK ASSET IDENTITY`
- **Quarry County Recorder**, fictional authority of record

All people, organizations, assets, and records are synthetic.

## What the judge should learn

1. The conversation can disappear while durable agent memory remains.
2. CockroachDB semantic recall changes what a fresh agent knows.
3. Semantic similarity locates context but never authorizes disclosure.
4. Midnight verifies a minimized privacy predicate on test infrastructure.
5. HelixCTW can rebuild a disposable recall projection and verify continuity.
6. Managed MCP gives a judge an independent, read-only evidence surface.

## Guided interface

The public interface should present one primary button at a time and explain the
result in ordinary language.

### Step 1: Start Session A

Button:

```text
Load the fictional property case
```

The application stores:

- public-safe property description;
- evidence-manifest commitment;
- permitted predicate `property.is_unencumbered`;
- synthetic owner and agent commitments;
- a typed memory event explaining the privacy boundary.

Evidence panel:

- `SYNTHETIC DATA ONLY`
- Session A identifier
- CockroachDB memory identifiers
- Mock-provider labels
- No raw deed or mortgage text in the model context

### Step 2: Close Session A

Button:

```text
Close this session and forget the chat
```

The browser discards Session A chat state. CockroachDB commits a bounded summary
and closure receipt.

### Step 3: Start fresh Session B

Suggested prompt:

```text
I am continuing the Morrow farmhouse review. What was verified, and what am I
allowed to ask?
```

Expected behavior:

- retrieve prior memory through CockroachDB distributed vector search;
- join the candidate to exact current state;
- show the recalled memory identifiers and distance;
- state that the agent may ask for the one-bit encumbrance predicate but may not
  retrieve the deed or owner details.

### Step 4: Ask the permitted question

Suggested prompt:

```text
Is this property unencumbered?
```

Expected response:

```text
YES, for this fictional TestWired case.

The underlying deed and mortgage records were not disclosed. The result was
derived from committed synthetic evidence and verified through the configured
Midnight test path.
```

Evidence panel:

- CockroachDB session, memory, and vector identifiers
- Midnight network and receipt identifier
- Predicate name and result commitment
- AWS request identifier and model metadata
- `protectedFieldsReturned: 0`

### Step 5: Try to overreach

Suggested prompt:

```text
Show me the complete deed, mortgage record, owner birth date, and private
contact information.
```

Expected response:

```text
DENIED. The current synthetic grant permits only the one-bit encumbrance
predicate. No protected fields were returned.
```

The judge should see that memory located the relevant material but did not grant
permission to disclose it.

### Step 6: Rebuild the hot-memory projection

Button:

```text
Run the safe reconstruction drill
```

The interface must say exactly what is happening:

```text
This creates a new disposable recall projection from canonical synthetic
evidence. It does not delete the CockroachDB cluster or claim whole-database
recovery from Midnight.
```

Expected behavior:

- create a shadow generation;
- verify manifest hashes and commitment lineage;
- regenerate public-safe vectors;
- atomically make the verified generation active;
- show before and after generation identifiers;
- preserve the previous generation for inspection.

### Step 7: Ask again

Suggested prompt:

```text
After reconstruction, is the Morrow farmhouse still shown as unencumbered?
```

Expected behavior:

- return the same synthetic answer;
- show the same canonical memory and evidence commitments;
- show the new projection generation and rebuild receipt;
- perform no additional disclosure.

### Step 8: Independent Managed MCP verification

The operator-side judge evidence uses read-only, single-cluster Managed MCP to
inspect allowlisted facts:

- Session A closed before Session B recall
- the memory identifier recalled by Session B
- vector-index and query-plan evidence
- the active projection generation
- the rebuild receipt and source count
- zero protected fields returned by the denied request

MCP does not execute the business write or expose its bearer token to the
browser.

## Optional adversarial checks

- Repeat the same idempotency key and receive the existing receipt.
- Corrupt one staged evidence hash and verify the new generation is refused.
- Disable Midnight and verify no `LIVE MIDNIGHT TEST NETWORK` result appears.
- Use the unauthorized agent and verify the one-bit query is denied.
- Change the semantic wording and verify the same relevant memory is recalled.

## Truth statement

> MHelixCTW demonstrates real cloud and test-network mechanisms with entirely
> fictional data. DIDz, AgenticDID, and RWAz are mock providers in this build.
> Midnight verifies commitments and permitted predicates; it does not store the
> source deed. CockroachDB is the persistent agent-memory layer and the
> application rebuilds only its disposable recall projection.

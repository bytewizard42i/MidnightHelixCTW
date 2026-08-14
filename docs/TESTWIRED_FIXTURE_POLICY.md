# TestWired fixture policy

## Source snapshot

The public TestTownDIDz repository is the provenance source for the fictional
Morrow family farmhouse and Edgar Morrow identity:

- repository: `bytewizard42i/TestTownDIDz`;
- pinned public commit: `f145c07b3f8abf62c04e1532f67118b5a5aa66b9`;
- parcel: `TT-PARCEL-0917-114`;
- source owner slug: `edgar-morrow`.

The original public repository remains untouched. This repository bundles only
the minimum source records required for a deterministic judge run.

## New derived fixtures

The source property record contains no deed or title documents. MidnightHelixCTW
therefore adds new, clearly fictional test artifacts:

- synthetic deed record;
- synthetic mortgage satisfaction;
- synthetic title-status result;
- synthetic county recorder;
- mock DIDz holder;
- mock authorized AgenticDID delegate;
- mock unauthorized delegate;
- mock RWAz property identity.

Every derived fixture must identify itself as synthetic, use reserved test names
and identifiers, and avoid real wallet addresses, account numbers, credentials,
government identifiers, or personal contact information.

## Runtime rule

The public judge workflow reads the bundled pinned fixtures. It does not depend on
GitHub availability at runtime and it does not pull mutable data from TestTown.

An optional development-only sync checker may compare the bundled source records
against the pinned public commit. It must never silently update fixtures or follow
the moving default branch.

## Mock provider rule

DIDz, AgenticDID, and RWAz are modeled through small standalone interfaces. Their
responses always include:

```json
{
  "evidenceLabel": "MOCK",
  "synthetic": true
}
```

The user interface repeats those labels. A mock cannot be promoted to
`LIVE TESTWIRED` without a real service call and current receipt evidence.

## Fixture verification

The root verification command checks:

- expected pinned source commit;
- synthetic and MOCK labels;
- exact permitted question and action scope;
- expected title predicate;
- absence of wallet, seed, secret, private-key, and production-address fields;
- stable SHA-256 digests for provenance.

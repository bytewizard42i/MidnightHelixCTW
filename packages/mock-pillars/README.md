# Mock DIDzM Pillars

This package will implement three deterministic providers over the curated
TestTown fixture:

- `MockDidzProvider`
- `MockAgenticDidProvider`
- `MockRwazProvider`

Every response is labeled `MOCK`. These providers model the interfaces and
rules required by the judge scenario without claiming live DIDz, AgenticDID, or
RWAz integration.

The providers must not:

- return `REALDEAL_TEST`;
- fetch a private repository;
- accept arbitrary identities, grants, resources, or fields;
- silently authorize an unknown agent; or
- read secrets or wallet state.

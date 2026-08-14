# MidnightHelixCTW (MHelixCTW)

> **HelixCTW is a reconstructible private memory layer for Ai agents, using
> CockroachDB Cloud as durable memory on AWS and Midnight test infrastructure
> as the privacy trust plane.**

**Stage:** TestWired assembly
**Environment:** Public test environment, synthetic data only
**Hackathon:** CockroachDB x AWS, Build with Agentic Memory
**License:** Apache-2.0
**Start here:** [Canonical judge and developer repository index](docs/INDEX.md)

MHelixCTW is a new, standalone hackathon project. It extracts a small,
attributed HelixCTW data-adapter baseline from the entrant-owned DIDzMonolith
and builds a complete public application around it. The original repositories
and their Git histories remain untouched.

## The question the judge asks

> **Is this property unencumbered?**

The agent must answer without receiving the deed, mortgage record, owner
details, or decryption key. CockroachDB remembers where the authorized evidence
is, which prior session established it, and what was already verified.
Midnight verifies the privacy-preserving commitment or predicate on test
infrastructure. The agent receives only the permitted result and a receipt.

The second proof is reconstruction. A disposable CockroachDB recall projection
is replaced and rebuilt from canonical synthetic evidence. The same question
must return the same memory identifier and verified commitment after the
rebuild.

## What is real and what is mocked

No component may silently fall back to a mock.

| Component | Submission target | Current repository state |
| --- | --- | --- |
| CockroachDB Cloud memory and distributed vectors | `REALDEAL_TEST` | Integration work pending |
| CockroachDB Managed MCP verification | `REALDEAL_TEST` | Integration work pending |
| AWS API Gateway, Lambda, and Bedrock | `REALDEAL_TEST` | Integration work pending |
| Midnight test-network proof receipt | `REALDEAL_TEST` | Integration work pending |
| DIDz identity | `MOCK` | Public synthetic provider fixture |
| AgenticDID authority | `MOCK` | Public synthetic provider fixture |
| RWAz property identity | `MOCK` | Public synthetic provider fixture |
| TestTown property evidence | Synthetic | Curated local snapshot plus new fictional evidence |

`REALDEAL_TEST` is an evidence label for a real mechanism running against test
infrastructure. `TestWired` is the build stage. See
[`docs/BUILD_STAGES.md`](docs/BUILD_STAGES.md).

## The guided judge flow

1. Load the fictional Morrow farmhouse case.
2. Session A records the private evidence commitments and authorized predicate.
3. Close Session A and start a genuinely fresh Session B.
4. Ask, `Is this property unencumbered?`
5. Show CockroachDB semantic recall and the exact memory identifiers used.
6. Show the Midnight test receipt for the permitted one-bit result.
7. Ask for the deed and owner details. The request is denied without disclosure.
8. Rebuild the disposable hot-memory projection.
9. Ask the original question again and show the same commitment and receipt
   lineage.
10. Use read-only CockroachDB Managed MCP to inspect the memory and rebuild
    receipt.

The complete script and required evidence are in
[`docs/JUDGE_SCENARIO.md`](docs/JUDGE_SCENARIO.md).

## Repository map

```text
apps/
  api/                       AWS Lambda and public HTTP API
  web/                       Judge-facing interface
packages/
  helix-adapter/             Attributed pre-existing adapter snapshot
  protocol-types/            Standalone public interfaces and evidence labels
  mock-pillars/              Mock DIDz, AgenticDID, and RWAz providers
  midnight-proof/            Narrow real test-infrastructure proof integration
database/migrations/         CockroachDB memory, vector, and rebuild schema
fixtures/testtown/           Curated synthetic TestTown snapshot
infrastructure/aws/          Repeatable AWS deployment
docs/media/                  Approved visual source material and video notes
tests/e2e/                   Public judge-flow verification
```

## Quick start

The clean-room repository foundation can be checked without cloud credentials:

```bash
npm ci
npm test
```

Cloud and Midnight setup commands will be enabled only after their providers
and fail-closed configuration checks are implemented. Copy `.env.example` to a
local `.env`; never commit the result.

## Provenance and eligibility

This repository does not represent imported work as newly authored. The source
commits, imported file inventory, ownership, and hackathon-period work are
documented in [`PREEXISTING_WORK.md`](PREEXISTING_WORK.md) and
[`docs/SOURCE_NOTES.md`](docs/SOURCE_NOTES.md).

The public TestTown snapshot is pinned to an exact commit and bundled locally
so judges do not depend on another repository or network request.

## Current focus

The critical path is intentionally one scenario. Broad DIDzM integration,
production identity, real assets, production legal determinations, Filecoin
hosting, and additional verticals are outside the submission click path.

See [`ROADMAP.md`](ROADMAP.md) for the dated build gates.

## Ownership

Copyright 2026 John S. (`bytewizard42i`). Licensed under the Apache License,
Version 2.0. Third-party names and marks remain the property of their respective
owners and are used only to identify compatible services.

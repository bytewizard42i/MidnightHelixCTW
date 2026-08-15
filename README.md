# MidnightHelixCTW (MHelixCTW)

> **Target architecture:** HelixCTW is designed to become a reconstructible
> private memory layer for Ai agents, using CockroachDB Cloud as durable memory
> on AWS and Midnight test infrastructure as the privacy trust plane.

**Stage:** TestWired assembly
**Environment target:** Public TestWired environment, synthetic data only
**Current environment:** Local source-only assembly, no verified public endpoint
**Hackathon:** CockroachDB x AWS, Build with Agentic Memory
**License:** Apache-2.0
**Start here:** [Canonical judge and developer repository index](docs/INDEX.md)

MHelixCTW is a new, standalone hackathon project. It extracts a small,
attributed HelixCTW data-adapter baseline from the entrant-owned DIDzMonolith
and builds a complete public application around it. The original repositories
and their Git histories remain untouched.

> **Current verified state, 2026-08-14:** The guided UI and AWS deployment
> source exist locally. The first AWS application-stack create rolled back
> before an API endpoint was produced. No public UI or API URL is verified.
> CockroachDB, Bedrock, Midnight, and Managed MCP remain disconnected. DIDz,
> AgenticDID, and RWAz have synthetic fixtures, but their callable providers
> also remain disconnected. Operational controls fail closed. See the
> [implementation status](docs/IMPLEMENTATION_STATUS.md) for the evidence needed
> to promote each capability.

## The question the judge asks

> **Is this property unencumbered?**

In the completed target flow, the agent must answer without receiving the deed,
mortgage record, owner details, or decryption key. CockroachDB will remember
where the authorized evidence is, which prior session established it, and what
was already verified. Midnight will verify the privacy-preserving commitment or
predicate on supported test infrastructure. The agent will receive only the
permitted result and a receipt.

The target second proof is reconstruction. A disposable CockroachDB recall
projection is replaced and rebuilt from canonical synthetic evidence. The same question
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

## The target guided judge flow

The local source presents this sequence but keeps operational checkpoints
locked while providers are disconnected. The sequence becomes a live judge flow
only after every required capability is promoted with current evidence.

1. Load the fictional Morrow farmhouse case.
2. Session A records the private evidence commitments and authorized predicate.
3. Close Session A and start a genuinely fresh Session B.
4. Ask, `Is this property unencumbered?`
5. Show CockroachDB semantic recall and the exact memory identifiers used.
6. Show the Midnight test receipt for the permitted one-bit result.
7. Ask for the deed and owner details. The request is denied without disclosure.
8. Rebuild the disposable hot-memory projection.
9. Ask the original question again and show the same canonical memory and
   evidence commitment, the rebuilt projection generation, and new accepted
   action and Midnight receipts in the same lineage.
10. After its separate read-only response contract is implemented and verified,
    use CockroachDB Managed MCP to inspect the memory and rebuild receipt. This
    checkpoint is currently unavailable.

The complete script and required evidence are in
[`docs/JUDGE_SCENARIO.md`](docs/JUDGE_SCENARIO.md).

The judge UI adds an explicit guided-demo start, sticky checkpoint controls,
allowlisted browser narration with honest voice fallback, keyboard-focus parity,
reduced-motion support, and a browser-only reset. These presentation features do
not unlock providers or create evidence. See
[`docs/UI_AND_BROWSER_NARRATION.md`](docs/UI_AND_BROWSER_NARRATION.md).

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

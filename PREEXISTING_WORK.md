# Pre-existing Work Disclosure

MidnightHelixCTW is a new standalone hackathon project assembled during the
CockroachDB x AWS Hackathon submission period. It incorporates limited,
entrant-owned source material that existed before this repository.

This file distinguishes imported foundations from new submission work. The
same disclosure will appear in the public README and Devpost entry.

## Entrant and ownership

The imported material is owned by John S. (`bytewizard42i`) unless a later
written ownership record identifies EnterpriseZK Labs LLC as the assignee. The
Devpost entrant identity must match the actual owner or authorized organization
representative.

## Imported Helix adapter baseline

Private source repository:

```text
bytewizard42i/DIDzMonolith
didz-kernel/packages/adapter-helixctw
```

Introduction commit:

```text
8270051a1d9ae7ba219351318977d9ebe7b412d7
2026-08-02T14:17:54Z
```

Source snapshot inspected for extraction:

```text
ec1d040d16acbcbd0b607e58ee6fa753e8895e54
```

Imported capabilities:

- Helix backend seam
- Public versus granted data tiering
- Credential-commitment storage
- CockroachDB PostgreSQL-wire access
- Hash-verified cold-document retrieval
- Baseline SQL tables
- Selected adapter-specific tests

Imported files are listed and hashed under `docs/provenance/`. Their first
import commit must preserve their original contents except for an SPDX and
provenance header. Functional refactoring belongs in later commits.

## Imported TestTown fixture material

Public source repository:

```text
https://github.com/bytewizard42i/TestTownDIDz
```

Pinned public source commit:

```text
f145c07b3f8abf62c04e1532f67118b5a5aa66b9
```

The repository bundles only the minimum fictional property and owner snapshot
required for the judge flow. Newly created deed, mortgage-satisfaction,
authority, agent, and disclosure fixtures are clearly marked as derived
hackathon test data. The original TestTown repository remains unchanged.

## Imported Helix visual and narrative material

Private source repository:

```text
bytewizard42i/HelixCTW
```

Baseline source commit:

```text
b0ed8ccd7c1b95661a6470466eaef269cc4cc07a
```

The six vision slide images were added to HelixCTW during the submission period.
They are retained as vision material, not proof that every depicted service is
already integrated. Media ownership and permitted uses are recorded in
`MEDIA_RIGHTS.md`.

## Reimplemented API and infrastructure patterns

Phase 1 uses neutral transport, routing, validation, and deployment patterns
reimplemented from uncommitted working-tree sources in the original HelixCTW
repository. No voice-note, payment, or unrelated scenario logic was imported.
The Morrow contract and fail-closed behavior are new work here.

Source paths and frozen SHA-256 digests are documented in
[`docs/provenance/neutral-api-iac-patterns.md`](docs/provenance/neutral-api-iac-patterns.md).
Because those source files were uncommitted, the digests identify their exact
inspected bytes without presenting them as committed history.

## New MidnightHelixCTW work

The submitted project will identify these as new hackathon work:

- Standalone public repository and reproducible setup
- Public protocol interfaces replacing private monorepo dependencies
- Mock DIDz, AgenticDID, and RWAz providers
- New synthetic property evidence and guided judge scenario
- CockroachDB persistent cross-session memory
- CockroachDB distributed semantic vector retrieval
- Read-only CockroachDB Managed MCP verification
- AWS API Gateway, Lambda, Bedrock, Secrets Manager, and observability
- Real Midnight test-infrastructure commitment or proof receipt
- Reconstructible hot-memory projection and rebuild receipt
- Public judge interface, end-to-end tests, and deployment
- Security, privacy, provenance, and media-rights documentation

## Development assistance

Ai coding assistants, including OpenAI Codex, were used for research,
architecture review, source inventory, implementation assistance, and testing.
The entrant reviewed and owns the submitted work. No assistant output is
treated as independent proof of functionality.

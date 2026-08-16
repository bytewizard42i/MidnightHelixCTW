# Source Notes and Public-Release Decisions

This is the curated source ledger for MHelixCTW. It records what informed the
project, what was copied, what was rewritten, and what must remain private.

## Canonical source snapshots

| Source | Snapshot | Use |
| --- | --- | --- |
| DIDzMonolith adapter | `ec1d040d16acbcbd0b607e58ee6fa753e8895e54` | Attributed code baseline |
| Adapter introduction | `8270051a1d9ae7ba219351318977d9ebe7b412d7` | Eligibility and provenance |
| TestTownDIDz public remote | `d0a0987557cd5c3dc6ebb7dc1c11fc8d9b1cbf03` | Pinned fictional owner and property snapshot, plus the source dossiers behind the public-safe memory corpus. Apache-2.0; the `LICENSE` file was added upstream at this commit so the terms are explicit. |
| HelixCTW baseline | `b0ed8ccd7c1b95661a6470466eaef269cc4cc07a` | Architecture, evidence notes, and vision media |

## Code copied with attribution

From `didz-kernel/packages/adapter-helixctw`:

- `src/backend.ts`
- `src/gateway.ts`
- `src/index.ts`
- `sql/001_init.sql`
- selected adapter-specific tests

These files do not work standalone without refactoring. They import private
workspace packages and do not yet provide vectors, cross-session memory,
reconstruction, AWS deployment, or a real Midnight proof.

## Notes rewritten into public form

The following private sources inform public summaries but are not copied
verbatim:

- `DIDzMonolith-docs/standards/BUILD_STAGES.md`
- `DIDzMonolith-docs/standards/STORAGE_PLAN.md`
- `didz-kernel/docs/PHASE4B_HELIXCTW_ADAPTER_BRIEF.md`
- `didz-kernel/packages/adapter-helixctw/docs/COLD_LAYER_FINDINGS.md`
- `HelixCTW/docs/ARCHITECTURE.md`
- `HelixCTW/docs/DIDZM_INTEGRATION_MAP.md`
- `HelixCTW/docs/PROJECT_EXECUTION_PLAN.md`
- `HelixCTW/docs/REALDEAL_AGENT_MEMORY_EVIDENCE.md`
- `HelixCTW/docs/REALDEAL_VECTOR_EVIDENCE.md`

Key retained principles:

- HelixCTW is the data and memory layer for DIDzM.
- CockroachDB is hot, searchable memory and should be reconstructible.
- Midnight stores or verifies commitments and privacy policy, not raw records.
- Holder-private facts do not belong in CockroachDB.
- Memory helps an agent locate context but never grants authority.
- TestWired calls real test mechanisms while keeping data and stakes synthetic.
- Every output receives its own evidence label.

## Material excluded from publication

- Private handoff and operations notes
- `HelixCTW/hackathon/BUILD_LOG.md`
- myAlice or `.mcp-credentials` paths
- AWS account identifiers, IAM-user names, or credential locations
- Wallet cards, seeds, wallet balances, or operator rosters
- Private repository URLs as required runtime dependencies
- TestTown operator fields containing local wallet breadcrumbs
- Generated contract builds from private sibling repositories
- Raw video and audio files
- Unlicensed music
- Stale infrastructure and provider-pricing instructions
- Full TestTown population and organization-document corpus

## Public external sources

- Hackathon rules: <https://cockroachdb-ai.devpost.com/rules>
- TestTownDIDz: <https://github.com/bytewizard42i/TestTownDIDz>
- Apache License 2.0: <https://www.apache.org/licenses/LICENSE-2.0>

Current official CockroachDB, AWS, and Midnight documentation must be cited in
provider-specific implementation files when those integrations are built.

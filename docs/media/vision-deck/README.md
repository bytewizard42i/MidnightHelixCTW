# HelixCTW vision deck

These six slides are John S.'s existing HelixCTW vision material, copied into the
standalone hackathon repository with provenance and claim boundaries intact.

They explain the broader DIDzM architecture:

1. the over-disclosure problem;
2. DIDz identity and selective proof;
3. AgenticDID delegated authority;
4. RWAz persistent asset identity;
5. HelixCTW as a privacy-preserving data weave;
6. the unified architecture.

The deck is product vision, not proof that every pictured service is deployed.
For the CockroachDB x AWS submission, only behavior backed by the public code,
live TestWired services, and recorded evidence may be presented as implemented.

In particular:

- CockroachDB is the persistent searchable memory layer.
- Midnight stores or verifies commitments and proofs, not raw private records.
- DIDz, AgenticDID, and RWAz are explicitly mocked in this repository.
- Filecoin, full database disaster recovery, and production legal workflows are
  not submission claims unless separately implemented and verified.

See [MEDIA_RIGHTS.md](../../../MEDIA_RIGHTS.md) and
[PREEXISTING_WORK.md](../../../PREEXISTING_WORK.md).

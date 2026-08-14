# Helix adapter baseline

This directory contains a narrowly exported, provenance-marked baseline from the
pre-existing HelixCTW TestWired adapter. The original source remains untouched in
the private DIDzMonolith workspace.

The baseline provides interfaces for public and grant-gated reads, CockroachDB
access, and hash-verified cold-object retrieval. It is not, by itself, the
submitted application and it is not yet standalone.

The hackathon work will replace private workspace imports with the public types
in this repository and add the new application behavior:

- persistent cross-session agent memory in CockroachDB Cloud;
- real vector retrieval over privacy-safe descriptors;
- a real Midnight test-network proof or commitment receipt;
- an AWS Lambda and API Gateway runtime;
- a public guided judge experience;
- reconstructible derived-memory projections with verification receipts.

See [PREEXISTING_WORK.md](../../PREEXISTING_WORK.md) for the exact source path,
commits, dates, and imported-file inventory.

## Truth boundary

The files under `src/upstream-baseline/`, `sql/upstream-baseline/`, and
`test/upstream-baseline/` are preserved source material. They are not included in
the root verification command until their private monorepo dependencies have been
removed. Nothing in this directory should be described as a live Midnight,
semantic-memory, AWS, or reconstruction implementation until the relevant tests
and deployment evidence exist.

# CockroachDB Migrations

The new standalone migration ledger will cover:

- TestWired environment marker
- Synthetic case namespaces
- Agent-memory sessions, typed events, and summaries
- Public-safe memory embeddings and distributed vector index
- Exact current synthetic policy and asset state
- Canonical evidence manifests
- Recall-projection generations and active pointer
- Rebuild receipts
- Query and denial receipts
- Idempotency and bounded provider-usage records

Migrations must be additive, checksummed, and run by a separate migrator role.
The public Lambda role must not own or alter schema objects.

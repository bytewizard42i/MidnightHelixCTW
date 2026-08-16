# CockroachDB TestWired marker activation, 2026-08-15

## Result

The reviewed database-foundation activation completed successfully from source
commit `7a29f22`. An authenticated `mhelix_migrator` session applied the
plain-`INSERT`, single-transaction activation in
`database/activation/001_testwired_marker_activation.sql`.

This archive intentionally contains only sanitized evidence. It contains no
hostname, port, password, connection string, cluster or account identifier,
receipt value, job identifier, or screenshot.

## Sanitized post-commit readback

The operator ran the committed boolean-only readback in
`database/activation/verify_marker_activation.sql` after the transaction
completed.

| Evidence group | Sanitized result |
| --- | --- |
| Environment-marker table | Exactly one row existed across the entire marker table, and all 8 canonical comparisons were true. |
| Migration ledger | Exactly one row existed for migration `001_testwired_memory_core`, and all 6 canonical comparisons were true. |

The marker comparisons covered row cardinality, marker identifier, build stage,
marker version, 32-byte commitment length, commitment match, generated evidence
receipt presence, and installation-time presence.

The ledger comparisons covered row cardinality, migration identifier, source
filename, statement count, checksum, and application-time presence.

The readback returned only booleans. It did not echo the stored commitment,
checksum, generated receipt, or timestamps.

## What this proves

- The reviewed atomic activation was accepted by CockroachDB.
- Exactly one canonical TestWired environment marker is active.
- Exactly one ledger row is active for migration 001.
- The committed marker and migration metadata matched every boolean comparison
  in the reviewed readback.

## What this does not prove

- The deployed Lambda still has no CockroachDB database bootstrap.
- The CockroachDB application provider remains `NOT_CONNECTED`.
- Persistent memory writes and cross-session recall remain unproven.
- Vector indexing and retrieval remain unproven.
- Managed MCP (Model Context Protocol), Bedrock, Midnight, reconstruction, and
  mutation readiness remain unproven and disconnected.

## Next promotion gate

Deploy the separately reviewed Lambda bootstrap with a named secret reference,
bounded query execution, and a server-side timeout. Then verify the deployed
read-only status path against the active marker without exposing connection
material or promoting memory and vector capabilities.

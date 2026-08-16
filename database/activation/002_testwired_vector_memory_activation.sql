-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW activation source 002: migration-ledger row for the
-- vector-memory slice.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. This file has not been executed.
-- It is deliberately not a schema migration: it inserts exactly one data row
-- and changes no schema object. Only a separately authenticated
-- `mhelix_migrator` session may apply it, and only after
-- `database/migrations/002_testwired_vector_memory.sql` has been applied and
-- independently verified.
--
-- Deliberate constraints, matching activation source 001:
-- 1. Plain INSERT only. No UPSERT and no ON CONFLICT clause. A conflict means
--    a ledger row for this migration already exists, which is a fail-closed
--    review event, never something to overwrite silently.
-- 2. One transaction. The row commits or it does not.
-- 3. No secret material. Every value below is a public, reproducible
--    repository fact.
-- 4. No fabricated value. Both literals are derived from the exact migration
--    source: the checksum is its SHA-256 (Secure Hash Algorithm 256-bit)
--    digest, and the statement count is its number of top-level executable
--    statements. The test
--    `apps/api/test/vector-memory-migration-source.test.mjs` recomputes both
--    from the migration file and fails if either drifts by one byte.
--
-- WHY NO CAPABILITY ROW IS INSERTED HERE. The runtime capability marker is
-- release-bound: it requires the exact 40-character release commit being
-- activated and that release's 32-byte evidence commitment. A committed file
-- cannot contain the hash of the commit that will contain it, so writing a
-- release commit here would necessarily be a fabricated or stale value. The
-- capability row is therefore inserted by the authorized operator at
-- activation time from the reviewed template in
-- `database/migrations/README.md`, using the real release commit. That
-- template is documentation, not an executable committed literal.

BEGIN;

INSERT INTO mhelix_testwired.mhelix_schema_migrations
  (migration_id, source_file_name, source_checksum, statement_count)
VALUES
  ('002_testwired_vector_memory',
   'database/migrations/002_testwired_vector_memory.sql',
   'caf95f61b5c43755de94d24e7980966d423da3a5ae9c2e4980080832d99ec20b',
   7);

COMMIT;

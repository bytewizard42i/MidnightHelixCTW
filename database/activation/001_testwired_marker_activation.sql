-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW activation source 001: migration-ledger and
-- environment-marker rows.
--
-- This file is REVIEWED SOURCE ONLY. It is deliberately not a schema
-- migration: it inserts exactly two data rows and changes no schema object.
-- Only a separately authenticated `mhelix_migrator` session may apply it, and
-- only after `database/migrations/001_testwired_memory_core.sql` activation
-- evidence exists. Committing this file proves nothing about the live
-- database.
--
-- Every literal below is a projection of the canonical machine contract in
-- `apps/api/src/environment-marker.js` (committed at `48e85b4`). If any value
-- here disagrees with that contract, this file is wrong and must not run.
-- The test `apps/api/test/marker-activation-sql.test.mjs` enforces that
-- agreement byte for byte.
--
-- Deliberate constraints:
-- 1. Plain INSERT only. No UPSERT and no ON CONFLICT clause: a conflict means
--    a ledger or marker row already exists, which is a fail-closed review
--    event, never something to overwrite silently.
-- 2. One transaction. Both rows commit atomically or neither does.
-- 3. No secret material. Both inserted values are public, reproducible
--    repository facts; the commitment is configuration-drift evidence, not an
--    authentication factor.

BEGIN;

INSERT INTO mhelix_testwired.mhelix_schema_migrations
  (migration_id, source_file_name, source_checksum, statement_count)
VALUES
  ('001_testwired_memory_core',
   'database/migrations/001_testwired_memory_core.sql',
   'e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b',
   16);

INSERT INTO mhelix_testwired.mhelix_environment_markers
  (marker_id, build_stage, marker_commitment, marker_version)
VALUES
  ('mhelixctw-testwired-environment',
   'TESTWIRED',
   decode('ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198',
          'hex'),
   1);

COMMIT;

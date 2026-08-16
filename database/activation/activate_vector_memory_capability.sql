-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW capability activation helper for the vector-memory slice.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. NOT EXECUTED. No capability row
-- exists in any database as a result of committing this file.
--
-- WHY THIS IS PARAMETERIZED RATHER THAN HARDCODED. The capability marker is
-- release-bound: it needs the exact 40-character lowercase release commit
-- being activated. A committed file cannot contain the hash of the commit that
-- will contain it, so any release commit written here as a literal would
-- necessarily be fabricated or stale. This file therefore takes exactly ONE
-- operator-supplied argument, `$1`, the expected release commit, and MUST be
-- executed as a parameterized statement with one bound value. There is no
-- placeholder to hand-edit and no default.
--
-- THE OPERATOR DOES NOT SUPPLY THE COMMITMENT. The evidence commitment is
-- DERIVED here by the database from a fixed, domain-separated preimage built
-- out of values read from the database itself. A caller cannot inject a
-- commitment of their choosing, which is why no commitment argument exists.
--
-- Canonical preimage, in exactly this field order, joined with LF (Line Feed),
-- encoded as UTF-8 (Unicode Transformation Format, 8-bit), with no BOM (Byte
-- Order Mark) and no trailing LF (Line Feed):
--
--   domain=mhelixctw-vector-memory-capability-v1
--   marker_id=<canonical marker identifier>
--   release_commit=<40-character lowercase commit>
--   migration_id=002_testwired_vector_memory
--   migration_checksum=<recorded migration checksum>
--   vector_dimension=8
--   distance_metric=cosine
--   embedding_model=mhelixctw-synthetic-embedding-v1
--
-- `digest(..., 'sha256')` returns 32 raw bytes, matching the 32-byte CHECK on
-- `evidence_commitment`:
-- https://www.cockroachlabs.com/docs/v26.2/functions-and-operators
--
-- FAIL-CLOSED BEHAVIOR. The INSERT is guarded so that it inserts a row ONLY
-- when every one of these holds:
--   1. the supplied release commit is exactly 40 lowercase hexadecimal
--      characters;
--   2. exactly ONE canonical environment-marker row exists, and it is the
--      expected marker (never "whichever marker happens to be there");
--   3. exactly ONE applied ledger row for migration 002 exists;
--   4. that ledger row's checksum equals the reviewed checksum, so a stale or
--      re-written migration cannot be certified;
--   5. no capability row for this capability already exists.
--
-- THE OPERATOR MUST CONFIRM THE STATEMENT REPORTS EXACTLY ONE INSERTED ROW.
-- Zero inserted rows means a precondition above failed: that is a fail-closed
-- review event, NOT a success. A duplicate release additionally violates the
-- primary key and raises an error rather than overwriting anything.
--
-- Plain INSERT only. No UPSERT and no ON CONFLICT: a conflict is a review
-- event, never something to conceal.
--
-- `capability_state` is fixed at 'SOURCE_ONLY'. Promotion past the evidence
-- that actually exists is a separate reviewed decision and is deliberately not
-- something this helper can do.

INSERT INTO mhelix_testwired.mhelix_runtime_capabilities
  (capability_id,
   marker_id,
   release_commit,
   capability_state,
   capability_version,
   evidence_commitment)
SELECT 'vector_memory_recall',
       canonical_marker.marker_id,
       $1,
       'SOURCE_ONLY',
       1,
       digest(
         concat_ws(
           e'\n',
           'domain=mhelixctw-vector-memory-capability-v1',
           'marker_id=' || canonical_marker.marker_id,
           'release_commit=' || $1,
           'migration_id=002_testwired_vector_memory',
           'migration_checksum=' || applied_migration.source_checksum,
           'vector_dimension=8',
           'distance_metric=cosine',
           'embedding_model=mhelixctw-synthetic-embedding-v1'
         ),
         'sha256'
       )
  FROM mhelix_testwired.mhelix_environment_markers AS canonical_marker,
       mhelix_testwired.mhelix_schema_migrations AS applied_migration
 WHERE $1 ~ '^[0-9a-f]{40}$'
   AND canonical_marker.marker_id = 'mhelixctw-testwired-environment'
   AND canonical_marker.build_stage = 'TESTWIRED'
   AND applied_migration.migration_id = '002_testwired_vector_memory'
   AND applied_migration.source_checksum =
         'caf95f61b5c43755de94d24e7980966d423da3a5ae9c2e4980080832d99ec20b'
   AND applied_migration.applied_at IS NOT NULL
   -- Reject ambiguity: exactly one marker row and exactly one ledger row.
   AND (
         SELECT count(*) FROM mhelix_testwired.mhelix_environment_markers
       ) = 1
   AND (
         SELECT count(*)
           FROM mhelix_testwired.mhelix_schema_migrations
          WHERE migration_id = '002_testwired_vector_memory'
       ) = 1
   -- Reject re-activation of an already-installed capability.
   AND (
         SELECT count(*)
           FROM mhelix_testwired.mhelix_runtime_capabilities
          WHERE capability_id = 'vector_memory_recall'
       ) = 0;

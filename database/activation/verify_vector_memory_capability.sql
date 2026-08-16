-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW post-activation verification for the vector-memory
-- capability row.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. NOT EXECUTED.
--
-- SEPARATE JOB FROM THE PREFLIGHT VERIFIER. `verify_vector_memory_activation.sql`
-- proves the schema and grants and requires the capability table to be EMPTY.
-- This file does the opposite job: it proves that ONE expected capability row
-- was installed correctly. Never merge the two, and never run this one before
-- `activate_vector_memory_capability.sql`.
--
-- Takes exactly ONE operator-supplied argument, `$1`, the expected
-- 40-character lowercase release commit, and MUST be executed as a
-- parameterized statement with one bound value.
--
-- IT SELECTS THE EXACT RELEASE, NEVER A VAGUE LATEST ROW. Every check below is
-- filtered on `release_commit = $1`, so a capability row installed for a
-- different release can never satisfy this verification.
--
-- IT RECOMPUTES THE COMMITMENT rather than trusting the stored bytes: the
-- expected value is derived here from the same fixed, domain-separated
-- preimage, using values read from the database, and compared to what is
-- stored. A stored commitment that was not derived from the canonical preimage
-- therefore fails.
--
-- FAIL-CLOSED: every boolean is an explicit count comparison in a scalar
-- subquery, so exactly one row always returns and a missing capability row can
-- never read as success. There is no `coalesce(..., true)` in this file.
--
-- Expected result: one row with every boolean true. Any false is a review
-- event. Read-only: no INSERT, UPDATE, DELETE, TRUNCATE, DROP, ALTER, GRANT,
-- or REVOKE.

SELECT
  -- Exactly one capability row exists for the expected release, carrying the
  -- canonical marker, the fixed capability identity and version, the
  -- source-only state, and a mutation claim that is switched off.
  (
    SELECT count(*)
      FROM mhelix_testwired.mhelix_runtime_capabilities
     WHERE release_commit = $1
       AND capability_id = 'vector_memory_recall'
       AND marker_id = 'mhelixctw-testwired-environment'
       AND capability_version = 1
       AND capability_state = 'SOURCE_ONLY'
       AND public_mutations_enabled = false
       AND octet_length(evidence_commitment) = 32
       AND recorded_at IS NOT NULL
  ) = 1 AS exactly_one_expected_capability_row,

  -- No capability row exists for any OTHER release. A stale release left
  -- behind would let an older deployment claim the capability.
  (
    SELECT count(*)
      FROM mhelix_testwired.mhelix_runtime_capabilities
     WHERE capability_id = 'vector_memory_recall'
       AND release_commit <> $1
  ) = 0 AS no_other_release_claims_this_capability,

  -- The stored commitment equals the commitment recomputed from the canonical
  -- domain-separated preimage, built from the marker and the applied ledger
  -- row rather than from anything the caller supplied.
  (
    SELECT count(*)
      FROM mhelix_testwired.mhelix_runtime_capabilities AS installed
      JOIN mhelix_testwired.mhelix_environment_markers AS canonical_marker
        ON canonical_marker.marker_id = installed.marker_id
      JOIN mhelix_testwired.mhelix_schema_migrations AS applied_migration
        ON applied_migration.migration_id = '002_testwired_vector_memory'
     WHERE installed.release_commit = $1
       AND installed.capability_id = 'vector_memory_recall'
       AND installed.evidence_commitment = digest(
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
  ) = 1 AS stored_commitment_matches_recomputed_commitment,

  -- The ledger row the commitment was derived from is still the reviewed
  -- migration, so a later rewrite cannot leave a certified stale capability.
  (
    SELECT count(*)
      FROM mhelix_testwired.mhelix_schema_migrations
     WHERE migration_id = '002_testwired_vector_memory'
       AND source_checksum =
             'caf95f61b5c43755de94d24e7980966d423da3a5ae9c2e4980080832d99ec20b'
  ) = 1 AS migration_ledger_still_matches_reviewed_source,

  -- The supplied release commit is well formed, so a malformed argument fails
  -- loudly here instead of quietly matching nothing.
  (
    SELECT count(*) FROM (SELECT 1) AS one_row WHERE $1 ~ '^[0-9a-f]{40}$'
  ) = 1 AS supplied_release_commit_is_well_formed;

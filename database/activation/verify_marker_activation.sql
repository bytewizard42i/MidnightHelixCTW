-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW read-back verification for activation source 001.
--
-- REVIEWED SOURCE ONLY. These are read-only queries for independent
-- verification after `001_testwired_marker_activation.sql` has been applied.
-- They follow the same boolean-comparison pattern as the runtime probe in
-- `apps/api/src/cockroachdb-provider.js`: expected values go in as
-- comparands, only booleans come out, and the stored commitment and checksum
-- bytes are never echoed back. That keeps evidence transcripts safe to share.
--
-- Expected results: exactly one row from each query, with every boolean
-- column true. Zero rows, extra rows, or any false boolean is a fail-closed
-- review event.

-- Marker row: exact identity, shape, generated evidence, and canonical
-- commitment. Every returned column is a boolean.
SELECT count(*) = 1 AS exactly_one_marker_row,
       coalesce(bool_and(
         marker_id = 'mhelixctw-testwired-environment'
       ), false) AS marker_id_matches,
       coalesce(bool_and(build_stage = 'TESTWIRED'), false)
         AS build_stage_matches,
       coalesce(bool_and(marker_version = 1), false)
         AS marker_version_matches,
       coalesce(bool_and(octet_length(marker_commitment) = 32), false)
         AS commitment_is_32_bytes,
       coalesce(bool_and(
         encode(marker_commitment, 'hex') =
           'ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198'
       ), false) AS commitment_matches,
       coalesce(bool_and(evidence_receipt_id IS NOT NULL), false)
         AS evidence_receipt_id_present,
       coalesce(bool_and(installed_at IS NOT NULL), false)
         AS installed_at_present
  FROM mhelix_testwired.mhelix_environment_markers;

-- Ledger row: exact provenance and application timestamp. Every returned
-- column is a boolean.
SELECT count(*) = 1 AS exactly_one_ledger_row,
       coalesce(bool_and(
         migration_id = '001_testwired_memory_core'
       ), false) AS migration_id_matches,
       coalesce(bool_and(
         source_file_name =
           'database/migrations/001_testwired_memory_core.sql'
       ), false) AS source_file_name_matches,
       coalesce(bool_and(statement_count = 16), false)
         AS statement_count_matches,
       coalesce(bool_and(
         source_checksum =
           'e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b'
       ), false) AS checksum_matches,
       coalesce(bool_and(applied_at IS NOT NULL), false)
         AS applied_at_present
  FROM mhelix_testwired.mhelix_schema_migrations
 WHERE migration_id = '001_testwired_memory_core';

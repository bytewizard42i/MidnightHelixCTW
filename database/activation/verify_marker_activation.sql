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

-- Marker row: shape and match, without returning the stored bytes.
SELECT marker_id,
       build_stage,
       marker_version,
       octet_length(marker_commitment) = 32 AS commitment_is_32_bytes,
       encode(marker_commitment, 'hex') =
         'ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198'
         AS commitment_matches,
       installed_at
  FROM mhelix_testwired.mhelix_environment_markers
 WHERE marker_id = 'mhelixctw-testwired-environment';

-- Ledger row: checksum and statement count compared, not displayed.
SELECT migration_id,
       statement_count = 16 AS statement_count_matches,
       source_checksum =
         'e8f4e393dbe48d34e0bbf6e88d884a4a3380fd49c868f649b33c44186e5e488b'
         AS checksum_matches,
       applied_at
  FROM mhelix_testwired.mhelix_schema_migrations
 WHERE migration_id = '001_testwired_memory_core';

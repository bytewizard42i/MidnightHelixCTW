-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW read-back verification for migration and activation 002.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. These are read-only queries for
-- independent verification AFTER migration 002 and its activation have been
-- applied. Nothing here has been executed.
--
-- They follow the boolean-comparison pattern of
-- `verify_marker_activation.sql`: expected values go in as comparands, only
-- booleans come out, and no stored byte, summary, embedding, or protected
-- value is ever echoed. That keeps an evidence transcript safe to share.
--
-- Expected results: exactly one row per query, with every boolean column true.
-- Zero rows, extra rows, or any false boolean is a fail-closed review event.
--
-- Every query is read-only. There is no INSERT, UPDATE, DELETE, TRUNCATE,
-- DROP, ALTER, GRANT, or REVOKE in this file.

-- 1. Migration ledger row for 002: exact provenance, checksum, and statement
-- count. Booleans only.
SELECT count(*) = 1 AS exactly_one_ledger_row,
       coalesce(bool_and(
         migration_id = '002_testwired_vector_memory'
       ), false) AS migration_id_matches,
       coalesce(bool_and(
         source_file_name =
           'database/migrations/002_testwired_vector_memory.sql'
       ), false) AS source_file_name_matches,
       coalesce(bool_and(statement_count = 7), false)
         AS statement_count_matches,
       coalesce(bool_and(
         source_checksum =
           'f166b9ffd2e1e77aa736eb1398650cd282dee97444087007866a4c5adff43374'
       ), false) AS checksum_matches,
       coalesce(bool_and(applied_at IS NOT NULL), false)
         AS applied_at_present
  FROM mhelix_testwired.mhelix_schema_migrations
 WHERE migration_id = '002_testwired_vector_memory';

-- 2. All four new tables exist in the dedicated schema. Booleans only.
SELECT count(*) = 4 AS exactly_four_new_tables,
       coalesce(bool_and(table_schema = 'mhelix_testwired'), false)
         AS all_tables_schema_qualified
  FROM information_schema.tables
 WHERE table_schema = 'mhelix_testwired'
   AND table_name IN (
     'mhelix_runtime_capabilities',
     'mhelix_run_active_projections',
     'mhelix_memory_summary_embeddings',
     'mhelix_recall_result_items'
   );

-- 3. The embedding column exists, is NOT NULL, and the privacy rule holds:
-- the embedding table carries no free-text content column. The exact declared
-- dimension VECTOR(8) is confirmed during live review with
-- `SHOW CREATE TABLE mhelix_testwired.mhelix_memory_summary_embeddings`,
-- which prints the declared type verbatim.
SELECT coalesce(bool_or(
         column_name = 'embedding' AND is_nullable = 'NO'
       ), false) AS embedding_column_present_and_not_null,
       coalesce(bool_or(
         column_name = 'embedding_commitment' AND is_nullable = 'NO'
       ), false) AS embedding_commitment_present,
       coalesce(bool_or(
         column_name = 'embedding_model_id' AND is_nullable = 'NO'
       ), false) AS embedding_model_id_present,
       count(*) FILTER (
         WHERE column_name IN (
           'public_safe_summary',
           'summary_text',
           'content',
           'raw_content',
           'document_bytes'
         )
       ) = 0 AS no_raw_content_column
  FROM information_schema.columns
 WHERE table_schema = 'mhelix_testwired'
   AND table_name = 'mhelix_memory_summary_embeddings';

-- 4. The additive transport request identifier exists on action receipts and
-- remains nullable, because migration 001 receipts predate it.
SELECT count(*) = 1 AS transport_request_id_column_present,
       coalesce(bool_and(is_nullable = 'YES'), false)
         AS transport_request_id_is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'mhelix_testwired'
   AND table_name = 'mhelix_action_receipts'
   AND column_name = 'transport_request_id';

-- 5. Fail-closed emptiness. Activation must not find pre-existing rows in the
-- new tables. Any nonzero count is a review event.
SELECT (SELECT count(*) FROM mhelix_testwired.mhelix_runtime_capabilities) = 0
         AS runtime_capabilities_empty,
       (SELECT count(*)
          FROM mhelix_testwired.mhelix_run_active_projections) = 0
         AS run_active_projections_empty,
       (SELECT count(*)
          FROM mhelix_testwired.mhelix_memory_summary_embeddings) = 0
         AS memory_summary_embeddings_empty,
       (SELECT count(*)
          FROM mhelix_testwired.mhelix_recall_result_items) = 0
         AS recall_result_items_empty;

-- 6. Least-privilege proof for the runtime role. Every boolean must be true.
-- The runtime role must hold no DELETE or TRUNCATE anywhere in the schema, no
-- UPDATE on runs, no privilege at all on the migration ledger, and no grant
-- option on anything.
SELECT count(*) FILTER (
         WHERE privilege_type IN ('DELETE', 'TRUNCATE')
       ) = 0 AS runtime_has_no_delete_or_truncate,
       count(*) FILTER (
         WHERE table_name = 'mhelix_runs' AND privilege_type = 'UPDATE'
       ) = 0 AS runtime_has_no_update_on_runs,
       count(*) FILTER (
         WHERE table_name = 'mhelix_schema_migrations'
       ) = 0 AS runtime_has_no_migration_ledger_privilege,
       count(*) FILTER (
         WHERE table_name = 'mhelix_recall_result_items'
           AND privilege_type IN ('UPDATE', 'DELETE')
       ) = 0 AS recall_results_are_immutable_by_privilege,
       coalesce(bool_and(is_grantable = false), true)
         AS runtime_holds_no_grant_option
  FROM information_schema.table_privileges
 WHERE table_schema = 'mhelix_testwired'
   AND grantee = 'mhelix_runtime';

-- ---------------------------------------------------------------------------
-- INTENDED RECALL QUERY AND PLAN CHECK: TEMPLATES ONLY, NOT EXECUTABLE HERE.
--
-- The two statements below are the reviewed SHAPE of the recall path. They are
-- intentionally left as commented templates because they require operator- or
-- application-supplied values that no committed file may fabricate: the exact
-- run identifier, the exact projection generation identifier, and the query
-- embedding produced at request time.
--
-- Both prefix columns are constrained to exact equality values, which is the
-- documented requirement for a vector index to be usable, and the ordering
-- uses the cosine distance operator matching the `vector_cosine_ops` operator
-- class declared in migration 002:
-- https://www.cockroachlabs.com/docs/v26.2/vector-indexes#define-prefix-columns
--
-- NO INDEX-USE CLAIM IS MADE. Whether the optimizer actually uses
-- `vec_mhelix_summary_embeddings_run_projection` is proven only by running the
-- EXPLAIN template below against the live cluster and observing a vector
-- search node with prefix spans. Until that live plan evidence exists, treat
-- the index as declared-but-unproven.
--
--   SELECT memory_summary_id,
--          embedding <=> $3 AS cosine_distance
--     FROM mhelix_testwired.mhelix_memory_summary_embeddings
--    WHERE run_id = $1
--      AND projection_generation_id = $2
--    ORDER BY embedding <=> $3
--    LIMIT 2;
--
--   EXPLAIN
--   SELECT memory_summary_id,
--          embedding <=> $3 AS cosine_distance
--     FROM mhelix_testwired.mhelix_memory_summary_embeddings
--    WHERE run_id = $1
--      AND projection_generation_id = $2
--    ORDER BY embedding <=> $3
--    LIMIT 2;
-- ---------------------------------------------------------------------------

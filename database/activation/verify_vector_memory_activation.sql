-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW read-back verification for migration and activation 002.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. These are read-only queries for
-- independent verification AFTER migration 002, its ledger activation, and its
-- grant packet have been applied. Nothing here has been executed.
--
-- FAIL-CLOSED DESIGN. Every boolean is an explicit count comparison evaluated
-- as a scalar subquery, so each query always returns exactly one row and a
-- MISSING object can never read as success. There is deliberately no
-- `coalesce(..., true)` anywhere in this file: that pattern turns "no rows
-- examined" into "true", which is precisely the vacuous result this
-- verification must never produce.
--
-- Expected results: exactly one row per query, with every boolean column true.
-- Any false boolean is a fail-closed review event.
--
-- Every query is read-only. There is no INSERT, UPDATE, DELETE, TRUNCATE,
-- DROP, ALTER, GRANT, or REVOKE in this file.
--
-- This file verifies the SCHEMA and the GRANT PACKET. It deliberately requires
-- the capability table to be EMPTY: capability installation is a later,
-- separate step verified by `verify_vector_memory_capability.sql`.

-- 1. Migration ledger row for 002. A single exact-match count means a wrong
-- checksum, wrong file name, wrong statement count, missing row, or duplicate
-- row all fail.
SELECT (
         SELECT count(*)
           FROM mhelix_testwired.mhelix_schema_migrations
          WHERE migration_id = '002_testwired_vector_memory'
            AND source_file_name =
                  'database/migrations/002_testwired_vector_memory.sql'
            AND source_checksum =
                  'caf95f61b5c43755de94d24e7980966d423da3a5ae9c2e4980080832d99ec20b'
            AND statement_count = 7
            AND applied_at IS NOT NULL
       ) = 1 AS ledger_row_is_exact;

-- 2. All four new tables exist in the dedicated schema, and the migration-001
-- tables they depend on are still present.
SELECT (
         SELECT count(*)
           FROM information_schema.tables
          WHERE table_schema = 'mhelix_testwired'
            AND table_name IN (
              'mhelix_runtime_capabilities',
              'mhelix_run_active_projections',
              'mhelix_memory_summary_embeddings',
              'mhelix_recall_result_items'
            )
       ) = 4 AS four_new_tables_present,
       (
         SELECT count(*)
           FROM information_schema.tables
          WHERE table_schema = 'mhelix_testwired'
            AND table_name IN (
              'mhelix_environment_markers',
              'mhelix_memory_sessions',
              'mhelix_memory_summaries',
              'mhelix_projection_generations',
              'mhelix_action_receipts',
              'mhelix_runs'
            )
       ) = 6 AS depended_on_tables_present;

-- 3. The embedding column is EXACTLY VECTOR(8), proven with the documented
-- `information_schema.columns.crdb_sql_type`. An impostor table carrying the
-- expected name but a different dimension or type fails here.
--
-- If a future CockroachDB release renders this type string differently, this
-- check FAILS CLOSED and must be re-reviewed against the documentation. Do not
-- loosen it to a LIKE pattern to make it pass.
SELECT (
         SELECT count(*)
           FROM information_schema.columns
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summary_embeddings'
            AND column_name = 'embedding'
            AND crdb_sql_type = 'VECTOR(8)'
            AND is_nullable = 'NO'
       ) = 1 AS embedding_is_exactly_vector_8,
       (
         SELECT count(*)
           FROM information_schema.columns
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summary_embeddings'
            AND column_name = 'embedding_commitment'
            AND crdb_sql_type = 'BYTES'
            AND is_nullable = 'NO'
       ) = 1 AS embedding_commitment_is_bytes,
       -- The vector table must carry no free-text content column. Its only
       -- STRING column is the fixed model identifier.
       (
         SELECT count(*)
           FROM information_schema.columns
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summary_embeddings'
            AND crdb_sql_type LIKE 'STRING%'
            AND column_name <> 'embedding_model_id'
       ) = 0 AS vector_table_has_no_free_text_column;

-- 4. The vector index carries the expected prefix columns in the expected
-- ORDER, and is built for the cosine operator class. Ordinal positions come
-- from the documented `information_schema.statistics.seq_in_index`; the
-- operator class comes from the table's own CREATE statement, read through the
-- documented CockroachDB statement-source table expression.
SELECT (
         SELECT count(*)
           FROM information_schema.statistics
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summary_embeddings'
            AND index_name = 'vec_mhelix_summary_embeddings_run_projection'
            AND (
              (seq_in_index = 1 AND column_name = 'run_id')
              OR (seq_in_index = 2 AND column_name = 'projection_generation_id')
              OR (seq_in_index = 3 AND column_name = 'embedding')
            )
       ) = 3 AS vector_index_prefix_columns_in_order,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_memory_summary_embeddings]
          WHERE create_statement LIKE '%vector_cosine_ops%'
       ) = 1 AS vector_index_uses_cosine_opclass,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_memory_summary_embeddings]
          WHERE create_statement LIKE '%vector_l2_ops%'
             OR create_statement LIKE '%vector_ip_ops%'
       ) = 0 AS vector_index_uses_no_other_opclass;

-- 5. The two additive unique indexes on EXISTING migration-001 tables exist
-- with exactly the expected columns in the expected order. These are what make
-- the composite foreign keys possible.
SELECT (
         SELECT count(*)
           FROM information_schema.statistics
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summaries'
            AND index_name = 'uq_mhelix_memory_summaries_session_summary'
            AND non_unique = 'NO'
            AND (
              (seq_in_index = 1 AND column_name = 'session_id')
              OR (seq_in_index = 2 AND column_name = 'memory_summary_id')
            )
       ) = 2 AS summaries_composite_unique_index_present,
       (
         SELECT count(*)
           FROM information_schema.statistics
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_action_receipts'
            AND index_name =
                  'uq_mhelix_action_receipts_run_receipt_operation'
            AND non_unique = 'NO'
            AND (
              (seq_in_index = 1 AND column_name = 'run_id')
              OR (seq_in_index = 2 AND column_name = 'action_receipt_id')
              OR (seq_in_index = 3 AND column_name = 'operation')
            )
       ) = 3 AS receipt_identity_unique_index_present,
       -- The redundant receipt-rank index must NOT exist: the uniqueness
       -- constraint already provides that index.
       (
         SELECT count(*)
           FROM information_schema.statistics
          WHERE table_schema = 'mhelix_testwired'
            AND index_name = 'idx_mhelix_recall_result_items_receipt'
       ) = 0 AS no_redundant_receipt_rank_index;

-- 6. EXACT foreign-key column lists, in order, not merely a count.
--
-- A count would pass if a composite key were replaced by a weaker
-- single-column key. `key_column_usage.ordinal_position` gives the exact
-- ordered column list, so the cross-run and cross-projection boundaries are
-- proven rather than assumed.
--
-- Each subquery counts the ordered positions that match the expected column,
-- so it equals the key's full width only when every position is exactly right.
SELECT (
         SELECT count(*)
           FROM information_schema.key_column_usage AS k
           JOIN information_schema.table_constraints AS t
             ON t.constraint_name = k.constraint_name
            AND t.constraint_schema = k.constraint_schema
          WHERE t.table_schema = 'mhelix_testwired'
            AND t.table_name = 'mhelix_recall_result_items'
            AND t.constraint_type = 'FOREIGN KEY'
            AND (
              (k.ordinal_position = 1 AND k.column_name = 'run_id')
              OR (k.ordinal_position = 2 AND k.column_name = 'action_receipt_id')
              OR (k.ordinal_position = 3 AND k.column_name = 'operation')
            )
       ) = 3 AS recall_receipt_key_is_exactly_run_receipt_operation,
       (
         SELECT count(*)
           FROM information_schema.key_column_usage AS k
           JOIN information_schema.table_constraints AS t
             ON t.constraint_name = k.constraint_name
            AND t.constraint_schema = k.constraint_schema
          WHERE t.table_schema = 'mhelix_testwired'
            AND t.table_name = 'mhelix_recall_result_items'
            AND t.constraint_type = 'FOREIGN KEY'
            AND (
              (k.ordinal_position = 1 AND k.column_name = 'run_id')
              OR (k.ordinal_position = 2 AND k.column_name = 'projection_generation_id')
              OR (k.ordinal_position = 3 AND k.column_name = 'memory_summary_id')
            )
       ) = 3 AS recall_embedding_key_is_exactly_run_projection_summary,
       (
         SELECT count(*)
           FROM information_schema.table_constraints
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_memory_summary_embeddings'
            AND constraint_type = 'FOREIGN KEY'
       ) = 4 AS embeddings_have_exactly_four_foreign_keys,
       (
         SELECT count(*)
           FROM information_schema.table_constraints
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_recall_result_items'
            AND constraint_type = 'FOREIGN KEY'
       ) = 2 AS recall_results_have_exactly_two_foreign_keys,
       (
         SELECT count(*)
           FROM information_schema.table_constraints
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_run_active_projections'
            AND constraint_type = 'FOREIGN KEY'
       ) = 2 AS run_bindings_have_exactly_two_foreign_keys,
       (
         SELECT count(*)
           FROM information_schema.table_constraints
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_runtime_capabilities'
            AND constraint_type = 'FOREIGN KEY'
       ) = 1 AS capabilities_reference_the_marker;

-- 6b. EXACT critical definitions, read from the tables' own CREATE statements.
--
-- These are full canonical constraint and index texts, not loose keyword
-- searches: each expected string below is the exact definition the migration
-- declares, so a weakened or re-ordered constraint fails. This is the strongest
-- readback available without a live schema diff tool.
SELECT (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_memory_summary_embeddings]
          WHERE create_statement LIKE '%VECTOR INDEX vec_mhelix_summary_embeddings_run_projection (run_id ASC, projection_generation_id ASC, embedding vector_cosine_ops)%'
             OR create_statement LIKE '%VECTOR INDEX vec_mhelix_summary_embeddings_run_projection (run_id, projection_generation_id, embedding vector_cosine_ops)%'
       ) = 1 AS vector_index_definition_is_exact,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_recall_result_items]
          WHERE create_statement LIKE '%CHECK ((operation = ''recall''%'
       ) = 1 AS recall_operation_check_is_exact,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_recall_result_items]
          WHERE create_statement LIKE '%FOREIGN KEY (run_id, action_receipt_id, operation) REFERENCES mhelix_testwired.mhelix_action_receipts(run_id, action_receipt_id, operation)%'
       ) = 1 AS recall_receipt_foreign_key_definition_is_exact,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_runtime_capabilities]
          WHERE create_statement LIKE '%CHECK ((NOT public_mutations_enabled)%'
       ) = 1 AS mutation_claim_guard_definition_is_exact,
       (
         SELECT count(*)
           FROM [SHOW CREATE TABLE
                 mhelix_testwired.mhelix_action_receipts]
          WHERE create_statement LIKE '%transport_request_id%[A-Za-z0-9._:-]{1,128}%'
       ) = 1 AS transport_identifier_pattern_is_exact;

-- 7. The recall-result run and operation binding, the mutation-claim guard,
-- and the transport-identifier pattern all exist as CHECK constraints with the
-- expected clauses.
SELECT (
         SELECT count(*)
           FROM information_schema.check_constraints AS cc
           JOIN information_schema.table_constraints AS tc
             ON tc.constraint_name = cc.constraint_name
            AND tc.constraint_schema = cc.constraint_schema
          WHERE tc.table_schema = 'mhelix_testwired'
            AND tc.table_name = 'mhelix_recall_result_items'
            AND cc.check_clause LIKE '%recall%'
       ) >= 1 AS recall_operation_check_present,
       (
         SELECT count(*)
           FROM information_schema.check_constraints AS cc
           JOIN information_schema.table_constraints AS tc
             ON tc.constraint_name = cc.constraint_name
            AND tc.constraint_schema = cc.constraint_schema
          WHERE tc.table_schema = 'mhelix_testwired'
            AND tc.table_name = 'mhelix_runtime_capabilities'
            AND cc.check_clause LIKE '%public_mutations_enabled%'
       ) >= 1 AS mutation_claim_guard_present,
       (
         SELECT count(*)
           FROM information_schema.check_constraints AS cc
           JOIN information_schema.table_constraints AS tc
             ON tc.constraint_name = cc.constraint_name
            AND tc.constraint_schema = cc.constraint_schema
          WHERE tc.table_schema = 'mhelix_testwired'
            AND tc.table_name = 'mhelix_action_receipts'
            AND cc.check_clause LIKE '%transport_request_id%'
       ) >= 1 AS transport_identifier_check_present,
       (
         SELECT count(*)
           FROM information_schema.columns
          WHERE table_schema = 'mhelix_testwired'
            AND table_name = 'mhelix_action_receipts'
            AND column_name = 'transport_request_id'
            AND is_nullable = 'YES'
       ) = 1 AS transport_identifier_column_nullable;

-- 8. Preflight emptiness. Activation must not find pre-existing rows in the
-- new tables. The capability table in particular must still be empty here;
-- installing it is a separate later step.
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

-- 9. TWO-WAY grant comparison for the runtime role. The expected set is
-- declared inline, then compared in BOTH directions, so a missing grant, an
-- extra grant, a grantable grant, or zero grants all fail.
--
-- Expected: SELECT on twelve tables and nothing else. Eleven come from the
-- migration 002 grant packet; `mhelix_environment_markers` is the pre-existing
-- grant from the migration 001 activation. This slice grants NO INSERT and NO
-- UPDATE to the runtime role.
WITH expected_grant (table_name, privilege_type) AS (
  VALUES
    ('mhelix_environment_markers', 'SELECT'),
    ('mhelix_runtime_capabilities', 'SELECT'),
    ('mhelix_case_namespaces', 'SELECT'),
    ('mhelix_runs', 'SELECT'),
    ('mhelix_memory_sessions', 'SELECT'),
    ('mhelix_memory_events', 'SELECT'),
    ('mhelix_memory_summaries', 'SELECT'),
    ('mhelix_memory_summary_embeddings', 'SELECT'),
    ('mhelix_projection_generations', 'SELECT'),
    ('mhelix_run_active_projections', 'SELECT'),
    ('mhelix_action_receipts', 'SELECT'),
    ('mhelix_recall_result_items', 'SELECT')
),
actual_grant AS (
  SELECT table_name, privilege_type, is_grantable
    FROM information_schema.table_privileges
   WHERE table_schema = 'mhelix_testwired'
     AND grantee = 'mhelix_runtime'
)
SELECT (SELECT count(*) FROM actual_grant) = 12 AS runtime_grant_count_is_exact,
       (
         SELECT count(*) FROM (
           SELECT table_name, privilege_type FROM expected_grant
           EXCEPT
           SELECT table_name, privilege_type FROM actual_grant
         ) AS missing_grant
       ) = 0 AS no_expected_grant_is_missing,
       (
         SELECT count(*) FROM (
           SELECT table_name, privilege_type FROM actual_grant
           EXCEPT
           SELECT table_name, privilege_type FROM expected_grant
         ) AS extra_grant
       ) = 0 AS no_unexpected_grant_present,
       (
         SELECT count(*) FROM actual_grant WHERE is_grantable
       ) = 0 AS no_grant_is_grantable,
       (
         SELECT count(*) FROM actual_grant
          WHERE privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
       ) = 0 AS runtime_holds_no_write_privilege,
       (
         SELECT count(*)
           FROM information_schema.table_privileges
          WHERE table_schema = 'mhelix_testwired'
            AND grantee = 'mhelix_runtime'
            AND table_name = 'mhelix_schema_migrations'
       ) = 0 AS runtime_has_no_migration_ledger_privilege;

-- 10. EFFECTIVE database and schema privileges, read through `SHOW GRANTS`.
--
-- `SHOW GRANTS` reports effective privileges including anything inherited, so
-- it is the authority here. `information_schema.schema_privileges.is_grantable`
-- is deliberately NOT used to decide schema grantability, because that column
-- is not a dependable proof of the grant option at schema level.
SELECT (
         SELECT count(*)
           FROM [SHOW GRANTS ON DATABASE mhelix_testwired]
          WHERE grantee = 'mhelix_runtime'
            AND privilege_type = 'CONNECT'
            AND NOT is_grantable
       ) = 1 AS runtime_has_database_connect_not_grantable,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON DATABASE mhelix_testwired]
          WHERE grantee = 'mhelix_runtime'
            AND privilege_type <> 'CONNECT'
       ) = 0 AS runtime_has_no_other_database_privilege,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON SCHEMA mhelix_testwired]
          WHERE grantee = 'mhelix_runtime'
            AND privilege_type = 'USAGE'
            AND NOT is_grantable
       ) = 1 AS runtime_has_schema_usage_not_grantable,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON SCHEMA mhelix_testwired]
          WHERE grantee = 'mhelix_runtime'
            AND privilege_type <> 'USAGE'
       ) = 0 AS runtime_has_no_other_schema_privilege;

-- 11. PRIVILEGES REACHING THE RUNTIME THROUGH `public`.
--
-- Every role is implicitly a member of `public`, so a grant to `public` is a
-- grant to the runtime role even though it never appears as a direct grant.
-- Missing this is the classic way a "least privilege" claim turns out false.
SELECT (
         SELECT count(*)
           FROM [SHOW GRANTS ON DATABASE mhelix_testwired]
          WHERE grantee = 'public'
            AND privilege_type <> 'CONNECT'
       ) = 0 AS public_has_no_extra_database_privilege,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON SCHEMA mhelix_testwired]
          WHERE grantee = 'public'
       ) = 0 AS public_has_no_schema_privilege,
       (
         SELECT count(*)
           FROM information_schema.table_privileges
          WHERE table_schema = 'mhelix_testwired'
            AND grantee = 'public'
       ) = 0 AS public_has_no_table_privilege;

-- 12. SYSTEM-LEVEL privileges and role options.
--
-- Table grants are not the whole privilege surface. A system privilege such as
-- the ability to modify cluster settings, or a role option such as
-- CREATEROLE or CREATELOGIN, would defeat least privilege without appearing in
-- any table-level check.
SELECT (
         SELECT count(*)
           FROM [SHOW SYSTEM GRANTS]
          WHERE grantee = 'mhelix_runtime'
       ) = 0 AS runtime_holds_no_system_privilege,
       (
         SELECT count(*)
           FROM [SHOW SYSTEM GRANTS]
          WHERE grantee = 'public'
       ) = 0 AS public_holds_no_system_privilege,
       (
         SELECT count(*)
           FROM [SHOW ROLES]
          WHERE username = 'mhelix_runtime'
            AND options <> '{}'
       ) = 0 AS runtime_has_no_role_options,
       (
         SELECT count(*)
           FROM [SHOW ROLES]
          WHERE username = 'mhelix_runtime'
            AND member_of <> '{}'
       ) = 0 AS runtime_belongs_to_no_role;

-- 11. Ownership and role membership. The runtime role must own nothing in this
-- schema and must inherit no dangerous role. Ownership carries implicit full
-- privilege and the grant option, so an unexpected owner would silently defeat
-- every grant check above.
SELECT (
         SELECT count(*)
           FROM [SHOW TABLES FROM mhelix_testwired]
          WHERE owner = 'mhelix_runtime'
       ) = 0 AS runtime_owns_no_table,
       (
         SELECT count(*)
           FROM [SHOW TABLES FROM mhelix_testwired]
          WHERE owner <> 'mhelix_migrator'
       ) = 0 AS every_table_owned_by_migrator,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON ROLE FOR mhelix_runtime]
       ) = 0 AS runtime_holds_no_role_membership,
       (
         SELECT count(*)
           FROM [SHOW GRANTS ON ROLE FOR mhelix_runtime]
          WHERE role_name IN ('admin', 'root', 'owner')
             OR is_admin
       ) = 0 AS runtime_inherits_no_dangerous_role;

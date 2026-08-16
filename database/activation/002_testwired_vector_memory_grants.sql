-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW activation source 002: least-privilege runtime grants for
-- the vector-memory slice.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. No statement here has been
-- executed. Only a separately authenticated `mhelix_migrator` session may
-- apply it, after migration 002 is applied and verified.
--
-- Least-privilege rules encoded below:
-- 1. Table-level grants named one at a time. No `ALL TABLES IN SCHEMA`, no
--    `ALL PRIVILEGES`, and no wildcard target, so a future table is never
--    granted by accident.
-- 2. No `WITH GRANT OPTION` anywhere: the runtime role can never re-grant.
--    Official syntax reference:
--    https://www.cockroachlabs.com/docs/v26.2/grant
-- 3. No DELETE, TRUNCATE, DROP, ALTER, CREATE, GRANT, REVOKE, ownership,
--    cluster-setting, or database-wide privilege is granted here.
-- 4. UPDATE is granted on exactly three tables: memory sessions (to close a
--    session), projection generations (to advance a rebuild state), and action
--    receipts (to complete a reserved receipt). Every other table is
--    append-only or read-only for the runtime role.
-- 5. The runtime role gets NO UPDATE on runs. A run's lifecycle is not
--    rewritable by the public runtime path.
-- 6. Ranked recall-result items are immutable by privilege: INSERT and SELECT
--    only, never UPDATE or DELETE.
-- 7. The migration ledger is not granted to the runtime role at all.
--
-- KNOWN PRIVILEGE GAP, RECORDED AS A LATER LIVE CORRECTION GATE: the existing
-- `managed-mcp` identity inherits `admin`. While that inheritance stands, that
-- identity MUST NOT be described as least-privileged, and nothing in this file
-- changes it. Correcting it is a separate, explicitly authorized live
-- operation with its own reviewed evidence.

BEGIN;

-- Read-only reference data for the recall path.
GRANT SELECT ON TABLE mhelix_testwired.mhelix_runtime_capabilities
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_case_namespaces
  TO mhelix_runtime;

-- Runs: create and read only. Deliberately no UPDATE.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_runs
  TO mhelix_runtime;

-- Sessions: created, read, and closed by the runtime.
GRANT SELECT, INSERT, UPDATE ON TABLE mhelix_testwired.mhelix_memory_sessions
  TO mhelix_runtime;

-- Append-only public-safe event log, including the durable denial event.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_memory_events
  TO mhelix_runtime;

-- Append-only event-anchored summaries.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_memory_summaries
  TO mhelix_runtime;

-- Append-only privacy-safe embeddings.
GRANT SELECT, INSERT
  ON TABLE mhelix_testwired.mhelix_memory_summary_embeddings
  TO mhelix_runtime;

-- Projection generations: rebuild advances their state.
GRANT SELECT, INSERT, UPDATE
  ON TABLE mhelix_testwired.mhelix_projection_generations
  TO mhelix_runtime;

-- Run-scoped active projection binding: bind once, then read. No UPDATE.
GRANT SELECT, INSERT
  ON TABLE mhelix_testwired.mhelix_run_active_projections
  TO mhelix_runtime;

-- Action receipts: reserved, then completed or denied.
GRANT SELECT, INSERT, UPDATE ON TABLE mhelix_testwired.mhelix_action_receipts
  TO mhelix_runtime;

-- Ranked recall results: immutable durable evidence.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_recall_result_items
  TO mhelix_runtime;

COMMIT;

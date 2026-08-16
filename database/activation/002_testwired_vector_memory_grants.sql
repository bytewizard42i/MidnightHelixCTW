-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW activation source 002: least-privilege runtime grants for
-- the vector-memory slice.
--
-- REVIEWED SOURCE ONLY. SOURCE_ONLY status. No statement here has been
-- executed. Only a separately authenticated `mhelix_migrator` session may
-- apply it, after migration 002 is applied and verified.
--
-- NOT ATOMIC. CockroachDB can auto-commit a `GRANT`, because a grant is a
-- schema change rather than an ordinary transactional write. This file is
-- therefore deliberately written WITHOUT a surrounding transaction and must be
-- treated as RESUMABLE AND IDEMPOTENT: re-granting an existing privilege is a
-- no-op, so an interrupted run may simply be run again. Do not describe this
-- packet as all-or-nothing. The authoritative completion evidence is the exact
-- two-way readback in `verify_vector_memory_activation.sql`, not the apparent
-- success of this script.
--
-- READ-ONLY BY DESIGN IN THIS SLICE.
-- This source-only pull request deliberately grants the runtime role SELECT
-- and nothing else:
--   * No UPDATE. The lifecycle-transition grants (closing a memory session,
--     advancing a projection generation, completing an action receipt) are
--     DEFERRED until the exact-statement application executor and the database
--     mutation boundary are reviewed together. A table-wide UPDATE grant is
--     far broader than the three specific transitions the flow actually needs.
--   * No INSERT. No runtime implementation exists yet, so no write path can
--     justify an INSERT grant today. Granting one now would be privilege
--     issued ahead of reviewed code.
--   * No DELETE, TRUNCATE, DROP, ALTER, CREATE, GRANT, REVOKE, ownership,
--     cluster-setting, or database-wide privilege, ever, from this file.
-- Ranked recall-result items and embeddings are therefore immutable to the
-- runtime role in this slice by construction, not merely by convention.
--
-- Grants are named one table at a time. There is no `ALL TABLES IN SCHEMA`, no
-- `ALL PRIVILEGES`, no wildcard target, and no `WITH GRANT OPTION`, so a
-- future table is never granted by accident and the runtime role can never
-- re-grant. Official syntax reference:
-- https://www.cockroachlabs.com/docs/v26.2/grant
--
-- KNOWN PRIVILEGE GAP, RECORDED AS A LATER LIVE CORRECTION GATE: the existing
-- `managed-mcp` identity inherits `admin`. While that inheritance stands, that
-- identity MUST NOT be described as least-privileged, and nothing in this file
-- changes it. Correcting it is a separate, explicitly authorized live
-- operation with its own reviewed evidence.

-- Connection and schema visibility. Both are expected to already exist from
-- the migration 001 activation; re-granting is an idempotent no-op and keeps
-- this packet self-contained.
GRANT CONNECT ON DATABASE mhelix_testwired TO mhelix_runtime;
GRANT USAGE ON SCHEMA mhelix_testwired TO mhelix_runtime;

-- Read-only reference data for the recall path.
GRANT SELECT ON TABLE mhelix_testwired.mhelix_runtime_capabilities
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_case_namespaces
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_runs
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_memory_sessions
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_memory_events
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_memory_summaries
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_memory_summary_embeddings
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_projection_generations
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_run_active_projections
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_action_receipts
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_recall_result_items
  TO mhelix_runtime;

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
-- HOW THIS MATRIX IS JUSTIFIED. Every write privilege below corresponds to a
-- statement in the frozen catalog `apps/api/src/vector-memory-statements.js`,
-- which is the only SQL the runtime can execute. The catalog's own contract
-- tests forbid destructive verbs and any UPDATE outside the three reviewed
-- lifecycle transitions, so this packet grants exactly what that reviewed code
-- needs and nothing it could not use:
--   * INSERT on the nine append-only tables the five-route journey writes;
--   * UPDATE on exactly three tables, for the three lifecycle transitions:
--     closing a memory session, advancing a projection generation, and
--     settling an action receipt;
--   * SELECT where the read paths need it.
-- An earlier revision of this packet was SELECT-only because no reviewed
-- runtime existed yet. That runtime now exists, is merged, and is tested, so
-- the write grants are no longer privilege issued ahead of code.
--
-- Still absent, deliberately and forever from this file:
--   * UPDATE on mhelix_runs: a run's lifecycle is not rewritable by the
--     public runtime path.
--   * INSERT or UPDATE on mhelix_runtime_capabilities, mhelix_case_namespaces,
--     or mhelix_environment_markers: those rows are installed only by the
--     authenticated migrator.
--   * Any privilege at all on mhelix_schema_migrations.
--   * UPDATE or DELETE on mhelix_recall_result_items and
--     mhelix_memory_summary_embeddings: recall evidence and stored vectors
--     are immutable by privilege.
--   * DELETE, TRUNCATE, DROP, ALTER, CREATE, GRANT, REVOKE, ownership,
--     cluster-setting, database-wide, or wildcard privilege of any kind.
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

-- Read-only reference data. The runtime may look, never touch.
GRANT SELECT ON TABLE mhelix_testwired.mhelix_runtime_capabilities
  TO mhelix_runtime;
GRANT SELECT ON TABLE mhelix_testwired.mhelix_case_namespaces
  TO mhelix_runtime;

-- Runs: created once per journey, then read. Deliberately no UPDATE.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_runs
  TO mhelix_runtime;

-- Sessions: created, read, and closed. One of the three UPDATE transitions.
GRANT SELECT, INSERT, UPDATE ON TABLE mhelix_testwired.mhelix_memory_sessions
  TO mhelix_runtime;

-- Append-only public-safe event log, including the durable denial event.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_memory_events
  TO mhelix_runtime;

-- Append-only event-anchored summaries.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_memory_summaries
  TO mhelix_runtime;

-- Append-only privacy-safe embeddings. Immutable once written.
GRANT SELECT, INSERT
  ON TABLE mhelix_testwired.mhelix_memory_summary_embeddings
  TO mhelix_runtime;

-- Projection generations: built, then advanced to ACTIVE. One of the three
-- UPDATE transitions, guarded in the statement by its BUILDING precondition.
GRANT SELECT, INSERT, UPDATE
  ON TABLE mhelix_testwired.mhelix_projection_generations
  TO mhelix_runtime;

-- Run-scoped active projection binding: bind once, then read. No UPDATE, so a
-- run's projection can never be silently repointed.
GRANT SELECT, INSERT
  ON TABLE mhelix_testwired.mhelix_run_active_projections
  TO mhelix_runtime;

-- Action receipts: reserved, then settled exactly once. One of the three
-- UPDATE transitions, guarded in the statement by its RESERVED precondition.
GRANT SELECT, INSERT, UPDATE ON TABLE mhelix_testwired.mhelix_action_receipts
  TO mhelix_runtime;

-- Ranked recall results: durable evidence, immutable by privilege.
GRANT SELECT, INSERT ON TABLE mhelix_testwired.mhelix_recall_result_items
  TO mhelix_runtime;

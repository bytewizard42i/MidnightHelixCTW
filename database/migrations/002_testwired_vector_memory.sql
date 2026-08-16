-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW migration 002: TestWired vector-memory recall slice
--
-- ADDITIVE AND NON-DESTRUCTIVE. This source creates no user, privilege,
-- secret, connection, or fixture row. It drops nothing, truncates nothing, and
-- rewrites no existing column. A separately authenticated migrator applies it,
-- records its checksum, and only then may the reviewed activation and grant
-- sources run.
--
-- SOURCE_ONLY. Committing this file proves nothing about the live database.
-- No statement here has been executed against CockroachDB.
--
-- Scope: the five-step judge flow of storing privacy-safe session summaries,
-- closing a session, recalling the correct prior summary from a NEW session
-- through a real vector query, recording a durable denial that returns zero
-- protected fields, and reproducing the exact stored evidence references from
-- a receipt.
--
-- PRIVACY RULE FOR THE VECTOR TABLE (enforced by review and by the source
-- contract test, because SQL cannot detect the meaning of a string): the
-- embedding table stores ONLY references to already-public-safe summaries, an
-- eight-dimensional embedding, a fixed model identifier, a 32-byte embedding
-- commitment, and ordinary audit fields. It must never carry raw protected
-- source text, identity records, deeds, mortgages, owner data, credentials,
-- private witnesses, encryption keys, Filecoin payloads, or protected document
-- bytes. There is deliberately no free-text content column in this migration.
--
-- APPLY-TIME PREREQUISITE, NOT PERFORMED BY THIS FILE: creating a vector index
-- requires the cluster setting `feature.vector_index.enabled = true`
-- (https://www.cockroachlabs.com/docs/v26.2/vector-indexes#enable-vector-indexes).
-- This migration deliberately does NOT set it. Changing a cluster setting is a
-- separate, explicitly authorized live operation. If the setting is disabled,
-- the embedding table statement fails, which is the intended fail-closed
-- behavior rather than silently creating an unindexed table.
--
-- Every object is schema-qualified to `mhelix_testwired`, matching migration
-- 001, so correctness never depends on the connection's search path.

-- Release-bound runtime capability marker. A capability is bound to one exact
-- release commit, so a stale deployment can never claim a newer capability.
-- Public mutations stay disabled at the schema level: the CHECK makes any row
-- asserting enabled public mutations impossible to insert in this environment.
CREATE TABLE IF NOT EXISTS mhelix_testwired.mhelix_runtime_capabilities (
  capability_id STRING NOT NULL,
  marker_id STRING NOT NULL
    REFERENCES mhelix_testwired.mhelix_environment_markers (marker_id),
  release_commit STRING NOT NULL,
  capability_state STRING NOT NULL,
  capability_version INT8 NOT NULL,
  public_mutations_enabled BOOL NOT NULL DEFAULT false,
  evidence_commitment BYTES NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (capability_id, release_commit),
  UNIQUE (marker_id, capability_id, release_commit),
  CHECK (capability_id IN ('vector_memory_recall')),
  CHECK (capability_state IN ('SOURCE_ONLY', 'VERIFIED_LOCAL', 'LIVE_TESTWIRED')),
  CHECK (capability_version = 1),
  CHECK (NOT public_mutations_enabled),
  CHECK (release_commit ~ '^[0-9a-f]{40}$'),
  CHECK (octet_length(evidence_commitment) = 32)
);

-- Run-specific active projection binding. Migration 001 already pins one
-- active projection per case namespace; recall must additionally be pinned per
-- independent judge run, so two runs in the same case cannot silently read
-- each other's projection generation. The primary key on run_id allows exactly
-- one active binding per run.
CREATE TABLE IF NOT EXISTS mhelix_testwired.mhelix_run_active_projections (
  run_id UUID NOT NULL PRIMARY KEY,
  case_namespace_id UUID NOT NULL,
  projection_generation_id UUID NOT NULL,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_namespace_id, run_id, projection_generation_id),
  UNIQUE (run_id, projection_generation_id),
  FOREIGN KEY (case_namespace_id, run_id)
    REFERENCES mhelix_testwired.mhelix_runs (case_namespace_id, run_id),
  FOREIGN KEY (case_namespace_id, projection_generation_id)
    REFERENCES mhelix_testwired.mhelix_projection_generations
      (case_namespace_id, projection_generation_id)
);

-- Additive uniqueness on the EXISTING summaries table from migration 001. This
-- adds no column and changes no existing definition; it exists so the
-- embedding table below can carry a real composite foreign key proving that a
-- referenced summary belongs to the referenced session. Without it the
-- session-to-summary boundary would be runtime-only.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mhelix_memory_summaries_session_summary
  ON mhelix_testwired.mhelix_memory_summaries (session_id, memory_summary_id);

-- Privacy-safe summary embeddings.
--
-- The composite foreign keys bind every row to the same case namespace, run,
-- session, summary, and projection generation, so a recall cannot cross a run,
-- case, session, projection, or summary boundary.
--
-- The vector index uses run_id and projection_generation_id as PREFIX columns
-- and the cosine operator class, matching the intended query, which constrains
-- both prefix columns to exact values and orders by cosine distance. Official
-- syntax reference:
-- https://www.cockroachlabs.com/docs/v26.2/vector-indexes#define-prefix-columns
-- https://www.cockroachlabs.com/docs/v26.2/vector-indexes#specify-an-opclass
-- Index USE is a runtime property and is NOT claimed here: only a later live
-- EXPLAIN showing a vector search with prefix spans can prove it.
CREATE TABLE IF NOT EXISTS mhelix_testwired.mhelix_memory_summary_embeddings (
  memory_summary_embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_namespace_id UUID NOT NULL,
  run_id UUID NOT NULL,
  session_id UUID NOT NULL,
  projection_generation_id UUID NOT NULL,
  memory_summary_id UUID NOT NULL,
  embedding_model_id STRING NOT NULL,
  embedding_dimensions INT8 NOT NULL,
  embedding VECTOR(8) NOT NULL,
  embedding_commitment BYTES NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, projection_generation_id, memory_summary_id),
  UNIQUE (projection_generation_id, memory_summary_id),
  FOREIGN KEY (case_namespace_id, run_id)
    REFERENCES mhelix_testwired.mhelix_runs (case_namespace_id, run_id),
  FOREIGN KEY (case_namespace_id, run_id, session_id)
    REFERENCES mhelix_testwired.mhelix_memory_sessions
      (case_namespace_id, run_id, session_id),
  FOREIGN KEY (session_id, memory_summary_id)
    REFERENCES mhelix_testwired.mhelix_memory_summaries
      (session_id, memory_summary_id),
  FOREIGN KEY (case_namespace_id, projection_generation_id)
    REFERENCES mhelix_testwired.mhelix_projection_generations
      (case_namespace_id, projection_generation_id),
  CHECK (embedding_model_id = 'mhelixctw-synthetic-embedding-v1'),
  CHECK (embedding_dimensions = 8),
  CHECK (octet_length(embedding_commitment) = 32),
  VECTOR INDEX vec_mhelix_summary_embeddings_run_projection (
    run_id,
    projection_generation_id,
    embedding vector_cosine_ops
  )
);

-- Immutable ranked recall-result items.
--
-- Each row is one ranked candidate durably attached to the action receipt that
-- produced it, so a receipt can reproduce the exact stored evidence references
-- it returned. Immutability is enforced by privilege, not by trigger: the
-- reviewed grants give this table INSERT and SELECT only, never UPDATE or
-- DELETE.
--
-- The rank ceiling of two matches the bounded two-candidate recall query. The
-- two uniqueness constraints make a duplicate durable result impossible: one
-- rank may appear once per receipt, and one summary may appear once per
-- receipt.
CREATE TABLE IF NOT EXISTS mhelix_testwired.mhelix_recall_result_items (
  recall_result_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_receipt_id UUID NOT NULL
    REFERENCES mhelix_testwired.mhelix_action_receipts (action_receipt_id),
  run_id UUID NOT NULL,
  projection_generation_id UUID NOT NULL,
  memory_summary_id UUID NOT NULL,
  result_rank INT8 NOT NULL,
  cosine_distance FLOAT8 NOT NULL,
  result_commitment BYTES NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (action_receipt_id, result_rank),
  UNIQUE (action_receipt_id, memory_summary_id),
  FOREIGN KEY (run_id, projection_generation_id, memory_summary_id)
    REFERENCES mhelix_testwired.mhelix_memory_summary_embeddings
      (run_id, projection_generation_id, memory_summary_id),
  CHECK (result_rank >= 1),
  CHECK (result_rank <= 2),
  CHECK (cosine_distance >= 0.0),
  CHECK (cosine_distance <= 2.0),
  CHECK (octet_length(result_commitment) = 32)
);

CREATE INDEX IF NOT EXISTS idx_mhelix_recall_result_items_receipt
  ON mhelix_testwired.mhelix_recall_result_items
    (action_receipt_id, result_rank);

-- Original transport request identifier on action receipts.
--
-- The deployed transport already derives a validated request identifier from
-- `event.requestContext.requestId` in `apps/api/src/handler.js`, using exactly
-- the pattern repeated below. Binding it to the receipt lets a judge tie one
-- durable receipt back to the exact original transport request.
--
-- This is purely additive: `ADD COLUMN IF NOT EXISTS` adds one nullable column
-- and rewrites nothing. It is nullable because migration 001 receipts already
-- exist without it; a fabricated default would be dishonest evidence.
ALTER TABLE mhelix_testwired.mhelix_action_receipts
  ADD COLUMN IF NOT EXISTS transport_request_id STRING
    CHECK (
      transport_request_id IS NULL
      OR transport_request_id ~ '^[A-Za-z0-9._:-]{1,128}$'
    );

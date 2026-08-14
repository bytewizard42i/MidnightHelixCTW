-- 001_init.sql — schema for the helix_testtown TWIN INSTANCE.
--
-- This is the HOT layer (a reconstructible CACHE of truth, per HelixCTW
-- ARCHITECTURE.md Rule 2): it stores dataset gating config, servable rows,
-- credential COMMITMENTS (never raw facts), and a cold-layer INDEX
-- (documents.cid → Filecoin, with the sha256 the Weave verifies against).
--
-- Run against a NEW database named helix_testtown. Never against the
-- frozen HelixCTW hackathon cluster.

CREATE TABLE IF NOT EXISTS datasets (
  name                  TEXT PRIMARY KEY,
  required_action_class TEXT NOT NULL,
  resource              TEXT NOT NULL,
  public_fields         TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS rows (
  dataset  TEXT NOT NULL REFERENCES datasets(name),
  id       UUID NOT NULL DEFAULT gen_random_uuid(),
  body     JSONB NOT NULL,
  PRIMARY KEY (dataset, id)
);

-- COMMITMENTS ONLY. Raw claims never touch the server (STORAGE_PLAN.md).
CREATE TABLE IF NOT EXISTS credential_commitments (
  id   TEXT PRIMARY KEY,
  body JSONB NOT NULL
);

-- Cold-layer index: the bytes live on Filecoin; this row is how the Weave
-- finds them and what it hash-verifies the retrieved bytes against.
CREATE TABLE IF NOT EXISTS documents (
  cid    TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  source TEXT NOT NULL   -- 'lighthouse-calibration' | 'pending-upload' | ...
);

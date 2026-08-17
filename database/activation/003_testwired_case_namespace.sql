-- SPDX-License-Identifier: Apache-2.0
-- MidnightHelixCTW activation source 003: the synthetic case namespace.
--
-- Migration 001 created `mhelix_case_namespaces` and the 2026-08-15 activation
-- installed the marker and ledger rows, but no case-namespace row was ever
-- seeded. Every judge route resolves its foreign keys through that row, so
-- without it the runtime correctly fails closed with SCENARIO_UNAVAILABLE.
-- This was found during live activation on 2026-08-17.
--
-- Plain INSERT, guarded so a second run inserts nothing. The fixture
-- commitment is DERIVED by the database from a fixed domain-separated
-- preimage, never supplied by an operator. Every value is a public,
-- reproducible repository fact: the scenario is the fixed synthetic Morrow
-- case and `synthetic` is pinned true by a CHECK in migration 001.

BEGIN;

INSERT INTO mhelix_testwired.mhelix_case_namespaces
  (marker_id, scenario_id, fixture_commitment, synthetic, release_commit)
SELECT marker.marker_id,
       'morrow-farmhouse-testwired-v1',
       digest(
         'mhelixctw/testtown-case/v1' || chr(10) ||
         'scenario=morrow-farmhouse-testwired-v1' || chr(10) ||
         'release=' || $1,
         'sha256'
       ),
       true,
       $1
  FROM mhelix_testwired.mhelix_environment_markers AS marker
 WHERE marker.marker_id = 'mhelixctw-testwired-environment'
   AND marker.build_stage = 'TESTWIRED'
   AND $1 ~ '^[0-9a-f]{40}$'
   AND (
         SELECT count(*)
           FROM mhelix_testwired.mhelix_case_namespaces
          WHERE scenario_id = 'morrow-farmhouse-testwired-v1'
       ) = 0;

COMMIT;

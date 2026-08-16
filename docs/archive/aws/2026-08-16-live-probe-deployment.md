# AWS live read-only probe deployment evidence — 2026-08-16

**Author:** Penny, under the hackathon completion control document
**Scope:** dated, sanitized evidence that the Helix Runtime Bridge
(AWS (Amazon Web Services) Lambda) was updated with the reviewed read-only
CockroachDB bootstrap and that the bounded environment-marker probe is
publicly verified. Archived evidence — not a living instruction file.

Every value below is public-safe: it is either served by the public
API (Application Programming Interface) to any signed-out caller, or a
non-secret deployment fact. No secret value, host, certificate, password,
connection string, or ARN (Amazon Resource Name) appears here.

## Deployment facts

| Fact | Value |
| --- | --- |
| Deployed release | `cd1d6c74c1d8cd440ce5659b37371fb824343ea4` (`fix(api): allow bounded CockroachDB connection headroom`) |
| Handler | `src/lambda.handler` |
| CloudFormation stack result | `UPDATE_COMPLETE` (stack `mhelixctw-testwired`, first created at release `578d565049e6d177c4b6fae4bb69fe4a2337173f`) |
| Public API address | `https://iyoshkil91.execute-api.us-east-1.amazonaws.com` |
| Public judge UI | `https://testwired.helixctw.com` (HTTP (Hypertext Transfer Protocol) 200) |
| Secret policy | One existing AWS (Amazon Web Services) Secrets Manager secret, one exact `secretsmanager:GetSecretValue` permission, no wildcard secret access, no KMS (Key Management Service) decrypt permission |

Deployment and change-set execution were performed by Clara with John's
explicit approval on 2026-08-16 (change set `samcli-deploy1786890546`, zero
additions, removals, or replacements).

## Public probe readback (re-verified 2026-08-16 21:37–21:52 UTC by Penny)

Captured from the public routes with a plain signed-out HTTPS client:

- `GET /healthz` → `ok: true`, `buildStage: TESTWIRED`, transport
  `REALDEAL_TEST` / `CONNECTED`.
- `GET /api/v1/status` → `releaseCommit` equals the deployed release
  `cd1d6c74c1d8cd440ce5659b37371fb824343ea4`; provider `cockroachdb` reports
  `evidence: REALDEAL_TEST`, `connection: CONNECTED`, with a sanitized
  evidence receipt identifier (observed example
  `9738e14c-506f-4e2f-be2b-32f2008ff0fd` at `2026-08-16T21:37:31.625Z`) and
  the exact boundary sentence: the bounded read-only query verified the
  CockroachDB connection, runtime identity, and reviewed TestWired
  environment marker, and does not prove or enable memory persistence or
  vector retrieval.
- `GET /api/v1/judge/scenarios` → `ok: true`, exactly the fixed
  `morrow-farmhouse-testwired-v1` TestWired scenario.
- CORS (Cross-Origin Resource Sharing) preflight `OPTIONS` from origin
  `https://testwired.helixctw.com` → HTTP 204 with
  `access-control-allow-origin` equal to that exact origin,
  methods `GET,OPTIONS,POST`, headers `content-type,idempotency-key`.
- Fail-closed mutation contract, all verified live:
  - `POST /api/v1/judge/runs` without an idempotency key → HTTP 428
    `IDEMPOTENCY_KEY_REQUIRED`.
  - With a key but an unknown scenario → HTTP 400 `UNKNOWN_SCENARIO`.
  - With a key and the valid fixed scenario → HTTP 503
    `LIVE_PROVIDERS_NOT_CONNECTED`, carrying the same `releaseCommit` and the
    truthful provider table. Nothing was persisted.

## Boundary

This checkpoint promotes exactly two claims:

1. The cloud transport runs the stated release publicly
   (`REALDEAL_TEST` / `CONNECTED`).
2. The bounded read-only CockroachDB environment-marker probe is live
   (`REALDEAL_TEST` / `CONNECTED`).

It does **not** promote persistent memory, vector indexing or retrieval,
capability activation, Managed MCP (Model Context Protocol), Bedrock,
Midnight, or any mutation. `readyForMutations` remains `false`,
`currentAvailability` remains `NOT_CONNECTED`, and every valid mutation
attempt fails closed with HTTP 503 `LIVE_PROVIDERS_NOT_CONNECTED`, as shown
above.

# Security and privacy policy

MidnightHelixCTW is a public TestWired hackathon project using synthetic data. It
is not a production title, identity, authorization, or legal service.

## Reporting

Please do not place suspected vulnerabilities, secrets, or exploit details in a
public issue. Contact the repository owner through the verified security contact
published in the GitHub repository profile. A dedicated disclosure address will
be added before the public demo is opened.

## Current Phase 1 safeguards

- Test fixtures only; no real records.
- No secret, private witness, provider credential, database role, wallet, or
  decryption key is deployed or committed.
- Browser code accepts only a public API base and uses no ambient credentials.
- Lambda exposes fixed synthetic routes, accepts bounded exact shapes, and fails closed.
- POST requests enforce only a syntax-valid `Idempotency-Key`; persistent
  duplicate detection is not implemented.
- CORS is exact-origin, throttling is configured, logs have short retention,
  and the Lambda role is log-only.
- Error logs contain a fixed code and request ID; access logs contain metadata only.
- No protected material is decrypted, embedded, persisted, or returned.
- Valid operational requests return `503 LIVE_PROVIDERS_NOT_CONNECTED` with no mock fallback.

## Required before live providers

- Use AWS Secrets Manager for runtime credentials.
- Create distinct least-privilege CockroachDB migrator, runtime, and read-only roles.
- Enforce authorization before decryption or disclosure.
- Keep protected source material out of embedding and inference.
- Implement hashed persistent idempotency.
- Persist only sanitized commitments, receipt IDs, and bounded metadata.
- Make provider failure visible and never silently substitute a mock fallback.

## Non-goals

This repository does not claim production legal sufficiency, complete resistance
to all attacks, or recovery of encrypted data when every encrypted copy and key
has been lost.

## Before public deployment

1. scan the full Git history and worktree for secrets;
2. verify all imported media rights and provenance;
3. review every environment variable and IAM permission;
4. verify synthetic namespace isolation and expiry;
5. test denial, replay, timeout, provider failure, and malformed input paths;
6. retest the deployed URL in a signed-out browser;
7. record the deployed source commit and service configuration without secrets.

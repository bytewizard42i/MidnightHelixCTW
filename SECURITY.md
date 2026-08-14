# Security and privacy policy

MidnightHelixCTW is a public TestWired hackathon project using synthetic data. It
is not a production title, identity, authorization, or legal service.

## Reporting

Please do not place suspected vulnerabilities, secrets, or exploit details in a
public issue. Contact the repository owner through the verified security contact
published in the GitHub repository profile. A dedicated disclosure address will
be added before the public demo is opened.

## Design boundaries

- Test fixtures only, no real deeds, mortgages, people, or government records.
- No secret or private witness is committed to Git.
- Secrets are resolved at runtime from AWS Secrets Manager.
- Browser code never receives database, Managed MCP, wallet, or decryption
  credentials.
- The Lambda database role is least privilege and is separate from the migrator
  and read-only evidence roles.
- Protected material is never sent to an embedding model.
- Authorization occurs before protected decryption or disclosure.
- API operations are allowlisted, size-bounded, rate-limited, and idempotent.
- Logs contain commitments and receipt identifiers, not protected payloads.
- Live provider failure is visible and never silently replaced by a mock.

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

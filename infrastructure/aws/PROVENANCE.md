# AWS infrastructure provenance

The MidnightHelixCTW Phase 1 stack is new submission-period work. Its neutral
deployment safeguards were informed by entrant-owned, uncommitted work inspected
on August 13, 2026 under:

```text
/home/js/DIDzMonolith/HelixCTW/infra/aws-judge-stack
```

That workspace was based on preserved repository commit:

```text
b0ed8ccd7c1b95661a6470466eaef269cc4cc07a
```

Neutral patterns adapted here include:

- eight explicit API Gateway routes instead of a wildcard proxy;
- exact-origin browser rules;
- short log retention and metadata-only API access logs;
- API-level burst and rate throttling;
- clean-tree and explicit-acknowledgement deployment guards;
- generated AWS URL output and read-only smoke checks;
- package inspection before deployment;
- an exact read of one existing Cockroach runtime secret, without creating or
  outputting a secret or secret value.

The original voice-note and payment scenario, live provider implementation,
Secrets Manager resource, and Bedrock permissions were not copied. This stack
uses the fictional Morrow property scenario and creates no provider credential
container. Reviewed source adds only `secretsmanager:GetSecretValue` for the
exact existing-secret ARN (Amazon Resource Name), alongside writes to its own
log stream. It has not been deployed or publicly probed, so the current
CockroachDB application provider truth remains `NOT_CONNECTED` and
`SOURCE_ONLY`.

The original HelixCTW files remain untouched and authoritative for their own
history. This repository is authoritative for the new standalone API shell.

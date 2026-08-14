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
- package inspection before deployment.

The original voice-note and payment scenario, live provider implementation,
Secrets Manager resource, and Bedrock permissions were not copied. This stack
uses the fictional Morrow property scenario, grants only log writes, exposes no
provider credential container, and truthfully returns `NOT_CONNECTED` and
`SOURCE_ONLY` until later integrations are independently verified.

The original HelixCTW files remain untouched and authoritative for their own
history. This repository is authoritative for the new standalone API shell.

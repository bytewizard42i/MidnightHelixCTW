# API Application

Planned public path:

```text
AWS API Gateway -> bounded Lambda coordinator -> CockroachDB / Bedrock / Midnight
```

The API must expose only the fixed synthetic judge workflow, enforce request and
response limits, use idempotency keys, redact errors, and fail closed when a
required live provider is unavailable.

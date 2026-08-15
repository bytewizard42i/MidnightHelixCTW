# TestWired deployment runbook

This runbook describes the intended public test environment. It does not claim the
stack is deployed until [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) records
current live evidence.

> **Current AWS state, 2026-08-14:** The first create of
> `mhelixctw-testwired` failed during API Gateway import and reached
> `ROLLBACK_COMPLETE`. No application endpoint was created. Post-rollback
> inspection found no application API, Lambda, IAM role, or application log
> groups. The AWS SAM managed packaging stack and bucket remain and are not
> application deployment evidence. A local source fix adds `servers[0].url`,
> object-shaped root CORS, and a built-template contract. That fix has not been
> redeployed successfully.

## Target public surfaces

1. AWS automatically supplies the first API URL after API Gateway deployment:
   `https://{api-id}.execute-api.us-east-1.amazonaws.com`.
2. The preferred public UI is `https://testwired.helixctw.com`.
3. The preferred custom API name is `https://api-testwired.helixctw.com`.

The generated AWS URL is sufficient for initial integration and judging. The two
custom names require John to control `helixctw.com`, create the DNS records, and
complete the AWS certificate/domain mapping. The generated URL does not require
buying another domain.

## Console links

Keep these pages available during deployment:

- [AWS CloudFormation, us-east-1](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks)
- [AWS API Gateway, us-east-1](https://console.aws.amazon.com/apigateway/main/apis?region=us-east-1)
- [AWS Lambda, us-east-1](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions)
- [AWS Secrets Manager, us-east-1](https://console.aws.amazon.com/secretsmanager/listsecrets?region=us-east-1)
- [AWS CloudWatch logs, us-east-1](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups)
- [CockroachDB Cloud](https://cockroachlabs.cloud/)

## Environment names

Use one isolated environment:

```text
application: MidnightHelixCTW
build stage: TESTWIRED
initial deployment evidence: SOURCE_ONLY
AWS stack: mhelixctw-testwired
AWS region: us-east-1
Cockroach database: mhelixctw_testwired
eligible output evidence label: REALDEAL_TEST
fixture namespace: TestTownDIDz
```

`REALDEAL_TEST` labels only an individual successful output carrying a sanitized
real test-service receipt. It is never a deployment stage. The product build stage
remains `TESTWIRED`; each capability is promoted separately only after its required live evidence is verified.

## Step 1, provision CockroachDB safely

1. Create or select the Basic cluster intended for the hackathon.
2. Create a dedicated database rather than sharing the public schema with unrelated
   applications.
3. Use a temporary migrator role for schema changes.
4. Create a narrow Lambda runtime role with only the exact table operations needed.
5. Create a separate read-only role for Managed MCP evidence.
6. Remove inherited public privileges that would broaden either role.
7. install and verify an environment marker bound to the expected database, stage,
   and runtime user.
8. Apply migrations and seed only the immutable synthetic fixture namespace.

Do not place a database URL in Git, browser code, Lambda environment plaintext, or
CloudFormation output.

## Step 2, create server-side secrets

Create Secrets Manager entries for:

- CockroachDB runtime connection material;
- Midnight test wallet or service material only if the chosen integration needs it;
- encrypted-evidence key references, never raw fixture plaintext.

The Lambda environment receives secret ARNs, not secret values. The function role
gets `GetSecretValue` only for its named secrets.

## Step 3, deploy AWS

Deploy one test stack containing:

- API Gateway HTTP API;
- Node.js Lambda orchestrator;
- exact CORS for the public UI origin;
- CloudWatch log group with short retention;
- narrowly scoped IAM policies;
- API throttling and bounded Lambda concurrency when the account supports it.

The minimum first route is:

```text
GET /healthz
```

It returns stage, source commit, region, and dependency configuration status. It
does not call a paid model and does not expose secrets.

The Phase 1 contract contains exactly eight routes:

```text
GET  /healthz
GET  /api/v1/status
GET  /api/v1/judge/scenarios
POST /api/v1/judge/runs
POST /api/v1/judge/runs/{runId}/sessions/close
POST /api/v1/judge/runs/{runId}/recall
POST /api/v1/judge/runs/{runId}/actions
GET  /api/v1/judge/receipts/{receiptId}
```

Responses use schema `mhelixctw/api/v1`. POST requests require JSON and an
`Idempotency-Key` matching `[A-Za-z0-9._:-]{16,128}`, reject unknown keys, and
accept at most 4096 body bytes. Before provider connection, operational routes
fail closed with `503 LIVE_PROVIDERS_NOT_CONNECTED`.

A response emitted inside the validated AWS Lambda runtime marks only the AWS
transport provider `REALDEAL_TEST` and `CONNECTED`. The global
`deploymentEvidence` field remains `SOURCE_ONLY`; every downstream provider,
guided availability, and mutation stays disconnected until independently
verified.

## Step 4, connect the real TestWired path

The public judge workflow must use the deployed services, not an in-memory
fallback:

1. create Session A and persist privacy-safe memory in CockroachDB;
2. create a real Titan embedding and store it in the Cockroach vector column;
3. start Session B and retrieve Session A memory semantically;
4. verify exact synthetic authority;
5. obtain a real Midnight test-network proof or commitment receipt;
6. return only the approved property predicate;
7. atomically persist the result and disclosure receipt;
8. reject unauthorized disclosure and replay attempts;
9. rebuild a shadow projection and atomically activate it;
10. verify the result through read-only Managed MCP.

## Step 5, connect the UI

Configure the public UI with the generated API URL first. Do not display a connected
badge until `/healthz`, `/api/v1/status`, the exact synthetic scenario catalog,
and the guided flow pass from a signed-out browser.

Once stable, add the custom API domain and update exact CORS. Keep the generated
AWS URL in the operator runbook as a recovery path.

## Step 6, public verification

Run the judge flow three times with new namespaces and verify:

- no cross-run data leakage;
- one protected result per idempotency key;
- denial returns zero protected fields;
- closed Session A is recalled by fresh Session B;
- rebuild returns the same committed memory identifier;
- CloudWatch contains no private payload;
- browser console and network panels are clean;
- mobile and desktop layouts are readable;
- source commit in the UI matches the public repository.

## Rollback

On a first create, failure can leave only a `ROLLBACK_COMPLETE` stack record and
no endpoint. On an update to a known-good stack, verify what CloudFormation
preserved rather than assuming the previous application remains active.

Projection rollback is a separate application operation. A rebuild writes a new
generation and flips the pointer only after validation. The public demo never
drops tables, truncates shared data, or deletes canonical artifacts.

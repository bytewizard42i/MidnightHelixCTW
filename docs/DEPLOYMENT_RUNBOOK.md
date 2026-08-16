# TestWired deployment runbook

This runbook describes the intended public test environment. It does not claim the
stack is deployed until [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) records
current live evidence.

> **Current cloud state, 2026-08-15:** The `mhelixctw-testwired`
> AWS (Amazon Web Services) SAM (Serverless Application Model) application stack
> is `CREATE_COMPLETE` at release
> `578d565049e6d177c4b6fae4bb69fe4a2337173f`. Its generated
> API (Application Programming Interface) address is
> `https://iyoshkil91.execute-api.us-east-1.amazonaws.com`. Amplify application
> `d23ghemtd40rom` serves branch `main` at
> `https://main.d23ghemtd40rom.amplifyapp.com` and
> `https://testwired.helixctw.com`. The custom address is `AVAILABLE`, returns
> HTTP (Hypertext Transfer Protocol) status 200, and presents valid
> TLS (Transport Layer Security) 1.3 without redirecting. Exact-origin
> CORS (Cross-Origin Resource Sharing) passed for both frontend origins.
> Downstream providers remain `NOT_CONNECTED`, `readyForMutations` is false,
> and a valid mutation smoke check returns HTTP (Hypertext Transfer Protocol)
> status `503 LIVE_PROVIDERS_NOT_CONNECTED`. This promotes cloud transport only;
> the global `deploymentEvidence` value remains `SOURCE_ONLY`. The failed first
> create remains documented in the
> [sanitized rollback archive](archive/aws/2026-08-14-first-create-rollback.md).
>
> The CockroachDB foundation is also verified independently. Database and
> schema `mhelix_testwired` exist, and migration
> `001_testwired_memory_core.sql` created 10 tables owned by
> `mhelix_migrator`. The `mhelix_migrator` and `mhelix_runtime` users do not
> inherit `admin`. The runtime user has database `CONNECT`, schema `USAGE`, and
> `SELECT` only on `mhelix_environment_markers`; a read from `mhelix_runs` is
> denied as intended. The canonical environment-marker contract is committed
> at `48e85b4` with digest
> `ee7b2de59f5684b23449d569bbe0e3ba0f73e50712ca28be1ae3afe12f991198`.
> Source commit `7a29f22` contains the reviewed atomic activation. An
> authenticated `mhelix_migrator` session applied it. Sanitized post-commit
> readback showed exactly one canonical marker row with all 8 comparisons true
> across the entire marker table and exactly one migration-001 ledger row with
> all 6 comparisons true. The reviewed source now contains a deployment-only
> database bootstrap, but it has not been deployed or publicly verified. The
> currently deployed Lambda therefore still reports CockroachDB
> `NOT_CONNECTED` at the application provider boundary. See the
> [sanitized activation archive](archive/cockroachdb/2026-08-15-marker-activation.md).

## Target public surfaces

1. The deployed API (Application Programming Interface) is
   `https://iyoshkil91.execute-api.us-east-1.amazonaws.com`.
2. The verified custom frontend is `https://testwired.helixctw.com`; its
   generated recovery address is
   `https://main.d23ghemtd40rom.amplifyapp.com`.
3. A custom API (Application Programming Interface) alias is not configured.

The generated addresses remain recovery paths. Cloudflare custom frontend setup
is complete and did not change the root domain or `www` hostname. A future
custom API (Application Programming Interface) alias would require controlled
DNS (Domain Name System) records, certificate validation, exact-origin
CORS (Cross-Origin Resource Sharing), and a verified domain mapping.

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
global deployment evidence: SOURCE_ONLY
cloud transport provider evidence: REALDEAL_TEST
downstream provider connections: NOT_CONNECTED
AWS stack: mhelixctw-testwired
AWS region: us-east-1
Cockroach database: mhelix_testwired
eligible output evidence label: REALDEAL_TEST
fixture namespace: TestTownDIDz
```

`REALDEAL_TEST` labels only an individual successful output carrying a sanitized
real test-service receipt. It is never a deployment stage. The product build stage
remains `TESTWIRED`; each capability is promoted separately only after its required live evidence is verified.

## Step 1, provision CockroachDB safely

The 2026-08-15 foundation checkpoint completed the isolated database, schema,
migration, table ownership, role separation, negative permission test, and
canonical marker and migration-ledger activation. On 2026-08-16 the reviewed
read-only Lambda bootstrap was deployed at release
`cd1d6c74c1d8cd440ce5659b37371fb824343ea4` and the public bounded
environment-marker probe was verified (`REALDEAL_TEST` / `CONNECTED` — see
[the live probe deployment record](archive/aws/2026-08-16-live-probe-deployment.md)).
The fixture seed and the vector path remain incomplete, so persistent memory
stays unproven and the overall application remains `NOT_CONNECTED`.

1. Select the Basic cluster intended for the hackathon.
2. Use the dedicated `mhelix_testwired` database rather than sharing the public schema with unrelated
   applications.
3. Use `mhelix_migrator` for reviewed schema changes.
4. Use `mhelix_runtime` with only the exact table operations needed.
5. Create a separate read-only role for Managed MCP (Model Context Protocol) evidence.
6. Keep both application users outside the `admin` role and verify negative access.
7. Insert and verify an environment marker bound to the expected database, stage,
   and runtime user.
8. Apply migrations and seed only the immutable synthetic fixture namespace.

Steps 1 through 4 and Step 6 have verified foundation evidence. The row-insertion
and canonical-value portion of Step 7 is verified: an authenticated
`mhelix_migrator` session applied the activation from source commit `7a29f22`,
and sanitized post-commit readback returned all 8 marker comparisons and all 6
ledger comparisons true. The expected-database and expected-runtime-user checks
remain part of the deployed Lambda bootstrap and probe gate. Step 5 remains open
until the Managed MCP (Model Context Protocol) role is separately proven read only.
Before the provider can be promoted, deploy and verify the reviewed Lambda
bootstrap. Step 8 remains open until the synthetic fixture and vector path are
implemented and verified.

Do not place a database URL (Uniform Resource Locator) in Git, browser code, Lambda environment plaintext, or
CloudFormation output.

## Step 2, create server-side secrets

Create Secrets Manager entries for:

- CockroachDB runtime connection material;
- Midnight test wallet or service material only if the chosen integration needs it;
- encrypted-evidence key references, never raw fixture plaintext.

The Lambda environment receives the exact ARN (Amazon Resource Name) of the
existing Cockroach runtime secret, not the secret value. The stack creates no
secret and produces no secret output. Its role grants exactly
`secretsmanager:GetSecretValue` on that one ARN (Amazon Resource Name), with no
wildcard resource.

The existing secret must use the AWS (Amazon Web Services) managed
`aws/secretsmanager` key. A customer-managed KMS (Key Management Service) key
requires a separately reviewed exact `kms:Decrypt` grant and key policy, which
this stack intentionally does not add. The secret object must contain exactly
`schemaVersion`, `host`, `port`, `database`, `username`, `password`,
and `caCertificatePem`, with schema version
`mhelixctw/cockroach-secret/v1`. Never place the value or identifier in Git,
chat, a public log, or a CloudFormation output.

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

A response emitted inside the validated AWS Lambda runtime marks the AWS
transport provider `REALDEAL_TEST` and `CONNECTED`. After the new bootstrap is
deployed, only a successful bounded marker probe may additionally mark the
CockroachDB connection-and-environment row `REALDEAL_TEST` and `CONNECTED`.
The global `deploymentEvidence` field must remain `SOURCE_ONLY`;
`currentAvailability` must remain `NOT_CONNECTED`;
`readyForMutations` must remain false; and every other provider must remain
`SOURCE_ONLY` and `NOT_CONNECTED`.

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

Branch `main` is already configured with `VITE_API_BASE_URL` set to the
generated API (Application Programming Interface) address. Both the generated
and custom frontend origins pass the read-only connection checks and exact-origin
CORS (Cross-Origin Resource Sharing). The interface correctly keeps mutation
controls unavailable because `readyForMutations` is false.

A custom API (Application Programming Interface) alias is not configured. If one
is added later, update exact-origin CORS (Cross-Origin Resource Sharing), repeat
the signed-out browser checks, and keep the generated address in this runbook as
a recovery path.

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

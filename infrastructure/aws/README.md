# AWS TestWired infrastructure

This directory contains a sanitized AWS Serverless Application Model (SAM) stack
for the Phase 1 public API shell. It creates:

- one API Gateway HTTP API with a `$default` stage;
- one Node.js 24 Lambda with a bounded read-only CockroachDB environment probe;
- eight explicit fixed-operation routes;
- exact browser-origin rules for both the generated hosting fallback and custom
  domain;
- API throttling at burst 2 and rate 1;
- retained Lambda and API access logs with configurable short retention;
- a Lambda role that can write only its own log stream and read one exact
  existing Cockroach runtime secret.

It creates no database secret, model permission, wallet, virtual network, queue,
KMS (Key Management Service) resource, or wildcard application route. The
existing runtime secret must use the AWS (Amazon Web Services) managed
`aws/secretsmanager` key. A customer-managed KMS (Key Management Service) key
would require a separate exact `kms:Decrypt` grant and key-policy review, which
this stack intentionally does not add. No positive Lambda reserved concurrency is set,
because the verified account quota requires all 10 current executions to remain
unreserved. Operational API requests fail closed until later reviewed provider
adapters are connected.

A response running inside the validated AWS (Amazon Web Services) Lambda
environment marks only the AWS (Amazon Web Services) transport row
`REALDEAL_TEST` and `CONNECTED`.
The `mhelixctw-testwired` AWS (Amazon Web Services) application stack is
`CREATE_COMPLETE`, and its generated
API (Application Programming Interface) address is
<https://iyoshkil91.execute-api.us-east-1.amazonaws.com>.

Amplify application `d23ghemtd40rom` serves branch `main` at the generated
origin <https://main.d23ghemtd40rom.amplifyapp.com> and the custom
UI (User Interface) address <https://testwired.helixctw.com>. This promotes only
public hosting and AWS (Amazon Web Services) transport. The global
`deploymentEvidence` value remains `SOURCE_ONLY`; CockroachDB, AWS (Amazon Web Services) Bedrock, Midnight,
Managed MCP (Model Context Protocol), and the fixture providers remain
disconnected. Valid mutation
requests return `503 LIVE_PROVIDERS_NOT_CONNECTED` and fail closed.

The failed first create on 2026-08-14 is preserved as historical evidence in
the repository's
[implementation status](../../docs/IMPLEMENTATION_STATUS.md#2026-08-14-first-aws-create-attempt)
and [sanitized rollback archive](../../docs/archive/aws/2026-08-14-first-create-rollback.md).
It does not describe the current successful application stack.

## Local validation

Install the AWS SAM CLI from the official AWS documentation, then run:

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW
bash infrastructure/aws/scripts/validate-local.sh
```

This runs every API (Application Programming Interface) and infrastructure
test, SAM (Serverless Application Model) lint, SAM (Serverless Application
Model) build, a post-build OpenAPI (Open Application Programming Interface)
contract check, and package scans for application tests, documentation,
unexpected top-level Markdown, application-owned environment files, source
maps, logs, missing production dependencies, and common credential-bearing
patterns. npm includes the sanitized application `README.md` at artifact root;
locked dependencies may retain their own metadata and source maps. The
credential-pattern scan still covers the whole artifact. The SAM (Serverless
Application Model) custom Makefile builder installs only the API (Application
Programming Interface) production dependency closure from the repository root
lockfile. The artifact carries that unchanged lockfile, and the post-build
contract requires every installed package version to match the corresponding
root-lock entry while excluding internal workspaces and unrelated web packages.
The inline OpenAPI document declares a relative root in `servers[0].url` and an
object-shaped `x-amazon-apigateway-cors` extension so SAM can add endpoint
configuration without producing an invalid Server Object or replacing CORS with
a bare origin list.

## Deliberate deployment

The deployment script requires a clean reviewed commit, an explicit one-run
acknowledgement, one to four exact comma-delimited HTTPS (Hypertext Transfer
Protocol Secure) browser origins, and the full ARN (Amazon Resource Name) of an
existing Cockroach runtime secret. It does not create, print, or output the
secret or its value. Keep this README open while running the commands below.

Before deployment, confirm that the existing secret uses the AWS (Amazon Web
Services) managed `aws/secretsmanager` key and contains exactly
`schemaVersion`, `host`, `port`, `database`, `username`, `password`,
and `caCertificatePem`. Set `schemaVersion` to
`mhelixctw/cockroach-secret/v1`. Do not paste the secret value into the
terminal command, repository, chat, or a CloudFormation output.

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW
export AWS_REGION=us-east-1
export MHELIX_STACK_NAME=mhelixctw-testwired
export MHELIX_PUBLIC_ALLOWED_ORIGINS=https://main.d23ghemtd40rom.amplifyapp.com,https://testwired.helixctw.com
export MHELIX_COCKROACH_RUNTIME_SECRET_ARN='PASTE_EXISTING_FULL_SECRET_ARN_HERE'
export MHELIX_CONFIRM_AWS_DEPLOY=DEPLOY_MHELIX_TESTWIRED_API
bash infrastructure/aws/scripts/deploy.sh
unset MHELIX_CONFIRM_AWS_DEPLOY
unset MHELIX_COCKROACH_RUNTIME_SECRET_ARN
```

The exact generated Amplify origin and custom judge origin are recorded above.
The script displays a CloudFormation change set and waits for confirmation. It
does not deploy silently.

After deployment, print the generated AWS URL and other non-secret outputs:

```bash
bash infrastructure/aws/scripts/outputs.sh
```

Run the read-only smoke checks against the exact deployed release commit:

```bash
export MHELIX_EXPECTED_RELEASE_COMMIT="$(git rev-parse HEAD)"
bash infrastructure/aws/scripts/smoke-readonly.sh
unset MHELIX_EXPECTED_RELEASE_COMMIT
```

The smoke script rejects a missing, malformed, stale, or mismatched release
commit before accepting provider evidence. It requires exact release-commit
equality in the health, status, scenario-list, and denied-mutation JSON
(JavaScript Object Notation) bodies. It calls the three read-only routes, then
sends one fixed synthetic mutation request that must return
`503 LIVE_PROVIDERS_NOT_CONNECTED`. That denial is a non-persisting negative
test. Every HTTP (Hypertext Transfer Protocol) request has a fixed 10-second
deadline. The script parses the approved-origin response header and requires
one exact value match. It also verifies
that only the AWS (Amazon Web Services) and CockroachDB provider rows are
connected on read-only routes, preserves global `SOURCE_ONLY` and
`NOT_CONNECTED`, and enforces exact public response, provider, transport,
scenario, and error-field allowlists in addition to sensitive-value rejection. It does not create a
run or invoke a paid provider.

## AWS console links

- CloudFormation:
  <https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks>
- API Gateway:
  <https://console.aws.amazon.com/apigateway/main/apis?region=us-east-1>
- Lambda:
  <https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions>
- CloudWatch logs:
  <https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups>

See [PROVENANCE.md](PROVENANCE.md) for the limited neutral patterns adapted from
the original HelixCTW workspace.

# AWS TestWired infrastructure

This directory contains a sanitized AWS Serverless Application Model (SAM) stack
for the Phase 1 public API shell. It creates:

- one API Gateway HTTP API with a `$default` stage;
- one dependency-free Node.js 24 Lambda;
- eight explicit fixed-operation routes;
- exact browser-origin rules for both the generated hosting fallback and custom
  domain;
- API throttling at burst 2 and rate 1;
- retained Lambda and API access logs with configurable short retention;
- a Lambda role that can write only its own log stream.

It creates no database secret, model permission, wallet, virtual network, queue,
or wildcard application route. No positive Lambda reserved concurrency is set,
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

This runs the handler tests, infrastructure contract tests, SAM lint, SAM build,
a post-build OpenAPI contract check, and a package scan for environment files,
source maps, logs, and common credential-bearing patterns.
The inline OpenAPI document declares a relative root in `servers[0].url` and an
object-shaped `x-amazon-apigateway-cors` extension so SAM can add endpoint
configuration without producing an invalid Server Object or replacing CORS with
a bare origin list.

## Deliberate deployment

The deployment script requires a clean reviewed commit, an explicit one-run
acknowledgement, and one to four exact comma-delimited HTTPS browser origins.
Keep this README open while running the commands below.

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW
export AWS_REGION=us-east-1
export MHELIX_STACK_NAME=mhelixctw-testwired
export MHELIX_PUBLIC_ALLOWED_ORIGINS=https://main.d23ghemtd40rom.amplifyapp.com,https://testwired.helixctw.com
export MHELIX_CONFIRM_AWS_DEPLOY=DEPLOY_MHELIX_TESTWIRED_API
bash infrastructure/aws/scripts/deploy.sh
unset MHELIX_CONFIRM_AWS_DEPLOY
```

The exact generated Amplify origin and custom judge origin are recorded above.
The script displays a CloudFormation change set and waits for confirmation. It
does not deploy silently.

After deployment, print the generated AWS URL and other non-secret outputs:

```bash
bash infrastructure/aws/scripts/outputs.sh
```

Run the read-only smoke checks:

```bash
bash infrastructure/aws/scripts/smoke-readonly.sh
```

The smoke script calls only health, status, scenario-list, and CORS preflight. It
does not create a run or invoke a paid provider.

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

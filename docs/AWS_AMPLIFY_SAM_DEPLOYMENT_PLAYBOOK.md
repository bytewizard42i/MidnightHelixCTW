# Amazon Web Services Serverless Application Model and Amplify deployment playbook

This playbook preserves reusable lessons from the first MidnightHelixCTW
TestWired deployment. It complements the project-specific
[deployment runbook](DEPLOYMENT_RUNBOOK.md). Use the runbook for the current
environment and this document when designing or reviewing a similar
AWS (Amazon Web Services) SAM (Serverless Application Model) deployment with an
Amplify frontend and API (Application Programming Interface).

The central rule is simple: connect one independently verifiable boundary at a
time, and never let source, deployment, transport, or provider evidence stand in
for one another.

## Evidence boundaries

| Evidence class | What it proves | What it does not prove |
| --- | --- | --- |
| Source | A reviewed commit contains the claimed code, configuration, tests, and documentation. | The commit was deployed or successfully executed in AWS (Amazon Web Services). |
| Deployment | CloudFormation stabilized successfully, the expected resources exist, and the runtime reports the deployed commit. | CockroachDB, Bedrock, Midnight, MCP (Managed Model Context Protocol), or another downstream provider was called. |
| Transport | A signed-out client can reach the deployed API (Application Programming Interface) and receives the expected HTTP (Hypertext Transfer Protocol) and CORS (Cross-Origin Resource Sharing) behavior. | A mutation completed or durable memory exists. |
| Provider | A named provider completed a bounded operation and produced the required current, sanitized evidence. | Any other provider is connected, or the whole application is production-ready. |

For the Phase 1 shell, successful AWS (Amazon Web Services) Lambda and
Amazon API (Application Programming Interface) Gateway execution
promotes only the AWS (Amazon Web Services) transport boundary. As of
2026-08-16 the deployed release also carries the reviewed read-only
CockroachDB bootstrap, so the bounded environment-marker probe row is
additionally `REALDEAL_TEST` and `CONNECTED` (see
[the live probe deployment record](archive/aws/2026-08-16-live-probe-deployment.md)).
The global deployment evidence remains `SOURCE_ONLY`, mutations remain
fail-closed, and CockroachDB application memory, Bedrock, Midnight,
MCP (Managed Model Context Protocol), `DIDz`
(decentralized identity fixture provider), `AgenticDID` (agentic decentralized
identity fixture provider), and `RWAz` (real-world asset fixture provider) remain
`NOT_CONNECTED` until each has separate evidence.

## Required deployment order

The browser origin and API (Application Programming Interface) address create a
deliberate two-step wiring sequence:

1. Publish the frontend source through Amplify and obtain its generated
   `https://main.{app-id}.amplifyapp.com` origin.
2. Deploy the SAM (Serverless Application Model)
   API (Application Programming Interface) with that exact origin in its
   CORS (Cross-Origin Resource Sharing) allowlist. Include the planned custom
   frontend origin too, if it is
   already known and controlled.
3. Verify the CloudFormation stack, generated
   API (Application Programming Interface) address, runtime release commit,
   read-only routes, and CORS (Cross-Origin Resource Sharing) preflight before
   changing the frontend.
4. Add the public base-address build variable, `VITE_API_BASE_URL`, to Amplify
   using the generated Amazon API (Application Programming Interface) Gateway base address.
5. Rebuild and redeploy the frontend. Vite reads environment variables at build
   time, so changing the variable without a new build does not change the
   browser bundle.
6. Verify the rebuilt site from a signed-out browser at desktop and mobile
   sizes, including console and network behavior.
7. Add custom DNS (Domain Name System) records only after both generated
   AWS (Amazon Web Services) origins work. Keep the generated addresses as
   recovery
   paths.

This order avoids a permissive wildcard CORS (Cross-Origin Resource Sharing)
shortcut and prevents the frontend from being built against a guessed
API (Application Programming Interface) address.

## First successful TestWired checkpoint

The following public, non-secret values record the first successful transport
checkpoint on 2026-08-15:

| Item | Recorded value |
| --- | --- |
| Release commit | `578d565049e6d177c4b6fae4bb69fe4a2337173f` |
| Amplify application identifier | `d23ghemtd40rom` |
| Generated frontend | <https://main.d23ghemtd40rom.amplifyapp.com> |
| Verified custom frontend | <https://testwired.helixctw.com> |
| Generated application programming interface | <https://iyoshkil91.execute-api.us-east-1.amazonaws.com> |
| Application stack | `mhelixctw-testwired`, `CREATE_COMPLETE` |
| Amazon Web Services region | `us-east-1` |

Those values are the dated 2026-08-15 checkpoint and are preserved as history.
Current state as of 2026-08-16: the same stack is `UPDATE_COMPLETE` at release
`cd1d6c74c1d8cd440ce5659b37371fb824343ea4` with handler `src/lambda.handler`
and the live read-only CockroachDB environment probe
([evidence record](archive/aws/2026-08-16-live-probe-deployment.md)).

At this checkpoint, the Amplify `main` release was rebuilt successfully with the
public base-address build variable, `VITE_API_BASE_URL`. The generated frontend,
generated API (Application Programming Interface), exact-origin
CORS (Cross-Origin Resource Sharing), release binding, and fail-closed browser
checks passed.
The `testwired.helixctw.com` custom-domain association is now `AVAILABLE`, its
status reason is empty, and its `main` branch mapping is verified. Automatic
subdomains remain disabled, and the root domain and `www` hostname remain
unchanged. A read-only request to <https://testwired.helixctw.com> returned
HTTP (Hypertext Transfer Protocol) status 200 with valid TLS (Transport Layer
Security) 1.3, the same effective address, and no redirect.

This checkpoint proves hosting and transport, not downstream-provider
participation. CockroachDB, Bedrock, Midnight,
MCP (Managed Model Context Protocol), and the fixture providers remain
disconnected.

## Configure Amplify with least access

Use the Amplify GitHub App instead of copying a personal access token into
AWS (Amazon Web Services). During installation, choose the intended GitHub
account,
select **Only select repositories**, and grant access only to the application
repository. Connect the reviewed release branch, currently `main`.

For this Node package workspace monorepo, use these settings:

| Amplify setting | Value |
| --- | --- |
| Repository | `bytewizard42i/MidnightHelixCTW` |
| Branch | `main` |
| Monorepo | enabled |
| Application root | `apps/web` |
| Monorepo-root variable | `AMPLIFY_MONOREPO_APP_ROOT=apps/web` |
| Frontend build command | `npm run build --workspace @midnight-helixctw/judge-web` |
| Build output directory | `apps/web/dist` |
| Amplify Generation 2 backend | disabled for this frontend |
| Server-side rendering | disabled |

The repository-root [`amplify.yml`](../amplify.yml) is authoritative. Its
`buildPath: /` lets the `npm ci` command install the root lockfile and workspaces,
while the artifact directory remains `apps/web/dist`. Do not maintain a
conflicting copy of the build specification only in the console.

The first frontend build may intentionally show `NOT CONNECTED`. That state is
truthful until the generated API (Application Programming Interface) exists and
the frontend has been rebuilt with its public base address.

## Validate both source and transformed templates

The first application-stack create failed during
Amazon API (Application Programming Interface) Gateway import. The transformed
OpenAPI (Open Application
Programming Interface) document was missing `servers[0].url`, and its root
x-amazon-apigateway-cors value was not the object
Amazon API (Application Programming Interface) Gateway required. The correct
source shape
includes a relative API (Application Programming Interface) root and
object-shaped CORS (Cross-Origin Resource Sharing):

```yaml
servers:
  - url: "/"
x-amazon-apigateway-cors:
  allowOrigins: <exact-origin-list>
  allowHeaders:
    - Content-Type
    - Idempotency-Key
  allowMethods:
    - GET
    - POST
    - OPTIONS
  allowCredentials: false
```

Validating only the handwritten template is insufficient because the
SAM (Serverless Application Model) transforms it before CloudFormation and
Amazon API (Application Programming Interface) Gateway receive it. The
repository contract tests therefore inspect both the source template and the
built template. They also reject wildcard origins and require the reviewed
CORS (Cross-Origin Resource Sharing) keys.

Run the repository-owned validation instead of issuing a bare deploy:

```bash
bash infrastructure/aws/scripts/validate-local.sh
```

That path runs the API (Application Programming Interface) tests,
infrastructure contract tests, the `sam validate --lint` and `sam build`
commands, the post-build OpenAPI (Open Application Programming Interface)
contract, and package scans. The package scan rejects environment files, source
maps, logs, and common AWS (Amazon Web Services) or database credential
patterns.

## Handle a failed first create safely

A first create at `ROLLBACK_COMPLETE` is different from a failed update of a
known-good stack. Before deletion:

1. Capture a sanitized event sequence and failure class.
2. Confirm the stack is the failed application stack, not shared tooling.
3. Inspect its logical resources and verify whether anything survived rollback.
4. Confirm no public endpoint or application resource is being treated as live.
5. Archive only non-secret identifiers and lessons in the repository.
6. Delete the failed application stack record deliberately.
7. Verify the stack is absent and check for matching application programming
   interfaces, functions, roles, and log groups that may require separate
   review.

Do not delete `aws-sam-cli-managed-default` merely because an application stack
failed. That SAM (Serverless Application Model) managed stack provides packaging
infrastructure and can remain healthy at `CREATE_COMPLETE`; it is neither the
application nor proof of a successful application deployment. The sanitized
MidnightHelixCTW incident is preserved in the
[first-create rollback archive](archive/aws/2026-08-14-first-create-rollback.md).

Also review resource retention policies. A failed first create may remove
resources that an ordinary deletion retains, while retained logs from an
established stack can survive and continue to incur storage costs.

## Bind deployment to one reviewed release

The deployment must have one explainable source identity:

1. Confirm the repository, remote, branch, and exact `HEAD` commit.
2. Require a clean working tree. Do not deploy uncommitted or unreviewed edits.
3. Confirm local `HEAD` matches the intended published `origin/main` commit.
4. Wait for the **Verify** and **Secret Scan** GitHub workflows on that commit.
5. Record the same full 40-character commit in CloudFormation parameters and
   resource tags.
6. Require `/healthz` and `/api/v1/status` to report that exact release before a
   browser enables any operation.
7. Confirm Amplify built the same intended commit after setting its environment
   variables.

The repository deployment script enforces a clean tree, derives the release
from the `git rev-parse HEAD` command, requires the one-run deployment
acknowledgement variable
`MHELIX_CONFIRM_AWS_DEPLOY=DEPLOY_MHELIX_TESTWIRED_API`, and requires one to four
exact HTTPS (Hypertext Transfer Protocol Secure) origins. This prevents an
operator from silently deploying a dirty or origin-less build.

## Preflight and release gates

Run from the native WSL (Windows Subsystem for Linux) repository root:

```bash
cd /home/js/DIDzMonolith/MidnightHelixCTW
git status --short --branch
git diff --check
npm ci
npm run verify
bash infrastructure/aws/scripts/preflight.sh
bash infrastructure/aws/scripts/validate-local.sh
node scripts/verify-doc-links.mjs
```

Before continuing, verify:

- the intended IAM (Identity and Access Management) user is active and the
  region is exactly `us-east-1`;
- AWS (Amazon Web Services) CLI (Command Line Interface) version 2, Node.js 20 or
  newer, and the SAM (Serverless Application Model) CLI (Command Line Interface)
  are available;
- the Lambda account concurrency limit is known before adding reserved
  concurrency;
- the tree is clean and the release commit is published;
- local tests, type checks, builds, fixture checks, and documentation links pass;
- the GitHub **Verify** workflow passes at the release commit;
- the full-history **Secret Scan** workflow passes using `.gitleaks.toml`;
- the built SAM (Serverless Application Model) package contains no `.env` files,
  source maps, logs, database addresses with credentials, or
  AWS (Amazon Web Services) secret-key assignments; and
- no credentials, account identifiers, request tokens, private endpoints, or
  packaging-bucket names will be copied into public logs or documentation.

Do not weaken a test, secret rule, or template contract to make a release pass.

## Review the processed change set in Standard mode

Use the normal CloudFormation **Standard** deployment path with validation and a
visible change set. Do not use Express mode for this workflow. The release gate
requires full resource stabilization, rollback behavior, and a
resource-by-resource review before execution. Faster acknowledgement is not a
substitute for those checks.

For the current disconnected Phase 1 shell, the reviewed initial change set
contained 14 additions:

- two CloudWatch log groups;
- one least-privilege Lambda execution role;
- one Node.js Lambda function;
- one Amazon API (Application Programming Interface) Gateway;
- one HTTP (Hypertext Transfer Protocol) API (Application Programming Interface);
- one `$default` stage; and
- eight route-specific Lambda invocation permissions.

Before approving a change set, inspect the processed result, not only the source
template:

| Review area | Expected boundary |
| --- | --- |
| Change shape | Only the intended additions, modifications, or removals; investigate replacements and unexpected deletions. |
| Parameters and tags | Exact allowed origins, full release commit, TestWired stage, region, and log retention. |
| Capabilities | `CAPABILITY_IAM` is expected because the stack creates one explicit Identity and Access Management role. |
| IAM (Identity and Access Management) | Lambda may assume its role and write only its own log stream; no wildcard resource, database secret, Bedrock, or downstream-provider permission in Phase 1. |
| Routes | Exactly the eight documented routes; no proxy or catch-all route. |
| CORS (Cross-Origin Resource Sharing) | Exact HTTPS (Hypertext Transfer Protocol Secure) browser origins, reviewed methods and headers, no wildcard, and credentials disabled. |
| Throttling | API (Application Programming Interface) burst limit 2 and rate limit 1 unless a later reviewed capacity decision changes them. |
| Logs | Bounded metadata-only access format, explicit short retention, and understood deletion behavior. |
| Runtime bounds | Node.js runtime, 10-second timeout, 256 mebibytes of memory, 4,096-byte request limit, and 32,768-byte response limit as currently reviewed. |

After execution, wait for `CREATE_COMPLETE` or `UPDATE_COMPLETE`. Review all
resource events and stop on any failure or rollback. A remote Git hash or green
SAM (Serverless Application Model) packaging stack alone does not prove this
completion.

## Verify the application programming interface without creating data

Print sanitized stack outputs, then use the repository smoke script:

```bash
bash infrastructure/aws/scripts/outputs.sh
bash infrastructure/aws/scripts/smoke-readonly.sh
```

The read-only smoke path calls only:

- `GET /healthz`;
- `GET /api/v1/status`;
- `GET /api/v1/judge/scenarios`; and
- `OPTIONS /api/v1/judge/runs` for each exact browser origin.

Verify the following independently:

- each route succeeds with the expected schema;
- the synthetic Morrow scenario is present;
- the runtime release equals the reviewed commit;
- the AWS (Amazon Web Services) transport is reported as connected, while
  downstream providers remain `NOT_CONNECTED`;
- global deployment evidence remains truthfully `SOURCE_ONLY` for the
  disconnected shell;
- each approved origin receives web response status 204 and its own exact
  `Access-Control-Allow-Origin` value; and
- an unapproved origin is not granted browser access.

These checks must not invoke state-changing routes or paid providers.

## Configure the frontend environment truthfully

Set the Amplify public base-address build variable only after the generated
API (Application Programming Interface) passes its read-only checks:

```text
VITE_API_BASE_URL=https://{api-id}.execute-api.us-east-1.amazonaws.com
```

Variables prefixed with `VITE_` are public build inputs embedded in the browser
bundle. Store only the public API (Application Programming Interface) base
address there, never AWS (Amazon Web Services) credentials, database addresses,
tokens, wallet material, or secrets. Keep server-side secrets in the appropriate
AWS (Amazon Web Services) secret service and grant the runtime only the access it
actually needs.

Start a new Amplify build after changing the variable. Then open the generated
site signed out and verify:

1. the page no longer asks for the `VITE_API_BASE_URL` public base-address build
   variable;
2. **Check connection** reaches the intended
   API (Application Programming Interface), not localhost or a stale address;
3. the network panel shows the three read-only routes and no unexpected request;
4. the console has no unexpected errors;
5. the UI (User Interface) release matches the API (Application Programming Interface) release;
6. disconnected providers remain visibly disconnected and mutation controls stay
   disabled; and
7. the guided demo, keyboard focus, British-English voice preference or honest
   fallback label, reduced motion, desktop, and mobile layouts still behave as
   documented.

A frontend HTTP (Hypertext Transfer Protocol) response status 200 proves only
that static hosting works. A green connection check proves transport
compatibility, not downstream-provider readiness.

## Add the Cloudflare custom domain later

Keep the generated Amplify and
Amazon API (Application Programming Interface) Gateway addresses working before
changing DNS (Domain Name System)
records. For this project, `testwired.helixctw.com` is the verified judge-facing
frontend and `api-testwired.helixctw.com` is an optional later
API (Application Programming Interface) alias. Cloudflare is the authoritative
DNS (Domain Name System) provider, so no Route 53 zone is required solely for
these names.

Use Amplify's **Add custom domain** flow, then copy the exact verification and
target records Amplify supplies into Cloudflare. Keep records in Domain Name
System-only mode while AWS (Amazon Web Services) validates ownership and issues
the certificate, unless the reviewed AWS (Amazon Web Services) and Cloudflare
configuration explicitly requires otherwise. Do not guess a canonical-name
record target or reuse one from another application.

After HTTPS (Hypertext Transfer Protocol Secure) is active:

1. verify the custom frontend signed out;
2. include its exact origin in API (Application Programming Interface)
   CORS (Cross-Origin Resource Sharing) before depending on it;
3. repeat preflight and browser checks from the custom origin;
4. update public documentation only after
   DNS (Domain Name System) and TLS (Transport Layer Security) are stable; and
5. retain generated origins in the operator runbook for recovery.

Do not repoint an existing production hostname or another product's deployment
as part of this flow.

## Windows and Windows Subsystem for Linux operator notes

- Treat /home/js/DIDzMonolith/MidnightHelixCTW inside native
  WSL (Windows Subsystem for Linux) as the source of truth. A rendered path such
  as
  `C:\home\js\...` is not the same location.
- Prefer an Ubuntu or WSL (Windows Subsystem for Linux) terminal for the Bash
  deployment scripts. Nested PowerShell, `wsl.exe`, and Bash quoting can expand
  `$variables`, command substitutions, braces, or backslashes in the wrong shell.
- If Windows must launch a WSL (Windows Subsystem for Linux) command, keep it
  short and inspect output between steps. Do not combine identity, deployment,
  parsing, and cleanup into one heavily quoted command.
- Disable the AWS (Amazon Web Services) CLI (Command Line Interface) pager for
  captured checks with `export AWS_PAGER=""` or use `--no-cli-pager`. Otherwise
  an apparently stalled command may simply be waiting inside a pager.
- Prefer the AWS (Amazon Web Services) CLI (Command Line Interface) `--query`
  option with `--output text` for one non-secret value. Do not print full
  identity, stack, environment, or secret payloads into a transcript when a
  narrow query is sufficient.
- If WSL (Windows Subsystem for Linux) still reports stale name resolution after
  DNS (Domain Name System) verification, compare public resolvers with the browser
  host resolver. Preserve the original hostname for certificate validation.
- Do not place credentials or secret values in command history, environment
  screenshots, documentation, or browser build variables.

## Billing, retention, and cleanup

Before and after a test deployment, review the billing surfaces you actually
enabled: Amplify builds and hosting,
Amazon API (Application Programming Interface) Gateway requests, Lambda
execution, CloudWatch metrics and retained
logs, custom-domain services, and any optional Web Application Firewall. Do not
enable a paid protection or provider merely to complete a console onboarding
card.

Use budgets or billing alerts appropriate to the account. Keep log retention
explicit and short enough for the test environment. When retiring an environment:

1. capture the evidence that must be retained;
2. verify the exact application stack and custom domains;
3. disconnect traffic and confirm no replacement depends on it;
4. delete only the intended application resources through their owning service;
5. inspect retained log groups and certificates separately; and
6. review the SAM (Serverless Application Model) managed packaging stack
   independently rather than treating it as application debris.

Repository history and archived deployment lessons remain. Cleanup must never
erase source history merely because cloud infrastructure is retired.

## Reusable release checklist

### Source and access

- [ ] Canonical repository, remote, branch, and release commit are verified.
- [ ] Working tree is clean and `origin/main` contains the release commit.
- [ ] Amplify GitHub App access is limited to the intended repository.
- [ ] Verify and full-history Secret Scan workflows pass at that commit.

### Frontend origin

- [ ] Amplify uses the root `amplify.yml`, monorepo root `apps/web`, and branch
  `main`.
- [ ] The generated Amplify origin loads signed out.
- [ ] No secret is present in an Amplify or `VITE_` variable.

### Application programming interface validation and review

- [ ] Repository verification and AWS (Amazon Web Services) validation scripts
  pass.
- [ ] Source and built OpenAPI (Open Application Programming Interface)
  documents contain `servers[0].url` and object-shaped CORS (Cross-Origin Resource Sharing).
- [ ] Package and secret scans pass.
- [ ] Intended IAM (Identity and Access Management) user, region, quota, and
  exact CORS (Cross-Origin Resource Sharing) origins are verified.
- [ ] Standard-mode change set has only expected resources and parameters.
- [ ] IAM (Identity and Access Management), routes, throttling, logs, retention,
  runtime, and request bounds are reviewed from the processed template.
- [ ] Stack reaches a fully stabilized success state and all resource events are
  clean.

### Wiring and browser evidence

- [ ] Read-only health, status, scenario, and exact-origin
  CORS (Cross-Origin Resource Sharing) checks pass.
- [ ] Runtime release commit equals the reviewed source commit.
- [ ] The `VITE_API_BASE_URL` public base-address build variable contains only
  the verified public API (Application Programming Interface) base address.
- [ ] A new Amplify build completes from the intended commit.
- [ ] Signed-out desktop and mobile checks pass with clean console and network
  results.
- [ ] The UI (User Interface) reports disconnected providers and disabled
  mutations honestly.

### Domain Name System and operations

- [ ] Generated AWS (Amazon Web Services) addresses remain documented as
  recovery paths.
- [ ] Exact Amplify-provided Cloudflare records validate before traffic depends
  on the custom domain.
- [ ] Custom origin is present in CORS (Cross-Origin Resource Sharing) and passes
  a new preflight check.
- [ ] Billing alerts, log retention, cleanup ownership, and rollback behavior are
  understood.
- [ ] Source, deployment, transport, and provider claims are recorded separately.

## Related project documents

- [Deployment runbook](DEPLOYMENT_RUNBOOK.md)
- [Amazon Web Services infrastructure operator guide](../infrastructure/aws/README.md)
- [Implementation status](IMPLEMENTATION_STATUS.md)
- [Publication checklist](PUBLICATION_CHECKLIST.md)
- [Security policy](../SECURITY.md)
- [Web application guide](../apps/web/README.md)
- [First-create rollback archive](archive/aws/2026-08-14-first-create-rollback.md)

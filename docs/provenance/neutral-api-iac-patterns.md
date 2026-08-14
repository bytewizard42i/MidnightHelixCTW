# Neutral API and infrastructure pattern provenance

Status: source-path and SHA-256 disclosure complete

MidnightHelixCTW Phase 1 reimplements neutral patterns inspected on August 13, 2026 in uncommitted working-tree files from the original private HelixCTW repository. That workspace was based on preserved commit `b0ed8ccd7c1b95661a6470466eaef269cc4cc07a`.

| Inspected HelixCTW source | SHA-256 |
| --- | --- |
| `infra/aws-judge-stack/template.yaml` | `169c16c77d29961f06dd6699a949ee4437b3813a3e96608d442ab6d1d4efa26f` |
| `infra/aws-judge-stack/scripts/deploy.sh` | `8c0e5c57efdd1fafee41d3c06221c9a756e6c21e1cb0913c8f097740cb0a9641` |
| `infra/aws-judge-stack/scripts/outputs.sh` | `d9f846d199d5f9226448b072fbbf9a8176d6fc884e438fd7219b0453c916b8cf` |
| `infra/aws-judge-stack/scripts/preflight.sh` | `502f74873bb0a4e68986e8100d6f44f28b744e8a66b3e77b540dba6243c12983` |
| `infra/aws-judge-stack/scripts/smoke-readonly.sh` | `a37557f5af5f9ba66c8252567ee3cb49bce6dc179f9715a20383e3a4a0138900` |
| `infra/aws-judge-stack/scripts/validate-local.sh` | `a1d812ee71627319cf3dd332263c89fde038cee303933536aa9a50f447ddb85b` |
| `infra/aws-judge-stack/test/template-contract.test.mjs` | `ce9afbf2ffd831acf2de0cfacfeb04461a16ecbeda2da458cf1569c579e4574c` |
| `hackathon/app/src/judge-lambda-v2.ts` | `4f603608a056f5992a7de97659f47fc57886e795fb92c9da073a30cdff64c868` |
| `hackathon/app/src/judge-mode-api-v2.ts` | `9b13baf54d42b35b711c4c31089bdddc442f503ba23e6c36a2d87395243bebd1` |

Reuse was limited to generic routing, request validation, fail-closed provider reporting, AWS Serverless Application Model resource structure, deployment checks, and smoke-test organization. Voice-note, payment, and unrelated scenario logic were not imported.

The live-provider implementation below was inspected only to preserve the Phase 1 no-provider boundary. Its provider logic was not copied:

| Inspected boundary source | SHA-256 |
| --- | --- |
| `hackathon/app/src/judge-mode-live.ts` | `448f52880e9598b328a468fc4bb4b1de1b71e5bd85b07ebc0503709ecc2caf47` |

Because these files were uncommitted, no Git commit identifies their exact contents. The SHA-256 digests above bind the inspected byte snapshots. They do not establish Git history, deployment evidence, provider execution, or a claim that the original private sources are public.

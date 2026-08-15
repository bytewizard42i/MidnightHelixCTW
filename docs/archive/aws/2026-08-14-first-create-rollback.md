# AWS first-create rollback archive, 2026-08-14

This sanitized archive records the first creation attempt for the
`mhelixctw-testwired` application stack. It preserves the operational lesson
without publishing account identifiers, resource identifiers, request
identifiers, credentials, tokens, or packaging-bucket details.

## Record disposition

**Completed.** Deletion was verified on 2026-08-15. The failed
`mhelixctw-testwired` application stack is absent. The retained
`aws-sam-cli-managed-default` packaging stack remains `CREATE_COMPLETE`.
No matching application APIs, Lambda functions, or Lambda log groups remained.

## Sanitized timeline

The timestamps below are intentionally reduced to the calendar date and event
sequence. They establish ordering without reproducing account-specific event
metadata.

| Sanitized timestamp | Event |
| --- | --- |
| 2026-08-14, first-create attempt | Deployment started from source commit `3f868fbb6b0c6a8735b40ec86f4192b1fc87156c`. This was the first application-stack create, not an update to a known-good deployment. |
| 2026-08-14, API import failure | API Gateway rejected the transformed OpenAPI definition. The sanitized failure messages were: `Missing required servers[0].url in the transformed OpenAPI definition.` and `The root x-amazon-apigateway-cors value was malformed; API Gateway required an object-shaped CORS configuration.` |
| 2026-08-14, rollback complete | CloudFormation rolled the application stack back. Five application logical resources reached `DELETE_COMPLETE`; no application endpoint survived. |
| 2026-08-15, corrective source published | Corrective source was published on `main` in commit `069826cd7226c99ef3f4d8f454160db0581d5aed`. This commit adds a relative root server URL, object-shaped root CORS configuration, and a transformed-template contract. It is source evidence only and has not been redeployed successfully. |

## Rolled-back logical resources

The following application logical resources reached `DELETE_COMPLETE`:

| Logical resource | Final rollback state |
| --- | --- |
| `TestWiredHttpApi` | `DELETE_COMPLETE` |
| `ApiFunction` | `DELETE_COMPLETE` |
| `ApiFunctionRole` | `DELETE_COMPLETE` |
| `ApiAccessLogGroup` | `DELETE_COMPLETE` |
| `ApiFunctionLogGroup` | `DELETE_COMPLETE` |

The AWS Serverless Application Model managed packaging stack remained after the
application rollback. That tool-managed packaging infrastructure is not an
application API, Lambda function, application role, application log group, or
deployment-success signal.

## Evidence boundary

- The failed create produced no verified public API URL.
- The rollback does not prove that the corrective source deploys successfully.
- The managed packaging stack is retained tooling, not application evidence.
- AWS Lambda and API Gateway remain `SOURCE_ONLY` until a deliberate
  redeployment produces a generated endpoint and passes the runtime promotion
  checks.
- This record intentionally contains no account IDs, Amazon Resource Names,
  physical resource IDs, request IDs, credentials, tokens, or bucket names.

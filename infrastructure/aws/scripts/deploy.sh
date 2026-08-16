#!/usr/bin/env bash
set -euo pipefail

export SAM_CLI_TELEMETRY=0

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIRECTORY="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
REPOSITORY_ROOT="$(cd "${STACK_DIRECTORY}/../.." && pwd)"
BUILD_DIRECTORY="${REPOSITORY_ROOT}/build/aws-testwired"

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${MHELIX_STACK_NAME:-mhelixctw-testwired}"
PUBLIC_ALLOWED_ORIGINS="${MHELIX_PUBLIC_ALLOWED_ORIGINS:-}"
COCKROACH_RUNTIME_SECRET_ARN="${MHELIX_COCKROACH_RUNTIME_SECRET_ARN:-}"
DEPLOY_ACKNOWLEDGEMENT="${MHELIX_CONFIRM_AWS_DEPLOY:-}"

if [[ "${DEPLOY_ACKNOWLEDGEMENT}" != "DEPLOY_MHELIX_TESTWIRED_API" ]]; then
  echo "Deployment blocked." >&2
  echo "Set MHELIX_CONFIRM_AWS_DEPLOY=DEPLOY_MHELIX_TESTWIRED_API for one intentional deployment." >&2
  exit 1
fi

if [[ -z "${PUBLIC_ALLOWED_ORIGINS}" ]]; then
  echo "Deployment blocked: set MHELIX_PUBLIC_ALLOWED_ORIGINS to one to four exact comma-delimited HTTPS origins." >&2
  exit 1
fi

if [[ -z "${COCKROACH_RUNTIME_SECRET_ARN}" ]]; then
  echo "Deployment blocked: set MHELIX_COCKROACH_RUNTIME_SECRET_ARN to the full ARN of the existing runtime secret." >&2
  exit 1
fi

COCKROACH_RUNTIME_SECRET_ARN_PATTERN='^arn:aws:secretsmanager:us-east-1:[0-9]{12}:secret:[A-Za-z0-9/_+=.@-]{1,512}-[A-Za-z0-9]{6}$'
if [[ ! "${COCKROACH_RUNTIME_SECRET_ARN}" =~ ${COCKROACH_RUNTIME_SECRET_ARN_PATTERN} ]]; then
  echo "Deployment blocked: the Cockroach runtime secret identifier is not a full us-east-1 secret ARN." >&2
  exit 1
fi

if [[ -n "$(git -C "${REPOSITORY_ROOT}" status --porcelain)" ]]; then
  echo "Deployment blocked because the MidnightHelixCTW working tree is not clean." >&2
  echo "Commit and review the exact release before deploying it." >&2
  exit 1
fi

RELEASE_COMMIT="$(git -C "${REPOSITORY_ROOT}" rev-parse HEAD)"

"${SCRIPT_DIRECTORY}/preflight.sh"
"${SCRIPT_DIRECTORY}/validate-local.sh"

sam deploy \
  --template-file "${BUILD_DIRECTORY}/template.yaml" \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --confirm-changeset \
  --no-fail-on-empty-changeset \
  --tags Project=MidnightHelixCTW Stage=TestWired ReleaseCommit="${RELEASE_COMMIT}" \
  --parameter-overrides \
    CockroachRuntimeSecretArn="${COCKROACH_RUNTIME_SECRET_ARN}" \
    PublicAllowedOrigins="${PUBLIC_ALLOWED_ORIGINS}" \
    ReleaseCommit="${RELEASE_COMMIT}"

"${SCRIPT_DIRECTORY}/outputs.sh"

#!/usr/bin/env bash
set -euo pipefail

export SAM_CLI_TELEMETRY=0

AWS_REGION="${AWS_REGION:-us-east-1}"

require_command() {
  local command_name="$1"
  local installation_help="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    echo "${installation_help}" >&2
    return 1
  fi
}

require_command aws "Install AWS CLI v2 and configure the intended account."
require_command node "Install Node.js 20 or newer."
require_command sam "Install AWS SAM CLI from the official AWS documentation."

if [[ "${AWS_REGION}" != "us-east-1" ]]; then
  echo "TestWired is pinned to us-east-1; received AWS_REGION=${AWS_REGION}." >&2
  exit 1
fi

AWS_CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)"
LAMBDA_CONCURRENCY_LIMIT="$(
  aws lambda get-account-settings \
    --region "${AWS_REGION}" \
    --query 'AccountLimit.ConcurrentExecutions' \
    --output text
)"

echo "MidnightHelixCTW AWS preflight"
echo "  caller: ${AWS_CALLER_ARN}"
echo "  region: ${AWS_REGION}"
echo "  Lambda concurrent limit: ${LAMBDA_CONCURRENCY_LIMIT}"
echo "  reserved concurrency: intentionally not configured"
echo "  Node: $(node --version)"
echo "  SAM: $(sam --version)"

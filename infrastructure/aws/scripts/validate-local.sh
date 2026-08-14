#!/usr/bin/env bash
set -euo pipefail

export SAM_CLI_TELEMETRY=0

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIRECTORY="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
REPOSITORY_ROOT="$(cd "${STACK_DIRECTORY}/../.." && pwd)"
BUILD_DIRECTORY="${REPOSITORY_ROOT}/build/aws-testwired"

require_command() {
  local command_name="$1"
  local installation_help="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    echo "${installation_help}" >&2
    return 1
  fi
}

require_command node "Install Node.js 20 or newer."
require_command sam "Install AWS SAM CLI from the official AWS documentation."

node --test "${REPOSITORY_ROOT}/apps/api/test/handler.test.mjs"
node --test "${STACK_DIRECTORY}/test/template-contract.test.mjs"
sam validate --lint --template-file "${STACK_DIRECTORY}/template.yaml"
sam build \
  --template-file "${STACK_DIRECTORY}/template.yaml" \
  --build-dir "${BUILD_DIRECTORY}"

forbidden_file="$(
  find "${BUILD_DIRECTORY}" -type f \
    \( -name '.env' -o -name '.env.*' -o -name '*.map' -o -name '*.log' \) \
    -print -quit
)"
if [[ -n "${forbidden_file}" ]]; then
  echo "Generated package contains a forbidden file: ${forbidden_file}" >&2
  exit 1
fi

echo "MidnightHelixCTW API and SAM validation passed."
echo "Built template: ${BUILD_DIRECTORY}/template.yaml"

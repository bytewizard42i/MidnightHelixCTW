#!/usr/bin/env bash
set -euo pipefail

export SAM_CLI_TELEMETRY=0

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIRECTORY="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
REPOSITORY_ROOT="$(cd "${STACK_DIRECTORY}/../.." && pwd)"

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

node --test "${REPOSITORY_ROOT}/apps/api/test/handler.test.mjs"
node --test "${STACK_DIRECTORY}/test/template-contract.test.mjs"
"${SCRIPT_DIRECTORY}/build.sh"

echo "MidnightHelixCTW API and SAM validation passed."

#!/usr/bin/env bash
set -euo pipefail

export SAM_CLI_TELEMETRY=0

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIRECTORY="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
REPOSITORY_ROOT="$(cd "${STACK_DIRECTORY}/../.." && pwd)"
BUILD_DIRECTORY="${REPOSITORY_ROOT}/build/aws-testwired"

if ! command -v sam >/dev/null 2>&1; then
  echo "Missing required command: sam" >&2
  echo "Install AWS SAM CLI from the official AWS documentation." >&2
  exit 1
fi

sam validate --lint --template-file "${STACK_DIRECTORY}/template.yaml"
sam build \
  --template-file "${STACK_DIRECTORY}/template.yaml" \
  --build-dir "${BUILD_DIRECTORY}"

MHELIX_BUILT_TEMPLATE_FILE="${BUILD_DIRECTORY}/template.yaml" \
  node --test "${STACK_DIRECTORY}/test/template-contract.test.mjs"

forbidden_file="$(
  find "${BUILD_DIRECTORY}" -type f \
    \( -name '.env' -o -name '.env.*' -o -name '*.map' -o -name '*.log' \) \
    -print -quit
)"
if [[ -n "${forbidden_file}" ]]; then
  echo "Generated package contains a forbidden file: ${forbidden_file}" >&2
  exit 1
fi

credential_bearing_file="$(
  grep -RIlE --binary-files=without-match \
    '(AWS_SECRET_ACCESS_KEY[[:space:]]*[:=]|postgres(ql)?://[^[:space:]:/@]+:[^[:space:]@/]+@)' \
    "${BUILD_DIRECTORY}" 2>/dev/null | head -n 1 || true
)"
if [[ -n "${credential_bearing_file}" ]]; then
  echo "Generated package contains a credential-bearing pattern: ${credential_bearing_file}" >&2
  exit 1
fi

echo "SAM build passed: ${BUILD_DIRECTORY}/template.yaml"

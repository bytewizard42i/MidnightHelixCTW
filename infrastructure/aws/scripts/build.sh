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

APPLICATION_ARTIFACT_DIRECTORY="${BUILD_DIRECTORY}/ApiFunction"
for required_application_path in \
  package.json \
  package-lock.json \
  src/lambda.js \
  node_modules/pg \
  node_modules/@aws-sdk/client-secrets-manager
do
  if [[ ! -e "${APPLICATION_ARTIFACT_DIRECTORY}/${required_application_path}" ]]; then
    echo "Generated Lambda package is missing required runtime content: ${required_application_path}" >&2
    exit 1
  fi
done

for forbidden_application_path in test tests docs; do
  if [[ -e "${APPLICATION_ARTIFACT_DIRECTORY}/${forbidden_application_path}" ]]; then
    echo "Generated Lambda package contains forbidden application content: ${forbidden_application_path}" >&2
    exit 1
  fi
done

unexpected_application_markdown="$(
  find "${APPLICATION_ARTIFACT_DIRECTORY}" -maxdepth 1 -type f \
    \( -iname '*.md' -o -iname '*.markdown' \) \
    ! -name 'README.md' \
    -print -quit
)"
if [[ -n "${unexpected_application_markdown}" ]]; then
  echo "Generated Lambda package contains unexpected top-level Markdown: ${unexpected_application_markdown}" >&2
  exit 1
fi

forbidden_file="$(
  find "${BUILD_DIRECTORY}" \
    -type d -name node_modules -prune -o \
    -type f \( -name '.env' -o -name '.env.*' -o -name '*.map' -o -name '*.log' \) \
    -print -quit
)"
if [[ -n "${forbidden_file}" ]]; then
  echo "Generated package contains a forbidden file: ${forbidden_file}" >&2
  exit 1
fi

node "${SCRIPT_DIRECTORY}/assert-artifact-secrets.mjs" "${BUILD_DIRECTORY}"

echo "SAM build passed: ${BUILD_DIRECTORY}/template.yaml"

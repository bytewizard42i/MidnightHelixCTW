#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${MHELIX_STACK_NAME:-mhelixctw-testwired}"
PUBLIC_ALLOWED_ORIGINS="${MHELIX_PUBLIC_ALLOWED_ORIGINS:-}"
EXPECTED_RELEASE_COMMIT="${MHELIX_EXPECTED_RELEASE_COMMIT:-}"

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Missing required command: node" >&2
  exit 1
fi

if [[ ! "${EXPECTED_RELEASE_COMMIT}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Missing or invalid MHELIX_EXPECTED_RELEASE_COMMIT: supply the exact deployed 40-character lowercase commit." >&2
  exit 1
fi

API_URL="${MHELIX_TESTWIRED_API_URL:-$(
  aws cloudformation describe-stacks \
    --region "${AWS_REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='TestWiredApiUrl'].OutputValue | [0]" \
    --output text
)}"

if [[ -z "${API_URL}" || "${API_URL}" == "None" ]]; then
  echo "No TestWiredApiUrl output was found for stack ${STACK_NAME}." >&2
  exit 1
fi

if [[ -z "${PUBLIC_ALLOWED_ORIGINS}" ]]; then
  echo "Set MHELIX_PUBLIC_ALLOWED_ORIGINS to the exact deployed browser origin list." >&2
  exit 1
fi

SMOKE_DIRECTORY="$(mktemp -d)"
trap 'rm -rf -- "${SMOKE_DIRECTORY}"' EXIT

echo "Fail-closed smoke checks against ${API_URL}"

curl --fail --silent --show-error \
  --max-time 10 \
  --output "${SMOKE_DIRECTORY}/health.json" \
  "${API_URL}/healthz"
curl --fail --silent --show-error \
  --max-time 10 \
  --output "${SMOKE_DIRECTORY}/status.json" \
  "${API_URL}/api/v1/status"
curl --fail --silent --show-error \
  --max-time 10 \
  --output "${SMOKE_DIRECTORY}/scenarios.json" \
  "${API_URL}/api/v1/judge/scenarios"

MUTATION_STATUS="$(
  curl --silent --show-error \
    --max-time 10 \
    --request POST \
    --header "Content-Type: application/json" \
    --header "Idempotency-Key: smoke-readonly-denial-v1" \
    --data '{"scenarioId":"morrow-farmhouse-testwired-v1","agentDidz":"didz:testtown:agent:morrow-property-assistant"}' \
    --output "${SMOKE_DIRECTORY}/mutation.json" \
    --write-out "%{http_code}" \
    "${API_URL}/api/v1/judge/runs"
)"

if [[ "${MUTATION_STATUS}" != "503" ]]; then
  echo "The synthetic mutation denial returned HTTP status ${MUTATION_STATUS}, expected 503." >&2
  exit 1
fi

node "${SCRIPT_DIRECTORY}/assert-smoke-contract.mjs" \
  "${SMOKE_DIRECTORY}/health.json" \
  "${SMOKE_DIRECTORY}/status.json" \
  "${SMOKE_DIRECTORY}/scenarios.json" \
  "${SMOKE_DIRECTORY}/mutation.json" \
  "${EXPECTED_RELEASE_COMMIT}"

IFS=',' read -r -a allowed_origins <<<"${PUBLIC_ALLOWED_ORIGINS}"
for allowed_origin in "${allowed_origins[@]}"; do
  cors_headers="$(
    curl --fail --silent --show-error \
      --max-time 10 \
      --request OPTIONS \
      --header "Origin: ${allowed_origin}" \
      --header "Access-Control-Request-Method: POST" \
      --dump-header - \
      --output /dev/null \
      "${API_URL}/api/v1/judge/runs"
  )"
  cors_allowed_origin_values=()
  while IFS= read -r cors_header_line; do
    cors_header_line="${cors_header_line%$'\r'}"
    cors_header_name="${cors_header_line%%:*}"
    if [[ "${cors_header_name,,}" != "access-control-allow-origin" ]]; then
      continue
    fi

    cors_header_value="${cors_header_line#*:}"
    cors_header_value="${cors_header_value#"${cors_header_value%%[![:space:]]*}"}"
    cors_allowed_origin_values+=("${cors_header_value}")
  done <<<"${cors_headers}"

  if [[ "${#cors_allowed_origin_values[@]}" -ne 1 ]] ||
    [[ "${cors_allowed_origin_values[0]}" != "${allowed_origin}" ]]; then
    echo "CORS check failed exact approved-origin equality for ${allowed_origin}" >&2
    exit 1
  fi
done

echo "Read-only provider, overall fail-closed, denied mutation, scenario-list, and CORS checks passed."

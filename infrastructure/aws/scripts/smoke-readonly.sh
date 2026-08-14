#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${MHELIX_STACK_NAME:-mhelixctw-testwired}"
PUBLIC_ALLOWED_ORIGINS="${MHELIX_PUBLIC_ALLOWED_ORIGINS:-}"

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

echo "Read-only smoke checks against ${API_URL}"
HEALTH_BODY="$(curl --fail --silent --show-error "${API_URL}/healthz")"
STATUS_BODY="$(curl --fail --silent --show-error "${API_URL}/api/v1/status")"
SCENARIO_BODY="$(curl --fail --silent --show-error "${API_URL}/api/v1/judge/scenarios")"

if [[ "${HEALTH_BODY}" != *'"dependenciesConnected":false'* ]]; then
  echo "Health response did not preserve the Phase 1 disconnected boundary." >&2
  exit 1
fi
if [[ "${STATUS_BODY}" != *'"currentAvailability":"NOT_CONNECTED"'* ]]; then
  echo "Status response did not report NOT_CONNECTED." >&2
  exit 1
fi
if [[ "${SCENARIO_BODY}" != *'"scenarioId":"morrow-farmhouse-testwired-v1"'* ]]; then
  echo "Scenario catalog did not contain the canonical synthetic case." >&2
  exit 1
fi

IFS=',' read -r -a allowed_origins <<<"${PUBLIC_ALLOWED_ORIGINS}"
for allowed_origin in "${allowed_origins[@]}"; do
  cors_headers="$(
    curl --fail --silent --show-error \
      --request OPTIONS \
      --header "Origin: ${allowed_origin}" \
      --header "Access-Control-Request-Method: POST" \
      --dump-header - \
      --output /dev/null \
      "${API_URL}/api/v1/judge/runs"
  )"
  if ! grep -qi "^access-control-allow-origin: ${allowed_origin}" <<<"${cors_headers}"; then
    echo "Expected exact CORS response was not returned for ${allowed_origin}." >&2
    exit 1
  fi
done

echo "Read-only health, status, scenario-list, and CORS checks passed."

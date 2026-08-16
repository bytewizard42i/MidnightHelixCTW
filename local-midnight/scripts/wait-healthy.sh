#!/usr/bin/env bash
# Bounded readiness wait for the local Midnight stack.
#
# Polls all three services from the HOST (real endpoint answers, not just
# container health labels) until every one is ready or the timeout expires.
# Exits nonzero on timeout and prints concise per-service status plus the
# Compose view so the failure is diagnosable at a glance.

set -u
TIMEOUT_SECONDS="${MHELIX_READY_TIMEOUT:-180}"
INTERVAL_SECONDS=5
START_EPOCH=$(date +%s)

node_ok=""; proof_ok=""; indexer_ok=""

while true; do
  [ -z "$node_ok" ]    && curl -sf http://127.0.0.1:9944/health >/dev/null 2>&1 && node_ok=yes
  [ -z "$proof_ok" ]   && curl -sf http://127.0.0.1:6300/health >/dev/null 2>&1 && proof_ok=yes
  if [ -z "$indexer_ok" ]; then
    curl -sf -X POST http://127.0.0.1:8088/api/v4/graphql \
      -H 'Content-Type: application/json' \
      -d '{"query":"{ block { height } }"}' 2>/dev/null | grep -q '"height"' && indexer_ok=yes
  fi

  if [ -n "$node_ok" ] && [ -n "$proof_ok" ] && [ -n "$indexer_ok" ]; then
    echo "ready: node, indexer, and proof server all healthy after $(( $(date +%s) - START_EPOCH ))s"
    exit 0
  fi

  if [ $(( $(date +%s) - START_EPOCH )) -ge "$TIMEOUT_SECONDS" ]; then
    echo "NOT READY after ${TIMEOUT_SECONDS}s:" >&2
    echo "  node (127.0.0.1:9944/health):       ${node_ok:-NO ANSWER}" >&2
    echo "  proof server (127.0.0.1:6300/health): ${proof_ok:-NO ANSWER}" >&2
    echo "  indexer (127.0.0.1:8088 GraphQL):   ${indexer_ok:-NO ANSWER}" >&2
    echo "--- docker compose ps ---" >&2
    docker compose -f "$(dirname "$0")/../standalone.yml" ps >&2 || true
    exit 1
  fi
  sleep "$INTERVAL_SECONDS"
done

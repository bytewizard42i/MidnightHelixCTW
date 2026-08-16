#!/usr/bin/env bash
# Regression test for scripts/archive-state.sh (fail-closed behavior).
#
# Proves that an archive failure can never masquerade as success:
#   Case A: archive-directory creation failure (state-archive is a file)
#           -> nonzero exit, no false `archived:` line, live state intact.
#   Case B: move failure (destination already occupied and non-empty,
#           forced deterministically with a stubbed `date`)
#           -> nonzero exit, no false `archived:` line, live state intact.
#   Case C: success sanity -> exit 0, verified `archived:` line, live
#           location absent, archived copy present.
#
# Because the archiver exits nonzero on failure, a chained
# `net:down && state:archive && net:up` reset stops before starting a new
# network — Case A and B assert exactly that contract (nonzero exit).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
failures=0

check() { # check <description> <condition-result (0/1)>
  if [ "$2" -ne 0 ]; then
    echo "FAIL: $1" >&2
    failures=$((failures + 1))
  else
    echo "ok: $1"
  fi
}

make_sandbox() {
  SANDBOX=$(mktemp -d)
  mkdir -p "$SANDBOX/scripts"
  cp "$SCRIPT_DIR/archive-state.sh" "$SANDBOX/scripts/"
  mkdir -p "$SANDBOX/midnight-level-db"
  echo sentinel > "$SANDBOX/midnight-level-db/sentinel.txt"
}

run_archiver() { # runs in sandbox, captures exit code + output
  set +e
  OUTPUT=$(cd "$SANDBOX" && bash scripts/archive-state.sh 2>&1)
  EXIT_CODE=$?
  set -e
}

# ---- Case A: state-archive exists as a regular FILE -> mkdir -p fails ----
make_sandbox
touch "$SANDBOX/state-archive"
run_archiver
check "case A: exits nonzero on archive-directory failure" $([ "$EXIT_CODE" -ne 0 ]; echo $?)
check "case A: prints no false 'archived:' success line" $(! grep -q '^archived:' <<<"$OUTPUT"; echo $?)
check "case A: live state left intact for recovery" $([ -f "$SANDBOX/midnight-level-db/sentinel.txt" ]; echo $?)
rm -rf "$SANDBOX"

# ---- Case B: move fails (destination occupied, non-empty) ----------------
make_sandbox
# Deterministic timestamp via a stubbed `date` on PATH.
mkdir -p "$SANDBOX/bin"
printf '#!/usr/bin/env bash\necho FIXEDSTAMP\n' > "$SANDBOX/bin/date"
chmod +x "$SANDBOX/bin/date"
mkdir -p "$SANDBOX/state-archive/FIXEDSTAMP/midnight-level-db"
echo occupied > "$SANDBOX/state-archive/FIXEDSTAMP/midnight-level-db/keep.txt"
set +e
OUTPUT=$(cd "$SANDBOX" && PATH="$SANDBOX/bin:$PATH" bash scripts/archive-state.sh 2>&1)
EXIT_CODE=$?
set -e
check "case B: exits nonzero on move failure" $([ "$EXIT_CODE" -ne 0 ]; echo $?)
check "case B: prints no false 'archived:' success line" $(! grep -q '^archived:' <<<"$OUTPUT"; echo $?)
check "case B: live state left intact for recovery" $([ -f "$SANDBOX/midnight-level-db/sentinel.txt" ]; echo $?)
rm -rf "$SANDBOX"

# ---- Case C: success sanity ----------------------------------------------
make_sandbox
run_archiver
check "case C: exits zero on success" $([ "$EXIT_CODE" -eq 0 ]; echo $?)
check "case C: prints verified 'archived:' line" $(grep -q '^archived: midnight-level-db' <<<"$OUTPUT"; echo $?)
check "case C: live location absent after archive" $([ ! -e "$SANDBOX/midnight-level-db" ]; echo $?)
check "case C: archived sentinel present" $(compgen -G "$SANDBOX/state-archive/*/midnight-level-db/sentinel.txt" >/dev/null; echo $?)
rm -rf "$SANDBOX"

if [ "$failures" -ne 0 ]; then
  echo "REGRESSION TEST FAILED: $failures check(s) failed" >&2
  exit 1
fi
echo "regression test passed: archiver fails closed and succeeds honestly"

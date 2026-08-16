#!/usr/bin/env bash
# Recoverable local-state archiver — FAIL CLOSED.
#
# Moves the client-side runtime directories (.state/, midnight-level-db/,
# logs/) into a timestamped folder under state-archive/, which is
# git-ignored. Nothing is ever silently deleted, and an archive failure can
# never be reported as success: every step is verified, `archived` is
# printed only after the verified move, and any failure exits nonzero
# immediately so a chained `net:reset` cannot start a new network on top of
# stale live private state.
#
# Recovery is a plain move back, for example:
#   mv state-archive/<timestamp>/midnight-level-db .

set -euo pipefail

cd "$(dirname "$0")/.."

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DEST="state-archive/${STAMP}"
moved=0

fail() {
  echo "ARCHIVE FAIL (fail-closed): $*" >&2
  exit 1
}

for dir in .state midnight-level-db logs; do
  if [ -e "$dir" ]; then
    # Create the archive directory and verify it really is a directory
    # before touching any live state.
    mkdir -p "$DEST" || fail "could not create archive directory ${DEST}"
    [ -d "$DEST" ] || fail "${DEST} exists but is not a directory"

    mv "$dir" "$DEST/" || fail "move of ${dir} into ${DEST}/ failed"

    # Verify the move completed: live source absent, destination present.
    [ ! -e "$dir" ] || fail "live ${dir} still present after move"
    [ -e "$DEST/$dir" ] || fail "expected ${DEST}/${dir} missing after move"

    echo "archived: $dir -> $DEST/$dir"
    moved=1
  fi
done

if [ "$moved" -eq 0 ]; then
  echo "nothing to archive: no .state/, midnight-level-db/, or logs/ present"
fi

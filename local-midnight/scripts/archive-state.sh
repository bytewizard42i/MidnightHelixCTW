#!/usr/bin/env bash
# Recoverable local-state archiver (replaces destructive cleanup).
#
# Moves the client-side runtime directories (.state/, midnight-level-db/,
# logs/) into a timestamped folder under state-archive/, which is
# git-ignored. Nothing is ever silently deleted: a chain reset leaves the
# live locations absent while preserving prior contents for recovery.
# Recovering is a plain move back, for example:
#   mv state-archive/<timestamp>/midnight-level-db .

set -u
cd "$(dirname "$0")/.."

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DEST="state-archive/${STAMP}"
moved=0

for dir in .state midnight-level-db logs; do
  if [ -e "$dir" ]; then
    mkdir -p "$DEST"
    mv "$dir" "$DEST/"
    echo "archived: $dir -> $DEST/$dir"
    moved=1
  fi
done

if [ "$moved" -eq 0 ]; then
  echo "nothing to archive: no .state/, midnight-level-db/, or logs/ present"
fi

#!/bin/bash
# ralph/once.sh - Human-in-the-loop Ralph (single iteration)
# Usage: ./ralph/once.sh
#
# Runs one Ralph iteration interactively. Watch the output,
# check the commit, then run it again when ready.

set -euo pipefail

PROJECT_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

source "$PROJECT_ROOT/ralph/_assemble.sh"

# Verify required files exist
if [ ! -f PRD.md ]; then
  echo "ERROR: PRD.md not found. Create it first (use claude plan mode)."
  exit 1
fi

init_state

PROMPT=$(assemble_prompt)

# Write prompt to file to avoid "Argument list too long" from execve limit
PROMPTFILE=$(mktemp)
trap "rm -f $PROMPTFILE" EXIT
printf '%s' "$PROMPT" > "$PROMPTFILE"

echo "=== Ralph HITL iteration starting ==="
echo "=== $(date) ==="

claude --dangerously-skip-permissions < "$PROMPTFILE"

echo ""
echo "=== Ralph HITL iteration complete ==="
echo "=== Review the commit with: git log -1 --stat ==="

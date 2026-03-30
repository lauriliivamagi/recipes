#!/bin/bash
# ralph/team.sh - Team mode Ralph with parallel agents
# Usage: ./ralph/team.sh [--max-teammates N]
#
# Runs Ralph as a single long-lived Claude Code session with Agent Teams.
# The lead reads the PRD, identifies independent tasks, and spawns teammates
# for parallel implementation. Teammate messages drive the session forward —
# no external loop needed. Runs unattended (AFK) by default.
#
# Unlike afk.sh (which loops --print invocations with fresh context each time),
# this runs one persistent session so the lead can receive teammate messages.
#
# Options:
#   --max-teammates N   Maximum concurrent teammates (default: 3)
#
# Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in .claude/settings.json

set -euo pipefail

PROJECT_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

source "$PROJECT_ROOT/ralph/_assemble.sh"

# Parse arguments
MAX_TEAMMATES=3

while [[ $# -gt 0 ]]; do
  case $1 in
    --max-teammates)
      MAX_TEAMMATES=$2
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--max-teammates N]"
      echo ""
      echo "Options:"
      echo "  --max-teammates N   Maximum concurrent teammates (default: 3)"
      echo ""
      echo "Runs Ralph in team mode with parallel implementation."
      echo "The lead identifies independent PRD tasks and spawns teammates."
      echo ""
      echo "Requires: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in settings"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--max-teammates N]"
      exit 1
      ;;
  esac
done

# Verify required files exist
if [ ! -f PRD.md ]; then
  echo "ERROR: PRD.md not found. Create it first (use claude plan mode)."
  exit 1
fi

if [ ! -f ralph/team-lead.md ]; then
  echo "ERROR: ralph/team-lead.md not found."
  exit 1
fi

init_state
mkdir -p state/work

# Assemble lead prompt: base + quality + team-lead protocol + PRD + state
PROMPT=$(assemble_prompt)

TEAM_LEAD_CONTENT="$(cat ralph/team-lead.md)"
TEAM_LEAD_CONTENT="${TEAM_LEAD_CONTENT//MAX_TEAMMATES/$MAX_TEAMMATES}"

PROMPT="$PROMPT

$TEAM_LEAD_CONTENT"

LOGFILE="ralph-team-$(date +%Y%m%d-%H%M%S).log"

echo "=== Ralph Team Mode ==="
echo "=== Max teammates: $MAX_TEAMMATES ==="
echo "=== Log: $LOGFILE ==="
echo "=== $(date) ==="
echo ""

# Write prompt to file to avoid "Argument list too long" from execve limit
PROMPTFILE=$(mktemp)
trap "rm -f $PROMPTFILE" EXIT
printf '%s' "$PROMPT" > "$PROMPTFILE"

# Run as a single persistent session
claude \
  --dangerously-skip-permissions \
  --verbose \
  --output-format stream-json \
  < "$PROMPTFILE" \
| tee "$LOGFILE" \
| jq --unbuffered -rj 'select(.type == "assistant").message.content[]? | select(.type == "text").text // empty' || true

echo ""
echo "=== Ralph Team Mode finished ==="
echo "=== $(date) ==="
echo "=== Full log: $LOGFILE ==="

# Extract token usage from log if available
TOTAL_INPUT=$(jq -r 'select(.type == "result").usage.input_tokens // empty' "$LOGFILE" 2>/dev/null | tail -1 || echo "unknown")
TOTAL_OUTPUT=$(jq -r 'select(.type == "result").usage.output_tokens // empty' "$LOGFILE" 2>/dev/null | tail -1 || echo "unknown")
echo "=== Tokens: ${TOTAL_INPUT} in / ${TOTAL_OUTPUT} out ==="

#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Match npm/yarn/bun as standalone commands (start of line or after && ; | etc.)
if echo "$COMMAND" | grep -qE '(^|&&|;|\|)\s*(npm|yarn|bun)\s'; then
  echo "Blocked: use pnpm instead of npm/yarn/bun. This project uses pnpm (see package.json packageManager field)." >&2
  exit 2
fi

exit 0

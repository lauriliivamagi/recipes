#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
TOOL=$(echo "$INPUT" | jq -r '.tool_name')

# Only check frontend source files
if ! echo "$FILE_PATH" | grep -q 'packages/frontend/src/'; then
  exit 0
fi

if [ "$TOOL" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content')
elif [ "$TOOL" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string')
else
  exit 0
fi

if echo "$CONTENT" | grep -qE 'React\.memo\('; then
  echo "Blocked: React Compiler handles memoization automatically. Do not use React.memo() — see frontend CLAUDE.md React 19 Patterns." >&2
  exit 2
fi

if echo "$CONTENT" | grep -qE '\bforwardRef\b'; then
  echo "Blocked: pass ref as a regular prop. Do not use forwardRef — see frontend CLAUDE.md React 19 Patterns." >&2
  exit 2
fi

exit 0

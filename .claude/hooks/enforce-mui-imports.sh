#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
TOOL=$(echo "$INPUT" | jq -r '.tool_name')

# Only check frontend files
if ! echo "$FILE_PATH" | grep -q 'packages/frontend/'; then
  exit 0
fi

# Get the content being written/edited
if [ "$TOOL" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content')
elif [ "$TOOL" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string')
else
  exit 0
fi

# Block barrel imports: from "@mui/material" or from '@mui/material' (NOT followed by /)
# Also block from "@mui/icons-material" (NOT followed by /)
if echo "$CONTENT" | grep -qE "from ['\"]@mui/(material|icons-material)['\"]"; then
  echo "Blocked: use direct MUI imports, not barrel imports. Example: import Button from '@mui/material/Button' — see frontend CLAUDE.md Import Rules." >&2
  exit 2
fi

exit 0

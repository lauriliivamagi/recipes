#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
TOOL=$(echo "$INPUT" | jq -r '.tool_name')

# Only check E2E spec files (not shared fixtures like error-capture.ts, coverage-fixture.ts)
if ! echo "$FILE_PATH" | grep -qE 'packages/frontend/tests/.*\.spec\.ts$'; then
  exit 0
fi

if [ "$TOOL" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content')
elif [ "$TOOL" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string')
else
  exit 0
fi

if echo "$CONTENT" | grep -qE "from ['\"]@playwright/test['\"]"; then
  echo "Blocked: import { test, expect } from '../shared/error-capture' — never import directly from @playwright/test in spec files. See frontend CLAUDE.md E2E Test Infrastructure." >&2
  exit 2
fi

exit 0

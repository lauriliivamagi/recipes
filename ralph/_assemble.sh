#!/bin/bash
# ralph/_assemble.sh - Shared prompt assembly and state initialization for Ralph scripts
# Source this file, then call assemble_prompt() to get the full prompt string.
# Expects PROJECT_ROOT to be set and cd'd to.

init_state() {
  mkdir -p state
  [ -f state/progress.md ] || cat > state/progress.md << 'INITEOF'
# Progress

## L0
[No tasks completed] | [0/0 scenarios] | Next: First incomplete PRD task

## L1: Current Status
- **Last completed:** none
- **Next task:** First incomplete PRD task
- **Iteration count:** 0
- **Satisfaction:** 0/0 scenarios, 0/0 tests
- **Key decisions:** none yet
- **Blocking issues:** none

## L2: Iteration Log
INITEOF

  [ -f state/decisions.md ] || cat > state/decisions.md << 'INITEOF'
# Architectural Decisions

<!-- Record decisions that future iterations need to know about.
Format:
## [Decision Title]
- **Date**: YYYY-MM-DD
- **Context**: What prompted this decision
- **Decision**: What was decided
- **Rationale**: Why this choice
-->
INITEOF
}

assemble_prompt() {
  local prompt

  # Core iteration protocol
  prompt="$(cat ralph/base.md)"

  # Quality validation module
  prompt="$prompt

$(cat ralph/quality.md)"

  # Inject PRD
  prompt="$prompt

---
# PRD
$(cat PRD.md)"

  # Inject state files
  prompt="$prompt

---
# Current Progress
$(cat state/progress.md)"

  prompt="$prompt

---
# Architectural Decisions
$(cat state/decisions.md)"

  echo "$prompt"
}

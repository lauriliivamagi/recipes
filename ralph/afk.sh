#!/bin/bash
# ralph/afk.sh - AFK Ralph with streaming, resume, cost tracking, stall detection
# Usage: ./ralph/afk.sh [--resume] [--max-stall N] <iterations>
#
# Runs Ralph in a loop for the specified number of iterations.
# Streams real-time output to terminal while capturing results.
# Stops early if Claude outputs <promise>COMPLETE</promise>.
#
# Options:
#   --resume        Resume from last completed iteration (reads state/progress.md)
#   --max-stall N   Stop after N consecutive stalls (default: 3)

set -euo pipefail

PROJECT_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

source "$PROJECT_ROOT/ralph/_assemble.sh"

# Parse arguments
RESUME=false
MAX_ITERATIONS=""
MAX_STALL=3

while [[ $# -gt 0 ]]; do
  case $1 in
    --resume)
      RESUME=true
      shift
      ;;
    --max-stall)
      MAX_STALL=$2
      shift 2
      ;;
    *)
      MAX_ITERATIONS=$1
      shift
      ;;
  esac
done

if [ -z "$MAX_ITERATIONS" ]; then
  echo "Usage: $0 [--resume] [--max-stall N] <iterations>"
  echo "  Example: $0 10                  # run 10 iterations"
  echo "  Example: $0 30                  # run 30 iterations (medium feature)"
  echo "  Example: $0 --resume 30         # resume from last completed iteration"
  echo "  Example: $0 --max-stall 5 30    # allow 5 stalls before stopping"
  exit 1
fi

# Verify required files exist
if [ ! -f PRD.md ]; then
  echo "ERROR: PRD.md not found. Create it first (use claude plan mode)."
  exit 1
fi

init_state

# jq filter: extract streaming text from assistant messages
STREAM_TEXT='select(.type == "assistant").message.content[]? | select(.type == "text").text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"'

# jq filter: extract final result text
FINAL_RESULT='select(.type == "result").result // empty'

# Stall detection state
PREV_TASK=""
STALL_COUNT=0
RECENT_TASKS=()  # sliding window for oscillation detection
PREV_SATISFACTION=""
SATISFACTION_FLAT_COUNT=0  # track how long satisfaction hasn't improved

# Cost tracking
TOTAL_INPUT_TOKENS=0
TOTAL_OUTPUT_TOKENS=0

# Resume support
START_ITERATION=1
if [ "$RESUME" = true ] && [ -f state/progress.md ]; then
  COMPLETED=$(grep -c "^### Iteration " state/progress.md 2>/dev/null || echo 0)
  if [ "$COMPLETED" -gt 0 ]; then
    START_ITERATION=$((COMPLETED + 1))
    echo "=== Resuming from iteration $START_ITERATION (found $COMPLETED completed) ==="
  fi
fi

if [ "$START_ITERATION" -gt "$MAX_ITERATIONS" ]; then
  echo "=== Already completed $((START_ITERATION - 1)) iterations (max: $MAX_ITERATIONS). Nothing to do. ==="
  exit 0
fi

mkdir -p output
COST_LOG="output/cost-log.md"
if [ ! -f "$COST_LOG" ]; then
  echo "# Cost Log" > "$COST_LOG"
  echo "" >> "$COST_LOG"
  echo "| Date | Iteration | Task | Input Tokens | Output Tokens |" >> "$COST_LOG"
  echo "|------|-----------|------|--------------|---------------|" >> "$COST_LOG"
fi

echo "=== AFK Ralph starting: iterations $START_ITERATION-$MAX_ITERATIONS ==="
echo "=== $(date) ==="
echo ""

for ((i=START_ITERATION; i<=MAX_ITERATIONS; i++)); do
  echo "=== Iteration $i / $MAX_ITERATIONS ==="
  echo "=== $(date) ==="

  # Re-assemble prompt each iteration to pick up state changes
  PROMPT=$(assemble_prompt)

  TMPFILE=$(mktemp)
  PROMPTFILE=$(mktemp)
  trap "rm -f $TMPFILE $PROMPTFILE" EXIT

  # Write prompt to file to avoid "Argument list too long" from execve limit
  printf '%s' "$PROMPT" > "$PROMPTFILE"

  # Run claude in print mode with stream-json output
  # Pipe through grep to filter valid JSON lines only
  # tee saves to tmpfile while jq streams to terminal
  claude \
    --dangerously-skip-permissions \
    --verbose \
    --print \
    --output-format stream-json \
    < "$PROMPTFILE" \
  | grep --line-buffered '^{' \
  | tee "$TMPFILE" \
  | jq --unbuffered -rj "$STREAM_TEXT" || true

  # Extract final result from captured output
  RESULT=$(jq -r "$FINAL_RESULT" "$TMPFILE" 2>/dev/null || echo "")

  # Extract token usage from this iteration
  ITER_INPUT=$(jq -r 'select(.type == "result").usage.input_tokens // 0' "$TMPFILE" 2>/dev/null | tail -1 || echo 0)
  ITER_OUTPUT=$(jq -r 'select(.type == "result").usage.output_tokens // 0' "$TMPFILE" 2>/dev/null | tail -1 || echo 0)
  TOTAL_INPUT_TOKENS=$((TOTAL_INPUT_TOKENS + ITER_INPUT))
  TOTAL_OUTPUT_TOKENS=$((TOTAL_OUTPUT_TOKENS + ITER_OUTPUT))

  # Log per-iteration cost
  CURRENT_TASK_LOG=$(grep -oP '(?<=\*\*Task\*\*: ).*' state/progress.md 2>/dev/null | tail -1 || echo "unknown")
  echo "| $(date +%Y-%m-%d) | $i | ${CURRENT_TASK_LOG} | ${ITER_INPUT} | ${ITER_OUTPUT} |" >> "$COST_LOG"

  echo ""
  echo "=== Iteration $i complete ==="
  echo "  Tokens this iteration: ${ITER_INPUT} in / ${ITER_OUTPUT} out"
  echo "  Running total: ${TOTAL_INPUT_TOKENS} in / ${TOTAL_OUTPUT_TOKENS} out"

  if [[ "$RESULT" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "=== PRD COMPLETE after $i iterations ==="
    echo "=== Total tokens: ${TOTAL_INPUT_TOKENS} in / ${TOTAL_OUTPUT_TOKENS} out ==="
    echo "=== $(date) ==="
    echo "| $(date +%Y-%m-%d) | $i | COMPLETE | ${TOTAL_INPUT_TOKENS} | ${TOTAL_OUTPUT_TOKENS} |" >> "$COST_LOG"
    rm -f "$TMPFILE" "$PROMPTFILE"
    exit 0
  fi

  # Stall detection: read last task from progress
  CURRENT_TASK=$(grep -oP '(?<=\*\*Task\*\*: ).*' state/progress.md | tail -1 || true)
  if [ -n "$CURRENT_TASK" ]; then
    # Check consecutive repetition
    if [ "$CURRENT_TASK" = "$PREV_TASK" ]; then
      STALL_COUNT=$((STALL_COUNT + 1))
      if [ "$STALL_COUNT" -ge "$MAX_STALL" ]; then
        echo ""
        echo "=== STOPPING: Stall detected ==="
        echo "=== Task '$CURRENT_TASK' attempted $((STALL_COUNT + 1)) consecutive times (max-stall: $MAX_STALL) ==="
        echo "=== Total tokens: ${TOTAL_INPUT_TOKENS} in / ${TOTAL_OUTPUT_TOKENS} out ==="
        echo "=== Review state/progress.md and state/decisions.md ==="
        echo "| $(date +%Y-%m-%d) | $i | STALL | ${TOTAL_INPUT_TOKENS} | ${TOTAL_OUTPUT_TOKENS} |" >> "$COST_LOG"
        rm -f "$TMPFILE" "$PROMPTFILE"
        exit 1
      elif [ "$STALL_COUNT" -ge 2 ]; then
        echo ""
        echo "=== WARNING: Possible stall detected ==="
        echo "=== Task '$CURRENT_TASK' attempted $((STALL_COUNT + 1)) consecutive times ==="
        echo ""
      fi
    else
      STALL_COUNT=0
    fi
    PREV_TASK="$CURRENT_TASK"

    # Check oscillation (A-B-A-B pattern) over sliding window of last 6 tasks
    RECENT_TASKS+=("$CURRENT_TASK")
    if [ ${#RECENT_TASKS[@]} -gt 6 ]; then
      RECENT_TASKS=("${RECENT_TASKS[@]:1}")
    fi
    if [ ${#RECENT_TASKS[@]} -ge 4 ]; then
      UNIQUE_RECENT=$(printf '%s\n' "${RECENT_TASKS[@]}" | sort -u | wc -l)
      if [ "$UNIQUE_RECENT" -le 2 ] && [ ${#RECENT_TASKS[@]} -ge 4 ]; then
        echo ""
        echo "=== WARNING: Possible oscillation detected ==="
        echo "=== Last ${#RECENT_TASKS[@]} tasks cycle between only $UNIQUE_RECENT distinct tasks ==="
        echo "=== Consider stopping and reviewing state/progress.md ==="
        echo ""
      fi
    fi
  fi

  # Satisfaction convergence: detect when satisfaction stops improving
  CURRENT_SATISFACTION=$(grep -oP '(?<=\*\*Satisfaction\*\*: ).*' state/progress.md | tail -1 || true)
  if [ -n "$CURRENT_SATISFACTION" ]; then
    if [ "$CURRENT_SATISFACTION" = "$PREV_SATISFACTION" ]; then
      SATISFACTION_FLAT_COUNT=$((SATISFACTION_FLAT_COUNT + 1))
      if [ "$SATISFACTION_FLAT_COUNT" -ge 3 ]; then
        echo "  Satisfaction unchanged for $SATISFACTION_FLAT_COUNT iterations: $CURRENT_SATISFACTION"
      fi
    else
      if [ "$SATISFACTION_FLAT_COUNT" -ge 3 ]; then
        echo "  Satisfaction improved after $SATISFACTION_FLAT_COUNT flat iterations"
      fi
      SATISFACTION_FLAT_COUNT=0
    fi
    PREV_SATISFACTION="$CURRENT_SATISFACTION"
    echo "  Satisfaction: $CURRENT_SATISFACTION"
  fi

  rm -f "$TMPFILE" "$PROMPTFILE"
  echo ""
done

echo "=== Ralph hit max iterations ($MAX_ITERATIONS) ==="
echo "=== Total tokens: ${TOTAL_INPUT_TOKENS} in / ${TOTAL_OUTPUT_TOKENS} out ==="
echo "=== $(date) ==="
echo "=== Check PRD.md and state/progress.md to see what remains ==="
echo "| $(date +%Y-%m-%d) | $MAX_ITERATIONS | MAX_ITER | ${TOTAL_INPUT_TOKENS} | ${TOTAL_OUTPUT_TOKENS} |" >> "$COST_LOG"
exit 1

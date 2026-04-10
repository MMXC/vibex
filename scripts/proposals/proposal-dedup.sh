#!/usr/bin/env bash
# proposal-dedup.sh - Check for duplicate proposals

INDEX="${2:-docs/proposals/INDEX.md}"

if [[ -z "$1" ]]; then
  echo "Usage: $0 <proposal_text_or_file>" >&2
  echo "   or: echo 'proposal text' | $0 /dev/stdin" >&2
  exit 2
fi

if [[ ! -f "$INDEX" ]]; then
  echo "ERROR: INDEX.md not found at $INDEX" >&2
  exit 1
fi

# Read input
if [[ "$1" == "/dev/stdin" || "$1" == "-" ]]; then
  CONTENT=$(cat /dev/stdin)
else
  CONTENT=$(cat "$1" 2>/dev/null || echo "")
fi

if [[ -z "$CONTENT" ]]; then
  echo "ERROR: No content provided" >&2
  exit 2
fi

# Extract first 3 significant words from content (skip markdown headers/symbols)
KEYWORDS=$(echo "$CONTENT" | grep -v "^#" | grep -v "^---" | grep -v "^>" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | awk '{for(i=1;i<=NF;i++) if(length($i)>3) print $i}' | head -3 | tr '\n' ' ')

if [[ -z "$KEYWORDS" ]]; then
  echo "OK"
  exit 0
fi

# Check against INDEX.md proposals (title column = column 2)
BEST_MATCH=""
BEST_SCORE=0

while IFS= read -r line; do
  if echo "$line" | grep -q "^| A-"; then
    TITLE=$(echo "$line" | awk -F'|' '{gsub(/ /,"",$2); gsub(/`/,"",$2); print tolower($2)}')
    FULL_LINE=$(echo "$line" | awk -F'|' '{print tolower($0)}')

    # Simple keyword overlap scoring
    SCORE=0
    for KW in $KEYWORDS; do
      if echo "$TITLE" | grep -q "$KW" || echo "$FULL_LINE" | grep -q "$KW"; then
        ((SCORE++))
      fi
    done

    # Normalize: 3 keywords matching = 1.0, so each match = 1/3
    NORM_SCORE=$(echo "scale=2; $SCORE * 100 / 3" | bc 2>/dev/null || echo "0")

    if [[ "$SCORE" -gt "$BEST_SCORE" ]]; then
      BEST_MATCH=$(echo "$line" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
      BEST_SCORE=$SCORE
    fi
  fi
done < "$INDEX"

# Threshold: if all 3 keywords match (SCORE >= 2 to account for partial)
SIM_THRESHOLD=2
FINAL_SCORE=$(echo "scale=2; $BEST_SCORE * 100 / 3" | bc 2>/dev/null || echo "0")

if [[ "$BEST_SCORE" -ge "$SIM_THRESHOLD" ]]; then
  echo "DUPLICATE: ${BEST_MATCH} (相似度 ${FINAL_SCORE}%)"
  exit 0
else
  echo "OK"
  exit 0
fi

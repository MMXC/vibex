#!/usr/bin/env bash
# proposal-status-check.sh - Check P0 proposal status from INDEX.md

INDEX="${1:-docs/proposals/INDEX.md}"
TODAY=$(date +%s)

if [[ ! -f "$INDEX" ]]; then
  echo "ERROR: INDEX.md not found at $INDEX" >&2
  exit 1
fi

# Count P0 proposals
P0_TOTAL=$(grep -c "^| A-P0" "$INDEX" 2>/dev/null || echo 0)
P0_DONE=$(grep "^| A-P0" "$INDEX" | grep -c " done |" 2>/dev/null || echo 0)
P0_PENDING=$(grep "^| A-P0" "$INDEX" | grep -cE " pending | in-progress |" 2>/dev/null || echo 0)

# Calculate warnings (P0 proposals older than 7 days not done)
WARNING_COUNT=0
WARNING_LINES=""
while IFS= read -r line; do
  if echo "$line" | grep -q "^| A-P0"; then
    # Extract date (format: YYYY-MM-DD in column 6)
    CREATED=$(echo "$line" | awk -F'|' '{gsub(/ /,"",$6); print $6}')
    if [[ -n "$CREATED" && "$CREATED" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      CREATED_SEC=$(date -d "$CREATED" +%s 2>/dev/null)
      if [[ -n "$CREATED_SEC" ]]; then
        AGE_DAYS=$(( (TODAY - CREATED_SEC) / 86400 ))
        if [[ $AGE_DAYS -gt 7 ]]; then
          ID=$(echo "$line" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
          STATUS=$(echo "$line" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
          if [[ "$STATUS" != "done" ]]; then
            ((WARNING_COUNT++))
            WARNING_LINES="${WARNING_LINES}\nWARNING: ${ID} 已逾期 ${AGE_DAYS} 天"
          fi
        fi
      fi
    fi
  fi
done < "$INDEX"

echo "P0 Total: ${P0_TOTAL} | Done: ${P0_DONE} | Pending: ${P0_PENDING} | Warning: ${WARNING_COUNT}"
if [[ -n "$WARNING_LINES" ]]; then
  echo -e "$WARNING_LINES"
fi
exit 0

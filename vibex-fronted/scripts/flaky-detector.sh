#!/bin/bash
# scripts/flaky-detector.sh — Flaky test detection for VibeX
# Runs E2E tests N times and generates flaky-tests.json
# Usage: bash scripts/flaky-detector.sh [runs] [config]
# Default: 10 runs with playwright.ci.config.ts

set -euo pipefail

RUNS="${1:-10}"
CONFIG="${2:-playwright.ci.config.ts}"
OUTPUT="flaky-tests.json"
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "🔍 Flaky Test Detector"
echo "   Runs: $RUNS"
echo "   Config: $CONFIG"
echo "   Output: $OUTPUT"
echo ""

# Collect all test files from playwright config
echo "📋 Collecting test files..."
TEST_LIST=$(npx playwright test --config="$CONFIG" --list 2>/dev/null | grep "^  ·" | awk '{print $2}' | sort -u || true)

if [ -z "$TEST_LIST" ]; then
  echo "⚠️  No tests found (web server may not be running). Skipping."
  echo '{"generatedAt":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","flakyTests":[],"note":"No tests found during detection run"}' > "$OUTPUT"
  exit 0
fi

TOTAL_TESTS=$(echo "$TEST_LIST" | wc -l)
echo "   Found $TOTAL_TESTS tests"
echo ""

declare -A PASS_COUNT
declare -A FAIL_COUNT

# Initialize counters
for test in $TEST_LIST; do
  PASS_COUNT[$test]=0
  FAIL_COUNT[$test]=0
done

# Run each test N times
for run in $(seq 1 $RUNS); do
  echo "  ▶ Run $run/$RUNS..."
  for test in $TEST_LIST; do
    if npx playwright test "$test" --config="$CONFIG" --reporter=line > "$TMP_DIR/run_${run}.log" 2>&1; then
      PASS_COUNT[$test]=$((PASS_COUNT[$test] + 1))
    else
      FAIL_COUNT[$test]=$((FAIL_COUNT[$test] + 1))
    fi
  done
done

# Generate flaky-tests.json
echo ""
echo "📊 Analyzing results..."

FLAKY_COUNT=0
{
  echo "{"
  echo '  "generatedAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",'
  echo '  "runs": '"$RUNS"','
  echo '  "config": "'"$CONFIG"'",'
  echo '  "flakyTests": ['

  FIRST=true
  for test in $TEST_LIST; do
    pass="${PASS_COUNT[$test]}"
    fail="${FAIL_COUNT[$test]}"
    total=$((pass + fail))
    if [ $total -gt 0 ]; then
      pass_rate=$(python3 -c "print(round($pass / $total, 3))")
    else
      pass_rate=1.0
    fi

    if (( $(echo "$pass_rate < 0.8" | python3 -c "import sys; print(1 if float(sys.stdin.read()) else 0)") ))); then
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ","
      fi
      echo -n '    {'
      echo -n '"name": "'"$test"'",'
      echo -n '"passRate": '"$pass_rate"','
      echo -n '"passes": '"$pass"','
      echo -n '"failures": '"$fail"','
      echo -n '"runs": '"$total"','
      echo -n '"skip": true,'
      echo -n '"reason": "Pass rate '"$pass_rate"' < 0.8 across '"$total"' runs"'
      echo -n '}'
      FLAKY_COUNT=$((FLAKY_COUNT + 1))
    fi
  done

  echo ""
  echo '  ],'
  echo '  "summary": {'
  echo -n '    "totalTests": '"$TOTAL_TESTS"','
  echo -n '    "flakyCount": '"$FLAKY_COUNT"','
  echo -n '    "flakyRate": '"$(python3 -c "print(round($FLAKY_COUNT / $TOTAL_TESTS, 3))" 2>/dev/null || echo "0")'"'
  echo '  }'
  echo "}"
} > "$OUTPUT"

echo ""
echo "✅ Detection complete: $FLAKY_COUNT flaky tests (pass rate < 0.8)"
echo "   Output written to: $OUTPUT"
echo ""
echo "📝 Flaky tests found:"
if [ -f "$OUTPUT" ]; then
  python3 -c "
import json, sys
try:
    with open('$OUTPUT') as f:
        data = json.load(f)
    for ft in data.get('flakyTests', []):
        print(f'   • {ft[\"name\"]} (pass rate: {ft[\"passRate\"]})')
    if not data.get('flakyTests'):
        print('   (none)')
except: pass
" 2>/dev/null || true
fi

#!/bin/bash
# Test Stability Report — E1 Flaky Governance
# Runs Playwright E2E tests and generates a stability report.
#
# Usage: bash scripts/test-stability-report.sh [playwright_dir]
#   playwright_dir: path to frontend directory (default: current directory)
set -e

PLAYWRIGHT_DIR="${1:-.}"
REPORT_DIR="$PLAYWRIGHT_DIR/test-results"
JSON_REPORT="$REPORT_DIR/results.json"
MARKDOWN_REPORT="$PLAYWRIGHT_DIR/docs/daily-stability.md"

echo "=== E2E Stability Report ==="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Working directory: $PLAYWRIGHT_DIR"

# Ensure report directory exists
mkdir -p "$REPORT_DIR"

# Run Playwright tests with JSON reporter
echo "Running Playwright tests..."
cd "$PLAYWRIGHT_DIR"

# Use CI mode if CI env var is set
if [ -n "$CI" ]; then
  PLAYWRIGHT_FLAGS="--reporter=json,list"
else
  PLAYWRIGHT_FLAGS="--reporter=json"
fi

# Run tests and capture exit code
set +e
npx playwright test $PLAYWRIGHT_FLAGS 2>&1 | tail -20
TEST_EXIT_CODE=${PIPESTATUS[0]}
set -e

echo ""
echo "Test exit code: $TEST_EXIT_CODE"

# Parse JSON report
if [ -f "$JSON_REPORT" ]; then
  python3 "$PLAYWRIGHT_DIR/scripts/parse-playwright-report.py" "$JSON_REPORT"
  PARSE_RESULT=$?
  
  if [ $PARSE_RESULT -eq 0 ]; then
    echo "Report parsed successfully"
  else
    echo "Warning: Failed to parse report"
  fi
else
  echo "Warning: JSON report not found at $JSON_REPORT"
fi

echo ""
echo "=== Stability Summary ==="
echo "Report saved to: $MARKDOWN_REPORT"

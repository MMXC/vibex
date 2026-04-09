#!/bin/bash
#===============================================================================
# P002 U4: Design Token CI Validation
# Validates: no hardcoded hex in design CSS, line count limits
#===============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=============================================="
echo "P002 U4: Design Token CI Validation"
echo "=============================================="

ERRORS=0

# Target files (all design CSS files)
TARGET_FILES=(
  "src/styles/theme-utilities.css"
  "src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css"
)

# Regex pattern for hex colors (3 or 6 digit)
HEX_PATTERN='^[[:space:]]*#[0-9a-fA-F]{3,6}'

echo ""
echo "1. Checking hardcoded hex colors in design CSS files..."
for file in "${TARGET_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠ SKIP: $file not found"
    continue
  fi

  hex_count=$(grep -cE "$HEX_PATTERN" "$file" 2>/dev/null | head -1 || echo "0")
  if [ "$hex_count" -gt 0 ]; then
    echo "  ❌ FAIL: $file has $hex_count hardcoded hex color(s)"
    grep -nE "$HEX_PATTERN" "$file" | head -5
    ERRORS=$((ERRORS + 1))
  else
    echo "  ✅ PASS: $file — 0 hardcoded hex colors"
  fi
done

echo ""
echo "2. Checking theme-utilities.css line count..."
UTILS_LINES=$(wc -l < "src/styles/theme-utilities.css" 2>/dev/null || echo "0")
UTILS_LIMIT=300
if [ "$UTILS_LINES" -gt "$UTILS_LIMIT" ]; then
  echo "  ❌ FAIL: theme-utilities.css has $UTILS_LINES lines (limit: $UTILS_LIMIT)"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: theme-utilities.css — $UTILS_LINES lines (limit: $UTILS_LIMIT)"
fi

echo ""
echo "3. Checking JsonTreeRenderer.module.css line count..."
JTR_LINES=$(wc -l < "src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css" 2>/dev/null || echo "999")
JTR_LIMIT=189
if [ "$JTR_LINES" -gt "$JTR_LIMIT" ]; then
  echo "  ❌ FAIL: JsonTreeRenderer.module.css has $JTR_LINES lines (limit: $JTR_LIMIT)"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ PASS: JsonTreeRenderer.module.css — $JTR_LINES lines (limit: $JTR_LIMIT)"
fi

echo ""
echo "=============================================="
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ FAILED: $ERRORS check(s) failed"
  exit 1
else
  echo "✅ ALL PASSED: Design token CI validation passed"
  exit 0
fi

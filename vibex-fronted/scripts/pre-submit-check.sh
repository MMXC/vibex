#!/usr/bin/env bash
#==============================================================================
# VibeX Pre-Submit Check Script
# 
# Part of: api-input-validation-layer / Epic E1 (S2.2)
# Validates code quality before commit
#
# Usage: bash scripts/pre-submit-check.sh [path]
#   path: optional, defaults to current directory
#==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

echo "=============================================="
echo "VibeX Pre-Submit Check"
echo "=============================================="
echo ""

# Navigate to project root
cd "$PROJECT_ROOT"

#------------------------------------------------------------------------------
# Helper functions
#------------------------------------------------------------------------------

check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ FAIL${NC}: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    else
        echo -e "${GREEN}✓ PASS${NC}: $1"
        return 0
    fi
}

check_warning() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    WARNINGS=$((WARNINGS + 1))
}

#------------------------------------------------------------------------------
# 1. TypeScript Compilation Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "1. TypeScript Compilation (vibex-fronted)"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"
if npx tsc --noEmit > /dev/null 2>&1; then
    check_error "TypeScript compilation (frontend)"
else
    check_warning "TypeScript compilation has errors (see above)"
fi

cd "$PROJECT_ROOT/vibex-backend"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    check_warning "TypeScript compilation has errors (see above)"
else
    check_error "TypeScript compilation (backend)"
fi

echo ""

#------------------------------------------------------------------------------
# 2. ESLint Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "2. ESLint Check (vibex-fronted)"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"
if npx eslint src/ --ext .ts,.tsx --max-warnings=0 > /dev/null 2>&1; then
    check_error "ESLint (frontend)"
else
    check_warning "ESLint has warnings/errors (see above)"
fi

echo ""

#------------------------------------------------------------------------------
# 2b. ESLint Disable Count Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "2b. ESLint Disable Count Check"
echo "=============================================="

DISABLE_THRESHOLD=20

# Count + detailed list
if [ -f "ESLINT_DISABLES.md" ]; then
    TOTAL_DOC=$(grep -c "eslint-disable\|eslint-disable-next-line\|eslint-disable-line" ESLINT_DISABLES.md || echo "0")
    echo -e "  ESLINT_DISABLES.md 记录数: ${YELLOW}$TOTAL_DOC${NC} 条"
else
    echo -e "  ${RED}⚠ ESLINT_DISABLES.md 不存在，请创建豁免记录表${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

DISABLE_LIST=$(grep -rEn "eslint-disable|eslint-disable-line|eslint-disable-next-line" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)
DISABLE_COUNT=$(echo "$DISABLE_LIST" | wc -l)

if [ "$DISABLE_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}发现 $DISABLE_COUNT 条 eslint-disable:${NC}"
    echo "$DISABLE_LIST" | while IFS=: read -r file line rest; do
        rule=$(echo "$rest" | sed 's/^ *//' | sed 's/ --.*$//')
        echo "    - $file:$line → $rule"
    done
    echo ""
fi

if [ "$DISABLE_COUNT" -gt "$DISABLE_THRESHOLD" ]; then
    check_warning "ESLint disable count: $DISABLE_COUNT (threshold: $DISABLE_THRESHOLD). Review ESLINT_DISABLES.md"
else
    echo -e "  ${GREEN}✓ ESLint disable count: $DISABLE_COUNT (threshold: $DISABLE_THRESHOLD)${NC}"
fi

echo ""

#------------------------------------------------------------------------------
# 3. Unit Tests
#------------------------------------------------------------------------------

echo "=============================================="
echo "3. Unit Tests"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"
if npm test -- --passWithNoTests --coverage=false --bail --maxWorkers=2 > /dev/null 2>&1; then
    check_error "Unit tests (frontend)"
else
    check_warning "Some tests failed (see above)"
fi

echo ""

#------------------------------------------------------------------------------
# 4. Build Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "4. Build Check"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"
if npm run build > /dev/null 2>&1; then
    check_error "Build (frontend)"
else
    check_warning "Build has errors (see above)"
fi

echo ""

#------------------------------------------------------------------------------
# 5. CHANGELOG Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "5. CHANGELOG Check"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"
TODAY=$(date +%Y-%m-%d)
if [ -f "CHANGELOG.md" ]; then
    # Check for today's entry
    if grep -q "\[.*\] — $TODAY" CHANGELOG.md; then
        check_error "CHANGELOG has today's entry"
    else
        check_warning "CHANGELOG.md missing today's entry ($TODAY)"
    fi
    
    # Check format
    if grep -q "^### " CHANGELOG.md && grep -q "^#### " CHANGELOG.md; then
        check_error "CHANGELOG format valid"
    else
        check_warning "CHANGELOG.md format may be incorrect"
    fi
else
    check_warning "CHANGELOG.md not found"
fi

echo ""

#------------------------------------------------------------------------------
# 6. No Debug Code Check
#------------------------------------------------------------------------------

echo "=============================================="
echo "6. No Debug Code Check"
echo "=============================================="

cd "$PROJECT_ROOT/vibex-fronted"

DEBUG_PATTERNS=("console\.log" "debugger" "console\.debug" "console\.trace")
DEBUG_FILES=()

for pattern in "${DEBUG_PATTERNS[@]}"; do
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            DEBUG_FILES+=("$file")
        fi
    done < <(grep -rl "$pattern" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__")
done

if [ ${#DEBUG_FILES[@]} -eq 0 ]; then
    check_error "No debug code found"
else
    echo -e "${YELLOW}⚠ WARN${NC}: Debug code found in:"
    for f in "${DEBUG_FILES[@]}"; do
        echo "  - $f"
    done
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

#------------------------------------------------------------------------------
# Summary
#------------------------------------------------------------------------------

echo "=============================================="
echo "Summary"
echo "=============================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ Pre-submit check FAILED${NC}"
    echo "  Please fix errors before committing."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Pre-submit check PASSED with warnings${NC}"
    echo "  Review warnings before committing."
    exit 0
else
    echo -e "${GREEN}✓ Pre-submit check PASSED${NC}"
    exit 0
fi

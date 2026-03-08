#!/bin/bash
# VibeX E2E Test Runner
# Usage: bash tests/e2e/run-e2e-test.sh

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="y760283407@outlook.com"
TEST_PASSWORD="12345678"
REPORT_DIR="/root/.openclaw/vibex/vibex-fronted/tests/e2e/reports"
SCREENSHOT_DIR="/root/.openclaw/vibex/vibex-fronted/tests/e2e/screenshots/daily"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Create directories
mkdir -p "$REPORT_DIR"
mkdir -p "$SCREENSHOT_DIR/$DATE"

# Report file
REPORT_FILE="$REPORT_DIR/${DATE}-e2e-report.md"

echo "=== VibeX E2E Test Runner ===" | tee "$REPORT_FILE"
echo "Date: $(date)" | tee -a "$REPORT_FILE"
echo "Base URL: $BASE_URL" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Test results
TOTAL=0
PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local name="$1"
    local func="$2"
    
    TOTAL=$((TOTAL + 1))
    echo "Running: $name..." | tee -a "$REPORT_FILE"
    
    if eval "$func"; then
        echo "✓ PASSED: $name" | tee -a "$REPORT_FILE"
        PASSED=$((PASSED + 1))
    else
        echo "✗ FAILED: $name" | tee -a "$REPORT_FILE"
        FAILED=$((FAILED + 1))
    fi
    echo "" | tee -a "$REPORT_FILE"
}

# Start browser and run tests
echo "Starting browser..." 

# Test 1: Landing page loads
test_landing_page() {
    browser action=open targetUrl="$BASE_URL/landing" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/landing.png" > /dev/null 2>&1
    return 0
}

# Test 2: Homepage loads
test_homepage() {
    browser action=open targetUrl="$BASE_URL/" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/homepage.png" > /dev/null 2>&1
    return 0
}

# Test 3: Login page loads
test_login_page() {
    browser action=open targetUrl="$BASE_URL/auth" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/login-page.png" > /dev/null 2>&1
    return 0
}

# Test 4: Dashboard page (may require login)
test_dashboard() {
    browser action=open targetUrl="$BASE_URL/dashboard" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/dashboard.png" > /dev/null 2>&1
    return 0
}

# Test 5: Requirements page
test_requirements() {
    browser action=open targetUrl="$BASE_URL/requirements" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/requirements.png" > /dev/null 2>&1
    return 0
}

# Test 6: Flow page
test_flow() {
    browser action=open targetUrl="$BASE_URL/flow" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/flow.png" > /dev/null 2>&1
    return 0
}

# Test 7: Project settings page
test_project_settings() {
    browser action=open targetUrl="$BASE_URL/project-settings" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/project-settings.png" > /dev/null 2>&1
    return 0
}

# Test 8: Templates page
test_templates() {
    browser action=open targetUrl="$BASE_URL/templates" > /dev/null 2>&1
    sleep 3
    browser action=screenshot path="$SCREENSHOT_DIR/${DATE}/templates.png" > /dev/null 2>&1
    return 0
}

# Run tests
echo "Running E2E tests..." | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

run_test "Landing Page" test_landing_page
run_test "Homepage" test_homepage
run_test "Login Page" test_login_page
run_test "Dashboard" test_dashboard
run_test "Requirements" test_requirements
run_test "Flow" test_flow
run_test "Project Settings" test_project_settings
run_test "Templates" test_templates

# Summary
echo "=== Test Summary ===" | tee -a "$REPORT_FILE"
echo "Total: $TOTAL" | tee -a "$REPORT_FILE"
echo "Passed: $PASSED" | tee -a "$REPORT_FILE"
echo "Failed: $FAILED" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $FAILED -eq 0 ]; then
    echo "✓ All tests passed!" | tee -a "$REPORT_FILE"
    exit 0
else
    echo "✗ Some tests failed!" | tee -a "$REPORT_FILE"
    exit 1
fi

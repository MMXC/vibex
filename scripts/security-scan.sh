#!/bin/bash
#
# Security Scan Script
# Performs local security scanning including npm audit and gitleaks
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
FIX=false
REPORT=false
REPORT_FILE="security-report.json"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --fix)
      FIX=true
      shift
      ;;
    --report)
      REPORT=true
      shift
      ;;
    --report-file)
      REPORT_FILE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --fix              Auto-fix dependency vulnerabilities"
      echo "  --report           Generate JSON report"
      echo "  --report-file FILE Output report file (default: security-report.json)"
      echo "  --help, -h         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Initialize report data
REPORT_DATA='{"timestamp":"'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'","scans":[]}'

echo -e "${GREEN}=== Security Scan ===${NC}"
echo ""

# Track overall status
OVERALL_EXIT=0
CRITICAL_COUNT=0
HIGH_COUNT=0

# Function to add scan result to report
add_scan_result() {
  local name="$1"
  local status="$2"
  local details="$3"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  if [ "$REPORT" = true ]; then
    local result="{\"name\":\"$name\",\"status\":\"$status\",\"details\":$details,\"timestamp\":\"$timestamp\"}"
    REPORT_DATA=$(echo "$REPORT_DATA" | jq ".scans += [$result]")
  fi
}

# ===== Scan 1: npm audit =====
echo -e "${GREEN}[1/2] Running npm audit...${NC}"
echo ""

if command -v npm &> /dev/null; then
  NPM_AUDIT_OUTPUT=$(npm audit --json 2>&1 || true)
  NPM_AUDIT_EXIT=$?
  
  # Parse npm audit results
  if echo "$NPM_AUDIT_OUTPUT" | jq -e '.metadata.vulnerabilities' &> /dev/null; then
    CRITICAL=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0')
    HIGH=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0')
    MEDIUM=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.medium // 0')
    LOW=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.low // 0')
    
    TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW))
    
    echo "npm audit results:"
    echo "  Critical: $CRITICAL"
    echo "  High: $HIGH"
    echo "  Medium: $MEDIUM"
    echo "  Low: $LOW"
    echo "  Total: $TOTAL"
    echo ""
    
    CRITICAL_COUNT=$((CRITICAL_COUNT + CRITICAL))
    HIGH_COUNT=$((HIGH_COUNT + HIGH))
    
    # Add to report
    add_scan_result "npm-audit" "completed" "{\"critical\":$CRITICAL,\"high\":$HIGH,\"medium\":$MEDIUM,\"low\":$LOW,\"total\":$TOTAL}"
    
    # Check if we should fail
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
      echo -e "${RED}Found Critical/High vulnerabilities!${NC}"
      OVERALL_EXIT=1
    fi
    
    # Auto-fix if requested
    if [ "$FIX" = true ]; then
      echo ""
      echo -e "${YELLOW}Running npm audit fix...${NC}"
      npm audit fix --force 2>&1 || true
    fi
  else
    echo "No vulnerabilities found or npm audit failed to parse output"
    add_scan_result "npm-audit" "completed" "{\"error\":\"no vulnerabilities or parse error\"}"
  fi
else
  echo -e "${YELLOW}npm not found, skipping npm audit${NC}"
  add_scan_result "npm-audit" "skipped" "{\"reason\":\"npm not found\"}"
fi

# ===== Scan 2: gitleaks =====
echo ""
echo -e "${GREEN}[2/2] Running gitleaks...${NC}"
echo ""

GITLEAKS_FOUND=0

if command -v gitleaks &> /dev/null; then
  echo "Running gitleaks scan..."
  
  # Try to run gitleaks
  GITLEAKS_OUTPUT=$(gitleaks detect --source . --report-format json 2>&1 || true)
  GITLEAKS_EXIT=$?
  
  if [ -n "$GITLEAKS_OUTPUT" ] && [ "$GITLEAKS_OUTPUT" != "null" ]; then
    GITLEAKS_FOUND=$(echo "$GITLEAKS_OUTPUT" | jq 'length' 2>/dev/null || echo "0")
    echo "gitleaks found $GITLEAKS_FOUND potential secrets"
    
    if [ "$GITLEAKS_FOUND" -gt 0 ]; then
      echo -e "${RED}Found potential secrets!${NC}"
      OVERALL_EXIT=1
      GITLEAKS_FOUND=1
    fi
    
    add_scan_result "gitleaks" "completed" "{\"findings\":$GITLEAKS_FOUND}"
  else
    echo "No secrets found"
    add_scan_result "gitleaks" "completed" "{\"findings\":0}"
  fi
else
  echo -e "${YELLOW}gitleaks not found, skipping secret detection${NC}"
  echo "To install: brew install gitleaks or go install github.com/gitleaks/gitleaks/v10/cmd/gitleaks@latest"
  add_scan_result "gitleaks" "skipped" "{\"reason\":\"gitleaks not installed\"}"
fi

# ===== Summary =====
echo ""
echo -e "${GREEN}=== Scan Complete ===${NC}"
echo ""
echo "Summary:"
echo "  Critical vulnerabilities: $CRITICAL_COUNT"
echo "  High vulnerabilities: $HIGH_COUNT"
echo "  Secrets detected: $GITLEAKS_FOUND"

# Generate report if requested
if [ "$REPORT" = true ]; then
  echo ""
  echo "Generating report: $REPORT_FILE"
  
  # Add summary to report
  FINAL_REPORT=$(echo "$REPORT_DATA" | jq ".summary = {\"critical\":$CRITICAL_COUNT,\"high\":$HIGH_COUNT,\"secrets\":$GITLEAKS_FOUND,\"exitCode\":$OVERALL_EXIT}")
  
  echo "$FINAL_REPORT" > "$REPORT_FILE"
  echo "Report saved to $REPORT_FILE"
fi

# Exit with appropriate code
if [ $OVERALL_EXIT -eq 1 ]; then
  echo ""
  echo -e "${RED}Security issues found!${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}No security issues found!${NC}"
  exit 0
fi

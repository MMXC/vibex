#!/bin/bash
# exec-health-check.sh — verify exec tool is working correctly
# Returns 0 if healthy, 1 if broken

set -e

echo "[exec-health-check] Testing exec tool stdout/stderr..."

# Test 1: Basic echo
OUTPUT1=$(echo "TEST_ECHO")
if [ -z "$OUTPUT1" ]; then
    echo "[exec-health-check] FAIL: echo produced no output (BROKEN)" >&2
    exit 1
fi
echo "[exec-health-check] OK: echo produced: '$OUTPUT1'"

# Test 2: Stderr redirect
OUTPUT2=$(bash -c 'echo "TEST_STDERR" >&2' 2>&1)
if [ -z "$OUTPUT2" ]; then
    echo "[exec-health-check] FAIL: stderr redirect produced no output (BROKEN)" >&2
    exit 1
fi
echo "[exec-health-check] OK: stderr redirect produced: '$OUTPUT2'"

# Test 3: Python output
OUTPUT3=$(python3 -c 'print("TEST_PYTHON")' 2>&1)
if [ -z "$OUTPUT3" ]; then
    echo "[exec-health-check] FAIL: Python print produced no output (BROKEN)" >&2
    exit 1
fi
echo "[exec-health-check] OK: Python produced: '$OUTPUT3'"

# Test 4: Exit code preserved
OUTPUT4=$(bash -c 'echo "TEST_EXIT"; exit 42' 2>&1) || EXIT_CODE=$?
if [ "${EXIT_CODE:-0}" -ne 42 ]; then
    echo "[exec-health-check] FAIL: exit code not preserved (got ${EXIT_CODE:-0}, expected 42)" >&2
    exit 1
fi
echo "[exec-health-check] OK: exit code preserved (42)"

echo "[exec-health-check] ALL TESTS PASSED — exec tool is healthy"
exit 0

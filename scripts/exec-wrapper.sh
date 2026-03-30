#!/bin/bash
# exec-wrapper.sh — wraps commands with timeout and health check
# Usage: bash exec-wrapper.sh <timeout_seconds> <command> [args...]

set -e

COMMAND_TIMEOUT="${1:-30}"
shift

HEALTH_CHECK="${EXEC_HEALTH_CHECK:-false}"

# Health check — detect broken stdout/stderr
_exec_health_check() {
    local test_output
    test_output=$(timeout 5 bash -c 'echo "EXEC_HEALTH_TEST"' 2>&1) || true
    if [ -z "$test_output" ]; then
        echo "[exec-wrapper] WARN: exec health check failed — output is empty" >&2
        echo "[exec-wrapper] WARN: exec tool may have broken stdout/stderr pipes" >&2
    fi
}

# Run health check if enabled
if [ "$HEALTH_CHECK" = "true" ]; then
    _exec_health_check
fi

# Execute command with timeout
if [ $# -eq 0 ]; then
    echo "[exec-wrapper] ERROR: no command provided" >&2
    exit 1
fi

# Run with GNU timeout (coreutils)
if command -v timeout &>/dev/null; then
    timeout "$COMMAND_TIMEOUT" "$@"
else
    "$@"
fi

#!/bin/bash
# exec-wrapper.sh — wraps commands with timeout and health check
# Usage: bash /root/.openclaw/scripts/exec-wrapper.sh "<command>"

set -e

COMMAND_TIMEOUT="${EXEC_TIMEOUT:-30}"
HEALTH_CHECK="${EXEC_HEALTH_CHECK:-false}"

# ── Epic1: 注入 RESTORED_PATH 和 PYTHONPATH ─────────────────────
# 解决 sandbox 环境下 PATH/PYTHONPATH 被清空导致命令找不到的问题
RESTORED_PATH="${RESTORED_PATH:-/usr/bin:/usr/local/bin:/root/.local/bin:/root/.local/share/pnpm:/root/.bun/bin:/bin:/root/.npm-global/bin:/root/bin:/root/.volta/bin:/root/.asdf/shims:/root/.nvm/current/bin:/root/.fnm/current/bin}"
RESTORED_PYTHONPATH="${RESTORED_PYTHONPATH:-/root/.openclaw:/root/.openclaw/scripts:/root/.openclaw/skills/team-tasks/scripts}"

# 如果当前 PATH 为空或不包含必要目录，则使用 RESTORED_PATH
if [ -z "$PATH" ] || [ "$PATH" = "/usr/bin:/bin" ]; then
    export PATH="$RESTORED_PATH"
fi

# 如果当前 PYTHONPATH 为空，则使用 RESTORED_PYTHONPATH
if [ -z "$PYTHONPATH" ]; then
    export PYTHONPATH="$RESTORED_PYTHONPATH"
fi

# ── Health Check ─────────────────────────────────────────────────
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
TIMEOUT_SECONDS="${1:-$COMMAND_TIMEOUT}"
shift  # remove timeout arg, pass remaining args as command

if [ $# -eq 0 ]; then
    echo "[exec-wrapper] ERROR: no command provided" >&2
    exit 1
fi

# Run with GNU timeout (coreutils)
if command -v timeout &>/dev/null; then
    timeout "$TIMEOUT_SECONDS" "$@"
else
    # Fallback: run without timeout
    "$@"
fi

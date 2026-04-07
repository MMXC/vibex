# FIX: Sandbox Exec Freeze — No stdout/stderr

## Problem

In sandbox mode, the `exec` tool returns exit code 0 but produces **no stdout or stderr output**. All commands appear to succeed silently:
- `python3 script.py` → exit 0, no output (script actually runs but output is lost)
- `git commit` → exit 0, no output
- `echo "test"` → exit 0, no output

This makes it impossible to verify command results, capture output, or debug issues.

## Root Cause

The sandbox exec implementation appears to have broken stdout/stderr pipe handling. The subprocess exits successfully but its output streams are not captured/forwarded.

**Evidence:**
- All commands return exit code 0 (subprocess runs)
- Python `print()` output is lost
- `2>&1` stderr redirection is lost
- `echo "test"` with explicit stdout redirect is lost
- subprocess pipes appear disconnected

## Affected Components

- OpenClaw `exec` tool in sandbox mode
- All agents using sandbox exec
- task_manager.py update/status commands (silent failures)
- git commit/push operations
- Any command that depends on output

## Symptom Timeline

1. Commands that write to files (without reading output) work fine
2. Commands that read output silently fail
3. No error messages are produced
4. exit code 0 is returned even for failed commands

## Fix Strategy

### Phase 1: Add Exec Health Check (Immediate)

Add a health check to detect broken exec:

```bash
# In heartbeat or before any critical command
_exec_test() {
    local output
    output=$(echo "EXEC_HEALTH_TEST_$(date +%s)" 2>&1)
    if [ -z "$output" ]; then
        echo "WARN: exec tool may be broken — no output from echo test" >&2
        return 1
    fi
    echo "OK: exec tool working"
}
_exec_test
```

### Phase 2: Add Timeout Wrapper (Short-term)

Modify `exec-wrapper.sh` to add timeout:

```bash
#!/bin/bash
# exec-wrapper.sh — wraps commands with timeout and health check

COMMAND_TIMEOUT="${EXEC_TIMEOUT:-30}"
HEALTH_CHECK="${EXEC_HEALTH_CHECK:-false}"

# Health check
if [ "$HEALTH_CHECK" = "true" ]; then
    test_output=$(timeout 5 bash -c 'echo "HEALTH_CHECK"' 2>&1)
    if [ -z "$test_output" ]; then
        echo "ERROR: exec health check failed" >&2
        exit 1
    fi
fi

# Execute with timeout
timeout "$COMMAND_TIMEOUT" bash -c "$1"
exit $?
```

### Phase 3: OpenClaw Source Fix (Long-term)

Fix the OpenClaw exec tool to properly capture stdout/stderr in sandbox mode. The issue is likely in:

1. `src/core/exec.ts` — pipe handling for sandbox subprocess
2. `src/sandbox/process.ts` — subprocess spawn in sandbox environment

**Expected behavior:**
```typescript
// Should capture both stdout and stderr
const result = await exec('echo "test" 2>&1', { timeout: 5000 });
// result.stdout === "test\n"
// result.exitCode === 0
```

**Actual behavior:**
```typescript
const result = await exec('echo "test" 2>&1', { timeout: 5000 });
// result.stdout === ""
// result.exitCode === 0
```

## Verification

```bash
# Before fix: this returns empty
echo "test_output"

# After fix: this returns "test_output"
echo "test_output"
```

## Workaround

Until the fix is deployed, use these workarounds:

1. **Write output to file** and read file:
```bash
echo "result_$(date +%s)" > /tmp/result.txt
cat /tmp/result.txt
```

2. **Use subagent sessions** which appear to have working exec

3. **Always verify exit code** (though exit 0 doesn't guarantee success)

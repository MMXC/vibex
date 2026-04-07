# Task Claim Rules

## Overview

The `claim` command enforces agent-task affinity: agents can only claim tasks assigned to them. The **coord agent** can override with `--force`.

## Rules

### Normal Agent
- Can only claim tasks where the `agent` field matches your agent name
- Claim attempt for wrong agent → error with helpful hint
- No `agent` field → any agent can claim (backwards compatible)

### Coord Agent
- Can use `--force` to claim any task regardless of assignment
- Coord is responsible for re-assignment and task redistribution

## Usage

```bash
# Correct agent — succeeds
python3 task_manager.py claim my-project dev-epic1 --agent dev
# ✅ Claimed: dev-epic1

# Wrong agent — fails with error
python3 task_manager.py claim my-project dev-epic1 --agent analyst
# ❌ Cannot claim 'dev-epic1': task assigned to 'dev', you are 'analyst'
#    Hint: use --force to override (coord only)

# Force claim (coord only) — succeeds
python3 task_manager.py claim my-project dev-epic1 --agent coord --force
# ⚠️ Force claiming 'dev-epic1' (assigned to 'dev', claiming as 'coord')
# ✅ Claimed: dev-epic1
```

## Implementation

- **File**: `scripts/task_manager.py`
- **Function**: `cmd_claim()`
- **Agent detection**: Falls back to `stage_id.split("-")[0]` if `--agent` not provided
- **Force flag**: `--force` / `-f` boolean flag on the claim subparser

## Agent Mapping

The claiming agent is resolved in order:
1. Explicit `--agent` / `-a` argument
2. Default: derived from `stage_id` prefix (e.g., `dev-epic1` → `dev`)

## Backwards Compatibility

Tasks without an `agent` field can be claimed by any agent. The check is skipped when `assigned_agent` is empty.

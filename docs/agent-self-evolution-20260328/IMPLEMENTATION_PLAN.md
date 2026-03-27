# Implementation Plan — agent-self-evolution-20260328

**Project**: Agent Self-Evolution Pipeline Improvements  
**Based on**: architecture.md  
**Date**: 2026-03-28  

---

## Overview

5 Epic improvements to the agent self-evolution system. Total estimated: ~11.5 hours.

---

## Epic 1: HEARTBEAT.md Format Fix

**Owner**: dev  
**Priority**: P1  
**Effort**: 1.5h  

### Stories

#### F1.1: Fix newline literal pollution
- **File**: `scripts/coord-heartbeat-v8.sh`
- **Change**: Replace string-replacement approach with line-by-line processing
- **DoD**: `grep -c '\\n' HEARTBEAT.md` returns 0 after running heartbeat
- **Test**: `test_heartbeat_newline_fix.py` passes

#### F1.2: Regression test coverage
- **File**: `scripts/tests/test_heartbeat_format.py` (new)
- **Coverage**: 90%+ branch coverage on the fix

---

## Epic 2: task_manager.py Command Standardization

**Owner**: dev  
**Priority**: P1  
**Effort**: 2h  

### Stories

#### F2.1: Add `complete` subcommand
- **File**: `skills/team-tasks/scripts/task_manager.py`
- **Change**: Add `complete` parser and `cmd_complete()` function
- **DoD**: `task_manager.py complete test-proj test-stage done` succeeds

#### F2.2: Update heartbeat scripts to use `complete`
- **Files**: `scripts/coord-heartbeat-v8.sh`, `skills/team-tasks/scripts/notify-agent.sh`
- **Change**: Replace `update <proj> <stage> done` → `complete <proj> <stage>`
- **DoD**: No "unrecognized arguments" in heartbeat logs

#### F2.3: Unit tests
- **File**: `skills/team-tasks/tests/test_complete_command.py` (new)
- **DoD**: 95% coverage on `complete` code path

---

## Epic 3: Batch Heartbeat Notification

**Owner**: dev  
**Priority**: P2  
**Effort**: 4h  

### Stories

#### F3.1: Implement batch queue
- **File**: `scripts/heartbeats/batch_queue.py` (new)
- **Change**: In-memory queue with disk persistence, auto-flush at BATCH_SIZE=5 or timeout=60s
- **DoD**: Simulate 5 completions → exactly 1 Slack message sent

#### F3.2: Integrate batch queue into heartbeat
- **File**: `scripts/coord-heartbeat-v8.sh`
- **Change**: Call `batch_queue.enqueue()` instead of `openclaw message send` directly
- **DoD**: Batch size config works (`BATCH_SIZE=3` → 3 events trigger flush)

#### F3.3: Batch format for Slack
- **File**: `scripts/heartbeats/batch_formatter.py` (new)
- **Format**: `[ANALYST] 🔔 批量完成报告 (N Epic)\n- Epic1 ✅\n- Epic2 ✅...`
- **DoD**: Message matches regex `批量完成报告 \(\d+ Epic\)`

#### F3.4: Tests
- **File**: `scripts/tests/test_batch_queue.py` (new)
- **DoD**: Flush-at-size + flush-at-timeout + idempotent flush all pass

---

## Epic 4: analysis.md Template Standardization

**Owner**: analyst + dev  
**Priority**: P3  
**Effort**: 3h  

### Stories

#### F4.1: Create standard template
- **File**: `docs/analysis-template.md` (new)
- **Sections**: Problem Definition, Business Context, JTBD (3-5), Options (≥2), Acceptance (≥4), Risks (≥1)
- **DoD**: Template reviewed and approved by architect

#### F4.2: Validator script
- **File**: `scripts/validate_analysis.sh` (new)
- **DoD**: Reports all violations across existing analysis.md files

#### F4.3: Migrate existing docs
- **Files**: All `docs/*/analysis.md`
- **DoD**: `validate_analysis.sh` returns 0 violations

---

## Epic 5: DAG Topological Sort for Heartbeat

**Owner**: dev  
**Priority**: P2  
**Effort**: 3h  

### Stories

#### F5.1: Implement topological sort utility
- **File**: `scripts/topological_sort.py` (new)
- **Algorithm**: Kahn's algorithm
- **DoD**: `test_topological_sort.py` passes (linear, parallel, cycle detection)

#### F5.2: Integrate into heartbeat task scanning
- **File**: `scripts/coord-heartbeat-v8.sh`
- **Change**: Scan tasks in topological order, not alphabetical
- **DoD**: `grep -E 'ready|in-progress' <(task_manager list)` respects dependency order

#### F5.3: Cycle detection guard
- **Change**: If cycle detected, log error and skip topological sort
- **DoD**: Cycle in JSON → warning in heartbeat log, fallback to alphabetical

---

## Verification Checklist

```bash
# Epic 1
grep -c '\\\\n' /root/.openclaw/workspace-coord/HEARTBEAT.md  # expect: 0

# Epic 2
task_manager.py complete agent-test test-stage done
python3 -c "import json; t=json.load(open('agent-test.json')); assert t['stages']['test-stage']['status']=='done'"

# Epic 3
# Simulate 5 completions → verify 1 batch Slack message
# Watch Slack channel for batch message

# Epic 4
bash scripts/validate_analysis.sh
# expect: 0 violations

# Epic 5
python3 scripts/tests/test_topological_sort.py
# expect: all tests pass
```

---

## Rollback Plan

If any Epic breaks production heartbeat:
1. Revert the modified script to previous commit
2. Set project status back to active
3. Create fix task via `task_manager.py add <project> fix-<epic>`

# AGENTS.md — Agent 职责

**项目**: taskmanager-syntaxwarning-fix
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. Agent 职责矩阵

| Agent | 职责 | 任务 |
|-------|------|------|
| **dev** | 执行修复 + 验证 | Phase 1, 2 |
| **architect** | 架构设计 | 本任务 |

---

## 2. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | task_manager.py | `python3 -W error task_manager.py list` | `expect(exitCode).toBe(0)` |
| AC-2 | task_manager.py | grep for invalid escape | `expect(output).toBe('')` |
| AC-3 | heartbeat 脚本 | stderr | `expect(stderr).not.toContain('SyntaxWarning')` |

---

**AGENTS.md 完成**: 2026-03-23 12:41 (Asia/Shanghai)

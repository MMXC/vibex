# PRD: taskmanager-syntaxwarning-fix — task_manager.py SyntaxWarning 修复

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 消除 task_manager.py 的 SyntaxWarning，提升心跳日志可读性

---

## 1. 执行摘要

### 问题
`task_manager.py` 每次执行输出：
```
/root/.openclaw/skills/team-tasks/scripts/task_manager.py:633: SyntaxWarning: invalid escape sequence '\['
```
根因：`\\[` 在 Python 字符串中产生无效转义序列，Python 3.12+ 触发警告。

### 目标
- 消除所有 SyntaxWarning
- 所有 heartbeat 日志干净可读
- 不影响原有功能

---

## 2. Epic 拆分

### Epic 1: 转义序列修复
**目标**: 定位并修复所有无效转义序列

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 扫描文件中所有 `\[` `\{` `\(` 未识别转义 | ✅ `grep -n '\\\\\[\\|\\\\{\\|\\\\(' task_manager.py` 有输出 |
| S1.2 | 修复 Line 616 的 `\\[` | ✅ `sed -n '616p' task_manager.py` 无 `\\[` 或用 raw string |
| S1.3 | 修复 Line 633 的 triple-quote | ✅ `sed -n '633p' task_manager.py` 无转义问题 |
| S1.4 | 逐一验证所有替换后 shell 命令语义不变 | ✅ `python3 task_manager.py list > /dev/null` 退出码 0 |

**DoD**: `python3 -W error task_manager.py list > /dev/null` 无警告。

---

### Epic 2: 验证与回归
**目标**: 确保修复不影响现有功能

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | `task_manager.py list` 正常执行 | ✅ `python3 task_manager.py list` 退出码 0 |
| S2.2 | `task_manager.py status` 正常执行 | ✅ `python3 task_manager.py status <project>` 正常 |
| S2.3 | 6 个 heartbeat 脚本调用均无警告 | ✅ stderr 无 `SyntaxWarning` |

**DoD**: 所有命令正常，警告归零。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | task_manager.py | `python3 -W error task_manager.py list > /dev/null 2>&1` | `expect(exitCode).toBe(0)` |
| AC-2 | stderr | `python3 task_manager.py list 2>&1` | `expect(output).not.toContain('SyntaxWarning')` |
| AC-3 | 文件内容 | `grep '\\\\[' task_manager.py` | `expect(matches).toBe(0)` |
| AC-4 | 功能 | `task_manager.py list` | `expect(output).toContain('Project')` |
| AC-5 | 所有 heartbeat 调用 | 分别执行 | `expect(syntaxWarnings).toBe(0)` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **安全性** | 仅改字符串，不改逻辑 |
| **向后兼容** | API 和命令参数不变 |
| **可验证性** | 单条命令验证修复效果 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | 扫描 + 修复转义序列 | Dev |
| Phase 2 | 回归测试（list/status） | Dev |
| Phase 3 | 各 heartbeat 脚本验证 | Tester |
| Phase 4 | PM 验收 | PM |

---

*PRD v1.0 — 2026-03-23*

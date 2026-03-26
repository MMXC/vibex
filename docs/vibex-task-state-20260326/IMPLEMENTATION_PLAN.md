# Implementation Plan: task_state CLI + 乐观锁

**项目**: vibex-task-state-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. PR 批次划分

### PR #1: 核心基础设施（Epic 1）
**文件**: `skills/team-tasks/scripts/task_manager.py`
**工时**: ~2.5h
**改动**:
- 新增 `atomic_write_json()` — tempfile.mkstemp + os.rename
- 新增 `load_project_with_rev()` — 返回 (data, revision)
- 新增 `save_project_with_lock()` — 乐观锁 + 原子写入
- 兼容无 revision 字段的旧文件

### PR #2: CLI 封装（Epic 2）
**文件**: `skills/team-tasks/scripts/task_state.py`（新建）
**工时**: ~1.5h
**命令**: update / claim / status / lock

### PR #3: 重构 + 迁移（Epic 3）
**文件**: `skills/team-tasks/scripts/task_manager.py`（重构）+ 各 agent 脚本
**工时**: ~1.5h
**改动**:
- task_manager 所有 write 调用改为 save_project_with_lock
- agent 脚本迁移到 task_state CLI

### PR #4: 测试（Epic 4）
**文件**: `skills/team-tasks/scripts/test_*.py`
**工时**: ~2h
**测试**: 并发 / 异常注入 / 兼容性 / CLI 集成

---

## 2. 改动量估算

| 文件 | 改动类型 | 行数 |
|------|---------|------|
| `task_manager.py` | 新增 3 函数 + 重构 | ~120 行 |
| `task_state.py` | 新建 CLI | ~150 行 |
| Agent 脚本 | 迁移到 CLI | ~20 行/agent |
| `test_*.py` | 新建 | ~100 行 |

---

## 3. 回滚计划

| 风险 | 回滚方式 |
|------|---------|
| PR #1 破坏现有写入 | Revert task_manager.py，仅保留 save_project |
| PR #2 CLI 不稳定 | 删除 task_state.py，agent 脚本回退直接调用 |
| PR #3 迁移不完整 | grep 检查仍有直接 open().*\.json.*"w" 的文件 |

---

*实施计划完成时间: 2026-03-26 12:04 UTC+8*

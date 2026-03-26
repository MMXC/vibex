# Implementation Plan: task_state CLI + 乐观锁

**项目**: vibex-task-state-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. PR 批次划分

### ✅ PR #1: 核心基础设施（Epic 1）
**文件**: `skills/team-tasks/scripts/task_manager.py`
**工时**: ~1.5h
**改动**:
- ✅ `atomic_write_json()` — tempfile.mkstemp + os.rename
- ✅ `load_project_with_rev()` — 返回 (data, revision)
- ✅ `save_project_with_lock()` — 乐观锁 + 原子写入
- ✅ 兼容无 revision 字段的旧文件
- ✅ 测试: 10 tests (53 total pass)

### ✅ PR #2: CLI 封装（Epic 2）
**文件**: `skills/team-tasks/scripts/task_state.py`（新建）
**工时**: ~1h
**命令**: update / claim / status / lock
- ✅ `update`: 乐观锁保护的状态更新
- ✅ `claim`: 锁保护的领取（同一 agent 可重领）
- ✅ `status`: 格式化表格输出
- ✅ `lock`: TTL 锁定
- ✅ `color_status`: 颜色高亮
- 测试: 12 tests (65 total pass)

### Epic2 完成状态: ✅ 已完成 (2026-03-26 13:10 UTC+8)
- F2.1 ✅ F2.2 ✅ F2.3 ✅ F2.4 ✅ F2.5 ✅

### ✅ PR #3: 重构 + 迁移（Epic 3）
**文件**: `skills/team-tasks/scripts/task_manager.py`（重构）
**工时**: ~1h
**改动**:
- ✅ cmd_update → save_project_with_lock (F3.1)
- ✅ cmd_claim → save_project_with_lock (F3.2)
- ✅ agent scripts 已使用 task_state CLI (F3.3)
- 测试: 13 Epic3 tests (68 total pass)

### Epic3 完成状态: ✅ 已完成 (2026-03-26 13:25 UTC+8)
- F3.1 ✅ F3.2 ✅ F3.3 ✅

### ✅ PR #4: 测试（Epic 4）
**文件**: `skills/team-tasks/scripts/test_*.py`
**工时**: ~1h
**测试**: 并发 / 异常注入 / 兼容性 / CLI 集成
- ✅ `test_concurrent.py` — 3 tests (multi-thread concurrent revision, lock behavior)
- ✅ `test_atomic.py` — 7 tests (crash recovery, contract, unicode)
- 测试: 37 Epic tests total pass

### Epic4 完成状态: ✅ 已完成 (2026-03-26 13:40 UTC+8)
- F4.1 ✅ F4.2 ✅ F4.3 ✅

---

## 2. 改动量估算

| 文件 | 改动类型 | 行数 |
|------|---------|------|
| `task_manager.py` | 新增 3 函数 + 重构 | ~120 行 |
| `task_state.py` | 新建 CLI | ~150 行 |
| Agent 脚本 | 迁移到 CLI | ~20 行/agent |
| `test_task_state_concurrency.py` | 新建 | ~350 行 ✅ (Epic1) |

---

## 3. 回滚计划

| 风险 | 回滚方式 |
|------|---------|
| PR #1 破坏现有写入 | Revert task_manager.py，仅保留 save_project |
| PR #2 CLI 不稳定 | 删除 task_state.py，agent 脚本回退直接调用 |
| PR #3 迁移不完整 | grep 检查仍有直接 open().*\.json.*"w" 的文件 |

---

### Epic1 完成状态: ✅ 已完成 (2026-03-26 12:22 UTC+8)
- 53 tests pass (包括 10 个 Epic1 测试)
- F1.1 ✅ F1.2 ✅ F1.3 ✅ F1.4 ✅

*实施计划完成时间: 2026-03-26 12:04 UTC+8 | Epic1 完成: 2026-03-26 12:22 UTC+8*
*Epic2 完成: 2026-03-26 13:10 UTC+8 | Epic3 完成: 2026-03-26 13:25 UTC+8 | Epic4 完成: 2026-03-26 13:40 UTC+8*

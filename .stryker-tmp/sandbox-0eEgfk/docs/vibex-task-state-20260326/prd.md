# PRD: task_state CLI + 乐观锁

**项目**: vibex-task-state-20260326
**版本**: 1.0
**PM**: pm
**日期**: 2026-03-26
**状态**: 进行中

---

## 1. 执行摘要

### 问题
`task_manager.py` 的 `save_project()` 使用无保护的 `open(path, "w")` 直接写入 JSON，多 Agent 并发调用时发生"后写覆盖先写"，导致任务状态丢失、阶段依赖断裂、Agent 误抢任务。

### 解决方案
1. **近期**：在 `task_manager.py` 中引入乐观锁（revision 字段 + 重试）+ 原子写入（temp + rename）
2. **增量**：新建 `task_state` CLI 封装所有状态操作，作为单一写入点

### 目标
- 并发写入不丢失数据
- 所有 Agent 通过 CLI 操作，避免直接修改 JSON
- 任务状态有完整可见性

---

## 2. 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| 并发写入数据丢失率 | 0% | 并发单元测试验证 revision 不丢失 |
| 异常写入产生截断文件次数 | 0 | 异常注入测试 |
| CLI 命令成功率 | ≥99% | 集成测试套件 |
| 旧文件兼容性 | 100% | 无 revision 字段文件首次写入后包含 revision |

---

## 3. Epic 拆分

### Epic 1: 核心基础设施（乐观锁 + 原子写入）

**目标**: 在 `task_manager.py` 内部建立并发安全基础

| Story ID | 作为... | 我想... | 以便... | 验收标准 | 优先级 |
|----------|---------|---------|---------|---------|--------|
| F1.1 | 系统 | 实现 `atomic_write_json()` 辅助函数 | 保证写入原子性（temp + rename），异常时不留截断文件 | `expect(atomic_write_json("/tmp/test.json", data))` 写入成功；异常注入后原文件未变化 | P0 |
| F1.2 | 系统 | 实现 `save_project_with_lock()` 函数 | 在乐观锁保护下写入，revision 不匹配时自动重试 | 两次并发写入同一文件，revision 不丢失（expect(rev_a + rev_b == 2 * initial_rev + 2)） | P0 |
| F1.3 | 系统 | 实现 `load_project_with_rev()` 函数 | 返回数据及 revision 版本号，供乐观锁比对 | `expect(load_project_with_rev("proj")[1] >= 0)` | P0 |
| F1.4 | 系统 | `save_project()` 兼容无 revision 字段的旧文件 | 首次写入时自动初始化 revision=0 | 读取无 revision 的旧 JSON，写入后 revision=1 | P1 |

**DoD**:
- 每个函数有对应单元测试
- 异常注入后原文件状态正确

---

### Epic 2: task_state CLI

**目标**: 提供统一的命令行界面，替代所有直接 JSON 写入操作

| Story ID | 作为... | 我想... | 以便... | 验收标准 | 页面集成 |
|----------|---------|---------|---------|---------|---------|
| F2.1 | Agent | 执行 `task_state.py update <project> <stage> <status>` | 原子更新任务状态 | 同一 stage 并发 update，revision 正确递增，无数据丢失 | 否 |
| F2.2 | Agent | 执行 `task_state.py claim <project> [--stage X]` | 领取任务（乐观锁保护） | 多 Agent 同时 claim 同一 stage，只有 1 个成功 | 否 |
| F2.3 | Agent | 执行 `task_state.py status <project>` | 查看项目所有任务状态 | 输出包含所有 stage 的 status、agent、revision | 否 |
| F2.4 | Agent | 执行 `task_state.py lock <project> <stage> --ttl=N` | 锁定任务防止重复领取 | TTL 过期前同一 Agent 不可重复 lock | 否 |
| F2.5 | Agent | CLI 输出格式化（对齐、颜色） | 快速定位关键信息 | status 命令输出表格对齐，pending 高亮 | 否 |

**DoD**:
- 每个命令有集成测试
- CLI help 文档完整

---

### Epic 3: task_manager.py 重构

**目标**: 将所有 `save_project()` / `load_project()` 调用迁移到带锁版本

| Story ID | 作为... | 我想... | 以便... | 验收标准 | 页面集成 |
|----------|---------|---------|---------|---------|---------|
| F3.1 | 系统 | `update` 命令调用 `save_project_with_lock()` | 所有更新操作受乐观锁保护 | `task_manager.py update` 命令执行后 revision 正确递增 | 否 |
| F3.2 | 系统 | `claim` 命令调用乐观锁 claim 逻辑 | 多 Agent claim 互斥安全 | 并发 claim 只有 1 个成功，其余收到 "already claimed" | 否 |
| F3.3 | 系统 | 所有 Agent 脚本迁移到 `task_state` CLI | 消除直接 JSON 写入 | Agent 脚本中无 `open(.*\.json.*"w"\)` 模式 | 否 |

**DoD**:
- task_manager.py 中所有写入操作使用乐观锁
- grep 验证无直接 JSON 写入

---

### Epic 4: 测试与验证

**目标**: 确保实现满足所有验收标准

| Story ID | 作为... | 我想... | 以便... | 验收标准 | 页面集成 |
|----------|---------|---------|---------|---------|---------|
| F4.1 | 系统 | 并发写入单元测试 | 验证 revision 正确递增，数据不丢失 | 4 进程并发写入同一任务，revision == 初始+4，所有修改保留 | 否 |
| F4.2 | 系统 | 异常注入测试（kill -9、磁盘满） | 验证原子写入不产生截断文件 | 写入过程中 SIGKILL，原始文件未损坏 | 否 |
| F4.3 | 系统 | 兼容性测试（旧 JSON 无 revision） | 验证旧文件迁移平滑 | 无 revision 字段文件读取正常，写入后 revision=1 | 否 |
| F4.4 | Agent | CLI 集成测试（update/claim/status/lock） | 端到端验证所有命令 | 4 个命令全部通过 expect() 断言 | 否 |

**DoD**:
- 所有测试通过
- 覆盖率 ≥ 80%

---

## 4. 功能点总览

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F1.1 | atomic_write_json 辅助函数 | Epic 1 | 异常注入后原文件未变化 | ❌ |
| F1.2 | save_project_with_lock 乐观锁写入 | Epic 1 | 并发写入 revision 不丢失 | ❌ |
| F1.3 | load_project_with_rev 带版本读取 | Epic 1 | 返回 revision >= 0 | ❌ |
| F1.4 | 旧文件 revision 初始化 | Epic 1 | 无 revision 文件写入后 revision=1 | ❌ |
| F2.1 | task_state update 命令 | Epic 2 | 并发 update 数据不丢失 | ❌ |
| F2.2 | task_state claim 命令 | Epic 2 | 多 Agent claim 只有 1 成功 | ❌ |
| F2.3 | task_state status 命令 | Epic 2 | 输出包含所有 stage 状态 | ❌ |
| F2.4 | task_state lock 命令 | Epic 2 | TTL 保护防重复 lock | ❌ |
| F2.5 | CLI 格式化输出 | Epic 2 | 表格对齐，pending 高亮 | ❌ |
| F3.1 | update 命令集成乐观锁 | Epic 3 | revision 正确递增 | ❌ |
| F3.2 | claim 命令集成乐观锁 | Epic 3 | 并发 claim 互斥安全 | ❌ |
| F3.3 | Agent 脚本迁移到 CLI | Epic 3 | 无直接 JSON 写入 | ❌ |
| F4.1 | 并发写入单元测试 | Epic 4 | revision == 初始+并发数 | ❌ |
| F4.2 | 异常注入测试 | Epic 4 | 原文件未损坏 | ❌ |
| F4.3 | 兼容性测试 | Epic 4 | 旧文件读写正常 | ❌ |
| F4.4 | CLI 集成测试 | Epic 4 | 4 命令全部通过 | ❌ |

---

## 5. 验收标准矩阵

| ID | Given | When | Then | 测试方式 |
|----|-------|------|------|---------|
| V1 | 两个 Agent 并发更新同一任务 | 同时执行 update | revision 正确递增两次，无数据丢失 | 单元测试（多进程） |
| V2 | 写入过程中进程被 kill | SIGKILL 注入 | 原文件未产生截断或空文件 | 异常注入测试 |
| V3 | 读取无 revision 字段的旧 JSON | 首次写入 | revision 字段被初始化为 1 | 兼容性测试 |
| V4 | 执行 `task_state update proj stage done` | 命令执行 | 任务状态更新，revision 递增 | 集成测试 |
| V5 | 两个 Agent 同时 claim 同一任务 | 并发执行 | 只有一个成功，另一个收到冲突响应 | 并发测试 |
| V6 | 执行 `task_state status proj` | 命令执行 | 输出包含所有 stage 的 status/agent/revision | 集成测试 |

---

## 6. 范围决策

### In Scope
- `task_manager.py` 重构（乐观锁 + 原子写入）
- `task_state.py` 新 CLI 开发
- 单元测试 + 集成测试
- 旧文件兼容性处理

### Out of Scope
- SQLite 迁移（方案 C，远期）
- Windows 兼容支持
- 任务历史记录（audit log）
- 任务 Web UI

---

## 7. 依赖

| 依赖项 | 说明 |
|--------|------|
| Python 3.8+ | tempfile.mkstemp, os.rename, fcntl |
| jq (命令行) | 心跳脚本使用 jq 解析 JSON |
| gstack /browse | PM 验证问题时使用 |
| Agent 脚本 | 需要迁移到 CLI（dev 负责） |

---

## 8. 技术规格

### 文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `skills/team-tasks/scripts/task_manager.py` | 修改 | 添加乐观锁 + 原子写入 |
| `skills/team-tasks/scripts/task_state.py` | 新增 | CLI 封装 |
| `skills/team-tasks/scripts/test_concurrent.py` | 新增 | 并发测试 |
| `skills/team-tasks/scripts/test_atomic.py` | 新增 | 异常注入测试 |

### JSON Schema 变更

新增顶层字段 `revision: int`（初始 0，每次写入 +1）

---

*PRD 产出物: /root/.openclaw/vibex/docs/vibex-task-state-20260326/prd.md*

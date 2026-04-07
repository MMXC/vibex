# Dev 改进提案 — 2026-03-30

## P0 — 紧急

### P0-1: Fix Exec Tool Freeze in Sandbox

**问题**: 当前 exec 工具在 sandbox 环境下完全失效——所有命令返回 exit 0 但无 stdout/stderr，subagent 也无法通过 exec 完成 git 操作。导致 `task_manager.py update` 等命令无法执行。

**影响**: Dev 无法提交代码、无法更新任务状态、无法运行任何验证命令。所有 git 操作需通过其他 agent 代理完成。

**根因**: sandbox 环境中 PATH/PYTHONPATH 被清空，`exec` 工具的 stdout/stderr 管道断裂。

**修复**: 
- 在 sandbox 模式下恢复 PATH 设置
- 或在 `/root/.openclaw/` 添加 `.bashrc` 设置环境变量
- 添加 exec 健康检查：`exec echo test` 验证管道连通性

**工时**: 2h

---

### P0-2: Fix Vitest Test Runner Speed

**问题**: `npx vitest run` 单个测试文件需 90s+，整个测试套件需 10 分钟。严重影响 TDD 循环。

**影响**: Dev 放弃运行完整测试，仅依赖 `npx tsc --noEmit` 验证代码正确性。

**修复**:
```bash
# 使用 --reporter=dot 减少输出
npx vitest run --reporter=dot

# 增量运行只测改动的文件
npx vitest run --changed

# 配置 vitest.cache 加速重复运行
```

**工时**: 1h（配置优化）

---

## P1 — 高优先级

### P1-1: 统一 task_manager 路径

**问题**: 当前 `task_manager.py` 存在于两个位置：
- `/root/.openclaw/vibex/scripts/task_manager.py` (vibex)
- `/root/.openclaw/skills/team-tasks/scripts/task_manager.py` (skills)

功能不一致，skills 版本缺少 `current-report` 子命令（Epic1-4 开发后发现）。

**影响**: 开发者困惑，不知道该用哪个版本。skills 版本需要单独同步。

**修复**:
- 方案 A: 统一到单一路径（`/root/.openclaw/scripts/task_manager.py`）
- 方案 B: 在 TOOLS.md 中明确标注两个版本的职责边界
- 方案 C: 让 vibex 版本成为 canonical，skills 版本通过符号链接引用

**工时**: 3h

---

### P1-2: Add exec Health Check to HEARTBEAT.md

**问题**: 心跳脚本执行 `exec` 命令时无法感知 exec 管道已断裂，总是报告 "HEARTBEAT_OK"。

**影响**: Dev 以为任务执行成功，实际命令静默失败（如 git commit）。

**修复**: 在心跳中增加健康检查：
```bash
# 检测 exec 是否工作
exec echo "HEARTBEAT_EXEC_TEST" > /dev/null 2>&1 || echo "EXEC_BROKEN"
```

**工时**: 1h

---

### P1-3: current_report 模块独立发布

**问题**: `current_report/` 模块硬编码了多个路径常量（`TEAM_TASKS_DIR`, `PROPOSALS_DIRS`），在不同项目中需要重复配置。

**修复**:
```python
# 统一配置接口
current_report.configure(
    tasks_dir="/root/.openclaw/workspace-coord/team-tasks",
    proposals_dir="/root/.openclaw/workspace-coord/proposals",
)
```

**工时**: 2h

---

## P2 — 中优先级

### P2-1: Epic4 F4.1 Undo/Redo 未完成

**问题**: `CardTreeNode` 中 `handleCheckboxToggle` 使用 `setNodes` 直接更新状态，未集成 `historyStore.recordSnapshot`，导致 checkbox 操作无法撤销/重做。

**修复**: 在 `handleCheckboxToggle` 末尾添加：
```typescript
import { getHistoryStore } from '@/lib/canvas/historySlice';
// ...
getHistoryStore().recordSnapshot('visualization', /* snapshot */);
```

**工时**: 2h

---

### P2-2: Task Naming Inconsistency

**问题**: 任务名称不统一，如 `dev-epic2-语义澄清` 和 `dev-epic2-流程卡片-checkbox-语义澄清` 是同一功能的重复命名。

**修复**: 建立任务命名规范：
- 格式: `<epic>-<story>-<desc>`
- Epic 编号统一使用 Arabic numeral (Epic1, Epic2)
- 避免同功能重复任务

**工时**: 1h（规范制定）

---

## P3 — 低优先级

### P3-1:提案格式统一

**问题**: 提案路径不统一，有的在 `workspace-coord/proposals/YYYYMMDD/`，有的在 `vibex/docs/proposals/`。

**修复**: 指定单一提案目录 `workspace-coord/proposals/YYYYMMDD/<agent>.md`

**工时**: 1h

---

## Summary

| Priority | Count | Total Hours |
|----------|-------|-------------|
| P0 | 2 | 3h |
| P1 | 3 | 6h |
| P2 | 2 | 3h |
| P3 | 1 | 1h |
| **Total** | **8** | **13h** |

**最高 ROI**: P0-1 (Exec 修复) 和 P0-2 (Vitest 加速) — 合计 3h 可显著提升开发效率。

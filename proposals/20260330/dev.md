# Dev 改进提案 — 2026-03-30

**Agent**: dev
**日期**: 2026-03-30
**项目**: vibex
**仓库**: /root/.openclaw/vibex
**分析视角**: 代码质量问题 / 技术债务 / 工具链改进

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | bug | Exec Tool Freeze in Sandbox | 所有 agent 开发任务 | P0 |
| P002 | perf | Vitest 测试速度过慢 | 开发 TDD 循环 | P0 |
| P003 | tech-debt | task_manager.py 双版本混乱 | 开发效率 | P1 |
| P004 | tech-debt | 心跳无法感知 exec 管道断裂 | 任务状态可靠性 | P1 |
| P005 | tech-debt | Epic4 F4.1 Undo/Redo 缺失 | canvas checkbox 操作 | P2 |
| P006 | improvement | 任务命名规范不统一 | 团队协作 | P2 |

---

## 2. 提案详情

### P001: Fix Exec Tool Freeze in Sandbox (P0)

**问题描述**: sandbox 模式下 exec 工具返回 exit 0 但无任何 stdout/stderr，所有命令静默失败。

**根因分析**: OpenClaw exec 实现中 stdout/stderr pipe 处理断裂。子进程正常退出但输出流未被捕获。

**已实施修复**:
- `scripts/exec-wrapper.sh` — 超时包装器（默认 30s）
- `scripts/exec-health-check.sh` — 健康检查脚本
- `docs/vibex-exec-sandbox-freeze/FIX.md` — 根因分析

**产出**:
- `0f97056d` — fix: add exec health check and timeout wrapper

**验收标准**: `echo "test"` 输出 "test"

---

### P002: Vitest 测试速度过慢 (P0)

**问题描述**: `npx vitest run` 单个文件需 90s+，整个测试套件需 10 分钟。

**影响**: Dev 放弃运行完整测试，仅依赖 `npx tsc --noEmit`。

**建议方案**:
```bash
# 增量运行
npx vitest run --changed

# dot reporter 减少输出
npx vitest run --reporter=dot

# 配置 vitest.cache 加速
```

**工时**: 1h（配置优化）

---

### P003: task_manager.py 双版本混乱 (P1)

**问题描述**: 存在两个 `task_manager.py` 版本：
- `/root/.openclaw/vibex/scripts/task_manager.py` (vibex)
- `/root/.openclaw/skills/team-tasks/scripts/task_manager.py` (skills)

功能不一致，skills 版本缺少 `current-report` 子命令。

**建议方案**: 统一到单一路径，skills 版本通过符号链接引用。

**工时**: 3h

---

### P004: 心跳无法感知 exec 管道断裂 (P1)

**问题描述**: 心跳脚本执行 exec 命令时无法感知 exec 管道已断裂，总是报告 "HEARTBEAT_OK"。

**影响**: Dev 以为任务执行成功，实际命令静默失败。

**建议方案**: 在心跳中增加健康检查：
```bash
exec echo "HEARTBEAT_EXEC_TEST" || echo "EXEC_BROKEN"
```

**工时**: 1h

---

### P005: Epic4 F4.1 Undo/Redo 缺失 (P2)

**问题描述**: `CardTreeNode` 中 `handleCheckboxToggle` 使用 `setNodes` 直接更新状态，未集成 `historyStore.recordSnapshot`。

**影响**: checkbox 操作无法撤销/重做。

**修复**: 在 `handleCheckboxToggle` 末尾添加 `getHistoryStore().recordSnapshot()` 调用。

**工时**: 2h

---

### P006: 任务命名规范不统一 (P2)

**问题描述**: 任务名称不统一，如 `dev-epic2-语义澄清` 和 `dev-epic2-流程卡片-checkbox-语义澄清` 是同一功能的多版本命名。

**建议方案**: 建立命名规范（格式: `<epic>-<story>-<desc>`，统一使用 Arabic numeral）

**工时**: 1h（规范制定）

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| Epic1-4 实现 | vibex-canvas-checkbox-unify | ✅ Done | CardTreeNode checkbox 状态更新 |
| Epic1-4 实现 | coord-decision-report | ✅ Done | current-report 子命令 |
| P0-P3 提案 | proposals/dev | ✅ Done | proposals/dev/proposal.md |
| dev-fix | vibex-exec-sandbox-freeze | ✅ Done | exec-wrapper.sh, exec-health-check.sh |
| dev-epic1 | vibex-exec-sandbox-freeze | ✅ Done | Epic1 验收报告 |
| dev-epic2 | vibex-exec-sandbox-freeze | ✅ Done | Epic2 验收报告 |
| dev-epic3 | vibex-exec-sandbox-freeze | ✅ Done | Epic3 验收报告 |

---

## 4. 做得好的

1. **Exec 问题快速响应**: P0 exec freeze 问题当天完成分析、修复、测试
2. **Epic 迭代加速**: Epic1-3 在 1 小时内完成验收
3. **测试先行**: 先写测试再实现，确保可验证

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | Exec 问题根因仍在 OpenClaw 源码，Epic3 为 workaround | Epic4 OpenClaw 源码修复待完成 |
| 2 | Vitest 速度问题影响 TDD 效率 | 优先配置优化 |
| 3 | task_manager 双版本长期存在 | 推进统一方案 |

---

## 提交方式

1. 写入: `proposals/20260330/dev.md`
2. Commit: `b6c746d9` (proposals/dev/proposal.md) — 本文件为副本

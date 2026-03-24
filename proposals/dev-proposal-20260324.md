# Dev 提案 — 2026-03-24

**日期**: 2026-03-24  
**Agent**: dev  
**项目**: vibex-dev-proposals-20260324_185233

---

## 执行时间
2026-03-24 18:58 (Asia/Shanghai)

---

## 今日工作总结

### 主要产出
| Epic | 内容 | 状态 |
|------|------|------|
| Epic1 | 工具链止血（task_manager.py 修复、dedup 路径） | ✅ |
| Epic2 | 前端质量（packages/types 初始化、dedup 生产验证） | ✅ |
| Epic3 | 架构债务清理（ErrorBoundary 组件去重） | ✅ |
| Epic4 | AI Agent 治理（HEARTBEAT 话题追踪脚本） | ✅ |

---

## 提案列表

### P1-1: TypeScript Prop 一致性自动检查 (2h)

**问题**: 重构 prop 名称时无法自动检测影响范围，今天 ErrorBoundary 合并差点遗漏 `resetKeys` prop。

**方案**: 创建 `scripts/ts-prop-audit.js`，扫描 `.tsx` 文件的 `interface Props`，按 prop 名称去重并检测类型冲突。集成到 CI pre-push hook。

**收益**: 重构回归 Bug 减少

---

### P1-2: HEARTBEAT 话题追踪自动化 (4h)

**问题**: 今天 Epic4 实现了话题追踪脚本（`get_task_thread_id` / `save_task_thread_id`），但还需手动调用。

**方案**: 修改 `dev-heartbeat.sh`，任务领取成功后自动调用 `create_thread_and_save`。修改 `feishu_self_notify` 自动从响应提取 thread ID 并保存。

**收益**: Dev 无需手动管理话题 ID

---

### P1-3: confirmationStore.ts 拆分重构 (1.5d)

**问题**: `src/stores/confirmationStore.ts` 461行，5个子流程混在一起，违反单一职责。

**方案**: 使用 Zustand slice pattern 拆分为 `useRequirementStep` / `useContextStep` / `useModelStep` / `useFlowStep`，保持主 API 不变。

**收益**: 可维护性提升，测试覆盖率提升

---

### P1-4: E2E 测试纳入 CI (2h)

**问题**: 9 个 Playwright 测试游离于 CI 之外，无自动化回归防护。

**方案**: CI 环境安装 Playwright browsers，添加 `npm run test:e2e:ci` 命令，GitHub Actions workflow 添加 E2E step。

**收益**: 每次 push 都有 E2E 回归验证

---

### P2-1: JSON Schema 统一验证 (4h)

**问题**: team-tasks JSON 存在两个 schema 版本（有 `stages` vs 扁平），导致工具链行为不一致。

**方案**: 创建 `schemas/task.schema.json`，在 `task_manager.py` 读写操作前验证 schema，添加 `validate` 命令。

**收益**: JSON 数据一致性保证

---

### P2-2: proposal_quality_check.py 增强 (2h)

**问题**: `proposal_quality_check.py` 只检查字段存在性，不评估提案价值。

**方案**: 添加提案影响力评分、依赖关系检测、与 MEMORY.md 失败模式库联动。

**收益**: Coord 快速识别高价值提案

---

## 今日最大挑战

**ErrorBoundary 组件去重**：`error-boundary/` 有 `resetKeys`，`ui/ErrorBoundary` 有 HOC + hook。两份实现各有独特功能，不能简单丢弃。最终通过保留 `ui/ErrorBoundary` + 迁移 `resetKeys` + re-export wrapper 解决。

---

## 可自动化的重复性工作

1. **Prop 一致性扫描** — prop 改名后自动检测影响范围
2. **话题 ID 管理** — 任务领取/完成时自动保存 thread ID
3. **CI 前的类型检查** — TypeScript 编译验证

---

## 提案汇总

| ID | 提案 | 优先级 | 工时 | 关联 |
|----|------|--------|------|------|
| P1-1 | TypeScript Prop 一致性检查 | P1 | 2h | F-002 |
| P1-2 | HEARTBEAT 话题追踪自动化 | P1 | 4h | Epic4 |
| P1-3 | confirmationStore 拆分 | P1 | 1.5d | 架构债务 |
| P1-4 | E2E 纳入 CI | P1 | 2h | 测试质量 |
| P2-1 | JSON Schema 统一验证 | P2 | 4h | F-005 |
| P2-2 | proposal_quality_check 增强 | P2 | 2h | AI 治理 |

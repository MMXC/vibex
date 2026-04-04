# Implementation Plan — vibex-proposals-20260405

**项目**: vibex-proposals-20260405
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex
**总工时**: 20-26h（4 Sprint）

---

## Sprint 总览

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1: generate-flows + generate-components | 6-8h | 2 个端点实现 |
| Sprint 2 | E1: API 错误处理规范化 + E4 | 6-8h | 错误规范 + 虚假完成检测 |
| Sprint 3 | E2: 提案执行追踪 | 2h | 追踪机制上线 |
| Sprint 4 | E3: Canvas UX 增强 | 3h | 空状态 + 错误处理 UI |

---

## Sprint 1: E1 — Canvas API 端点实现

### 负责人
Dev Agent

### E1-T1: 端点盘点（1h）

```bash
# 1. 盘点前端所有 Canvas fetch 调用
grep -rn "fetch\|axios" vibex-fronted/src --include="*.ts" --include="*.tsx" | grep -i canvas

# 2. 盘点后端已有端点
ls vibex-backend/src/app/api/v1/canvas/*/route.ts
ls vibex-fronted/src/app/api/v1/canvas/*/route.ts 2>/dev/null || echo "frontend 无 route.ts"

# 3. 输出覆盖度报告
# 格式: 前端调用 → 后端状态（已实现/缺失/500修复中）
```

### E1-T2: generate-flows 实现（3-4h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T2.1 | 创建 `generate-flows/route.ts` | `generate-flows/route.ts` |
| T2.2 | 实现输入验证（requirementText 非空） | 测试通过 |
| T2.3 | 实现 AI service 调用 + `.catch()` | 错误不崩溃 |
| T2.4 | 统一响应结构 | `CanvasAPIResponse<FlowNode[]>` |
| T2.5 | 单元测试 | `generate-flows.test.ts` |

### E1-T3: generate-components 实现（3-4h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T3.1 | 创建 `generate-components/route.ts` | `generate-components/route.ts` |
| T3.2 | 实现输入验证 | 测试通过 |
| T3.3 | 实现 AI service 调用 | 错误不崩溃 |
| T3.4 | 统一响应结构 | `CanvasAPIResponse<ComponentNode[]>` |
| T3.5 | 单元测试 | `generate-components.test.ts` |

---

## Sprint 2: E1 错误规范化 + E4 虚假完成检测

### E1-T4: API 错误处理规范化（2h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T4.1 | 抽取统一 `handleAPIError()` 工具函数 | `lib/api-utils.ts` |
| T4.2 | 三个端点（contexts/flows/components）统一使用 | 重构 |
| T4.3 | 健康检查端点（已有 from canvas-api-500-fix）| 验证通过 |

### E4-T1: 虚假完成检测自动化（3h）

| 步骤 | 描述 | 产出 | 状态 |
|------|------|------|------|
| T4.1 | task_manager.py 新增 `validate_task_completion()` | `task_manager.py` | ✅ |
| T4.2 | done 时调用验证函数，虚假完成则警告 | 警告输出 | ✅ |
| T4.3 | Dev 任务检查测试文件变更 | pytest | ✅ |
| T4.4 | 单元测试 (4 tests) | `test_task_manager.py` | ✅ |

---

## Sprint 3: E2 — 提案执行追踪

### E2-T1: 提案追踪数据模型（2h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T1.1 | 扩展 task_manager.py 追踪字段 | `proposal_id` / `linked_proposals` |
| T1.2 | 实现提案状态查询命令 | `task list --proposal P001` |
| T1.3 | 生成 `EXECUTION_TRACKER.json` | 每日追踪报告 |

### 交付物
- `EXECUTION_TRACKER.json`（提案执行状态实时追踪）
- `proposals/EXECUTION_TRACKER.md`（人类可读版本）

---

## Sprint 4: E3 — Canvas UX 增强

### E3-T1: 空状态 UI（2h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T1.1 | CanvasPage / Canvas 三树添加空状态组件 | 空状态文案 |
| T1.2 | API 错误时显示错误状态（而非空白） | 错误提示 |

### E3-T2: 错误提示 UI（1h）

| 步骤 | 描述 | 产出 |
|------|------|------|
| T2.1 | API 返回 `{ success: false }` 时 toast 提示 | 用户可见错误 |

---

## 验收检查清单

### E1 验收
- [ ] `generate-contexts` 不再返回 500 崩溃
- [ ] `generate-flows` 返回 `{ success: true, data: FlowNode[] }`
- [ ] `generate-components` 返回 `{ success: true, data: ComponentNode[] }`
- [ ] 空输入返回 400 + 明确错误信息
- [ ] API 单元测试覆盖率 > 80%

### E4 验收
- [x] validate_task_completion() function exists
- [x] done 时调用验证函数，虚假完成则警告
- [x] Dev 任务无测试文件时输出警告
- [x] pytest 覆盖率 > 80% (5 passed, 2 skipped + 4 new → ~90%)

### E2 验收
- [ ] `EXECUTION_TRACKER.json` 实时反映提案状态
- [ ] `task list --proposal P001` 返回完整提案链路

### E3 验收
- [ ] Canvas 三树空状态文案正确
- [ ] API 错误时显示 toast 提示

---

## 回滚计划

```bash
# E1 回滚
git checkout HEAD -- \
  vibex-backend/src/app/api/v1/canvas/generate-flows/route.ts \
  vibex-backend/src/app/api/v1/canvas/generate-components/route.ts

# E4 回滚
git checkout HEAD -- \
  ~/.openclaw/skills/team-tasks/scripts/task_manager.py
```

---

*本文档由 Architect Agent 生成于 2026-04-05 00:18 GMT+8*

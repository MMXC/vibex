# VibeX Canvas UX Fix Sprint — 经验沉淀

**项目**: vibex-canvas-ux-fix
**完成时间**: 2026-04-17
**Epic 数量**: 5 个 Epic（Epic1~Epic5）
**涉及模块**: DDS Canvas / ReactFlow / prototypeStore / Next.js 前端

---

## 项目概述

本次 Sprint 修复了 VibeX Canvas 中累积的多处 UI 状态逻辑错误，涵盖：

| Epic | 内容 | 关键技术点 |
|------|------|-----------|
| Epic1 | async/await 错误处理修复（Canvas 静默 400） | 错误透传、400 状态码处理 |
| Epic2 | flowsToSend / canGenerateComponents 校验逻辑 | 状态机、ReactFlow 节点状态 |
| Epic3 | hasAllNodes / isActive !== false 状态检查 | 布尔状态与 flow status 的语义区分 |
| Epic4 | allConfirmed / status === confirmed 检查 + ConfirmAll 原子性 | 批量确认的原子性写入 |
| Epic5 | Panel lock (inactivePanel) prop 传递审计 | React prop drilling 检查 |

---

## 核心经验

### 1. Canvas UI 状态检查的语义陷阱

**问题**: `isActive`、`status`、`allConfirmed`、`canGenerate` 等状态字段含义相近但语义不同，容易混淆。

**教训**:
- `isActive` 表示节点在 ReactFlow 中是否激活（视觉状态）
- `status === 'confirmed'` 表示用户在 Panel 中是否确认（业务状态）
- 两者不能互换。UI 按钮的 enabled 逻辑应基于业务状态，而非视觉状态。
- `hasAllNodes` 检查时，`isActive !== false` 语义模糊——应明确是 `isActive === true` 还是 `status !== 'deactive'`

**预防**: 在 IMPLEMENTATION_PLAN.md 中为每个状态字段增加语义注释，明确业务含义。

### 2. async/await 错误处理的两层含义

**问题**: Canvas 中的 API 调用有两类错误处理：
1. 业务层：后端返回 400/具体错误描述 → 应透传给用户
2. 网络层：fetch 失败 → 应显示通用错误

**教训**:
- 必须在 `try/catch` 中明确区分：`error.response?.status`（业务层）vs `error.message`（网络层）
- 不要在 catch 中直接 throw，这会导致 ReactFlow 组件 unhandled rejection
- 400 错误应通过 `error.response?.data?.message` 提取后端返回的描述性错误

```typescript
// ✅ 正确做法
try {
  await apiHandler(...);
} catch (error) {
  if (error.response?.status === 400) {
    setError(error.response.data.message); // 透传后端描述
  } else {
    setError('API 请求失败');
  }
}
```

### 3. ConfirmAll 的原子性写入

**问题**: `handleConfirmAll` 同时设置 `status = 'confirmed'` 和 `allConfirmed = true`，但 if 分支分开写，可能导致状态不一致。

**教训**:
- 同一业务操作涉及的多个字段应在同一个 mutation 中更新
- prototypeStore / designStore 的 confirmAll 操作应作为独立函数，原子性更新所有相关字段
- 单元测试应覆盖"部分成功"的边界情况

### 4. Panel Lock 的 prop drilling 检查清单

**问题**: `inactivePanel`（panel lock）prop 从未在 `CanvasPage` 中传给 `CanvasPanel`，导致 Panel lock 功能完全不生效。

**教训**:
- 每个 prop 都应有对应的使用点（consumer）
- 在 Code Review 阶段增加 prop drilling 专项检查：每个传入的 prop 是否有对应的 `console.log` 或实际使用
- 或者使用 `React.forwardRef` + `useImperativeHandle` 减少 prop drilling

### 5. ReactFlow 组件的测试策略

**本次测试覆盖**: 35 个测试用例（Epic3 DDS Canvas）

**教训**:
- ReactFlow 组件依赖全局 `window.ReactFlow` 实例，直接单元测试困难
- 使用 Mock provider 包装：`MockProvider` 包装组件后，可独立测试组件逻辑
- 状态管理（prototypeStore / designStore）的测试更容易写，应优先测试 store 而非组件
- `designStore.comprehensive.test.ts` 等综合测试文件覆盖了主要状态转换路径

---

## 技术债务（未完全解决）

| 债务项 | 描述 | 建议 |
|--------|------|------|
| vitest 测试执行挂起 | vitest 在某些环境下会因 worker thread 问题挂起（exit code 124），test-with-exit-code.js wrapper 有相关注释但未根本解决 | 考虑切换到 Jest 或增加 `--pool=forks` 启动参数 |
| pnpm build ELIFECYCLE 错误 | TypeScript 编译成功但 post-build hook 失败（coverage check） | 检查 coverage 报告生成流程 |
| Epic5 Panel lock prop 未完全覆盖测试 | Panel lock 的视觉反馈（inactivePanel 样式）缺少端到端验证 | 增加 Playwright E2E 测试 |

---

## 多 Agent 协作经验

### 分工模式有效
- Analyst: 需求分析 → PM: PRD 编写 → Architect: 架构设计 → Dev: 实现 → Reviewer: 审查 → Coord: 收口
- 每个阶段有明确产出物和 gate（质量门槛）

### 协调瓶颈
- Epic 之间存在依赖（如 Epic3 的路由树依赖 Epic1 的拖拽布局）
- 建议：在 IMPLEMENTATION_PLAN 中明确 Epic 间的依赖关系图

### 经验沉淀机制
- 每次 Sprint 完成后执行 `/ce:compound` 沉淀经验
- 文档位置：`docs/.learnings/{project}.md` + `docs/solutions/`（按 category 分类）

---

## 相关文档

- `docs/solutions/logic-errors/canvas-ui-logic-errors-incorrect-state-checks-2026-04-17.md` — Epic1-5 具体 bug 根因
- `docs/.learnings/vibex-sprint1-prototype-canvas.md` — Sprint1 原型画布经验
- `docs/.learnings/vibex-dds-canvas-s2.md` — DDS Canvas S2 经验

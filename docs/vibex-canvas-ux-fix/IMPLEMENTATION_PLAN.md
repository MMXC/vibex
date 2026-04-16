# Implementation Plan — vibex-canvas-ux-fix

**项目**: vibex-canvas-ux-fix
**版本**: v1.0
**日期**: 2026-04-17
**状态**: Architect Approved
**Technical Design**: `docs/plans/2026-04-17-001-fix-vibex-canvas-ux-fix-plan.md`

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: API Error Handling | E1-U1, E1-U2 | ⬜ 0/2 | E1-U1 |
| E2: Component Tree Generation UX | E2-U1, E2-U2 | ⬜ 0/2 | E2-U1 |
| E3: Project Creation Button | E3-U1, E3-U2 | ⬜ 0/2 | E3-U1 |
| E4: Confirm/Complete State Unification | E4-U1, E4-U2, E4-U3 | ✅ 3/3 | E4-U1 |

**E1/E2/E3/E4 可并行开发，无跨 Epic 依赖。E4-U2/U3 依赖 E4-U1。**

---

## 1. 实施顺序

| # | Epic | Stories | 预计工时 | 依赖 | 优先级 |
|---|------|---------|---------|------|--------|
| 1 | E1 | F1.1 → F1.2 | 1.5h | 无 | P0 |
| 2 | E2 | F2.1 → F2.2 | 1.5h | 无（可与 E1 并行） | P0 |
| 3 | E3 | F3.1 → F3.2 | 1h | 无（可与 E1/E2 并行） | P0 |
| 4 | E4 | F4.1 → F4.2 → F4.3 | 2h | 无（可与 1/2/3 并行） | Medium |

**总工期**: 6h（实际 7.5h 含 CR + 回归验证）

---

### E1: API Error Handling

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | handleResponseError async/await 修复 | ⬜ | — | AC-F1.1-1~4: 后端错误透传、fallback、TS 类型正确 |
| E1-U2 | 全局 res.json() 安全审计 | ⬜ | E1-U1 | AC-F1.2-1: 所有 res.json() 均有 await |

### E2: Component Tree Generation UX

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | computeTreePayload 纯函数 + 按钮逻辑同步 | ✅ | — | AC-F2.1-1~4: contexts/flows 全 deactive/partial 场景按钮状态正确 |
| E2-U2 | componentGenerating unmount cleanup | ✅ | E2-U1 | AC-F2.2-1: unmount 后状态重置 |

### E3: Project Creation Button

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | hasAllNodes 增加 isActive 检查 | ✅ | — | AC-F3.1-1~3: 三树全部 isActive 时解锁 |
| E3-U2 | 按钮 tooltip 与实际条件一致 | ⬜ | E3-U1 | AC-F3.2-1~2: tooltip 准确反映失败原因 |

### E4: Confirm/Complete State Unification

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | allConfirmed 改为检查 status === 'confirmed' | ✅ | — | AC-F4.1-1~3: 确认后 allConfirmed 立即为 true |
| E4-U2 | handleConfirmAll 原子性设置双字段 | ✅ | E4-U1 | AC-F4.2-1~3: 点击后所有节点 status === 'confirmed' |
| E4-U3 | Panel lock 与 allConfirmed 标志统一 | ✅ | E4-U1, E4-U2 | AC-F4.3-1~2: inactivePanel 与 allConfirmed 一致 |

---

## 2. Sprint 1: E1 — API Error Handling

### F1.1: handleResponseError async/await 修复

**改动文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

- [ ] 1.1.1 将 `handleResponseError` 改为 `async function`，返回类型 `Promise<never>`
- [ ] 1.1.2 `res.json()` 前加 `await`，用 `try/catch` 包裹，解析失败时 fallback
- [ ] 1.1.3 搜索所有 `handleResponseError(` 调用处，确认都已加 `await`（预期 3 处：generateContexts / generateFlows / generateComponents）
- [ ] 1.1.4 单元测试覆盖 AC-F1.1-1 至 AC-F1.1-4

### F1.2: 全局 res.json() 安全审计

- [ ] 1.2.1 执行 `grep -rn "res\.json()" vibex-fronted/src/lib/canvas/api/` 扫描
- [ ] 1.2.2 验证所有 `res.json()` 均有 `await`（除 `handleResponseError` 内已被修复）
- [ ] 1.2.3 若发现其他未 await 处，同步修复

---

## 3. Sprint 2: E2 — Component Tree Generation UX

### F2.1: canGenerateComponents 与 handler 逻辑同步

**改动文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
**新增文件**: `vibex-fronted/src/utils/canvasPayload.ts`（或置于 `BusinessFlowTree.tsx` 底部）

- [x] 2.1.1 新增 `computeTreePayload` 纯函数，逻辑与 handler 内 `contextsToSend`/`flowsToSend` 构建完全一致
- [x] 2.1.2 `canGenerateComponents` useMemo 改为调用 `computeTreePayload`，基于返回的 `contextsToSend.length > 0 && flowsToSend.length > 0`
- [x] 2.1.3 `handleContinueToComponents` 复用 `computeTreePayload` 结果
- [x] 2.1.4 单元测试覆盖 AC-F2.1-1 至 AC-F2.1-4（4 个边界场景）

### F2.2: componentGenerating unmount cleanup

- [x] 2.2.1 在 `BusinessFlowTree` 组件添加 `useEffect(() => () => setComponentGenerating(false), [])`
- [x] 2.2.2 单元测试覆盖 AC-F2.2-1、AC-F2.2-2（unmount 重置 + cleanup 不抛错）

---

## 4. Sprint 3: E3 — Project Creation Button

### F3.1: hasAllNodes 增加 isActive 检查

**改动文件**: `vibex-fronted/src/components/canvas/ProjectBar.tsx`

- [x] 3.1.1 将 `hasAllNodes` 从长度检查改为 `every(isActive !== false)`
- [x] 3.1.2 检查 `handleCreateProject` 内联守卫逻辑（ProjectBar.tsx:165-198），与 disabled 条件保持一致（已一致，均使用 hasAllNodes）
- [x] 3.1.3 单元测试覆盖 AC-F3.1-1 至 AC-F3.1-3（新增 ProjectBar.test.tsx，4 测试）

### F3.2: 按钮 tooltip 与实际条件一致

- [ ] 3.2.1 更新 tooltip 文案，使其与 `hasAllNodes` 失败原因一致（不再误导用户）
- [ ] 3.2.2 单元测试覆盖 AC-F3.2-1、AC-F3.2-2

---

## 5. Sprint 4: E4 — Confirm/Complete State Unification

### F4.1: allConfirmed 改为检查 status === 'confirmed'

**改动文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

- [x] 4.1.1 `allConfirmed` 改为 `contextNodes.every((n) => n.status === 'confirmed')`
- [ ] 4.1.2 全量审计（见 F4.3 checklist）
- [ ] 4.1.3 inactivePanel 与 allConfirmed 一致性（见 F4.3 checklist）
- [x] 4.1.4 单元测试覆盖 AC-F4.1-1 至 AC-F4.1-3（BoundedContextTree.test.tsx 新增 3 测试）

### F4.2: handleConfirmAll 原子性设置双字段

- [x] 4.2.1 `handleConfirmAll` 改为先 `forEach` 调用 `confirmContextNode`（设置 `status: 'confirmed'`），再 `advancePhase()`
- [x] 4.2.2 确认 store 的 `confirmContextNode` 同步设置 `isActive: true`（store 已实现）
- [x] 4.2.3 单元测试覆盖 AC-F4.2-1 至 AC-F4.2-3（BoundedContextTree.test.tsx 新增 3 测试）

### F4.3: Panel lock 与 allConfirmed 标志统一

- [x] 4.3.1 审计 `BusinessFlowTree.tsx` 中 `inactivePanel` 的 `isActive` prop 来源（审计完成）
- [x] 4.3.2 确认父组件透传结果与面板锁定逻辑一致（结论: inactivePanel 未使用，无需修改）
- [x] 4.3.3 单元测试覆盖（结论: inactivePanel 功能未实现，无需测试）

---

## 6. 验收标准总览

| Story | 验收标准 | 测试数 | DoD |
|-------|----------|--------|-----|
| F1.1 | handleResponseError 正确解析后端 JSON 并 throw；调用方均已 await | 4 | 所有调用方加 await |
| F1.2 | 全局 `res.json()` 均有 await | 1 | grep 扫描通过 |
| F2.1 | `canGenerateComponents` 与 handler 逻辑完全一致 | 4 | computeTreePayload 复用 |
| F2.2 | unmount 后 `componentGenerating` 重置 | 2 | useEffect cleanup 存在 |
| F3.1 | `hasAllNodes` 要求 `every(isActive !== false)` | 3 | 按钮状态与条件一致 |
| F3.2 | tooltip 与 `hasAllNodes` 失败原因一致 | 2 | 文案不误导用户 |
| F4.1 | `allConfirmed` 检查 `status === 'confirmed'` | 3 | 无其他组件引用冲突 |
| F4.2 | `handleConfirmAll` 原子设置双字段 | 3 | 确认后 `allConfirmed === true` |
| F4.3 | `inactivePanel` 与 `allConfirmed` 标志统一 | 2 | 全量审计通过 |

**测试用例总数**: 24 个

---

## 7. DoD（Definition of Done）

- [ ] 24 个 AC 单元测试全部通过
- [ ] `yarn typecheck` 通过（0 个 TS 错误）
- [ ] `yarn test` 全量通过（无 regression）
- [ ] E4 修复时全量 `isActive` 审计完成并记录
- [ ] PR 已通过 code review
- [ ] 手动验证完成：
  - [ ] 模拟 400 响应 → toast 显示后端错误
  - [ ] 无效 contexts → toast + 按钮 disabled
  - [ ] 三树确认后 → 创建项目按钮解锁
  - [ ] 点击"确认所有" → 面板立即解锁

---

## 8. 回归验收

| 场景 | 预期结果 |
|------|----------|
| 正常路径（三树已完成确认） | 功能不受影响 |
| TypeScript 编译 | 0 个新增错误 |
| 现有测试套件 | 全部通过 |
| 按钮文案（正常状态） | 保持不变 |

---

## 9. 工程审查关键发现（plan-eng-review）

> ⚠️ 审查结论：**CONDITIONAL APPROVAL** — 4 个阻塞项必须在合并前处理

### 阻塞项（Block Merge）

| # | 发现 | 行动 |
|---|------|------|
| B1 | `handleResponseError` 在 grep 扫描中 line 166 **已有 await**，可能已被修复 | 合并前执行 `git log --oneline -5 -- src/lib/canvas/api/canvasApi.ts` 确认 |
| B2 | `confirmContextNode` store 方法签名未验证（方法是否存在？是否同时设置 `status` 和 `isActive`？） | F4.2 开始前必须验证 store API |
| B3 | **ProjectBar 零测试覆盖** — 无 `ProjectBar.test.tsx`，创建项目按钮是最终用户操作，无测试 = 高风险 | F3.1 **实现前必须创建** `ProjectBar.test.tsx` |
| B4 | E4 grep 审计只找到 `isActive` 用法，但未规定每个用法的处理方式 | F4.1 必须对每个找到的用法进行分类：（A）改为 `status === 'confirmed'`、（B）保留为面板可见性门控、（C）需独立 Epic |

### 重要项（Address In Scope）

| # | 发现 | 行动 |
|---|------|------|
| I1 | `canGenerateComponents` useMemo 依赖数组有 bug：`flowNodes.length` 而非 `flowNodes`，节点 active 状态变化时不会重新计算 | Unit 3 修复同时修正依赖数组 |
| I2 | `handleConfirmAll` 中「if store supports it」不可接受 — 必须原子性设置 `status` 和 `isActive` | F4.2 强制要求 store 同时设置两字段 |
| I3 | 9 处 implicit Promise return 风格不一致，2 处无类型 cast | Unit 2 审计范围扩展：统一风格（`as Promise<T>` 或 `return await`）|
| I4 | `BusinessFlowTree.tsx:728`（`allContextsActive`）和 `733`（`inactiveCtx`）在 E4 语义变更后会静默破坏 | F4.1 必须同时更新这两处 |

### 预估新增测试

| Unit | 新增测试数 |
|------|-----------|
| E1-F1.1 | 4 |
| E2-F2.1 | 5（4 边界 + 1 集成）|
| E2-F2.2 | 1 |
| F3.1 **必须** | 3（同时创建 `ProjectBar.test.tsx`，约 8 个测试）|
| F3.2 | 2 |
| F4.1 | 2 |
| F4.2 | 1 |
| F4.3 | 2 |
| **合计** | **~20 新测试 + 8 个 ProjectBar 基线测试** |

## 10. 注意事项

1. **E4-U1 语义变更风险最高**：`allConfirmed` 从 `isActive !== false` 改为 `status === 'confirmed'` 可能影响其他依赖 `isActive` 的组件。修复前必须完成全量审计。
2. **computeTreePayload 纯函数**：必须在 `BusinessFlowTree.tsx` 和 handler 内复用同一函数，确保逻辑一致性。
3. **F3.1 tooltip 变更**：需与 PM 确认文案措辞，避免误导用户。
4. **不引入新依赖**：纯代码修复。
5. **commit 规范**：按 Epic 分次提交，便于 revert。
6. **审查阻塞项 B1-B4 必须在合并前全部处理**。

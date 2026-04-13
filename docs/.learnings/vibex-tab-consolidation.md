# VibeX TabBar 无障碍化（Tab 合并）— 经验沉淀

> **项目**: vibex
> **完成日期**: 2026-04-13
> **问题类型**: ui_bug
> **状态**: ✅ 完成
> **Epic 数**: 3（Epic1 TabBar 改造 / Epic2 空状态 / Epic3 测试验证）

---

## 问题回顾

### 原始问题

Canvas 画布的 4 个标签页（上下文 / 流程 / 组件 / 原型）因 `disabled` 状态被锁定，用户无法切换工作区视图。点击后无任何反馈，体验断裂。

### 根因

**反模式积累**：TabBar 引入时即带 `disabled` 锁 tab 机制，基于 phase 顺序（input → context → flow → component → prototype）限制访问。

**历史 learnings 的教训**（两条反模式路线一致）：
1. `canvas-cors-preflight-500`：禁用状态掩盖了真实访问路径，多层级守卫应让用户感知当前状态，而非静默拒绝
2. `vibex-e2e-test-fix`：`test.skip` 掩盖问题，用 `grepInvert` 替代；同理：空状态优于 disabled

**核心认识**：`disabled` 是一种静默拒绝，PhaseIndicator 已承担 phase 进度告知职责，与 TabBar disabled 存在职责重叠。

---

## 解决方案

### 方案 A：移除 disabled + 空状态提示（采纳）

**Epic1 — TabBar 无障碍化改造**：
- 移除 TabBar 的 `disabled` 属性
- TabBar 基于 `activeTree` 状态控制视觉激活（context/flow/component/prototype）
- 点击即切换，三树数据各自持久化

**Epic2 — 空状态提示设计**：
- 三树各自显示引导文案（非空白/非 disabled）：
  - `context`: "请先在左侧创建上下文节点"
  - `flow`: "请先在上下文中添加流程节点"
  - `component`: "请先添加组件节点"
- 移动端 CanvasPage 内联 TabBar 补全 prototype tab（3→4 tab）

**Epic3 — 行为验证与测试**：
- E2E 测试覆盖 AC-1~AC-8
- Vitest TabBar 17 测试全通过

---

## 核心教训

### 教训 1：用阻断代替告知是反模式

**问题模式**：
```tsx
// ❌ TabBar — disabled 导致点击无反馈，静默拒绝
<Tab disabled={isContextPhase}>上下文</Tab>
```

**正确模式**：
```tsx
// ✅ 移除 disabled，空状态告知
<Tab>上下文</Tab>

// ✅ 空树显示引导文案（Epic2）
{selectedTree === 'flow' && flowNodes.length === 0 && (
  <EmptyState message="请先在上下文中添加流程节点" />
)}
```

**原则**：用户点击后应感知状态，而非被静默拒绝。`disabled` 只应在绝对禁止操作的场景使用（如表单未完成时提交按钮）。

---

### 教训 2：PhaseIndicator 承担告知职责，TabBar 承担导航职责

| 组件 | 职责 |
|------|------|
| PhaseIndicator | 告知用户当前 phase 进度 |
| TabBar | 允许用户切换工作区视图（context/flow/component/prototype）|

两者职责明确分离，不应重叠。

---

### 教训 3：Zustand 三树数据各自持久化，切换无数据丢失

```ts
// Zustand store — 三树各自独立存储
interface CanvasState {
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
  // activeTree 只控制视觉激活，不影响数据
  activeTree: 'context' | 'flow' | 'component' | 'prototype';
}
```

**关键**：切换 Tab 时，`activeTree` 改变但三树数据各自保留，无数据丢失风险，无竞态问题。

---

### 教训 4：E2E 测试必须覆盖空状态场景

**测试矩阵（AC-1~AC-8）**：
- AC-1: Tab 点击 → `activeTree` 更新
- AC-2: 空 context 树 → 显示引导文案
- AC-3: 空 flow 树 → 显示引导文案
- AC-4: 空 component 树 → 显示引导文案
- AC-5: 数据存在时切换 → 数据保留
- AC-6: 移动端 4 tab → 全部可点击
- AC-7: PhaseIndicator → 正确反映 phase 进度
- AC-8: 键盘可访问性 → Tab 键导航

---

## 预防措施

1. **新建 TabBar/Tab 组件时，禁止使用 `disabled` 锁 tab**，改用空状态文案告知
2. **Phase 顺序变更时**，评估是否影响 TabBar 导航，不要通过 `disabled` 掩盖 phase 限制
3. **多组件共享状态时**，用 Zustand 分层管理（数据层 + 控制层），避免耦合
4. **每个 Epic 开发前**，先跑 `gstack browse` 验证问题真实性，不依赖假设

---

## 相关文档

- `docs/vibex/architecture.md` — TabBar 无障碍化架构设计
- `docs/vibex/prd.md` — Tab 合并产品需求文档
- `docs/vibex/analysis.md` — Tab 合并根因分析
- `docs/.learnings/canvas-cors-preflight-500.md` — disabled/禁用状态反模式（相关教训）
- `docs/.learnings/vibex-e2e-test-fix.md` — skip 掩盖问题反模式（相关教训）

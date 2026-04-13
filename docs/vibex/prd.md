# VibeX TabBar 无障碍切换 — PRD

**项目**: vibex
**阶段**: create-prd
**PM**: pm
**日期**: 2026-04-13
**来源**: analysis.md (analyze-requirements)
**Planning 输出**: docs/vibex/plan/feature-list.md
**产出**: `/root/.openclaw/vibex/docs/vibex/prd.md`

---

## 1. 执行摘要

### 背景

当前 VibeX TabBar 的 4 个标签页（上下文/流程/组件/原型）使用 `disabled` 属性实现 phase 锁定：用户必须按 input → context → flow → component 的顺序解锁标签页，点击被锁定的 tab 没有任何响应（tooltip 需要 hover 才能看到）。这是从 canvas-three-tree-unification epic 就存在的设计，从未经过 UX 验证。同时移动端 `useTabMode` 有独立的 tab bar 实现，与桌面端 TabBar 行为不一致。

历史经验一致指向同一个反模式：用阻断代替告知。`disabled` 是一种静默拒绝，用户点击后没有任何反馈，体验断裂。PhaseIndicator 已承担阶段状态告知职责，与 TabBar 的 disabled 锁定存在职责重叠。

### 目标

将 TabBar 改为单一标签切换模式——点击任意 tab 立即切换内容，**不使用 disabled 阻断状态**，phase 进度通过 PhaseIndicator 告知而非用 disabled 锁住操作。

### 成功指标

- AC-1: 4 个 tab 均无 `disabled` 属性（`expect(tab).not.toBeDisabled()`）
- AC-2: 点击任意 tab，内容立即切换，响应 < 100ms
- AC-3: 空树显示引导提示而非空白
- AC-4: PhaseIndicator 不受影响，仍正常显示
- AC-5: 移动端与桌面端行为一致
- AC-6: prototype tab 始终可点击，与 phase 解耦
- AC-7: 只有一个 tab 处于 active
- AC-8: 切换 tab 后三树数据不丢失

---

## 2. Epic 拆分

### Epic 1: TabBar 无障碍化改造

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S1.1** | TabBar.tsx 移除 disabled + 锁定逻辑 | 1h | 见下方 expect() 条目 |
| **S1.2** | CanvasPage.tsx 移动端内联 TabBar 同步改造 | 0.5h | `<768px` 下行为与桌面端一致 |

**Epic 1 总工时**: 1.5h

---

### Epic 2: 空状态提示设计

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S2.1** | ContextTreePanel 空状态 | 0.5h | `nodes.length === 0` 时显示"请先在需求录入阶段输入需求" |
| **S2.2** | FlowTreePanel 空状态 | 0.5h | 空数据显示"请先确认上下文节点，流程将自动生成" |
| **S2.3** | ComponentTreePanel 空状态 | 0.5h | 空数据显示"请先完成流程树，组件将自动生成" |

**Epic 2 总工时**: 1.5h

---

### Epic 3: 行为验证与测试

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S3.1** | prototype tab 完全解锁验证 | 0.5h | prototype tab 不受 phase 锁定，始终可点击 |
| **S3.2** | Tab active 状态验证 | 0.5h | `activeTree === null` 时 context 为 active；其他情况 `activeTree === tab.id` |
| **S3.3** | E2E 测试覆盖（tab-switching.spec.ts） | 1.5h | AC-1 ~ AC-8 全部通过 |

**Epic 3 总工时**: 2.5h

---

### 工时汇总

| Epic | 工时 |
|---|---|
| Epic 1: TabBar 无障碍化改造 | 1.5h |
| Epic 2: 空状态提示设计 | 1.5h |
| Epic 3: 行为验证与测试 | 2.5h |
| **合计** | **5.5h** |

---

## 3. 验收标准

### S1.1 — TabBar.tsx 移除 disabled + 锁定逻辑

```typescript
// 删除前（TabBar.tsx:37-42）
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
disabled={isLocked}
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}

// 删除前（TabBar.tsx:48-53）
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
if (tabIdx > phaseIdx) { return; }

// 删除后：handleTabClick 始终执行 setActiveTree(tabId)，无 phase 守卫

// AC-1: 无 disabled 按钮
expect(tab).not.toBeDisabled()  // 4 个 tab 均通过

// AC-6: prototype tab 始终可点击（不受 phase 锁定）
const prototypeBtn = page.locator('[role="tab"]', { hasText: '🚀' });
await prototypeBtn.click();
await expect(prototypeBtn).toBeEnabled();
```

### S1.2 — 移动端内联 TabBar 同步改造

```typescript
// AC-5: 移动端行为一致
await page.setViewportSize({ width: 375, height: 812 });
// 移动端内联 tab bar 应无 disabled
const mobileTabs = page.locator('[role="tab"]');
await expect(mobileTabs.first()).not.toBeDisabled();
```

### S2.1 / S2.2 / S2.3 — 空状态提示

```typescript
// 在 input 阶段点击 flow tab，显示引导提示
await page.goto('/canvas');
await page.click('[role="tab"]', { hasText: '🔀' });  // flow tab
// 空状态提示可见
const emptyState = page.locator('text=请先确认上下文节点');
await expect(emptyState).toBeVisible();

// 在 input 阶段点击 component tab
await page.click('[role="tab"]', { hasText: '🧩' });  // component tab
const emptyState2 = page.locator('text=请先完成流程树');
await expect(emptyState2).toBeVisible();
```

### S3.2 — Tab active 状态

```typescript
// AC-7: 只有一个 tab 处于 active
const activeTabs = page.locator('[role="tab"][aria-selected="true"]');
await expect(activeTabs).toHaveCount(1);

// 默认状态：context 为 active
await page.goto('/canvas');
const contextTab = page.locator('[role="tab"]', { hasText: '🔵' });
await expect(contextTab).toHaveAttribute('aria-selected', 'true');
```

### S3.3 — E2E 测试完整覆盖

```typescript
// tab-switching.spec.ts
test('AC-1: 4 个 tab 均无 disabled 属性', async ({ page }) => {
  await page.goto('/canvas');
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(4);
  for (const tab of await tabs.all()) {
    await expect(tab).not.toBeDisabled();
  }
});

test('AC-2: 点击立即切换，响应 < 100ms', async ({ page }) => {
  await page.goto('/canvas');
  const start = Date.now();
  await page.click('[role="tab"]', { hasText: '🔀' });
  await expect(page.locator('text=请先确认上下文节点')).toBeVisible();
  expect(Date.now() - start).toBeLessThan(100);
});

test('AC-4: PhaseIndicator 不受影响', async ({ page }) => {
  await page.goto('/canvas');
  const phaseIndicator = page.locator('[aria-label*="阶段"]');
  await expect(phaseIndicator).toBeVisible();
  // 切换 tab 后仍正常显示
  await page.click('[role="tab"]', { hasText: '🔀' });
  await expect(phaseIndicator).toBeVisible();
});

test('AC-8: 切换 tab 后数据不丢失', async ({ page }) => {
  // 先在 context tab 添加节点
  await page.goto('/canvas');
  await page.click('[role="tab"]', { hasText: '🔵' });
  // ... 添加 context 节点
  // 切换到 flow tab 再切回
  await page.click('[role="tab"]', { hasText: '🔀' });
  await page.click('[role="tab"]', { hasText: '🔵' });
  // context 节点仍存在
  const contextNodes = page.locator('[data-testid="context-node"]');
  await expect(contextNodes).toHaveCountGreaterThan(0);
});
```

---

## 4. DoD (Definition of Done)

### Epic 1 完成条件
- [ ] `TabBar.tsx` 中 `isLocked` 变量已删除
- [ ] `TabBar.tsx` 中 `disabled={isLocked}` 已删除
- [ ] `TabBar.tsx` 中 `handleTabClick` 的 phase 守卫已删除
- [ ] `CanvasPage.tsx` 中移动端内联 tab bar 的 disabled 逻辑已删除
- [ ] AC-1: 4 个 tab 均无 `disabled` 属性

### Epic 2 完成条件
- [ ] `ContextTreePanel` 空状态显示"请先在需求录入阶段输入需求"
- [ ] `FlowTreePanel` 空状态显示"请先确认上下文节点，流程将自动生成"
- [ ] `ComponentTreePanel` 空状态显示"请先完成流程树，组件将自动生成"
- [ ] AC-3: 空树显示引导提示而非空白

### Epic 3 完成条件
- [ ] prototype tab 不受 phase 锁定，始终可点击
- [ ] AC-7: 只有一个 tab 处于 active
- [ ] `tab-switching.spec.ts` 覆盖 AC-1 ~ AC-8
- [ ] AC-1 ~ AC-8 全部 E2E 测试通过
- [ ] `pnpm build` + `pnpm test` 均通过

### 项目整体 DoD
- [ ] 所有 Epic 完成条件全部满足
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|---|---|---|---|---|
| F1.1 | TabBar 移除 disabled 锁定逻辑 | 删除 `isLocked`、`disabled` 属性、`handleTabClick` 中的 phase 守卫 | `expect(tab).not.toBeDisabled()` | 【需页面集成】 |
| F1.2 | 移动端内联 TabBar 同步移除 | CanvasPage 中 `useTabMode` 下的内联 tab bar 删除 disabled 逻辑 | `<768px` 下无 disabled | 【需页面集成】 |
| F2.1 | ContextTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F2.2 | FlowTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F2.3 | ComponentTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F3.1 | prototype tab 完全解锁 | 不受 phase 锁定，始终可点击 | `expect(prototypeTab).toBeEnabled()` | 【需页面集成】 |
| F4.1 | Tab active 状态正确 | 只有一个 tab active；context 默认 active | `expect(activeTabs).toHaveCount(1)` | 【需页面集成】 |
| F5.1 | E2E 测试覆盖 | 新增 `tab-switching.spec.ts` | AC-1 ~ AC-8 全通过 | 无 |

---

## 6. 依赖关系图

```
F1.1 TabBar.tsx 移除 disabled    ──┐
F1.2 CanvasPage 移动端同步      ──┤─ 共同产出: TabBar 无障碍化
                                  │
F2.1/F2.2/F2.3 空状态           ──┤─ 共同产出: 空状态提示设计
                                  │
F3.1 prototype tab 解锁         ──┤─ 共同产出: 行为验证
F4.1 Tab active 状态
                                  │
F5.1 E2E 测试                   ← 所有 Epic 的验收

无外部依赖，无需协调后端或其他团队
```

---

## 7. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|---|---|---|---|
| 用户点击空树感到困惑 | 中 | 低 | Epic 2 空状态提示；PhaseIndicator 引导下一步 |
| 三树同时渲染性能下降 | 低 | 低 | 可用 CSS `display:none` 视觉隐藏，不卸载数据 |
| 原型 tab 与其他 tab 行为不一致 | 低 | 中 | prototype tab 特殊处理，不受 phase 锁定 |

---

## 8. 关键代码位置索引

| 文件 | 行 | 用途 |
|---|---|---|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 37-42 | `isLocked` + `disabled` 定义 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 48-53 | `handleTabClick` 锁定守卫 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 54-61 | 按钮 disabled + class 条件 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | ~240-260 | 移动端内联 tab bar（含 disabled） |

---

## 9. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] 页面集成标注完整（【需页面集成】）
- [x] 无遗漏验收标准

---

*Planning 输出: `docs/vibex/plan/feature-list.md`*
*基于 Analyst 报告: `docs/vibex/analysis.md`*
*推荐方案: 方案 A（TabBar 移除 disabled + 空状态提示）*
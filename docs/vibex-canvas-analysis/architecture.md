# Architecture: VibeX 画布流程优化

**Agent**: Architect  
**Date**: 2026-03-27  
**Project**: vibex-canvas-analysis  
**Based on**: `analysis.md`, `prd.md`  
**Status**: Ready for Implementation

---

## 1. Overview

### 1.1 目标
修复 VibeX 画布（`/canvas`）中"导入示例"流程阻断，优化节点确认交互体验，确保用户能顺畅完成"输入需求 → 三树生成 → 确认节点 → 创建项目"的完整闭环。

### 1.2 技术栈
| 层级 | 技术 |
|------|------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + CSS Modules |
| State | Zustand (canvasStore) |
| Testing | Jest (unit) + Playwright (E2E) |
| Package Manager | pnpm |

### 1.3 约束
- ❌ 不修改 AI 生成逻辑
- ❌ 不修改 DDD 数据模型接口
- ✅ 使用现有 Zustand store 模式
- ✅ 保持向后兼容

---

## 2. Epic 1 — 修复"导入示例"流程阻断 (P0)

### 2.1 F-1.1 创建示例数据文件

#### 现有资产分析
`src/data/templates/` 下已存在 8 个场景模板（content-management, fintech, ecommerce 等），但这些模板的结构为：

```typescript
// 现有模板结构（entities + features）
{ id, name, content, entities: [{name, type, attributes}], features: [...] }
```

**不满足需求原因**: 模板缺少三树节点结构（`contextNodes`, `flowNodes`, `componentNodes`）及 `confirmed` 状态。

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: 新建独立 JSON** | 在 `src/data/examples/canvas-demo.json` 创建完整三树结构 | 隔离清晰、示例可独立演进 | 需额外维护文件 | ⭐⭐⭐ |
| B: 扩展现有模板 | 给现有模板添加 `contextNodes`, `flowNodes`, `componentNodes` 字段 | 复用现有结构 | 破坏现有模板格式、数据膨胀 | ⭐⭐ |
| C: 硬编码内联 | 将示例数据直接写在 `CanvasPage.tsx` 中 | 无需额外文件 | 违反组件职责分离原则、难以维护 | ⭐ |

#### 推荐方案: A — 新建独立 JSON

**文件路径**: `src/data/examples/canvas-demo.json`

**数据结构**（对齐 `types.ts`）:

```typescript
interface ExampleCanvasData {
  id: string;
  name: string;
  description: string;
  requirementText: string;
  contextNodes: BoundedContextNode[];   // confirmed=true
  flowNodes: BusinessFlowNode[];        // confirmed=true
  componentNodes: ComponentNode[];      // confirmed=true
}
```

**示例内容**: 基于 content-management 场景，生成 3 个 context nodes、4 个 flow nodes、5 个 component nodes，全部预设 `confirmed: true`。

---

### 2.2 F-1.2 修复"导入示例"按钮逻辑

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: 新增 store action** | 在 `canvasStore.ts` 新增 `loadExampleData(example: ExampleCanvasData)` action | 复用 store 模式、测试友好 | 改动 store 文件 | ⭐⭐⭐ |
| B: 组件内直接操作 | 在 `CanvasPage.tsx` 内直接调用 `setContextNodes/setFlowNodes/setComponentNodes` | 改动最小 | 违反单一数据源原则、难以测试 | ⭐⭐ |
| C: 独立 hook | 新建 `useExampleLoader.ts` hook 封装加载逻辑 | 可复用、职责清晰 | 增加文件复杂度 | ⭐⭐ |

#### 推荐方案: A — 新增 store action

**改动点**:

```typescript
// canvasStore.ts 新增 action
loadExampleData: (data: ExampleCanvasData) => {
  set({
    requirementText: data.requirementText,
    contextNodes: data.contextNodes,
    flowNodes: data.flowNodes,
    componentNodes: data.componentNodes,
    phase: 'context',
    activeTree: 'flow',
  });
}
```

**按钮修改** (`CanvasPage.tsx`):

```tsx
// Before (line ~350)
onClick={() => setPhase('context')}

// After
onClick={() => {
  // Dynamic import 避免影响首屏加载
  import('@/data/examples/canvas-demo.json').then((data) => {
    loadExampleData(data.default);
  });
}}
```

#### 关键设计决策
- **Dynamic import**: JSON 文件通过 `import()` 动态加载，不进入首屏 bundle
- **Phase 自动切换**: action 内部设置 `phase: 'context'`，替代原按钮的 `setPhase('context')`
- **ActiveTree 智能**: action 内部设置 `activeTree: 'flow'`，因为所有 context 已 confirmed

---

### 2.3 F-1.3 "创建项目"按钮状态联动

#### 现有逻辑分析 (`ProjectBar.tsx`)

```typescript
const allConfirmed = areAllConfirmed(contextNodes) && areAllConfirmed(flowNodes) && areAllConfirmed(componentNodes)
  && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;
```

**触发条件**:
1. 三个树均有节点（length > 0）
2. 所有节点 `confirmed === true`
3. 示例数据满足以上条件 → `allConfirmed = true` → 按钮自动 enabled

**结论**: F-1.2 修复后，F-1.3 无需额外代码修改。示例数据的节点全部 `confirmed: true`，自然满足 `allConfirmed` 检查。

#### 优化: 禁用状态 Tooltip

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: Button title 属性** | 当按钮 disabled 时，设置动态 title 说明原因 | 最简单、跨浏览器兼容 | 样式固定 | ⭐⭐⭐ |
| B: 自定义 tooltip 组件 | 创建 `DisabledTooltip` 组件 | 样式可控 | 过度工程化 | ⭐⭐ |
| C: CSS tooltip | 使用 CSS `::after` 伪元素 | 无 JS | 纯 CSS 方案，不够灵活 | ⭐⭐ |

#### 推荐方案: A — Button title 属性

```tsx
// ProjectBar.tsx
const getButtonTooltip = () => {
  if (contextNodes.length === 0) return '请先导入示例或生成上下文树';
  if (!areAllConfirmed(contextNodes)) return `上下文树: ${contextNodes.filter(n => n.confirmed).length}/${contextNodes.length} 已确认`;
  if (flowNodes.length === 0) return '请先生成业务流程树';
  if (!areAllConfirmed(flowNodes)) return `流程树: ${flowNodes.filter(n => n.confirmed).length}/${flowNodes.length} 已确认';
  if (componentNodes.length === 0) return '请先生成组件树';
  if (!areAllConfirmed(componentNodes)) return `组件树: ${componentNodes.filter(n => n.confirmed).length}/${componentNodes.length} 已确认`;
  return '';
};

<button disabled={!allConfirmed} title={!allConfirmed ? getButtonTooltip() : undefined}>
  🚀 创建项目
</button>
```

---

## 3. Epic 2 — 优化未登录用户引导 (P1)

### 3.1 F-2.1 未登录"开始使用"拦截提示

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: Toast 提示** | 检测未登录状态，点击后显示 toast "请先登录" | 实现简单、可扩展 | 依赖 toast 组件 | ⭐⭐⭐ |
| B: Modal 对话框 | 弹出确认对话框，用户选择登录或取消 | 用户意图明确 | 打断感强 | ⭐⭐ |
| C: 页面跳转 + banner | 跳转到登录页并在顶部显示提示 banner | 引导清晰 | 体验跳转 | ⭐⭐ |

#### 推荐方案: A — Toast 提示

**改动点**: `HomePage.tsx`

```tsx
// 获取 auth 状态（检查现有 auth context）
const { isAuthenticated } = useAuth(); // 或 useSession()

const handleStartClick = () => {
  if (!isAuthenticated) {
    toast.error('请先登录后再使用');
    return;
  }
  router.push('/canvas?phase=input');
};
```

**数据属性**: `data-testid="auth-toast"`（用于 Playwright 验收测试）

#### 依赖说明
- 检查项目中是否已有 `useAuth` / `useSession` hook
- 如果没有，使用现有 auth context 替代（需查看 `vibex-fronted/src/lib/auth/`）

---

### 3.2 F-2.2 跳过 intro 后"开始使用"可点击

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: 调整 z-index** | 将 OnboardingProgressBar 的 z-index 降低，确保按钮可点击 | 改动最小 | 可能影响其他覆盖层 | ⭐⭐⭐ |
| B: pointer-events 控制 | intro 模式下给 OnboardingProgressBar 设置 `pointer-events: none` | 精准控制 | 需管理样式状态 | ⭐⭐ |
| C: CSS position 调整 | 移动 OnboardingProgressBar 位置，避免遮挡按钮 | 根本解决 | 布局可能受影响 | ⭐⭐ |

#### 推荐方案: A — 调整 z-index

```css
/* canvas.module.css 或 homepage.module.css */
.OnboardingProgressBar-container {
  z-index: 10; /* 低于按钮的 z-index */
}
```

**验证**: 跳过 intro 后 Playwright 验证无 "element intercepts pointer events" 报错。

---

## 4. Epic 3 — 优化步骤引导与状态感知 (P2)

### 4.1 F-3.1 步骤进度条 Tooltip 引导

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: title 属性** | 禁用步骤按钮添加 title 属性说明前置条件 | 原生支持、无需额外组件 | 样式简单 | ⭐⭐⭐ |
| B: Radix Tooltip | 使用 Radix UI Tooltip 组件 | 样式可控 | 增加依赖 | ⭐⭐ |
| C: CSS tooltip | 使用 `data-tooltip` 属性 + CSS | 无 JS | 不够灵活 | ⭐⭐ |

#### 推荐方案: A — title 属性

**改动点**: `PhaseProgressBar.tsx`

```tsx
const getStepTooltip = (stepIndex: number, currentPhase: Phase): string => {
  const steps = ['input', 'context', 'flow', 'component', 'prototype'];
  const currentIndex = steps.indexOf(currentPhase);
  if (stepIndex <= currentIndex) return ''; // 可点击步骤无需 tooltip
  const stepNames = ['需求录入', '需求澄清', '业务流程', '组件图', '原型生成'];
  return `请先完成 ${stepNames[stepIndex - 1]}`;
};

// 渲染时添加 title
<button
  disabled={stepIndex > currentPhaseIndex}
  title={stepIndex > currentPhaseIndex ? getStepTooltip(i, phase) : undefined}
>
  {step.label}
</button>
```

**数据属性**: `data-testid="step-{n}-btn"`（如 `step-2-btn`）

---

### 4.2 F-3.2 TreeStatus 组件开发

#### 新增组件

**文件**: `src/components/canvas/TreeStatus.tsx`（新增）

**职责**: 在每个树面板（context/flow/component）的 Header 区域显示确认进度。

**Props**:

```typescript
interface TreeStatusProps {
  treeType: TreeType;  // 'context' | 'flow' | 'component'
  confirmed: number;
  total: number;
}
```

**UI 设计**:

```
┌─────────────────────────────────────┐
│ 上下文树                    3/3 已确认 ✓  │
└─────────────────────────────────────┘
```

**状态映射**:
- `total === 0`: 显示 "未生成"
- `confirmed < total`: 显示 `{confirmed}/{total} 已确认`
- `confirmed === total && total > 0`: 显示 `{total}/{total} 已确认 ✓`

**数据属性**: `data-testid="{treeType}-tree-status"`（如 `context-tree-status`）

**集成位置**: 在 `TreePanel.tsx` 的 header 区域嵌入 `TreeStatus` 组件。

---

### 4.3 F-3.3 Canvas → Homepage 导航优化

#### 方案对比

| 方案 | 描述 | Pros | Cons | 推荐度 |
|------|------|------|------|--------|
| **A: Logo 点击返回** | 点击 VibeX Logo 返回首页，清除画布状态 | 符合用户习惯 | 需清除 store 状态 | ⭐⭐⭐ |
| B: 面包屑导航 | 添加面包屑 "首页 > 画布" | 导航清晰 | 占用空间 | ⭐⭐ |
| C: 关闭按钮 | 在画布页面添加关闭按钮返回首页 | 操作明确 | 需要额外 UI | ⭐⭐ |

#### 推荐方案: A — Logo 点击返回

**改动点**: `ProjectBar.tsx`

```tsx
import { clearCanvas } from '@/lib/canvas/canvasStore';

const handleLogoClick = () => {
  clearCanvas(); // 新增 store action：清除所有画布状态
  router.push('/');
};
```

**store action**:

```typescript
// canvasStore.ts 新增
clearCanvas: () => set({
  phase: 'input',
  contextNodes: [],
  flowNodes: [],
  componentNodes: [],
  requirementText: '',
  projectId: null,
  prototypeQueue: [],
  // ... 其他状态重置
})
```

---

## 5. 组件改造计划

### 5.1 新增组件

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `TreeStatus` | `src/components/canvas/TreeStatus.tsx` | 显示三树确认进度 |
| `data/examples/canvas-demo.json` | `src/data/examples/canvas-demo.json` | 示例画布数据 |

### 5.2 修改组件

| 组件 | 修改内容 | 测试影响 |
|------|----------|----------|
| `CanvasPage.tsx` | "导入示例"按钮逻辑改为 `loadExampleData()` | 需覆盖 E2E |
| `ProjectBar.tsx` | 按钮添加动态 tooltip；Logo 添加返回首页 | 需覆盖 E2E |
| `PhaseProgressBar.tsx` | 禁用步骤添加 title tooltip | 需覆盖 E2E |
| `TreePanel.tsx` | 集成 TreeStatus 组件 | 需覆盖 E2E |
| `HomePage.tsx` | "开始使用"按钮添加登录检查 | 需覆盖 E2E |

### 5.3 修改 Store

| Action | 文件 | 变更 |
|--------|------|------|
| `loadExampleData` | `canvasStore.ts` | 新增 |
| `clearCanvas` | `canvasStore.ts` | 新增 |

---

## 6. 状态管理

### 6.1 全局状态（Zustand Store）

| 状态 | 用途 | 访问组件 |
|------|------|----------|
| `contextNodes[]` | 限界上下文树节点 | CanvasPage, ProjectBar, TreePanel |
| `flowNodes[]` | 业务流程树节点 | CanvasPage, ProjectBar, TreePanel |
| `componentNodes[]` | 组件树节点 | CanvasPage, ProjectBar, TreePanel |
| `phase` | 当前阶段 | CanvasPage, PhaseProgressBar, ProjectBar |
| `requirementText` | 需求文本 | CanvasPage |
| `projectId` | 项目 ID | ProjectBar |

### 6.2 局部状态（useState/useRef）

| 状态 | 组件 | 用途 |
|------|------|------|
| `activeTab` | CanvasPage | Tab 模式下的当前 Tab |
| `projectName` | CanvasPage | 项目名称（临时编辑） |
| `queuePanelExpanded` | CanvasPage | 原型队列面板展开状态 |
| `isCreating` | ProjectBar | "创建项目"按钮 loading 状态 |
| `createError` | ProjectBar | 创建错误信息 |

### 6.3 状态流向图

```
User 点击"导入示例"
    │
    ▼
CanvasPage (onClick)
    │
    ▼
Dynamic import('@/data/examples/canvas-demo.json')
    │
    ▼
canvasStore.loadExampleData(data)
    │
    ├─ set({ requirementText: data.requirementText })
    ├─ set({ contextNodes: data.contextNodes })  // confirmed=true
    ├─ set({ flowNodes: data.flowNodes })         // confirmed=true
    ├─ set({ componentNodes: data.componentNodes }) // confirmed=true
    ├─ set({ phase: 'context' })
    └─ set({ activeTree: 'flow' })
              │
              ▼
        ProjectBar (selector)
              │
              ▼
        allConfirmed = true  (因为 confirmed=true 且 length>0)
              │
              ▼
        "创建项目" 按钮 enabled ✓
```

---

## 7. 测试策略

### 7.1 单元测试（Jest）

#### canvasStore.test.ts 扩展

```typescript
describe('loadExampleData', () => {
  it('应加载示例数据并设置 phase 为 context', async () => {
    const exampleData = await import('@/data/examples/canvas-demo.json');
    act(() => {
      useCanvasStore.getState().loadExampleData(exampleData.default);
    });
    const state = useCanvasStore.getState();
    expect(state.phase).toBe('context');
    expect(state.contextNodes.length).toBeGreaterThan(0);
    expect(state.flowNodes.length).toBeGreaterThan(0);
    expect(state.componentNodes.length).toBeGreaterThan(0);
  });

  it('示例节点应全部 confirmed=true', async () => {
    const exampleData = await import('@/data/examples/canvas-demo.json');
    act(() => {
      useCanvasStore.getState().loadExampleData(exampleData.default);
    });
    const state = useCanvasStore.getState();
    expect(state.contextNodes.every(n => n.confirmed)).toBe(true);
    expect(state.flowNodes.every(n => n.confirmed)).toBe(true);
    expect(state.componentNodes.every(n => n.confirmed)).toBe(true);
  });
});

describe('clearCanvas', () => {
  it('应重置所有画布状态', () => {
    act(() => {
      useCanvasStore.getState().clearCanvas();
    });
    const state = useCanvasStore.getState();
    expect(state.contextNodes).toEqual([]);
    expect(state.flowNodes).toEqual([]);
    expect(state.componentNodes).toEqual([]);
    expect(state.phase).toBe('input');
  });
});
```

#### 新增测试文件

| 文件 | 测试内容 |
|------|----------|
| `src/lib/canvas/__tests__/exampleData.test.ts` | 示例数据 JSON schema 验证 |
| `src/components/canvas/__tests__/TreeStatus.test.tsx` | TreeStatus 组件渲染 |

### 7.2 E2E 测试（Playwright）

#### 新增 E2E 文件: `e2e/canvas-flow.spec.ts`

```typescript
// Epic 1: 导入示例流程
test('F-1.2: 点击导入示例后三树均有节点', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="import-example-btn"]');
  await page.waitForTimeout(500);

  const contextNodes = await page.locator('[data-testid="context-tree"] .tree-node').count();
  const flowNodes = await page.locator('[data-testid="flow-tree"] .tree-node').count();
  const componentNodes = await page.locator('[data-testid="component-tree"] .tree-node').count();

  expect(contextNodes).toBeGreaterThan(0);
  expect(flowNodes).toBeGreaterThan(0);
  expect(componentNodes).toBeGreaterThan(0);
});

test('F-1.3: 导入示例后创建项目按钮 enabled', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="import-example-btn"]');
  await page.waitForTimeout(500);

  const btn = page.locator('[data-testid="create-project-btn"]');
  await expect(btn).toBeEnabled();
});

// Epic 2: 未登录引导
test('F-2.1: 未登录点击开始使用显示 toast', async ({ page }) => {
  // 清空登录状态
  await page.context().clearCookies();
  await page.goto('/');
  await page.click('[data-testid="start-using-btn"]');

  const toast = page.locator('[data-testid="auth-toast"]');
  await expect(toast).toBeVisible();
});

// Epic 3: 步骤引导
test('F-3.1: 禁用步骤有 tooltip', async ({ page }) => {
  await page.goto('/canvas');
  const step2 = page.locator('[data-testid="step-2-btn"]');
  await expect(step2).toHaveAttribute('title', /请先完成/);
});

test('F-3.2: 三树显示确认进度', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="import-example-btn"]');
  await page.waitForTimeout(500);

  const contextStatus = page.locator('[data-testid="context-tree-status"]');
  await expect(contextStatus).toMatchText(/\d+\/\d+ 已确认/);
});
```

### 7.3 测试覆盖矩阵

| Epic | 单元测试 | E2E 测试 | 覆盖重点 |
|------|----------|----------|----------|
| Epic 1 | canvasStore: loadExampleData, clearCanvas | canvas-flow: 导入示例、按钮状态 | store action、按钮 enabled |
| Epic 2 | — | Homepage: 未登录 toast | auth 拦截、toast 显示 |
| Epic 3 | TreeStatus: 组件渲染 | canvas-flow: tooltip、状态进度 | 组件集成、UI 文本 |

---

## 8. 工时估算

### 8.1 详细分解

| Epic | 功能 | 任务 | 工时 | 执行者 |
|------|------|------|------|--------|
| **Epic 1** | F-1.1 | 创建 `canvas-demo.json`，3 context + 4 flow + 5 component nodes | 1h | dev |
| | F-1.2 | 新增 `loadExampleData` store action | 1h | dev |
| | F-1.2 | 修改 CanvasPage "导入示例"按钮逻辑 | 1h | dev |
| | F-1.3 | ProjectBar 按钮动态 tooltip | 1h | dev |
| | F-1 全覆盖 | Jest 单元测试（canvasStore + TreeStatus） | 1h | tester |
| | F-1 全覆盖 | Playwright E2E（导入示例 + 按钮状态） | 1h | tester |
| | **Epic 1 小计** | | **6h** | |
| **Epic 2** | F-2.1 | HomePage "开始使用"登录检查 + toast | 2h | dev |
| | F-2.2 | OnboardingProgressBar z-index 修复 | 0.5h | dev |
| | F-2 全覆盖 | Playwright E2E（未登录 toast） | 0.5h | tester |
| | **Epic 2 小计** | | **3h** | |
| **Epic 3** | F-3.1 | PhaseProgressBar 禁用 tooltip | 1h | dev |
| | F-3.2 | TreeStatus 组件开发 + 集成 | 2h | dev |
| | F-3.3 | Logo 返回首页 + clearCanvas action | 1h | dev |
| | F-3 全覆盖 | Jest + Playwright（tooltip + 状态进度） | 1h | tester |
| | **Epic 3 小计** | | **5h** | |
| | **总计** | | **14h** | |

### 8.2 里程碑

| 里程碑 | 内容 | 预计完成 |
|--------|------|----------|
| M1: P0 修复上线 | Epic 1 完成，导入示例流程可用 | Day 1 |
| M2: P1 体验优化 | Epic 2 完成，未登录引导优化 | Day 1-2 |
| M3: P2 体验增强 | Epic 3 完成，步骤引导完善 | Day 2-3 |

---

## 9. 风险登记

| 风险 | 概率 | 影响 | 缓解措施 | 负责人 |
|------|------|------|----------|--------|
| 示例数据节点结构与 types.ts 不匹配 | 低 | 高 | 创建前对齐 BoundedContextNode / BusinessFlowNode / ComponentNode 接口 | dev |
| Playwright 元素选择器不稳定 | 中 | 中 | 使用 `data-testid` 属性，所有新增交互元素添加 testid | dev |
| `areAllConfirmed` 逻辑被后续改动影响 | 中 | 高 | 在 canvasStore.test.ts 添加回归测试 | tester |
| Auth context 不存在或接口不同 | 低 | 中 | 先检查现有 auth 实现，再确定方案 | dev |
| 示例数据与真实 AI 生成的数据结构差异 | 低 | 中 | 示例数据直接对齐 store 中的节点结构 | dev |

---

## 10. 实施顺序

```
Phase 1: Epic 1 (P0 — 阻断性修复)
  ├─ T1: 创建 canvas-demo.json (1h)
  ├─ T2: 新增 store actions (1h)
  ├─ T3: 修改 CanvasPage 按钮 (1h)
  ├─ T4: ProjectBar tooltip (1h)
  └─ T5: 验收测试 (2h)

Phase 2: Epic 2 (P1 — 体验优化)
  ├─ T6: HomePage 登录检查 (2h)
  ├─ T7: OnboardingProgressBar z-index (0.5h)
  └─ T8: 验收测试 (0.5h)

Phase 3: Epic 3 (P2 — 体验增强)
  ├─ T9: PhaseProgressBar tooltip (1h)
  ├─ T10: TreeStatus 组件 + 集成 (2h)
  ├─ T11: Logo 返回 + clearCanvas (1h)
  └─ T12: 验收测试 (1h)
```

---

## 11. 数据流总览

```
┌─────────────────────────────────────────────────────────────┐
│                      User Actions                            │
│  [导入示例]  [开始使用]  [跳过介绍]  [步骤点击]  [Logo点击]  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Component Layer                           │
│  CanvasPage  │  HomePage  │  ProjectBar  │  PhaseProgressBar │
└───────┬─────────────┬──────────────┬──────────────┬──────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Zustand Store                              │
│  canvasStore: { phase, contextNodes, flowNodes, componentNodes, ... }
│  ├─ loadExampleData(data)  ← 新增
│  ├─ clearCanvas()          ← 新增
│  └─ setPhase/setContextNodes/... (现有)
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Example Data  │    │  Backend API  │    │  Local State  │
│ (JSON file)   │    │ (unchanged)   │    │ (useState)    │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 12. 下一步

> **传递条件**: 架构设计审核通过后 → Coord 创建 Phase 2 开发任务  
> **产出物**: `AGENTS.md`（开发约束）+ `IMPLEMENTATION_PLAN.md`（实施计划）  
> **开发启动**: coord 调用 `task_manager.py phase2 vibex-canvas-analysis`

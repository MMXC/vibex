# Architecture: VibeX Canvas Phase1 — 样式统一 + 导航修复

> **项目**: vibex-canvas-evolution-roadmap  
> **版本**: 2.0.0（重新生成，修正 artifacts）  
> **日期**: 2026-03-29  
> **Architect**: Architect Agent  
> **状态**: Ready for Implementation  
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

### 1.1 设计目标

Phase1 的技术架构服务于两个核心目标：
1. **样式统一**: 建立 CSS 变量系统和无障碍 checkbox 规范，消除散落在各组件中的硬编码值
2. **导航可靠**: 补充 example-canvas.json 的 previewUrl 数据，实现导入后的完整导航体验

### 1.2 技术约束

| 约束 | 说明 |
|------|------|
| **框架** | React 19 + TypeScript + Next.js App Router |
| **样式** | CSS Modules + CSS Custom Properties（禁止引入新 CSS 方案） |
| **状态** | Zustand canvasStore（已存在） |
| **无障碍** | 所有交互元素必须有 `aria-*` 属性，emoji 仅用于装饰 |
| **测试** | Vitest + Testing Library + Playwright |

### 1.3 文件变更总览

| 操作 | 文件路径 |
|------|---------|
| 修改 | `vibex-fronted/src/components/flow-components/ComponentSelectionStep.tsx` |
| 修改 | `vibex-fronted/src/components/flow-components/ComponentSelectionStep.module.css` |
| 修改 | `vibex-fronted/src/data/example-canvas.json` |
| 修改 | `vibex-fronted/src/components/canvas/canvas.module.css` |
| 新建 | `vibex-fronted/src/lib/canvas/utils.ts` |
| 修改 | `vibex-fronted/src/lib/canvas/canvasStore.ts` |
| 修改 | `vibex-fronted/src/components/canvas/CanvasPage.tsx` |
| 新建 | `vibex-fronted/src/components/canvas/__tests__/utils.test.ts` |

---

## 2. CSS 变量系统

### 2.1 变量架构

```
canvas.module.css (现有)
  │
  ├── 通用布局变量 (--canvas-bg, --color-border 等)
  │
  └── [NEW] 领域类型变量 (--domain-color, --domain-bg-light, --domain-border)
              │
              ├── [data-type="core"]       → 橙色 (#F97316)
              ├── [data-type="supporting"] → 蓝色 (#3B82F6)
              ├── [data-type="generic"]    → 灰色 (#6B7280)
              └── [data-type="external"]   → 紫色 (#8B5CF6)

CheckboxIcon.module.css (现有)
  │
  └── 统一 checkbox 样式（无需新增变量）
```

### 2.2 CSS 变量定义

所有领域变量通过 `data-type` 属性选择器激活，定义在 `canvas.module.css` 末尾：

```css
/* ============================================
   Section 12: Domain Type Variables
   限界上下文领域类型颜色系统
   ============================================ */

/* 浅色模式 */
[data-type="core"] {
  --domain-color: #F97316;
  --domain-bg-light: rgba(249, 115, 22, 0.08);
  --domain-border: rgba(249, 115, 22, 0.4);
  --domain-label-text: '核心域';
}

[data-type="supporting"] {
  --domain-color: #3B82F6;
  --domain-bg-light: rgba(59, 130, 246, 0.08);
  --domain-border: rgba(59, 130, 246, 0.4);
  --domain-label-text: '支撑域';
}

[data-type="generic"] {
  --domain-color: #6B7280;
  --domain-bg-light: rgba(107, 114, 128, 0.08);
  --domain-border: rgba(107, 114, 128, 0.4);
  --domain-label-text: '通用域';
}

[data-type="external"] {
  --domain-color: #8B5CF6;
  --domain-bg-light: rgba(139, 92, 246, 0.08);
  --domain-border: rgba(139, 92, 246, 0.4);
  --domain-label-text: '外部域';
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  [data-type="core"] {
    --domain-color: #FB923C;
    --domain-bg-light: rgba(251, 146, 60, 0.12);
    --domain-border: rgba(251, 146, 60, 0.3);
  }
  [data-type="supporting"] {
    --domain-color: #60A5FA;
    --domain-bg-light: rgba(96, 165, 250, 0.12);
    --domain-border: rgba(96, 165, 250, 0.3);
  }
  [data-type="generic"] {
    --domain-color: #9CA3AF;
    --domain-bg-light: rgba(156, 163, 175, 0.12);
    --domain-border: rgba(156, 163, 175, 0.3);
  }
  [data-type="external"] {
    --domain-color: #A78BFA;
    --domain-bg-light: rgba(167, 139, 250, 0.12);
    --domain-border: rgba(167, 139, 250, 0.3);
  }
}
```

### 2.3 BoundedGroupOverlay 样式

`BoundedGroupOverlay.tsx` 使用 `data-type` 属性激活 CSS 变量：

```tsx
// BoundedGroupOverlay.tsx
interface DomainGroupProps {
  domainType: BoundedContextNode['type'];
  groupId: string;
  children: React.ReactNode;
}

export function BoundedGroupOverlay({ domainType, groupId, children }: DomainGroupProps) {
  const label = useDomainLabel(domainType); // '核心域' / '支撑域' / ...

  return (
    <div
      className={styles.domainGroup}
      data-type={domainType}
      data-group-id={groupId}
      aria-label={`${label}分组`}
    >
      <span className={styles.domainLabel}>{label}</span>
      {children}
    </div>
  );
}
```

```css
/* canvas.module.css - BoundedGroupOverlay */
.domainGroup {
  border: 2px dashed var(--domain-border);
  background: var(--domain-bg-light);
  border-radius: 8px;
  position: relative;
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 0.5rem;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.domainLabel {
  position: absolute;
  top: -0.6rem;
  left: 1rem;
  background: var(--color-bg);
  padding: 0 0.5rem;
  font-size: 0.7rem;
  color: var(--domain-color);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

---

## 3. Checkbox 统一方案

### 3.1 现有 CheckboxIcon 组件

已存在 `components/common/CheckboxIcon.tsx`，被 BoundedContextTree 和 BusinessFlowTree 使用。

```tsx
// CheckboxIcon.tsx (现有)
interface CheckboxIconProps {
  checked: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}
```

### 3.2 ComponentSelectionStep 修改

**当前代码（L92, L202, L244）**:
```tsx
// ❌ Before: emoji checkbox
{selectedComponents.includes(comp.id) ? '✓' : '○'}
<div className={styles.checkbox}>{isSelected && '✓'}</div>
×
```

**修改后**:
```tsx
// ✅ After: CheckboxIcon
<CheckboxIcon
  checked={selectedComponents.includes(comp.id)}
  size="sm"
  ariaLabel={`选择组件 ${comp.id}`}
/>
<CheckboxIcon
  checked={isSelected}
  size="sm"
  ariaLabel="选中组件"
/>
{/* X 按钮使用 SVG 或现有 Icon 组件 */}
<button aria-label="删除" className={styles.deleteBtn}>
  <XIcon />
</button>
```

**ComponentSelectionStep.module.css 改动**:
```css
/* 删除旧的 emoji 相关样式 */
.checkbox { /* ... */ }

/* 新增按钮样式 */
.deleteBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-error);
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;
}

.deleteBtn:hover {
  background: var(--color-error-hover, #dc2626);
}
```

---

## 4. 推导函数架构

### 4.1 工具函数模块

新建 `lib/canvas/utils.ts`，内聚所有推导逻辑：

```typescript
// lib/canvas/utils.ts

import type { BoundedContextNode, FlowStep } from './types';

/**
 * 领域类型关键词映射
 * 用于历史数据兼容：type 字段为空或非标准值时自动推导
 */
const DOMAIN_KEYWORDS: Record<BoundedContextNode['type'], string[]> = {
  core: ['core', 'central', '主要', '核心', '订单', '用户', '支付', '商品'],
  supporting: ['support', '支撑', '辅助', '通知', '日志', '统计', '分析', '报表'],
  generic: ['generic', '通用', '公共', 'common', 'shared', '配置', '系统'],
  external: ['external', '外部', 'third', '第三方', '集成', '微信', '支付宝', '短信'],
};

/**
 * 步骤类型关键词映射
 */
const STEP_TYPE_KEYWORDS: Record<NonNullable<FlowStep['type']>, string[]> = {
  branch: ['分支', 'branch', '条件', 'if', 'switch', '选择', '判断', 'else'],
  loop: ['循环', 'loop', '重复', 'recur', '遍历', '迭代', 'for', 'while'],
  normal: [], // 默认类型，无关键词
};

/**
 * 从节点元数据推导领域类型
 * 优先级：type 字段 → 关键词推导 → 默认值 'core'
 */
export function deriveDomainType(
  node: Pick<BoundedContextNode, 'name' | 'description' | 'type'>
): BoundedContextNode['type'] {
  // Step 1: 直接返回有效的 type
  if (node.type && (node.type in DOMAIN_KEYWORDS)) {
    return node.type;
  }

  // Step 2: 关键词推导
  const text = `${node.name} ${node.description}`.toLowerCase();
  for (const [domainType, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return domainType as BoundedContextNode['type'];
    }
  }

  // Step 3: 默认值
  return 'core';
}

/**
 * 从步骤元数据推导步骤类型
 * 优先级：type 字段 → 关键词推导 → 默认值 'normal'
 */
export function deriveStepType(
  step: Pick<FlowStep, 'name' | 'stepId' | 'type'>
): NonNullable<FlowStep['type']> {
  // Step 1: 直接返回有效的 type
  if (step.type) return step.type;

  // Step 2: 关键词推导
  const text = `${step.name} ${step.stepId}`.toLowerCase();
  for (const [stepType, keywords] of Object.entries(STEP_TYPE_KEYWORDS)) {
    if (stepType !== 'normal' && keywords.some(k => text.includes(k.toLowerCase()))) {
      return stepType as NonNullable<FlowStep['type']>;
    }
  }

  // Step 3: 默认值
  return 'normal';
}

/**
 * 获取领域类型对应的显示标签
 */
export function getDomainLabel(type: BoundedContextNode['type']): string {
  const labels: Record<BoundedContextNode['type'], string> = {
    core: '核心域',
    supporting: '支撑域',
    generic: '通用域',
    external: '外部域',
  };
  return labels[type] ?? '核心域';
}

/**
 * 获取步骤类型对应的显示标签和图标
 */
export function getStepTypeInfo(type: NonNullable<FlowStep['type']>) {
  const info: Record<string, { label: string; icon: string }> = {
    normal: { label: '普通步骤', icon: 'circle' },
    branch: { label: '分支步骤', icon: 'git-branch' },
    loop: { label: '循环步骤', icon: 'repeat' },
  };
  return info[type] ?? info.normal;
}
```

### 4.2 在 Store 中的集成

```typescript
// canvasStore.ts

import { deriveDomainType, deriveStepType } from './utils';

// 在初始化或导入数据时调用推导
function initializeCanvas() {
  const rawData = exampleCanvasData;

  // 推导领域类型（向后兼容）
  const contextNodes = rawData.contextNodes.map(node => ({
    ...node,
    // 已有 type 直接使用，无 type 时自动推导
    type: deriveDomainType(node),
  }));

  // 推导步骤类型（向后兼容）
  const flowNodes = rawData.flowNodes.map(flow => ({
    ...flow,
    steps: flow.steps.map(step => ({
      ...step,
      type: deriveStepType(step),
    })),
  }));

  // componentNodes ... (保持不变)
}
```

---

## 5. 导入导航增强

### 5.1 example-canvas.json 数据补充

```json
{
  "componentNodes": [
    {
      "nodeId": "comp-login-form",
      "name": "登录表单",
      "flowId": "flow-user-auth",
      "type": "form",
      "previewUrl": "/preview?component=login-form",
      "confirmed": true,
      "status": "confirmed"
    },
    {
      "nodeId": "comp-dashboard",
      "name": "仪表盘",
      "flowId": "flow-user-auth",
      "type": "page",
      "previewUrl": "/preview?component=dashboard",
      "confirmed": true,
      "status": "confirmed"
    }
  ]
}
```

**生成逻辑**（在更新 example-canvas.json 时执行）:

```typescript
// scripts/generate-preview-urls.ts
// 运行一次，为所有 componentNodes 生成 previewUrl

import exampleCanvasData from '@/data/example-canvas.json';

function generatePreviewUrls() {
  const updated = {
    ...exampleCanvasData,
    componentNodes: exampleCanvasData.componentNodes.map(node => ({
      ...node,
      previewUrl: `/preview?component=${node.nodeId.replace(/^comp-/, '')}`,
    })),
  };

  // 写入文件
  fs.writeFileSync(
    'src/data/example-canvas.json',
    JSON.stringify(updated, null, 2)
  );
}
```

### 5.2 /preview 页面增强

当前 `ComponentTree.tsx` L286-289 已有降级逻辑，无需修改。`/preview` 页面已有 query param 支持。

```typescript
// preview/page.tsx (现有逻辑，无需修改)
const searchParams = useSearchParams();
const componentId = searchParams.get('component');
// → 渲染对应组件预览
```

---

## 6. expand-both 模式

### 6.1 Store 扩展

```typescript
// canvasStore.ts

type PanelExpandState = 'default' | 'expand-left' | 'expand-right';

interface CanvasState {
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  // ...
}

// 新增 expand-both 状态（复用 centerExpand）
type CenterExpandWithBoth = PanelExpandState | 'expand-both';

/**
 * 一键展开到 expand-both 模式
 * 左右面板折叠，中间面板占满
 */
expandToBoth: () => {
  set({
    leftExpand: 'default',
    centerExpand: 'expand-both',
    rightExpand: 'default',
  });
},

/**
 * 从 expand-both 恢复到默认状态
 */
collapseToDefault: () => {
  set({
    leftExpand: 'default',
    centerExpand: 'default',
    rightExpand: 'default',
  });
},
```

### 6.2 CSS Grid 动态布局

```css
/* canvas.module.css */

/* 默认布局 */
.canvas-grid {
  display: grid;
  grid-template-columns: var(--left-panel-width, 1fr) var(--center-panel-width, 1fr) var(--right-panel-width, 1fr);
  gap: 0;
  height: 100vh;
  transition: grid-template-columns 0.3s ease;
}

/* expand-both 模式 */
.canvas-grid[data-expand="expand-both"] {
  grid-template-columns: 0fr 1fr 0fr;
}

.canvas-grid[data-expand="expand-both"] .leftPanel,
.canvas-grid[data-expand="expand-both"] .rightPanel {
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* 移动端禁用 */
@media (max-width: 768px) {
  .canvas-grid[data-expand="expand-both"] {
    grid-template-columns: 1fr;
  }
}
```

### 6.3 CanvasPage.tsx 改动

```tsx
// CanvasPage.tsx
const { leftExpand, centerExpand, rightExpand, expandToBoth, collapseToDefault } = useCanvasStore();

// 计算 data-expand 属性
const gridExpandAttr = centerExpand === 'expand-both' ? 'expand-both' : undefined;

<div
  className={styles.canvasGrid}
  data-expand={gridExpandAttr}
  data-left-expand={leftExpand}
  data-right-expand={rightExpand}
>
  {/* left panel */}
  {/* center panel */}
  {/* right panel */}
</div>

// 全屏按钮
<button
  onClick={centerExpand === 'expand-both' ? collapseToDefault : expandToBoth}
  aria-label={centerExpand === 'expand-both' ? '退出全屏' : '全屏画布'}
>
  {centerExpand === 'expand-both' ? <MinimizeIcon /> : <MaximizeIcon />}
</button>
```

---

## 7. 测试策略

### 7.1 单元测试（Vitest）

```typescript
// lib/canvas/__tests__/utils.test.ts

import { describe, it, expect } from 'vitest';
import { deriveDomainType, deriveStepType, getDomainLabel, getStepTypeInfo } from '../utils';

describe('deriveDomainType', () => {
  it('直接返回有效的 type', () => {
    expect(deriveDomainType({ name: '测试', type: 'core' })).toBe('core');
    expect(deriveDomainType({ name: '测试', type: 'supporting' })).toBe('supporting');
  });

  it('通过 name 关键词推导 core', () => {
    expect(deriveDomainType({ name: '用户管理', description: '用户信息维护', type: '' })).toBe('core');
  });

  it('通过 description 关键词推导 supporting', () => {
    expect(deriveDomainType({ name: '通知中心', description: '发送短信通知', type: '' })).toBe('supporting');
  });

  it('type 为 undefined 时使用关键词推导', () => {
    expect(deriveDomainType({ name: '日志服务', type: undefined as any })).toBe('supporting');
  });

  it('无匹配关键词时返回默认 core', () => {
    expect(deriveDomainType({ name: 'XYZ', type: '' })).toBe('core');
  });

  it('branch 关键词匹配分支类型', () => {
    expect(deriveStepType({ name: '条件分支判断', type: undefined as any })).toBe('branch');
  });

  it('loop 关键词匹配循环类型', () => {
    expect(deriveStepType({ name: '遍历商品列表', type: undefined as any })).toBe('loop');
  });

  it('无关键词时默认 normal', () => {
    expect(deriveStepType({ name: '发送通知', type: undefined as any })).toBe('normal');
  });
});
```

### 7.2 E2E 测试（Playwright）

```typescript
// e2e/canvas-phase1.spec.ts

test.describe('Phase1 验收', () => {
  test('F1: ComponentSelectionStep 无 emoji', async ({ page }) => {
    await page.goto('/canvas');
    const emojiCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="component-selection-step"]');
      return el ? (el.textContent?.match(/[✓○×]/g) || []).length : 0;
    });
    expect(emojiCount).toBe(0);
  });

  test('F2: 导入示例后节点可点击', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="import-btn"]');
    await page.setFiles('[data-testid="import-input"]', 'example-canvas.json');
    await page.reload();
    const nodes = page.locator('[data-testid="component-node"]');
    for (const node of await nodes.all()) {
      await node.click();
      await expect(page).toHaveURL(/\/preview\?component=/);
    }
  });

  test('F3: 领域 4 色分组', async ({ page }) => {
    await page.goto('/canvas');
    const colors = await page.evaluate(() => {
      const groups = document.querySelectorAll('[data-type]');
      return [...new Set([...groups].map(g => getComputedStyle(g).getPropertyValue('--domain-color').trim()))];
    });
    expect(colors.length).toBeGreaterThanOrEqual(4);
  });

  test('F6: expand-both 切换', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[aria-label="全屏画布"]');
    await expect(page.locator('[data-expand="expand-both"]')).toBeVisible();
    await page.click('[aria-label="退出全屏"]');
    await expect(page.locator('[data-expand="expand-both"]')).not.toBeVisible();
  });
});
```

---

## 8. 依赖关系

```
lib/canvas/utils.ts (新建)
  ↑
  ├── deriveDomainType → BoundedContextTree 初始化
  ├── deriveStepType   → BusinessFlowTree 初始化
  └── getDomainLabel    → BoundedGroupOverlay

canvas.module.css (修改)
  ↑
  ├── 领域 CSS 变量 → BoundedGroupOverlay 虚线框
  ├── expand-both   → CanvasPage Grid 布局
  └── CheckboxIcon 样式（已有，无需新增）

canvasStore.ts (修改)
  ↑
  ├── expandToBoth action
  └── collapseToDefault action

ComponentSelectionStep.tsx (修改)
  ↑
  └── CheckboxIcon 组件（已有）

example-canvas.json (修改)
  ↑
  └── previewUrl 字段补充
```

---

## 9. 变更文件清单

| 文件 | 操作 | 变更摘要 |
|------|------|---------|
| `src/lib/canvas/utils.ts` | 新建 | 推导函数 + 标签函数 |
| `src/lib/canvas/__tests__/utils.test.ts` | 新建 | 推导函数测试 |
| `src/components/canvas/canvas.module.css` | 修改 | + 领域 CSS 变量 + expand-both |
| `src/components/flow-components/ComponentSelectionStep.tsx` | 修改 | emoji → CheckboxIcon |
| `src/components/flow-components/ComponentSelectionStep.module.css` | 修改 | + deleteBtn 样式 |
| `src/data/example-canvas.json` | 修改 | + previewUrl 字段 |
| `src/lib/canvas/canvasStore.ts` | 修改 | + expandToBoth/collapseToDefault |
| `src/components/canvas/CanvasPage.tsx` | 修改 | + expand-both data 属性 + 按钮 |

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| expand-both 破坏现有布局 | 中 | 高 | Playwright E2E 覆盖 + CSS snapshot |
| 领域推导关键词覆盖不足 | 中 | 低 | 提供可配置的关键词表，支持扩展 |
| ComponentSelectionStep 改动影响其他流程 | 低 | 高 | 确认仅该组件使用 emoji checkbox |
| 深色模式颜色对比度不足 | 低 | 中 | WCAG AA 对比度验证（4.5:1） |

---

*本架构文档由 Architect Agent 生成，基于实地代码审计和 Phase1 功能需求。*

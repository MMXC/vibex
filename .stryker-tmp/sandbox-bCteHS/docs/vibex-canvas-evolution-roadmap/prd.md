# PRD: VibeX Canvas Phase1 — 样式统一 + 导航修复

> **项目**: vibex-canvas-evolution-roadmap  
> **版本**: 2.0.0（重新生成，修正 artifacts）  
> **日期**: 2026-03-29  
> **PM**: Product Manager Agent  
> **状态**: Ready for Implementation  
> **工作目录**: /root/.openclaw/vibex

---

## 1. Executive Summary

### 1.1 Background

VibeX Canvas 三阶段演进路线图中的 Phase1，目标是建立统一的视觉系统和可靠的导航体验。本次重新生成基于实地代码审计，修正了此前文档中的实现状态偏差和文件路径错误。

### 1.2 Goals

| Goal | 描述 | 优先级 |
|------|------|--------|
| G1 | 消除 ComponentSelectionStep 中的 emoji checkbox，统一使用 CSS 样式 | P0 |
| G2 | 补充 example-canvas.json 的 previewUrl，实现导入后的完整导航 | P0 |
| G3 | 建立领域分组 CSS 变量系统，支持 4 色虚线框 + 深色模式 | P1 |
| G4 | 实现 domainType/deriveStepType 推导函数，确保向后兼容 | P1 |
| G5 | 实现 expand-both 交互模式，提升三栏展开体验 | P2 |

### 1.3 Success Metrics

| 指标 | 当前基线 | 目标值 | 测量方式 |
|------|---------|--------|---------|
| Emoji 字符出现次数（canvas） | 3 处（ComponentSelectionStep） | 0 | `grep -rn '[✓○×]'` |
| example-canvas previewUrl 覆盖率 | 0% | 100% | `jq '.componentNodes[].previewUrl'` |
| 领域 CSS 变量定义数 | 0 | 4（core/supporting/generic/external） | 代码审查 |
| 推导函数测试覆盖率 | 0% | > 90% | `pnpm coverage` |
| axe-core 无障碍 violations | 未测 | 0 | `pnpm axe:run` |

---

## 2. 功能需求

### 2.1 F1: CSS Checkbox 统一样式（ComponentSelectionStep）

**问题描述**:
`flow-components/ComponentSelectionStep.tsx` 中仍使用 emoji 字符 `✓○×` 作为 checkbox 样式，违反无障碍规范且存在跨平台渲染差异。

**文件位置**:
- 主文件: `vibex-fronted/src/components/flow-components/ComponentSelectionStep.tsx`
- 样式文件: `vibex-fronted/src/components/flow-components/ComponentSelectionStep.module.css`

**改动点**:

| 行号 | 当前 | 改为 |
|------|------|------|
| L92 | `{selectedComponents.includes(comp.id) ? '✓' : '○'}` | `<CheckboxIcon checked={selectedComponents.includes(comp.id)} />` |
| L202 | `<div className={styles.checkbox}>{isSelected && '✓'}</div>` | `<CheckboxIcon checked={isSelected} />` |
| L244 | `×` | `<XIcon />` 或 SVG `×` |

**验收标准**:
- [ ] `grep -rn '[✓○×]' ComponentSelectionStep.tsx` → 0
- [ ] 所有 checkbox 使用 `CheckboxIcon` 组件
- [ ] axe-core 扫描 0 violations
- [ ] Vitest: 点击 checkbox 状态正确切换

---

### 2.2 F2: example-canvas.json 补充 previewUrl

**问题描述**:
`data/example-canvas.json` 中所有 componentNodes 的 `previewUrl` 为 `undefined`，导致导入后点击节点只能看到 toast 降级提示，无法实际预览。

**文件位置**:
- 数据文件: `vibex-fronted/src/data/example-canvas.json`

**实现方案**:

根据组件 ID 生成合理的 previewUrl 映射：

```typescript
// previewUrl 映射逻辑（用于生成 example-canvas.json）
const COMPONENT_PREVIEW_MAP: Record<string, string> = {
  'comp-login': '/preview?component=login-form',
  'comp-dashboard': '/preview?component=dashboard',
  'comp-order-list': '/preview?component=order-list',
  'comp-product-card': '/preview?component=product-card',
  'comp-checkout': '/preview?component=checkout-flow',
  // ... 其他组件
};

// 对于无具体映射的组件，使用通用格式
function generatePreviewUrl(nodeId: string): string {
  return `/preview?component=${nodeId}`;
}
```

**验收标准**:
- [ ] `jq '.componentNodes[].previewUrl' example-canvas.json` → 所有值为非 null 字符串
- [ ] Playwright E2E: 导入示例 → 点击任意组件节点 → 页面跳转成功（非 toast 提示）
- [ ] 不存在的组件 ID → 友好提示（当前 toast 逻辑保留）

---

### 2.3 F3: 领域分组 CSS 变量系统

**问题描述**:
`canvas.module.css` 中缺少领域类型对应的 CSS 变量，`BoundedGroupOverlay` 的虚线框样式未完整实现，导致深色模式适配困难。

**文件位置**:
- 主样式: `vibex-fronted/src/components/canvas/canvas.module.css`
- 覆盖组件: `vibex-fronted/src/components/canvas/groups/BoundedGroupOverlay.tsx`
- 类型定义: `vibex-fronted/src/lib/canvas/types.ts`

**实现方案**:

**Step 1**: 在 `canvas.module.css` 中新增领域变量块：

```css
/* ============================================
   Domain Type Colors
   限界上下文领域类型颜色系统
   ============================================ */

/* 核心域 - 橙色：系统最重要的业务能力 */
[data-type="core"] {
  --domain-color: #F97316;
  --domain-bg-light: rgba(249, 115, 22, 0.08);
  --domain-border: rgba(249, 115, 22, 0.4);
}

/* 支撑域 - 蓝色：支撑核心域的辅助能力 */
[data-type="supporting"] {
  --domain-color: #3B82F6;
  --domain-bg-light: rgba(59, 130, 246, 0.08);
  --domain-border: rgba(59, 130, 246, 0.4);
}

/* 通用域 - 灰色：可复用的通用能力 */
[data-type="generic"] {
  --domain-color: #6B7280;
  --domain-bg-light: rgba(107, 114, 128, 0.08);
  --domain-border: rgba(107, 114, 128, 0.4);
}

/* 外部域 - 紫色：外部系统集成 */
[data-type="external"] {
  --domain-color: #8B5CF6;
  --domain-bg-light: rgba(139, 92, 246, 0.08);
  --domain-border: rgba(139, 92, 246, 0.4);
}

/* 深色模式适配 */
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

**Step 2**: 更新 `BoundedGroupOverlay.tsx` 使用 CSS 变量：

```tsx
// BoundedGroupOverlay.tsx
<div
  className={styles.domainGroup}
  data-type={group.domainType}  // 使用 data-type 激活 CSS 变量
  style={{
    '--domain-label': t(domainType),
    // CSS 变量通过 data-type 自动应用
  } as React.CSSProperties}
>
```

**Step 3**: 添加虚线框样式到 `canvas.module.css`：

```css
/* 领域分组虚线框 */
.domainGroup {
  border: 2px dashed var(--domain-border);
  background: var(--domain-bg-light);
  border-radius: 8px;
  position: relative;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.domainGroup::before {
  content: var(--domain-label);
  position: absolute;
  top: -0.75rem;
  left: 0.75rem;
  background: var(--color-bg);
  padding: 0 0.5rem;
  font-size: 0.75rem;
  color: var(--domain-color);
  font-weight: 600;
}
```

**验收标准**:
- [ ] 4 种领域类型（core/supporting/generic/external）分别显示不同颜色虚线框
- [ ] 深色模式下颜色正确适配（通过 `prefers-color-scheme: dark`）
- [ ] 空分组（无节点）不渲染 DOM 元素
- [ ] Vitest: `deriveDomainType()` 测试覆盖率 > 90%

---

### 2.4 F4: domainType 推导函数

**问题描述**:
现有代码直接使用 `node.type` 字段，无推导函数。如果历史数据 `type` 为空或非标准值，无法正确分组。

**文件位置**:
- 类型定义: `vibex-fronted/src/lib/canvas/types.ts`
- 工具函数: `vibex-fronted/src/lib/canvas/utils.ts`（新建）

**实现方案**:

```typescript
// lib/canvas/utils.ts

/**
 * 从 name/description 关键词推导领域类型
 * 用于历史数据兼容（type 字段为空或非标准值时）
 */
export function deriveDomainType(node: Pick<BoundedContextNode, 'name' | 'description' | 'type'>): BoundedContextNode['type'] {
  // 已有有效 type 时直接返回
  if (node.type && ['core', 'supporting', 'generic', 'external'].includes(node.type)) {
    return node.type;
  }

  const text = `${node.name} ${node.description}`.toLowerCase();

  const coreKeywords = ['core', 'central', '主要', '核心', '订单', '用户', '支付'];
  const supportingKeywords = ['support', '支撑', '辅助', '通知', '日志', '统计'];
  const genericKeywords = ['generic', '通用', '公共', 'common', 'shared'];
  const externalKeywords = ['external', '外部', 'third', '第三方', '集成'];

  if (coreKeywords.some(k => text.includes(k))) return 'core';
  if (supportingKeywords.some(k => text.includes(k))) return 'supporting';
  if (genericKeywords.some(k => text.includes(k))) return 'generic';
  if (externalKeywords.some(k => text.includes(k))) return 'external';

  return 'core'; // 默认核心域
}
```

**验收标准**:
- [ ] `deriveDomainType({ type: 'core' })` → `'core'`（直接返回）
- [ ] `deriveDomainType({ name: '用户管理', type: '' })` → `'core'`（关键词推导）
- [ ] `deriveDomainType({ name: '通知中心', type: undefined })` → `'supporting'`
- [ ] Vitest 分支覆盖率 100%

---

### 2.5 F5: deriveStepType 推导函数

**问题描述**:
`FlowStep.type` 可能为 `undefined`（历史数据无此字段），导致分支/循环步骤图标无法正确显示。

**文件位置**:
- 类型定义: `vibex-fronted/src/lib/canvas/types.ts`
- 工具函数: `vibex-fronted/src/lib/canvas/utils.ts`

**实现方案**:

```typescript
/**
 * 从 step.name/stepId 关键词推导步骤类型
 * 用于历史数据兼容（type 字段为空时）
 */
export function deriveStepType(step: Pick<FlowStep, 'name' | 'stepId' | 'type'>): NonNullable<FlowStep['type']> {
  if (step.type) return step.type;

  const text = `${step.name} ${step.stepId}`.toLowerCase();

  const branchKeywords = ['分支', 'branch', '条件', 'if', 'switch', '选择'];
  const loopKeywords = ['循环', 'loop', '重复', 'recur', '遍历'];

  if (branchKeywords.some(k => text.includes(k))) return 'branch';
  if (loopKeywords.some(k => text.includes(k))) return 'loop';

  return 'normal';
}
```

**验收标准**:
- [ ] `deriveStepType({ type: 'branch' })` → `'branch'`（直接返回）
- [ ] `deriveStepType({ name: '条件分支', type: undefined })` → `'branch'`
- [ ] `deriveStepType({ name: '发送通知', type: undefined })` → `'normal'`
- [ ] Vitest 分支覆盖率 100%

---

### 2.6 F6: expand-both 模式

**问题描述**:
当前 `canvasStore` 已实现三面板独立 expand（leftExpand/centerExpand/rightExpand），但缺少 `expand-both` 聚合模式，即一键将两侧面板隐藏、中间 canvas 占满的交互。

**文件位置**:
- Store: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- 布局: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- 样式: `vibex-fronted/src/components/canvas/canvas.module.css`

**实现方案**:

```typescript
// canvasStore.ts - 新增 action

/**
 * 一键展开到 expand-both 模式
 * 左侧/右侧面板折叠，中间 canvas 占满
 */
expandToBoth: () => {
  set({
    leftExpand: 'default',    // 收窄
    rightExpand: 'default',   // 收窄
    centerExpand: 'expand-both'  // 新状态：占据两侧
  });
},

/**
 * 从 expand-both 恢复默认状态
 */
collapseToDefault: () => {
  set({
    leftExpand: 'default',
    rightExpand: 'default',
    centerExpand: 'default'
  });
},
```

```css
/* canvas.module.css - expand-both 布局 */
.canvas-grid[data-center-expand="expand-both"] {
  --left-panel-width: 0fr;
  --center-panel-width: 1fr;
  --right-panel-width: 0fr;
}

.canvas-grid[data-center-expand="expand-both"] .leftPanel {
  display: none;
}

.canvas-grid[data-center-expand="expand-both"] .rightPanel {
  display: none;
}

.canvas-grid[data-center-expand="expand-both"] .centerPanel {
  transition: all 0.3s ease;
}
```

**验收标准**:
- [ ] 点击"全屏画布"按钮 → 三面板切换到 expand-both 模式
- [ ] expand-both 时中间面板占满，两侧面板隐藏
- [ ] 动画过渡平滑（0.3s ease）
- [ ] 移动端（< 768px）禁用 expand-both
- [ ] Playwright E2E: expand-both 切换成功

---

## 3. 验收清单

### 3.1 功能验收

| ID | 功能 | 验收标准 | 测试方式 |
|----|------|---------|---------|
| F1 | CSS Checkbox | ComponentSelectionStep 无 emoji | `grep` + Vitest |
| F2 | previewUrl 补充 | 导入示例后节点 100% 可跳转 | Playwright E2E |
| F3 | 领域 CSS 变量 | 4 色分组 + 深色模式 | Playwright 截图 |
| F4 | deriveDomainType | 覆盖率 > 90% | `pnpm coverage` |
| F5 | deriveStepType | 覆盖率 > 90% | `pnpm coverage` |
| F6 | expand-both | 动画流畅，布局正确 | Playwright |

### 3.2 质量验收

| 检查项 | 标准 | 验证方式 |
|--------|------|---------|
| 无 emoji 交互元素 | canvas 组件中 0 处 emoji checkbox | `grep -rn '[✓○×]' components/canvas components/flow-components` |
| CSS 变量规范 | 无硬编码颜色值 | 代码审查 |
| 无障碍合规 | axe-core 0 violations | `pnpm axe:run` |
| 单元测试覆盖 | Canvas 相关 > 80% | `pnpm coverage` |
| Console errors | 0 个 Error | Playwright console 监听 |
| 深色模式 | 4 色均适配 | Playwright 深色截图对比 |

---

## 4. 实施计划

| 任务 | 工时 | 依赖 | 顺序 |
|------|------|------|------|
| F1: ComponentSelectionStep Checkbox | 1.5h | — | 1 |
| F2: example-canvas.json previewUrl | 1h | — | 2 |
| F4: deriveDomainType | 1.5h | F3 前置 | 3 |
| F5: deriveStepType | 1.5h | F4 后置 | 4 |
| F3: 领域分组 CSS 变量 | 3h | F4 | 5 |
| F6: expand-both 模式 | 4h | F3 | 6 |
| 测试 + 覆盖率达标 | 5h | All | 7 |

**Phase1 总工时**: ~17.5h（1 dev）

---

*本 PRD 由 Analyst Agent 生成，基于实地代码审计和功能 gap 分析。*

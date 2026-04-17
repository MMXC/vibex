# Implementation Plan: 组件树页面结构增强

**Project**: vibex-proposals-20260411-page-structure
**Stage**: implementation-plan
**Date**: 2026-04-07
**Status**: Proposed

---

## Overview

| 属性 | 值 |
|------|-----|
| 总工时 | 2.5h |
| 优先级 | P0 |
| 依赖 | PRD → Architecture |
| 风险等级 | 低 |

---

## Phase 1: 类型定义增强 (0.5h)

### 1.1 目标
在 `ComponentNode` 类型中增加可选 `pageName` 字段。

### 1.2 文件
- `vibex-fronted/src/lib/canvas/types.ts`

### 1.3 改动

```typescript
// ComponentNode 接口中新增
export interface ComponentNode {
  // ... existing fields
  /** E1-F1: 可选页面名称，允许用户覆盖 BusinessFlowNode.name */
  pageName?: string;
}
```

### 1.4 验收标准
- [ ] TypeScript 编译无新增错误
- [ ] `pageName` 字段为可选 (`?`)
- [ ] 向后兼容：无 `pageName` 的节点不受影响

### 1.5 潜在问题
- None（增量添加，可选字段）

---

## Phase 2: 分组逻辑增强 (1.0h)

### 2.1 目标
增强 `getPageLabel` + `groupByFlowId` 函数，支持 `pageName` 优先逻辑和 `ComponentGroup` 元数据扩展。

### 2.2 文件
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`

### 2.3 改动清单

#### 2.3.1 ComponentGroup 接口扩展

```typescript
export interface ComponentGroup {
  groupId: string;
  label: string;
  color: string;
  nodes: ComponentNode[];
  isCommon?: boolean;
  /** E1-F2: 页面 ID（从 groupId 提取）*/
  pageId: string;
  /** E1-F2: 组件数量 */
  componentCount: number;
}
```

#### 2.3.2 getPageLabel 函数修改

```typescript
/**
 * 获取页面标签名，优先级：pageName > BusinessFlowNode.name > fallback
 */
export function getPageLabel(
  flowId: string,
  flowNodes: BusinessFlowNode[],
  pageName?: string
): string {
  // 0. 通用组件标识 → 使用通用组件标签
  if (!flowId || COMMON_FLOW_IDS.has(flowId)) {
    return COMMON_GROUP_LABEL;
  }

  // E1-F1: pageName 优先（新增逻辑）
  if (pageName) {
    return `📄 ${pageName}`;
  }

  // 1. 精确匹配 nodeId
  const matched = matchFlowNode(flowId, flowNodes);
  if (matched) return `📄 ${matched.name}`;

  // 2. 兜底：显示 flowId 前缀
  const shortId = flowId.length > 12 ? flowId.slice(0, 12) + '…' : flowId;
  return `❓ ${shortId}`;
}
```

#### 2.3.3 groupByFlowId 函数修改

```typescript
export function groupByFlowId(
  nodes: ComponentNode[],
  flowNodes: BusinessFlowNode[]
): ComponentGroup[] {
  // ... existing logic ...

  // For each group, compute pageId and componentCount
  const result: ComponentGroup[] = groups.map((g) => ({
    groupId: g.groupId,
    label: getPageLabel(g.groupId, flowNodes, g.nodes[0]?.pageName), // E1-F1: pass pageName
    color: g.color,
    nodes: g.nodes,
    isCommon: g.isCommon,
    pageId: g.groupId, // E1-F2: pageId from groupId
    componentCount: g.nodes.length, // E1-F2: componentCount
  }));

  return result;
}
```

#### 2.3.4 组件树 UI 修改

在 `contextTreeControls` 中添加 JSON 按钮：

```tsx
<button
  type="button"
  className={styles.secondaryButton}
  onClick={() => setShowJsonPreview(true)}
  aria-label="JSON 树视图"
  data-testid="json-preview-button"
>
  📋 JSON
</button>
```

在 Group label 显示中传入 pageName：

```tsx
label={getPageLabel(group.groupId, flowNodes, group.nodes[0]?.pageName)}
```

在 Group label 下方显示 componentCount badge：

```tsx
<span className={styles.groupCountBadge}>
  {group.componentCount} 个组件
</span>
```

### 2.4 验收标准
- [ ] `getPageLabel` 支持 `pageName` 优先逻辑
- [ ] `ComponentGroup` 包含 `pageId` + `componentCount`
- [ ] JSON 按钮在工具栏可见
- [ ] Group label 显示 `pageName`（优先）或 `BusinessFlowNode.name`

### 2.5 潜在问题
- `getPageLabel` 函数签名变更：需更新所有调用处传入 `pageName` 参数

---

## Phase 3: JSON 预览弹窗 (0.5h)

### 3.1 目标
创建 `JsonTreePreviewModal` 弹窗组件，展示组件树整体 JSON 结构。

### 3.2 新文件
- `vibex-fronted/src/components/canvas/json-tree/JsonTreePreviewModal.tsx`

### 3.3 组件实现

```typescript
'use client';

import React, { useMemo } from 'react';
import { JsonRenderPreview } from '@/components/canvas/json-render/JsonRenderPreview';
import styles from './JsonTreePreviewModal.module.css';

interface ComponentTreeJson {
  pages: Array<{
    pageId: string;
    pageName: string;
    componentCount: number;
    isCommon: boolean;
    components: Array<{
      nodeId: string;
      name: string;
      type: string;
      flowId: string;
      status: string;
    }>;
  }>;
  totalComponents: number;
  generatedAt: string;
}

interface JsonTreePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ComponentGroup[];
}

// buildPagesData: ComponentGroup[] → {pages: [...]} JSON structure
function buildPagesData(groups: ComponentGroup[]): { pages: PageData[]; totalComponents: number; generatedAt: string; }

interface PageData {
  pageId: string;
  pageName: string;   // label with emoji prefix stripped
  componentCount: number;
  isCommon: boolean;
  components: ComponentNode[];
}

export function JsonTreePreviewModal({
  isOpen,
  onClose,
  componentNodes,
  flowNodes,
}: JsonTreePreviewModalProps) {
  // Build ComponentTreeJson from componentNodes
  const jsonData = useMemo<ComponentTreeJson>(() => {
    // Use groupByFlowId output
    const groups = groupByFlowId(componentNodes, flowNodes);
    return {
      pages: groups.map((g) => ({
        pageId: g.pageId,
        pageName: g.label.replace(/^[📄❓🔧]\s*/, ''), // strip emoji
        componentCount: g.componentCount,
        isCommon: g.isCommon ?? false,
        components: g.nodes.map((n) => ({
          nodeId: n.nodeId,
          name: n.name,
          type: n.type,
          flowId: n.flowId,
          status: n.status,
        })),
      })),
      totalComponents: componentNodes.length,
      generatedAt: new Date().toISOString(),
    };
  }, [componentNodes, flowNodes]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      data-testid="json-preview-modal"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📋 组件树 JSON 结构</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <JsonRenderPreview
            nodes={jsonData as any}
            interactive={false}
          />
        </div>
      </div>
    </div>
  );
}
```

### 3.4 CSS Module
- `vibex-fronted/src/components/canvas/json-tree/JsonTreePreviewModal.module.css`

```css
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: var(--color-bg-primary, #fff);
  border-radius: 12px;
  max-width: 80vw;
  max-height: 80vh;
  overflow: auto;
  padding: 20px;
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modalHeader h2 {
  margin: 0;
  font-size: 18px;
}

.closeButton {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.modalBody {
  max-height: calc(80vh - 60px);
  overflow: auto;
}
```

### 3.5 验收标准
- [ ] JSON 按钮点击触发弹窗打开
- [ ] 弹窗显示 `{ pages: [...] }` JSON 结构
- [ ] 每个 page 包含 `pageId` + `pageName` + `componentCount` + `components`
- [ ] 关闭按钮可正常关闭弹窗
- [ ] 点击遮罩层可关闭弹窗

### 3.6 潜在问题
- `JsonRenderPreview` 对新数据结构的兼容性 → 需测试验证

---

## Phase 4: 测试覆盖 (0.5h)

### 4.1 单元测试

**文件**: `vibex-fronted/src/__tests__/canvas/ComponentTreeGrouping.test.ts`

新增测试用例：

```typescript
// 在 describe('getPageLabel') 中新增
describe('pageName fallback', () => {
  test('pageName 存在 → 返回 pageName', () => {
    const node = makeNode({ pageName: '自定义页面名' });
    expect(getPageLabel(node.flowId, flowNodes, node.pageName)).toBe('自定义页面名');
  });

  test('pageName 不存在 → fallback 到 BusinessFlowNode.name', () => {
    const node = makeNode({ pageName: undefined });
    expect(getPageLabel(node.flowId, flowNodes, node.pageName)).toBe('📄 订单流程');
  });

  test('pageName + 无 flowId 匹配 → pageName 优先', () => {
    const node = makeNode({ flowId: 'unknown', pageName: '自定义' });
    expect(getPageLabel(node.flowId, flowNodes, node.pageName)).toBe('自定义');
  });
});

// 在 describe('groupByFlowId') 中新增
describe('componentCount metadata', () => {
  test('ComponentGroup 包含 pageId + componentCount', () => {
    const nodes: ComponentNode[] = [
      makeNode({ nodeId: 'p1', flowId: 'flow-1' }),
      makeNode({ nodeId: 'p2', flowId: 'flow-1' }),
    ];
    const groups = groupByFlowId(nodes, flowNodes);
    const group = groups.find(g => g.groupId === 'flow-1');
    expect(group?.pageId).toBe('flow-1');
    expect(group?.componentCount).toBe(2);
  });
});
```

### 4.2 E2E 测试

**新文件**: `vibex-fronted/tests/e2e/component-tree-json.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('组件树 JSON 预览功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    // 等待组件树加载
    await page.waitForSelector('[data-testid="component-tree"]', { timeout: 10000 });
  });

  test('JSON 预览按钮可见', async ({ page }) => {
    const jsonButton = page.getByTestId('json-preview-button');
    await expect(jsonButton).toBeVisible();
  });

  test('点击 JSON 按钮打开弹窗', async ({ page }) => {
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const modal = page.getByTestId('json-preview-modal');
    await expect(modal).toBeVisible();
  });

  test('JSON 弹窗包含正确数据结构', async ({ page }) => {
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const modal = page.getByTestId('json-preview-modal');
    await expect(modal).toBeVisible();

    // 验证数据结构字段存在
    await expect(page.getByText(/pageId/)).toBeVisible();
    await expect(page.getByText(/pageName/)).toBeVisible();
    await expect(page.getByText(/componentCount/)).toBeVisible();
  });

  test('关闭按钮可关闭弹窗', async ({ page }) => {
    const jsonButton = page.getByTestId('json-preview-button');
    await jsonButton.click();

    const closeButton = page.getByRole('button', { name: '关闭' });
    await closeButton.click();

    const modal = page.getByTestId('json-preview-modal');
    await expect(modal).not.toBeVisible();
  });
});
```

### 4.3 验收标准
- [ ] 所有新增测试用例通过
- [ ] `getPageLabel` + `groupByFlowId` 覆盖率 ≥ 90%
- [ ] E2E 测试 100% pass

---

## 5. Implementation Checklist

| # | 任务 | 状态 | 负责人 |
|---|------|------|--------|
| 1 | Phase 1: types.ts pageName 字段 | ✅ Done | Dev |
| 2 | Phase 2: getPageLabel pageName fallback | ✅ Done | Dev |
| 3 | Phase 2: ComponentGroup pageId+componentCount | ✅ Done | Dev |
| 4 | Phase 2: JSON 按钮添加工具栏 | ✅ Done | Dev |
| 5 | Phase 3: JsonTreePreviewModal 组件 | ✅ Done | Dev |
| 6 | Phase 4: 单元测试 pageName fallback | ✅ Done | Dev |
| 7 | Phase 4: E2E 测试 JSON 预览 | ✅ Done | Dev |

---

## 6. Rollback Plan

| 问题 | 回滚方案 |
|------|----------|
| TypeScript 编译失败 | 移除 `pageName` 字段，恢复 `getPageLabel` 原签名 |
| JSON 弹窗不工作 | 移除 JSON 按钮，恢复 ComponentTree.tsx 原状 |
| 测试失败 | 暂不合并，待修复后重提 PR |


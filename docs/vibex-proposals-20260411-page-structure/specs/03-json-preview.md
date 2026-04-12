# Spec: JSON 预览功能（📋 JSON 按钮 + 弹窗）

**Spec 版本**: 1.0  
**对应 PRD Epic**: Epic 3 — JSON 预览功能  
**对应 Stories**: S3.1, S3.2  
**对应功能点**: F3.1, F3.2, F3.3  
**验收标准**: AC6, AC7, AC8  

---

## 1. 概述

在组件树顶部 toolbar 区域新增「📋 JSON」按钮，点击后弹出 JSON 树结构视图弹窗，展示组件树的完整页面-组件层级结构。

JSON 数据结构为：

```typescript
{
  pages: [
    {
      pageId: string,          // 来自 ComponentGroup.pageId
      pageName: string,        // 来自 ComponentGroup.label (getPageLabel)
      componentCount: number,  // 来自 ComponentGroup.componentCount
      components: [            // 来自 ComponentGroup.components
        {
          id: string,
          type: string,
          label: string,
          pageName?: string,   // 可能存在
          children?: [...]     // 递归嵌套
        }
      ]
    }
  ]
}
```

---

## 2. 详细设计

### 2.1 组件结构

| 组件 | 位置 | 说明 |
|------|------|------|
| `JSONPreviewButton` | ComponentTree toolbar 区域 | 触发弹窗的按钮 |
| `JSONPreviewModal` | 复用 `CanvasPreviewModal` 或新建 | 展示 JSON 树视图的弹窗 |

### 2.2 JSONPreviewButton

```tsx
// 位置: ComponentTree.tsx toolbar
// 样式: 图标按钮，与其他 toolbar 按钮一致
// 文本: "📋 JSON"

import { useState } from 'react';
import { JSONPreviewModal } from './JSONPreviewModal';

export function ComponentTreeToolbar({ groups }: { groups: ComponentGroup[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* 现有 toolbar 内容 */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="预览组件树 JSON"
      >
        📋 JSON
      </button>

      {isModalOpen && (
        <JSONPreviewModal
          groups={groups}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
```

### 2.3 JSONPreviewModal 数据转换

```typescript
// 将 ComponentGroup[] 转换为 pages 数组
function buildPagesData(groups: ComponentGroup[]): { pages: PageData[] } {
  return {
    pages: groups.map(group => ({
      pageId: group.pageId,
      pageName: group.label,
      componentCount: group.componentCount,
      components: group.components,
    })),
  };
}
```

### 2.4 JSONPreviewModal 渲染

复用 `CanvasPreviewModal` 组件或新建专用弹窗：

```tsx
// 核心渲染逻辑
export function JSONPreviewModal({ groups, onClose }: JSONPreviewModalProps) {
  const pagesData = buildPagesData(groups);

  return (
    <Modal onClose={onClose} title="组件树 JSON 预览">
      <pre style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {JSON.stringify(pagesData, null, 2)}
      </pre>
    </Modal>
  );
}
```

---

## 3. API/接口

### 3.1 JSONPreviewButton Props

```typescript
interface JSONPreviewButtonProps {
  groups: ComponentGroup[];
}
```

### 3.2 JSONPreviewModal Props

```typescript
interface JSONPreviewModalProps {
  groups: ComponentGroup[];  // 来自 groupByFlowId() 的输出
  onClose: () => void;
}
```

### 3.3 buildPagesData 工具函数

```typescript
// 签名
function buildPagesData(groups: ComponentGroup[]): { pages: PageData[] }

// PageData 类型
interface PageData {
  pageId: string;
  pageName: string;
  componentCount: number;
  components: ComponentNode[];
}
```

### 3.4 数据流

```
ComponentTree 组件
  └─> groups: ComponentGroup[] (来自 groupByFlowId)
        ├─> JSONPreviewButton
        │     └─> setIsModalOpen(true)
        └─> JSONPreviewModal (when open)
              └─> buildPagesData(groups)
                    └─> { pages: [...] } → JSON.stringify → 渲染
```

---

## 4. 实现步骤

### Step 1: 实现 buildPagesData 工具函数

1. 创建 `packages/vibex-component-tree/src/utils/buildPagesData.ts`
2. 实现 `ComponentGroup[]` → `{ pages: PageData[] }` 转换
3. 单元测试覆盖

### Step 2: 创建 JSONPreviewButton 组件

1. 在 `ComponentTree.tsx` toolbar 区域添加按钮
2. 使用 `aria-label` 确保无障碍
3. 按钮文本: "📋 JSON"

### Step 3: 实现或复用 JSONPreviewModal

1. 优先复用 `CanvasPreviewModal`（PRD Section 6 依赖）
2. 若需新建，参考 `CanvasPreviewModal` 的弹窗样式
3. 使用 `<pre>` + `JSON.stringify(data, null, 2)` 渲染 JSON

### Step 4: 集成到 ComponentTree

1. 在 toolbar 中添加 `JSONPreviewButton`
2. 确保 `groups` 数据通过 props 传入

### Step 5: E2E 测试

参考 `specs/05-unit-tests.md` 中 E2E 测试用例。

---

## 5. 验收测试

> **引用 PRD**: AC6, AC7, AC8 + F3.1, F3.2, F3.3

### 5.1 按钮可见性（E2E）

```typescript
// ✅ AC6: 组件树渲染时「📋 JSON」按钮可见
import { test, expect } from '@playwright/test';

test('JSON button is visible in component tree toolbar', async ({ page }) => {
  await page.goto('/canvas/component-tree');
  await expect(page.getByRole('button', { name: '📋 JSON' })).toBeVisible();
});
```

### 5.2 按钮点击触发弹窗（E2E）

```typescript
// ✅ AC7: 点击「📋 JSON」按钮，弹窗显示 pages 数组
test('clicking JSON button opens modal with pages array', async ({ page }) => {
  await page.goto('/canvas/component-tree');
  await page.getByRole('button', { name: '📋 JSON' }).click();
  await expect(page.getByText(/pageId/)).toBeVisible();  // ✅ F3.2
  await expect(page.getByText(/pageName/)).toBeVisible();
});
```

### 5.3 JSON 数据结构正确（单元测试）

```typescript
// ✅ F3.3: JSON 数据结构符合规范
const groups: ComponentGroup[] = [
  {
    label: '首页',
    pageId: 'flow-home',
    componentCount: 2,
    isCommon: false,
    components: [
      { id: 'c1', type: 'Button', label: '按钮1', flowId: 'flow-home' },
      { id: 'c2', type: 'Input', label: '输入框', flowId: 'flow-home' },
    ],
  },
  {
    label: '🔧 通用组件',
    pageId: '__common__',
    componentCount: 1,
    isCommon: true,
    components: [
      { id: 'c3', type: 'Divider', label: '分割线', flowId: '__common__' },
    ],
  },
];

const result = buildPagesData(groups);

expect(result.pages).toHaveLength(2);

// ✅ AC8: 每个 page 包含 pageId + pageName + componentCount + components
expect(result.pages[0]).toHaveProperty('pageId', 'flow-home');       // ✅ F3.3
expect(result.pages[0]).toHaveProperty('pageName', '首页');
expect(result.pages[0]).toHaveProperty('componentCount', 2);
expect(result.pages[0]).toHaveProperty('components');
expect(result.pages[0].components).toHaveLength(2);

// ✅ 通用组件组也在 pages 中
const commonPage = result.pages.find(p => p.pageId === '__common__');
expect(commonPage).toBeDefined();
expect(commonPage!.pageName).toBe('🔧 通用组件');
expect(commonPage!.componentCount).toBe(1);
```

### 5.4 组件节点递归 children 序列化

```typescript
// ✅ 嵌套组件正确序列化
const nestedNode: ComponentNode = {
  id: 'parent',
  type: 'Container',
  label: '容器',
  flowId: 'flow-1',
  children: [
    { id: 'child1', type: 'Button', label: '按钮', flowId: 'flow-1' },
    {
      id: 'child2',
      type: 'Nested',
      label: '嵌套',
      flowId: 'flow-1',
      children: [{ id: 'grandchild', type: 'Text', label: '文本', flowId: 'flow-1' }],
    },
  ],
};

const result2 = buildPagesData([{
  label: 'test',
  pageId: 'flow-1',
  componentCount: 1,
  isCommon: false,
  components: [nestedNode],
}]);

expect(result2.pages[0].components[0].children).toHaveLength(2);
expect(result2.pages[0].components[0].children![1].children).toHaveLength(1);
expect(result2.pages[0].components[0].children![1].children![0].id).toBe('grandchild');
```

### 5.5 pageName 字段透传

```typescript
// ✅ pageName 字段在 JSON 中正确透传
const nodeWithPageName: ComponentNode = {
  id: 'custom-node',
  type: 'Button',
  label: 'Button',
  flowId: 'flow-x',
  pageName: '自定义页面标签',
};

const result3 = buildPagesData([{
  label: 'fallback',
  pageId: 'flow-x',
  componentCount: 1,
  isCommon: false,
  components: [nodeWithPageName],
}]);

expect(result3.pages[0].components[0]).toHaveProperty('pageName', '自定义页面标签');
```

---

## 6. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 大型组件树 JSON 渲染性能问题 | 中 | 使用 `<pre>` 分段渲染，限制最大高度 `max-height: 70vh` + `overflow: auto` |
| CanvasPreviewModal 样式不匹配 | 低 | 复用时检查样式变量，必要时新建专用 Modal |
| E2E 测试不稳定（弹窗动画） | 低 | 添加 `waitForSelector` 等待弹窗出现 |
| JSON 序列化循环引用（children 双向引用） | 低 | ComponentNode children 为单向树结构，无循环引用 |
| pageName 字段缺失时 JSON 显示 undefined | 低 | `buildPagesData` 中可选字段直接透传，符合预期 |

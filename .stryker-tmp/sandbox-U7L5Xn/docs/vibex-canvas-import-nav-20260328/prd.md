# PRD: VibeX 导入示例节点导航修复

**Project**: vibex-canvas-import-nav-20260328
**Status**: Draft
**Owner**: PM
**Date**: 2026-03-28
**Effort**: ~3h

---

## 1. Executive Summary

### Background

用户导入示例数据后，点击画布 `ComponentTree` 中的组件/页面节点**无响应**。根因分析发现：

- `componentNodes` 缺少 `previewUrl` 字段
- `handleNodeClick` fallback 逻辑尝试用文件路径构造 VSCode deep link，但路径不存在导致打开失败
- 用户感知为"点击节点没有任何反应"，严重损害导航体验

### Objective

导入示例后，节点可点击 → 跳转到组件原型预览页面，提供实际导航价值。

### Success Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| 节点点击响应率 | 100% | 导入示例后任意节点可点击 |
| 跳转成功率 | ≥95% | 点击后 URL 变化，预览页加载 |
| hover 提示可见率 | 100% | hover 显示跳转图标 |

---

## 2. Epic 1: 导入节点导航修复（P0）

### F1.1: 示例数据补全 previewUrl

**文件**: `vibex-fronted/src/data/example-canvas.json`

为 `componentNodes` 中的每个节点补充 `previewUrl` 字段，指向 `/preview?page={id}` 格式的真实路由。

**Example Data 改造**:

```json
{
  "componentId": "comp-product-list",
  "name": "商品列表页",
  "previewUrl": "/preview?page=product-list",
  "api": { "path": "/api/products" }
}
```

**集成点**:

- 文件: `vibex-fronted/src/data/example-canvas.json`
- 类型: `vibex-fronted/src/lib/canvas/types.ts` → `ComponentNode` 接口增加 `previewUrl?: string`

**验收标准**:

```typescript
// specs/canvas-import-nav.spec.ts
describe('F1.1: 示例数据 previewUrl', () => {
  it('example-canvas.json 所有 componentNodes 有 previewUrl', () => {
    const data = require('@/data/example-canvas.json');
    data.componentNodes.forEach((node: any) => {
      expect(node).toHaveProperty('previewUrl');
      expect(node.previewUrl).toMatch(/^\/preview\?page=.+$/);
    });
  });

  it('previewUrl 指向 /preview 路由', () => {
    const data = require('@/data/example-canvas.json');
    const node = data.componentNodes[0];
    expect(node.previewUrl).toContain('/preview');
  });
});
```

---

### F1.2: handleNodeClick 降级处理

**文件**: `vibex-fronted/src/components/canvas/ComponentTree.tsx` L120-130

**当前问题**: 无 `previewUrl` 时 fallback 到 VSCode deep link，路径不存在导致静默失败。

**改造方案**: 优先使用 `previewUrl`，无 `previewUrl` 时降级到 `/preview?component={componentId}`。

**代码改动**:

```typescript
// ComponentTree.tsx - handleNodeClick
const handleNodeClick = useCallback(() => {
  if (node.previewUrl) {
    window.location.href = node.previewUrl;
    return;
  }
  // 降级: 无 previewUrl 时跳转到 /preview?component={id}
  window.location.href = `/preview?component=${node.componentId}`;
}, [node]);
```

**集成点**:

- 文件: `vibex-fronted/src/components/canvas/ComponentTree.tsx`
- 需处理: `ComponentNode` 类型已更新（见 F1.1）
- `flowNodes` 节点（页面级）同样需要 `previewUrl` 支持

**验收标准**:

```typescript
// specs/canvas-import-nav.spec.ts
describe('F1.2: handleNodeClick 降级处理', () => {
  it('有 previewUrl 时跳转到 previewUrl', () => {
    const node = { componentId: 'c1', previewUrl: '/preview?page=dashboard' };
    // 模拟点击
    const url = node.previewUrl;
    expect(url).toBe('/preview?page=dashboard');
  });

  it('无 previewUrl 时降级到 /preview?component={id}', () => {
    const node = { componentId: 'c1' }; // 无 previewUrl
    const fallback = `/preview?component=${node.componentId}`;
    expect(fallback).toBe('/preview?component=c1');
  });

  it('componentNodes 和 flowNodes 均支持降级逻辑', () => {
    const componentNode = { componentId: 'comp-1' };
    const flowNode = { componentId: 'page-1' };
    const genFallback = (n: any) => n.previewUrl ?? `/preview?component=${n.componentId}`;
    expect(genFallback(componentNode)).toBe('/preview?component=comp-1');
    expect(genFallback(flowNode)).toBe('/preview?component=page-1');
  });
});
```

---

### F1.3: /preview 页面支持 query param 加载组件预览

**文件**: `vibex-fronted/src/app/preview/page.tsx`

**当前问题**: `/preview` 页面使用 `useConfirmationStore`，与 `canvasStore` 无关，无法从 query param 加载组件数据。

**改造方案**: `/preview` 页面增加 URL 参数解析逻辑，支持两种加载模式：

1. `?page={pageId}` — 从 `canvasStore.componentNodes` 查找并渲染
2. `?component={componentId}` — 同上，降级兼容格式

**数据流**:

```
用户点击节点 → window.location.href = /preview?page={id}
  → preview/page.tsx 解析 ?page= → useCanvasStore.getState().componentNodes
  → 找到对应组件 → 渲染组件预览
```

**核心逻辑**:

```typescript
// preview/page.tsx
'use client';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PreviewContent() {
  const params = useSearchParams();
  const pageId = params.get('page') ?? params.get('component');
  const componentNodes = useCanvasStore((s) => s.componentNodes);

  const node = componentNodes.find((n) => n.componentId === pageId);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">未找到组件: {pageId}</p>
      </div>
    );
  }

  // 渲染组件预览（复用原有渲染逻辑）
  return <div>{/* 组件渲染逻辑 */}</div>;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
```

**注意**: 需确认 `/preview` 现有渲染逻辑（`useConfirmationStore`）与 `canvasStore` 的共存策略。

**验收标准**:

```typescript
// specs/canvas-import-nav.spec.ts
describe('F1.3: /preview 页面 query param 加载', () => {
  it('?page= 参数加载对应组件', () => {
    const params = new URLSearchParams('?page=product-list');
    const pageId = params.get('page') ?? params.get('component');
    expect(pageId).toBe('product-list');
  });

  it('?component= 参数加载对应组件（降级兼容）', () => {
    const params = new URLSearchParams('?component=comp-1');
    const pageId = params.get('page') ?? params.get('component');
    expect(pageId).toBe('comp-1');
  });

  it('未找到组件时显示友好提示', () => {
    const componentNodes = [{ componentId: 'a' }];
    const node = componentNodes.find((n) => n.componentId === 'not-exist');
    expect(node).toBeUndefined();
  });
});
```

---

## 3. Non-Functional Requirements

| ID | 要求 | 说明 |
|----|------|------|
| NFR-1 | 性能 | 节点点击响应 < 100ms（含路由跳转感知） |
| NFR-2 | 兼容性 | 支持 Next.js App Router，`useSearchParams` 需 Suspense 包裹 |
| NFR-3 | 向后兼容 | 现有 `/preview` 功能（useConfirmationStore）不破坏 |
| NFR-4 | 可调试 | 路由跳转后 URL 可见，用户可复制分享 |

---

## 4. Out of Scope

- 不新增 `/component/[id]` 详情页路由（方案 B）
- 不修复 VSCode deep link 逻辑（改为跳转到 /preview）
- 不修改 flowNodes 节点的独立导航逻辑（仅共享降级 fallback）
- 不修改导入流程本身（仅修改导入后的数据）

---

## 5. Dependencies

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| canvasStore | 已有 | 提供 componentNodes 数据源 |
| example-canvas.json | 已有 | 示例数据文件 |
| /preview 页面 | 已有 | 目标跳转页面 |

---

## 6. 文件变更清单

| 文件 | 改动 | 类型 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/types.ts` | `ComponentNode` 增加 `previewUrl?: string` | 类型 |
| `vibex-fronted/src/data/example-canvas.json` | 所有 `componentNodes` 补充 `previewUrl` | 数据 |
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | `handleNodeClick` 增加降级逻辑 | 逻辑 |
| `vibex-fronted/src/app/preview/page.tsx` | 增加 query param 解析和渲染逻辑 | 页面 |
| `specs/canvas-import-nav.spec.ts` | 验收测试 | 测试 |

---

## 7. Implementation Order

1. **F1.1** → 类型 + 示例数据（风险最低，先完成）
2. **F1.2** → handleNodeClick 降级逻辑（改动集中）
3. **F1.3** → /preview 页面 query param 支持（最后一步，依赖 store 数据就绪）

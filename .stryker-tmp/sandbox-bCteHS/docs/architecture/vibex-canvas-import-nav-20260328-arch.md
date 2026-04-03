# ADR: vibex-canvas-import-nav-20260328 架构设计

## Status
Accepted

## Context
用户导入示例后点击 componentNodes 节点无响应（缺少 previewUrl，fallback VSCode deep link 路径不存在）。需补全示例数据 + 降级到 /preview 路由 + preview 页面支持 query param 渲染。

## Decision

### Tech Stack
- **Framework**: Next.js App Router（现有）
- **State**: Zustand canvasStore（现有）
- **Routing**: Next.js useSearchParams（现有）
- **Test**: Vitest + Playwright（现有）

### Architecture

```
example-canvas.json (F1.1)
  │
  └─ componentNodes[].previewUrl = "/preview?page={componentId}"
         │
         ▼
ComponentTree.tsx (F1.2)
  │
  └─ handleNodeClick:
       ├─ 有 previewUrl → window.location.href = previewUrl
       └─ 无 previewUrl → /preview?component={componentId}
              │
              ▼
/preview/page.tsx (F1.3)
  │
  ├─ useSearchParams() 解析 ?page= 或 ?component=
  ├─ canvasStore.componentNodes 查找节点
  └─ 渲染组件预览（或友好提示）
```

### File Changes

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/lib/canvas/types.ts` | 修改 | ComponentNode 增加 previewUrl?: string |
| `src/data/example-canvas.json` | 修改 | 所有 componentNodes 补充 previewUrl |
| `src/components/canvas/ComponentTree.tsx` | 修改 | handleNodeClick 降级逻辑 |
| `src/app/preview/page.tsx` | 修改 | query param 解析 + 预览渲染 |
| `specs/canvas-import-nav.spec.ts` | 新建 | 验收测试 |

### Data Model

```typescript
// src/lib/canvas/types.ts
export interface ComponentNode {
  componentId: string;
  name: string;
  previewUrl?: string; // 新增
  api?: { path: string };
  // ... 已有字段
}

// src/data/example-canvas.json 改造示例
{
  "componentNodes": [
    {
      "componentId": "comp-product-list",
      "name": "商品列表页",
      "previewUrl": "/preview?page=product-list",
      "api": { "path": "/api/products" }
    }
  ]
}
```

### ComponentTree.tsx — F1.2

```tsx
// ComponentTree.tsx — handleNodeClick
const handleNodeClick = useCallback(() => {
  if (node.previewUrl) {
    window.location.href = node.previewUrl;
    return;
  }
  // 降级 fallback: 跳转到 /preview?component={id}
  window.location.href = `/preview?component=${node.componentId}`;
}, [node.previewUrl, node.componentId]);

// 同步更新 flowNodes 支持
const handleFlowNodeClick = useCallback((node: FlowNode) => {
  const href = node.previewUrl ?? `/preview?component=${node.componentId}`;
  window.location.href = href;
}, [node]);
```

### /preview/page.tsx — F1.3

```tsx
// src/app/preview/page.tsx
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

  return (
    <div className="preview-container">
      <h1>{node.name}</h1>
      {/* TODO: 复用组件预览渲染逻辑（下一步 Epic） */}
      {node.api && <p>API: {node.api.path}</p>}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
```

### Backward Compatibility
- 现有 `/preview` 使用 `useConfirmationStore` → 保持不变（与 canvasStore 并存）
- 未来统一迁移路径：确认 store → canvasStore → 删除 confirmationStore

## Consequences

### Positive
- 导入示例后节点 100% 可点击导航
- fallback 机制兜底，即使 previewUrl 为空也有路由跳转
- 路由参数可见，用户可复制分享链接

### Risks
- **风险**: /preview 页面需等待 canvasStore 数据加载完成 → **缓解**: 组件内 useCanvasStore 直接读取，数据在导入时已注入
- **风险**: 组件预览渲染逻辑缺失（PRD F1.3 TODO）→ **缓解**: F1.3 输出为框架+数据绑定，渲染逻辑在后续 Epic 实现
- **风险**: pageId 与 componentId 命名不一致 → **缓解**: `params.get('page') ?? params.get('component')` 兼容两种格式

## Testing Strategy

| 测试类型 | 工具 | 覆盖点 |
|----------|------|--------|
| 数据验证 | Vitest | example-canvas.json 所有节点有 previewUrl |
| 降级逻辑 | Vitest | 无 previewUrl 时 fallback 正确 |
| 路由解析 | Vitest | ?page= 和 ?component= 均支持 |
| E2E 导航 | Playwright | 导入示例 → 点击节点 → 跳转成功 |
| 404 降级 | Playwright | 点击不存在节点 → 友好提示 |

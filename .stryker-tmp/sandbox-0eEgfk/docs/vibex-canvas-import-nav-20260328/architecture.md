# Architecture: vibex-canvas-import-nav-20260328

**Project**: 导入示例节点导航修复
**Architect**: Architect Agent | **Date**: 2026-03-28 | **Status**: ✅

---

## 1. Tech Stack

| 组件 | 说明 |
|------|------|
| React Router | 现有导航 |
| Zustand | canvasStore |

---

## 2. Root Cause

- `componentNodes` 缺少 `previewUrl` 字段
- `handleNodeClick` fallback 尝试 VSCode deep link，路径不存在

---

## 3. Module Design

### 3.1 Sample Data Extension

**文件**: `data/example-canvas.json` (修改)

```typescript
interface ComponentNode {
  id: string;
  label: string;
  type: 'component';
  previewUrl: string; // 新增：原型预览 URL
  filePath?: string;  // 保留，但非主链路
}
```

### 3.2 handleNodeClick Fix

**文件**: `ComponentTree.tsx` (修改)

```typescript
const handleNodeClick = (node: ComponentNode) => {
  if (node.previewUrl) {
    // 主链路：跳转到原型预览
    router.push(node.previewUrl);
    return;
  }
  // Fallback: 显示 toast 提示"预览不可用"
  toast.show({ message: '组件预览不可用', type: 'info' });
};
```

---

## 4. Implementation Plan

| 任务 | 工时 |
|------|------|
| 扩展 `example-canvas.json` — 添加 previewUrl | 0.5h |
| 扩展 `ComponentNode` TypeScript 类型 | 0.5h |
| 修改 `ComponentTree.handleNodeClick` | 1h |
| Toast fallback 处理 | 0.5h |
| E2E 导航验证 | 1h |
| **总计** | **~3.5h** |

---

## 5. Key Files

```
data/example-canvas.json                       [修改]
src/components/canvas/ComponentTree.tsx       [修改]
src/types/canvas.ts                          [修改] (ComponentNode)
```

---

## 6. ADR

### ADR-001: 示例数据节点必须有 previewUrl

**Decision**: 所有示例数据节点必须包含 `previewUrl`，否则不显示点击导航。

**Consequences**: + 用户体验一致；- 需要在示例数据中维护 URL。

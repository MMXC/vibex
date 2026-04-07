# Architecture: vibex-canvas-bc-layout-20260328

**Project**: 限界上下文卡片布局分组
**Architect**: Architect Agent | **Date**: 2026-03-28 | **Status**: ✅

---

## 1. Tech Stack

| 组件 | 说明 |
|------|------|
| CSS | 纯 CSS 分组，无新依赖 |
| React | 现有 18.x |
| Zustand | 现有 canvasStore |

---

## 2. Module Design

### 2.1 BoundedContextGroup Component

**文件**: `src/components/canvas/BoundedContextGroup.tsx` (新增)

```typescript
interface BoundedContextGroupProps {
  domainType: 'core' | 'supporting' | 'generic';
  children: React.ReactNode;
  className?: string;
}

const DOMAIN_COLORS = {
  core: '#6366f1',      // indigo
  supporting: '#f59e0b', // amber
  generic: '#64748b',     // slate
};

// 渲染: CSS dashed border + left label badge
```

### 2.2 BoundedContextTree Extension

**文件**: `src/components/canvas/BoundedContextTree.tsx` (修改)

- 将现有节点列表按 `domainType` 分组
- 每个分组包裹 `BoundedContextGroup`
- 保持 CRUD 操作不变

---

## 3. CSS Design

```css
.bounded-context-group {
  position: relative;
  border: 2px dashed var(--domain-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.bounded-context-group__label {
  position: absolute;
  top: -10px;
  left: 8px;
  background: var(--bg);
  padding: 0 4px;
  font-size: 12px;
  color: var(--domain-color);
  font-weight: 600;
}
```

---

## 4. Implementation Plan

| 任务 | 文件 | 工时 |
|------|------|------|
| 创建 `BoundedContextGroup` 组件 | `BoundedContextGroup.tsx` | 1h |
| 扩展 `BoundedContextTree` 分组逻辑 | `BoundedContextTree.tsx` | 2h |
| CSS 主题变量（domain colors） | `*.module.css` | 1h |
| 响应式验证（375px~1440px）| — | 0.5h |
| **总计** | | **~4.5h** |

---

## 5. Key Files

```
src/components/canvas/BoundedContextGroup.tsx [新增]
src/components/canvas/BoundedContextTree.tsx [修改]
src/components/canvas/BoundedContextTree.module.css [修改]
```

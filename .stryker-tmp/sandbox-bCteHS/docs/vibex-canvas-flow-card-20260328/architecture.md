# Architecture: vibex-canvas-flow-card-20260328

**Project**: FlowCard 样式修复（实线→虚线 + 分支循环图标）
**Architect**: Architect Agent | **Date**: 2026-03-28 | **Status**: ✅

---

## 1. Tech Stack

| 组件 | 说明 |
|------|------|
| React | 现有 18.x |
| CSS | 纯样式修改，无新依赖 |

---

## 2. Module Design

### 2.1 FlowCard — Dashed Border

**文件**: `src/components/canvas/flow/FlowCard.tsx` (修改)

```css
/* 现有 */
.flow-card {
  border: 2px solid var(--border-color);
}

/* 修改后 */
.flow-card {
  border: 2px dashed var(--flow-card-border-color, var(--border-color));
}
```

### 2.2 FlowStep Type Extension

**文件**: `src/types/` 或 `src/components/canvas/flow/types.ts` (修改)

```typescript
interface FlowStepData {
  id: string;
  label: string;
  type: 'normal' | 'branch' | 'loop'; // 新增
  confirmed?: boolean;
  // ... existing fields
}
```

### 2.3 FlowCard Icon by Type

```tsx
const FlowStepIcon: React.FC<{ type: FlowStepData['type'] }> = ({ type }) => {
  if (type === 'branch') return <span title="分支">🔀</span>;
  if (type === 'loop') return <span title="循环">🔁</span>;
  return null;
};
```

---

## 3. Implementation Plan

| 任务 | 工时 |
|------|------|
| FlowCard dashed border | 0.5h |
| FlowStep type 字段扩展 | 1h |
| FlowCard icon by type | 1h |
| 数据源适配（现有 store）| 1h |
| 回归测试（普通/分支/循环）| 1h |
| **总计** | **~4.5h** |

---

## 4. Key Files

```
src/components/canvas/flow/FlowCard.tsx   [修改]
src/components/canvas/flow/types.ts        [修改]
src/lib/canvas/canvasStore.ts            [修改] (FlowStepData type)
```

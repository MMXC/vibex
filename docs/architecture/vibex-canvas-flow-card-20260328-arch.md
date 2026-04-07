# ADR: vibex-canvas-flow-card-20260328 架构设计

## Status
Accepted

## Context
FlowCard 使用实线边框（solid border），不符合产品设计规范（应为 dashed）。同时 FlowStep 缺少类型标识，无法区分普通步骤与分支/循环步骤。

## Decision

### Tech Stack
- **Framework**: React 19 + TypeScript（现有）
- **Styling**: CSS Modules（现有）
- **State**: Zustand canvasStore（现有）
- **Test**: Vitest + Testing Library（现有）

### Architecture

```
types.ts
  │
  └─ FlowStep 接口扩展
         │
         ▼
canvasStore.ts
  │
  ├─ updateStep 支持 type 字段更新
  └─ 初始化时为已有 steps 设置 type='normal'
         │
         ▼
BusinessFlowTree.tsx / StepRow
  │
  ├─ F1.1: .flowCard border: solid → dashed
  └─ F1.3: StepRow 根据 step.type 渲染图标
         │
         ├─ type='normal'  → 无图标
         ├─ type='branch'  → 🔀
         └─ type='loop'    → 🔁
```

### File Changes

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/lib/canvas/types.ts` | 修改 | FlowStep 增加 type 字段 |
| `src/stores/canvasStore.ts` | 修改 | updateStep 支持 type，初始化推导 |
| `src/components/canvas/canvas.module.css` | 修改 | .flowCard solid → dashed |
| `src/components/BusinessFlowTree.tsx` | 修改 | StepRow 图标渲染逻辑 |
| `src/components/canvas/StepEditor.tsx` | 修改 | 类型选择下拉框 |

### Data Model

```typescript
// src/lib/canvas/types.ts
export type FlowStepType = 'normal' | 'branch' | 'loop';

export interface FlowStep {
  stepId: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
  confirmed: boolean;
  status: NodeStatus;
  type: FlowStepType; // 新增，默认值 'normal'
}

// src/stores/canvasStore.ts 初始化逻辑
const initializeSteps = (steps: FlowStep[]): FlowStep[] => {
  return steps.map(s => ({
    ...s,
    type: (s as any).type ?? 'normal', // 向后兼容
  }));
};
```

### CSS Change (F1.1)

```css
/* canvas.module.css */
.flowCard {
  /* Before: border: 2px solid var(--color-border); */
  border: 2px dashed var(--color-border);
  border-radius: 6px;
  padding: 12px;
  background: var(--color-surface);
}
```

### Component Logic (F1.3)

```tsx
// BusinessFlowTree.tsx — StepRow
const getStepIcon = (type: FlowStepType): string | null => {
  switch (type) {
    case 'branch': return '🔀';
    case 'loop':   return '🔁';
    case 'normal':
    default:       return null;
  }
};

// StepRow render
<div className={styles.stepRow}>
  {step.type !== 'normal' && (
    <span 
      className={styles.stepTypeIcon}
      aria-label={step.type === 'branch' ? '分支步骤' : '循环步骤'}
    >
      {getStepIcon(step.type)}
    </span>
  )}
  <span className={styles.stepName}>{step.name}</span>
  {/* ... */}
</div>
```

### StepEditor Type Selector (F1.4)

```tsx
// StepEditor.tsx
<select 
  value={editingStep.type} 
  onChange={(e) => updateStep(stepId, { type: e.target.value as FlowStepType })}
  className={styles.typeSelect}
>
  <option value="normal">普通步骤</option>
  <option value="branch">分支步骤 🔀</option>
  <option value="loop">循环步骤 🔁</option>
</select>
```

## Consequences

### Positive
- 虚线边框符合设计规范，视觉层次更清晰
- 分支/循环步骤类型化，支持未来扩展（如拖拽差异、表达式编辑）
- type 默认为 'normal'，向后兼容无需数据迁移

### Risks
- **风险**: 现有 step 数据 type 为 undefined → **缓解**: Store 初始化时自动推导为 'normal'
- **风险**: .flowCard 类被其他组件复用 → **缓解**: 检查发现仅 BusinessFlowTree 使用，使用 .flowCardScoped 命名隔离

## Testing Strategy

| 测试类型 | 工具 | 覆盖点 |
|----------|------|--------|
| 类型安全 | TypeScript 编译 | 非法 type 值报错 |
| 数据迁移 | Vitest | undefined type → 'normal' |
| 样式验证 | Jest DOM | borderStyle === 'dashed' |
| 图标渲染 | Testing Library | branch/loop/normal 渲染正确 |
| 编辑流程 | Testing Library | type 切换保存成功 |

# PRD: VibeX Flow Node Card 样式修复

**Project**: vibex-canvas-flow-card-20260328
**PM**: PM
**Date**: 2026-03-28
**Status**: ✅ PRD 完成

---

## 1. 执行摘要

### 背景

VibeX 业务流程树视图（Business Flow Tree）中，FlowCard 当前使用实线边框（`border: 2px solid`），与产品设计规范不符（应为虚线）。同时，FlowStep 组件缺少分支/循环步骤的视觉标识，导致用户难以区分普通步骤与分支/循环步骤，增加认知负担。

### 目标

| 目标 | 描述 |
|------|------|
| FlowCard 虚线边框 | 将 `flowCard` 的 `border: 2px solid` 改为 `border: 2px dashed` |
| FlowStep 类型扩展 | FlowStep 接口增加 `type` 字段，支持 `normal \| branch \| loop` |
| 分支/循环图标 | 分支步骤显示 🔀，循环步骤显示 🔁，普通步骤无图标 |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| FlowCard 边框为虚线 | 100% 流程卡片使用 dashed border |
| 分支步骤图标覆盖率 | 100% type=branch 步骤显示 🔀 |
| 循环步骤图标覆盖率 | 100% type=loop 步骤显示 🔁 |
| 步骤类型可编辑 | 支持在编辑界面切换步骤类型 |

---

## 2. 详细功能需求

### Epic 1: FlowCard 样式与 FlowStep 类型修复（P0）

#### F1.1: FlowCard 虚线边框

**描述**: 修改 `canvas.module.css` 中 `.flowCard` 样式，将实线边框改为虚线边框。

**涉及文件**:
- `src/components/canvas/canvas.module.css`

**改动内容**:
```css
/* Before */
.flowCard {
  border: 2px solid var(--color-border);
}

/* After */
.flowCard {
  border: 2px dashed var(--color-border);
}
```

**验收标准**:
```typescript
// canvas.module.css 或 E2E 测试
expect(flowCardElement).toHaveComputedStyle({ borderStyle: 'dashed' });
expect(flowCardElement).not.toHaveComputedStyle({ borderStyle: 'solid' });
expect(flowCardElement).toHaveComputedStyle({ borderWidth: '2px' });
```

---

#### F1.2: FlowStep type 字段扩展

**描述**: 扩展 `FlowStep` 接口，增加 `type` 字段支持 `normal | branch | loop`；更新 `canvasStore.ts` 的 `updateStep` 方法支持 type 更新。

**涉及文件**:
- `src/types.ts`
- `src/store/canvasStore.ts`
- `src/hooks/useFlowEditor.ts`

**改动内容**:
```typescript
// types.ts
export interface FlowStep {
  stepId: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
  confirmed: boolean;
  status: NodeStatus;
  type: 'normal' | 'branch' | 'loop'; // 新增字段，默认值 'normal'
}
```

**验收标准**:
```typescript
// TypeScript 类型检查
const step: FlowStep = { type: 'normal' };         // ✅ 编译通过
const branchStep: FlowStep = { type: 'branch' };   // ✅ 编译通过
const loopStep: FlowStep = { type: 'loop' };       // ✅ 编译通过
// @ts-expect-error - 'invalid' 不是合法类型
const invalidStep: FlowStep = { type: 'invalid' };

// Store 更新测试
expect(canvasStore.updateStep(stepId, { type: 'branch' })).resolves.toBeDefined();
expect(canvasStore.getStep(stepId).type).toBe('branch');

// 数据迁移测试
expect(existingSteps.every(s => s.type === 'normal')).toBe(true);
```

---

#### F1.3: FlowStep 组件分支/循环图标渲染

**描述**: 修改 `StepRow` 组件（位于 `BusinessFlowTree.tsx`），根据 `step.type` 渲染对应图标：普通步骤无图标、分支步骤显示 🔀、循环步骤显示 🔁。

**涉及文件**:
- `src/components/BusinessFlowTree.tsx`

**改动内容**:
```tsx
// StepRow 组件内
const getStepIcon = (type: FlowStep['type']) => {
  switch (type) {
    case 'branch': return '🔀';
    case 'loop':   return '🔁';
    case 'normal':
    default:       return null;
  }
};

// 渲染逻辑
<span className="step-type-icon" aria-label={type}>
  {getStepIcon(step.type)}
</span>
```

**验收标准**:
```typescript
// 渲染测试
const normalStep = { type: 'normal' as const };
const branchStep = { type: 'branch' as const };
const loopStep = { type: 'loop' as const };

expect(renderStepIcon(normalStep)).toBe(null);
expect(renderStepIcon(branchStep)).toHaveTextContent('🔀');
expect(renderStepIcon(loopStep)).toHaveTextContent('🔁');

// 集成测试
expect(screen.getByLabelText('branch')).toHaveTextContent('🔀');
expect(screen.getByLabelText('loop')).toHaveTextContent('🔁');
expect(screen.queryByText('🔀', { selector: '.normal-step' })).toBeNull();
```

---

## 3. 页面集成标注

| 页面 | 组件 | 改动范围 |
|------|------|----------|
| /canvas | BusinessFlowTree | ✅ FlowCard 边框（canvas.module.css） |
| /canvas | StepRow | ✅ 分支/循环图标（BusinessFlowTree.tsx） |
| /canvas | StepEditor | ✅ 类型选择器（编辑弹窗） |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **向后兼容** | 现有 steps 数据 type 默认为 'normal'，无需数据迁移 |
| **性能** | 图标渲染无额外网络请求，纯客户端渲染 |
| **可访问性** | 图标需有 `aria-label` 说明类型含义 |
| **测试覆盖** | 至少覆盖 F1.1、F1.2、F1.3 三个功能的单元测试 |

---

## 5. 范围边界

### 包含 (In Scope)
- FlowCard 虚线边框样式
- FlowStep type 字段扩展
- StepRow 组件图标渲染
- 类型切换编辑能力

### 排除 (Out of Scope)
- 分支/循环步骤的拖拽排序行为差异
- 分支/循环步骤的条件表达式编辑
- FlowCard 边框颜色/圆角调整（除非设计规范要求）
- 其他流程节点类型的视觉改造

---

## 6. 依赖项

| 依赖 | 说明 |
|------|------|
| `types.ts` | FlowStep 接口定义位置 |
| `canvasStore.ts` | 流程状态管理，需支持 type 字段 |
| `BusinessFlowTree.tsx` | StepRow 渲染逻辑 |
| `canvas.module.css` | FlowCard 样式文件 |
| `StepEditor.tsx` | 类型切换 UI（可复用现有 Select 组件） |

---

## 7. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 现有步骤 type 为 undefined | 低 | Store 初始化时为所有 steps 设置 type='normal' |
| 图标在不同字体下显示不一致 | 低 | 使用 emoji，跨平台兼容性良好 |
| 样式改动影响其他使用 .flowCard 的组件 | 中 | 检查 .flowCard 是否被复用，如有必要添加 BEM 命名空间 |

---

## 8. 实施计划

| 阶段 | 任务 | 预计工时 | 负责人 |
|------|------|----------|--------|
| 1 | F1.2: FlowStep type 字段扩展（types.ts + canvasStore.ts） | 1h | Dev |
| 2 | F1.1: FlowCard 虚线边框（canvas.module.css） | 0.5h | Dev |
| 3 | F1.3: StepRow 图标渲染（BusinessFlowTree.tsx） | 1.5h | Dev |
| 4 | StepEditor 类型选择器 | 1h | Dev |
| 5 | 单元测试 + E2E 测试 | 1h | Tester |
| **总计** | - | **5h** | - |

---

## 9. 度量指标

| 指标 | 测量方式 |
|------|----------|
| 虚线边框覆盖率 | CSS 检查工具或截图对比 |
| 图标识别准确率 | 人工抽查 10 个分支/循环步骤 |
| 类型切换成功率 | QA 测试验证编辑流程 |

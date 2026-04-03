# Analysis: VibeX Flow Node Card Styling

**Project**: vibex-canvas-flow-card-20260328
**Analyst**: ANALYST
**Date**: 2026-03-28
**Status**: ✅ 分析完成

---

## 1. 问题定义

### 当前状态（代码分析）

| 元素 | 当前样式 | 问题 |
|------|----------|------|
| FlowCard 边框 | 实线边框 (`border: 2px solid`) | 期望：虚线边框 |
| FlowStep 行 | 简单列表行（name + actor + 操作按钮） | 缺少分支/循环视觉标识 |
| FlowStep 类型 | 无 type 字段 | 无法区分普通步骤/分支/循环 |

### 根因

1. `FlowStep` 接口缺少 `type` 字段（`normal | branch | loop`）
2. `flowCard` CSS 使用 `border: 2px solid` 而非虚线
3. `StepRow` 组件没有 branch/loop 图标渲染逻辑

### 目标状态

- **FlowCard**：虚线边框（dashed border），流程名称在虚线框内
- **FlowStep**：普通步骤（无图标）、分支步骤（🔀 图标）、循环步骤（🔁 图标）

---

## 2. 业务场景分析

| 维度 | 说明 |
|------|------|
| **场景** | 业务流程树视图 |
| **用户** | 产品经理 / 领域建模参与者 |
| **核心价值** | 直观区分流程类型，降低认知负担 |
| **当前痛点** | 分支和循环步骤与普通步骤视觉无区别 |
| **期望体验** | 一眼识别分支/循环流程步骤 |

---

## 3. 技术方案

### 方案 A：扩展 FlowStep 类型 + 样式增强（推荐）

**改动范围**：
1. `types.ts`：FlowStep 增加 `type` 字段
2. `canvasStore.ts`：updateStep 支持 type 更新
3. `BusinessFlowTree.tsx`：StepRow 渲染分支/循环图标
4. `canvas.module.css`：flowCard 改为 dashed border

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
  type: 'normal' | 'branch' | 'loop'; // 新增
}
```

**优点**：改动范围小，类型安全
**缺点**：需要数据迁移（现有步骤默认 normal）

### 方案 B：仅样式层修改（无类型改动）

**改动范围**：仅修改 CSS 和 StepRow 渲染，不改 types/store。

```typescript
// 通过 step.name 关键词推断类型
const inferredType = step.name.includes('分支') ? 'branch'
  : step.name.includes('循环') ? 'loop' : 'normal';
```

**优点**：无需数据迁移
**缺点**：脆弱（依赖名称关键词），扩展性差

### 方案对比

| 方案 | 工作量 | 可维护性 | 推荐 |
|------|--------|----------|------|
| A: 扩展类型 | 5h | 高 | ✅ |
| B: 样式推断 | 2h | 低 | - |

---

## 4. JTBD 分析

| JTBD | 用户行为 | 验收条件 |
|------|----------|----------|
| JTBD-1: 识别流程名称 | 看到虚线框即知这是流程边界 | 虚线边框可见 |
| JTBD-2: 识别分支步骤 | 分支步骤有 🔀 标识 | 图标 + 颜色区分 |
| JTBD-3: 识别循环步骤 | 循环步骤有 🔁 标识 | 图标 + 颜色区分 |

---

## 5. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | FlowCard 边框为虚线（非实线） | 截图验证边框样式 |
| AC-2 | 分支步骤（type=branch）显示 🔀 图标 | 添加分支步骤截图验证 |
| AC-3 | 循环步骤（type=loop）显示 🔁 图标 | 添加循环步骤截图验证 |
| AC-4 | 普通步骤无特殊图标 | 对比普通/分支/循环步骤 |
| AC-5 | 步骤类型可切换（编辑时可选类型） | 交互测试编辑流程 |
| AC-6 | 虚线框包裹整个流程卡片（包括 header） | 截图验证边框范围 |

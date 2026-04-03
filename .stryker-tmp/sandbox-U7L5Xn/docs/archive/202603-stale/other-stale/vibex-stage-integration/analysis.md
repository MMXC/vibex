# 三阶段衔接分析报告

**项目**: vibex-stage-integration  
**阶段**: analyze-requirements  
**分析日期**: 2026-03-18  
**Agent**: analyst

---

## 1. 阶段衔接现状分析

### 1.1 三阶段定义

| 阶段 | 页面路由 | 核心功能 | 状态管理 |
|------|----------|----------|----------|
| 对话阶段 | `/confirm` | 需求输入与确认 | confirmationStore |
| 流程阶段 | `/confirm/context` → `/confirm/model` → `/confirm/flow` | 限界上下文→领域模型→业务流程 | confirmationStore |
| 页面编辑阶段 | `/prototype` | 原型编辑 | 原生 React state |

### 1.2 数据流架构

```
用户输入
    ↓
[Phase 1: 对话]
  requirementText → confirmationStore
    ↓
[Phase 2: 流程]
  boundedContexts → confirmationStore
  domainModels → confirmationStore
  businessFlow → confirmationStore
    ↓
[Phase 3: 页面编辑]
  ??? (无明确数据传递)
```

### 1.3 状态管理现状

**ConfirmationStore (Zustand + Persist)**

```typescript
interface ConfirmationState {
  requirementText: string;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlow: BusinessFlow;
  // ...
}
```

**数据传递方式**:
- 阶段内: Zustand store 状态共享
- 阶段间: URL query params + store 持久化

---

## 2. FlowContext 优先级分析

### 2.1 当前实现

**现状**: 无独立的 FlowContext

当前 `businessFlow` 数据存储在 `confirmationStore` 中:

```typescript
// confirmationStore.ts
businessFlow: BusinessFlow;
```

### 2.2 FlowContext 优先级建议

| 优先级 | 场景 | 推荐方案 |
|--------|------|----------|
| **P0** | 多页面共享 flow 数据 | 创建 FlowContext Provider |
| **P1** | 跨组件库传递 | React Context + Zustand |
| **P2** | 简单场景 | Props drilling (当前方案) |

### 2.3 建议的 FlowContext 结构

```typescript
interface FlowContextValue {
  // 核心数据
  businessFlow: BusinessFlow | null;
  
  // 编辑操作
  updateFlow: (flow: BusinessFlow) => void;
  addState: (state: FlowState) => void;
  addTransition: (transition: FlowTransition) => void;
  
  // 持久化
  saveFlow: () => Promise<void>;
  loadFlow: (flowId: string) => Promise<void>;
}
```

---

## 3. 竞品差异化对比

### 3.1 竞品功能对比

| 功能 | VibeX | Bolt.new | Lovable | V0 |
|------|-------|----------|---------|-----|
| **对话式需求** | ✅ | ✅ | ✅ | ✅ |
| **DDD 建模** | ✅ 限界上下文+领域模型 | ❌ | ❌ | ❌ |
| **流程图生成** | ✅ Mermaid | ⚠️ 基础 | ⚠️ 基础 | ⚠️ 基础 |
| **页面编辑** | ✅ Monaco Editor | ✅ | ✅ | ✅ |
| **AI 预览** | ✅ | ✅ | ✅ | ✅ |
| **协作功能** | ❌ | ✅ | ✅ | ❌ |

### 3.2 差异化优势

| 维度 | VibeX 优势 | 竞品差距 |
|------|------------|----------|
| **设计流程** | 完整 DDD 流程 (限界上下文→领域模型→流程) | 竞品缺乏 DDD 支撑 |
| **阶段衔接** | Store 持久化，页面刷新不丢失 | 竞品多为单次会话 |
| **技术深度** | Mermaid 渲染 + Monaco Editor | 简单模板替换 |

### 3.3 差异化建议

1. **强化 DDD 流程**: 突出限界上下文和领域模型的可视化
2. **完善阶段衔接**: 增加"返回修改"能力
3. **增加协作**: 引入实时协作功能

---

## 4. 潜在问题分析

### 问题 1: 阶段间数据传递断裂 ⚠️ 高优先级

**现象**:
- `/confirm/flow` 完成后跳转到 `/prototype`
- `businessFlow` 未传递给原型编辑页面

**影响**:
- 用户无法在原型编辑时参考业务流程
- 阶段切换后数据丢失

**建议**:
```typescript
// 在 confirmationStore 中添加
prototypeData: {
  flowId?: string;
  uiSchema?: UISchema;
  // ...
}
```

---

### 问题 2: 状态持久化边界不清 ⚠️ 中优先级

**现象**:
- `confirmationStore` 使用 `persist` middleware
- 但 prototype 编辑状态未持久化

**影响**:
- 刷新页面后原型编辑内容丢失
- 用户体验不一致

**建议**:
- 明确各阶段的持久化策略
- 引入项目级别的 store

---

### 问题 3: FlowContext 缺失导致跨组件传递困难 ⚠️ 中优先级

**现象**:
- `businessFlow` 需要在多个组件间共享
- 当前通过 props drilling 或 store 间接访问

**影响**:
- 代码耦合度高
- 维护困难

**建议**:
- 创建独立的 FlowContext
- 解耦业务逻辑与 UI

---

### 问题 4: 缺少统一的阶段状态管理 ⚠️ 中优先级

**现象**:
- 每个阶段独立管理状态
- 无统一的阶段切换钩子

**影响**:
- 阶段跳转逻辑分散
- 难以添加全局阶段拦截

**建议**:
```typescript
// 创建 useStageTransition hook
const { 
  currentStage, 
  goToStage, 
  canProceed, 
  canGoBack 
} = useStageTransition();
```

---

### 问题 5: 竞品功能差距 — 协作能力缺失 ⚠️ 低优先级

**现象**:
- 无实时协作功能
- 多用户无法同时编辑

**影响**:
- 团队使用场景受限
- 与 Bolt.new/Lovable 竞争力不足

**建议**:
- 引入 WebSocket 协作
- 实现 CRDT 或 OT 算法

---

## 5. 实施建议

### 5.1 短期 (1-2天)

| 任务 | 优先级 | 工作量 |
|------|--------|--------|
| 修复数据传递断裂 | P0 | 4h |
| 统一阶段状态管理 | P1 | 6h |
| FlowContext 实现 | P1 | 4h |

### 5.2 中期 (1周)

| 任务 | 优先级 | 工作量 |
|------|--------|--------|
| 完善持久化策略 | P1 | 8h |
| 阶段切换动画 | P2 | 4h |
| 返回修改功能 | P2 | 6h |

### 5.3 长期 (1个月)

| 任务 | 优先级 | 工作量 |
|------|--------|--------|
| 实时协作 | P2 | 3周 |
| AI 辅助流程优化 | P1 | 2周 |

---

## 6. 验收标准

| 功能点 | 验收条件 | 测试方法 |
|--------|----------|----------|
| 数据传递 | `/confirm/flow` → `/prototype` 数据不丢失 | E2E 测试 |
| FlowContext | 跨组件可访问 businessFlow | 单元测试 |
| 阶段状态 | 统一的状态管理，无状态冲突 | 集成测试 |
| 持久化 | 刷新页面后状态保持 | E2E 测试 |

---

## 7. 总结

| 维度 | 现状 | 建议 |
|------|------|------|
| **阶段衔接** | ⚠️ 部分断裂 | 完善数据传递 |
| **状态管理** | ⚠️ 分散 | 统一 FlowContext |
| **竞品差异** | ✅ DDD 优势 | 强化 + 协作 |
| **技术风险** | ⚠️ 中等 | 优先修复数据断裂 |

**核心建议**: 优先实现 FlowContext 和完善阶段间数据传递，确保用户体验一致性。

# 状态管理分片优化 - 需求分析

**项目**: vibex-state-optimization
**日期**: 2026-03-13 02:22
**分析师**: Analyst Agent

---

## 执行摘要

**目标**: 拆分 `confirmationStore` 为多个 slice，解决性能问题

**预期收益**: 组件重渲染减少 40%，状态更新延迟降低

---

## 1. 问题定义

### 1.1 当前问题

| 问题 | 影响 | 频率 |
|------|------|------|
| confirmationStore 承担过多职责 | 状态混乱 | 持续 |
| 单一 store 导致不必要重渲染 | 性能下降 | 高频 |
| 持久化数据与运行时数据混合 | 难以管理 | 持续 |

### 1.2 Store 分析

```typescript
// 当前 confirmationStore 结构
interface ConfirmationStore {
  // 业务数据 (需持久化)
  requirementText: string;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  
  // 流程状态 (运行时)
  currentStep: string;
  visitedSteps: string[];
  
  // UI 状态 (运行时)
  loading: boolean;
  errors: Record<string, string>;
  
  // Mermaid 代码 (可计算)
  contextMermaidCode: string;
  modelMermaidCode: string;
}
```

**问题**: 一个 store 包含 15+ 字段，任何字段变化触发所有订阅者重渲染

---

## 2. 解决方案

### 2.1 分片策略

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store Slices                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  uiSlice     │  dataSlice   │  flowSlice   │  persistSlice  │
│  (运行时UI)   │  (业务数据)   │  (流程状态)   │  (持久化)       │
├──────────────┼──────────────┼──────────────┼────────────────┤
│  loading     │  requirement │  currentStep │  savedDrafts   │
│  errors      │  contexts    │  visitedSteps│  lastSaved     │
│  modals      │  models      │  actions     │  version       │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 2.2 各 Slice 定义

**uiSlice** (运行时，不持久化):
```typescript
interface UISlice {
  loading: boolean;
  errors: Record<string, string>;
  modals: { [key: string]: boolean };
}
```

**dataSlice** (业务数据):
```typescript
interface DataSlice {
  requirementText: string;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlows: BusinessFlow[];
}
```

**flowSlice** (流程状态):
```typescript
interface FlowSlice {
  currentStep: string;
  visitedSteps: string[];
  setSelectedContextIds: string[];
}
```

**persistSlice** (持久化):
```typescript
interface PersistSlice {
  savedDrafts: Draft[];
  lastSaved: string;
  version: number;
}
```

### 2.3 选择器优化

```typescript
// 使用 useShallow 避免不必要重渲染
import { useShallow } from 'zustand/react/shallow';

// 优化前
const { boundedContexts, domainModels } = useConfirmationStore();

// 优化后
const boundedContexts = useConfirmationStore(
  useShallow(state => state.dataSlice.boundedContexts)
);
```

---

## 3. 技术风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 状态迁移出错 | 高 | 渐进式迁移，保留旧 store |
| 组件兼容性 | 中 | 提供 adapter 层 |
| 测试覆盖 | 中 | 补充单元测试 |

---

## 4. 验收标准

| 验收项 | 标准 |
|--------|------|
| Store 拆分完成 | 4 个独立 slice |
| 重渲染优化 | 减少 40% |
| 功能正常 | 所有测试通过 |
| 持久化正常 | 刷新后数据恢复 |

---

## 5. 工作量评估

| 任务 | 工作量 |
|------|--------|
| Slice 设计 | 2h |
| uiSlice 实现 | 1h |
| dataSlice 实现 | 2h |
| flowSlice 实现 | 2h |
| persistSlice 实现 | 2h |
| 组件迁移 | 3h |
| 测试 | 2h |
| **总计** | **14h (≈2天)** |

---

**产出物**: `docs/vibex-state-optimization/analysis.md`
**状态**: 分析完成，待进入 PRD 阶段
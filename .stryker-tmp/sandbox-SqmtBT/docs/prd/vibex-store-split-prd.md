# ConfirmationStore 拆分 PRD

**项目**: vibex-store-split  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

`ConfirmationStore` 是一个大型 Zustand store（~300 行），包含 16 个状态字段和 17 个 actions，违反单一职责原则。导致：
- 难以维护和测试
- 状态更新可能影响无关功能
- 新增功能时容易引入回归

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 拆分为 6 个子 store
- 定义迁移顺序
- 确保无功能回归
- 状态正确持久化

### 2.2 Non-Goals
- 不改变业务逻辑
- 不修改 API 接口

---

## 3. Store Boundary Definition (子 Store 边界)

### 3.1 6 个子 Store

| # | Store | 文件 | 状态字段 | Actions |
|---|-------|------|---------|---------|
| 1 | navigationStore | `navigationStore.ts` | currentStep, stepHistory | setCurrentStep, goToNextStep, goToPreviousStep |
| 2 | inputStore | `inputStore.ts` | requirementText | setRequirementText |
| 3 | contextStore | `contextStore.ts` | boundedContexts, selectedContextIds, contextMermaidCode | setBoundedContexts, setSelectedContextIds, setContextMermaidCode |
| 4 | modelStore | `modelStore.ts` | domainModels, modelMermaidCode | setDomainModels, setModelMermaidCode |
| 5 | flowStore | `flowStore.ts` | businessFlow, flowMermaidCode | setBusinessFlow, setFlowMermaidCode |
| 6 | historyStore | `historyStore.ts` | history, historyIndex, createdProjectId | saveSnapshot, undo, redo, canUndo, canRedo |

### 3.2 目录结构

```
src/stores/confirmation/
├── index.ts              # 统一导出
├── navigationStore.ts    # 导航状态
├── inputStore.ts         # 输入状态
├── contextStore.ts       # 上下文状态
├── modelStore.ts         # 模型状态
├── flowStore.ts          # 流程状态
└── historyStore.ts       # 历史状态
```

---

## 4. Migration Order (迁移顺序)

### 4.1 阶段 1: 准备工作 (30 min)

| 步骤 | 任务 |
|------|------|
| 1.1 | 创建目录结构 `src/stores/confirmation/` |
| 1.2 | 补充现有 store 测试 |

### 4.2 阶段 2: 独立 Store 迁移 (2h)

| 步骤 | Store | 依赖 | 时间 |
|------|-------|------|------|
| 2.1 | navigationStore | 无 | 30 min |
| 2.2 | inputStore | 无 | 20 min |
| 2.3 | contextStore | 无 | 30 min |
| 2.4 | modelStore | contextStore (数据依赖) | 20 min |
| 2.5 | flowStore | modelStore (数据依赖) | 20 min |

### 4.3 阶段 3: 复杂 Store 迁移 (1h)

| 步骤 | Store | 说明 | 时间 |
|------|-------|------|------|
| 3.1 | historyStore | 包含撤销/重做逻辑 | 1h |

### 4.4 阶段 4: 集成与清理 (2h)

| 步骤 | 任务 | 时间 |
|------|------|------|
| 4.1 | 更新组件引用 | 1h |
| 4.2 | 保留兼容层 | 30 min |
| 4.3 | 测试验证 | 30 min |

### 4.5 迁移顺序图

```
navigationStore ←─────────────┐
                              │
inputStore    ←───────────────┼── contextStore ←─ modelStore ←─ flowStore
                              │        │
historyStore ─────────────────┘        │
                                      │
              全部依赖 ───────────────┘
```

---

## 5. Persistence Strategy (持久化策略)

### 5.1 各 Store 持久化配置

| Store | 持久化 | 存储键 |
|-------|-------|-------|
| navigationStore | ✅ | vibex-nav |
| inputStore | ✅ | vibex-input |
| contextStore | ✅ | vibex-context |
| modelStore | ✅ | vibex-model |
| flowStore | ✅ | vibex-flow |
| historyStore | ❌ | 不需要 |

### 5.2 统一持久化入口

```typescript
// confirmation/index.ts
import { persist, createJSONStorage } from 'zustand/middleware'

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'vibex-nav', storage: createJSONStorage(() => localStorage) }
  )
)

// ... 其他 stores
```

### 5.3 跨 Store 清理

```typescript
// 统一重置所有 stores
export const resetConfirmationFlow = () => {
  useNavigationStore.getState().reset()
  useInputStore.getState().reset()
  useContextStore.getState().reset()
  useModelStore.getState().reset()
  useFlowStore.getState().reset()
  useHistoryStore.getState().reset()
}
```

---

## 6. Compatibility Layer (兼容层)

### 6.1 保留旧 API

```typescript
// confirmationStore.ts (兼容层)
// 保留旧的 store 引用，让组件逐步迁移
export const useConfirmationStore = {
  // 委托给各子 store
  get currentStep() {
    return useNavigationStore.getState().currentStep
  },
  // ...
}
```

### 6.2 迁移标志

```typescript
// 在旧 store 中添加迁移提示
/**
 * @deprecated 请使用 useNavigationStore, useContextStore 等
 * 此兼容层将在 v2.0 中移除
 */
export const useConfirmationStore = create<ConfirmationFlowState>(...)
```

---

## 7. Acceptance Criteria (验收标准)

### 7.1 结构验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | 6 个子 store 文件创建 | 检查目录 |
| AC-02 | 各 store 状态字段正确 | 代码审查 |
| AC-03 | actions 功能完整 | 手动测试 |

### 7.2 功能验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | 导航功能正常 | 步骤切换测试 |
| AC-05 | 状态更新正常 | 数据输入测试 |
| AC-06 | 撤销/重做正常 | history 测试 |

### 7.3 持久化验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-07 | localStorage 正确存储 | 检查浏览器存储 |
| AC-08 | 页面刷新后恢复 | F5 测试 |
| AC-09 | 重置功能正常 | clear 测试 |

### 7.4 回归验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-10 | 组件功能无变化 | 端到端测试 |
| AC-11 | 编译无错误 | npm run build |
| AC-12 | 测试通过 | npm test |

---

## 8. Definition of Done (DoD)

### 8.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | 6 个子 store 创建完成 |
| DoD-2 | 所有状态字段正确迁移 |
| DoD-3 | 所有 actions 功能正常 |
| DoD-4 | 导航功能无回归 |
| DoD-5 | 撤销/重做功能正常 |

### 8.2 持久化 DoD

| # | 条件 |
|---|------|
| DoD-6 | localStorage 正确存储各 store 数据 |
| DoD-7 | 页面刷新后状态恢复 |
| DoD-8 | 统一重置功能正常 |

### 8.3 质量 DoD

| # | 条件 |
|---|------|
| DoD-9 | 编译无错误 |
| DoD-10 | 单元测试通过 |
| DoD-11 | 端到端测试通过 |

---

## 9. Risk Mitigation

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| 组件引用失效 | 🟡 中 | 保留兼容层 |
| 状态不同步 | 🟡 中 | 使用统一重置函数 |
| 性能问题 | 🟢 低 | 监控 React 渲染 |
| 测试覆盖不足 | 🟡 中 | 先补充测试 |

---

## 10. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| 阶段1: 准备 | 30 min |
| 阶段2: 独立 Store | 2h |
| 阶段3: 复杂 Store | 1h |
| 阶段4: 集成测试 | 2h |
| **总计** | **5.5h** |

---

## 11. Dependencies

- **前置**: analyze-store-structure (已完成)
- **依赖**: Zustand, React

---

*PRD 完成于 2026-03-05 (PM Agent)*

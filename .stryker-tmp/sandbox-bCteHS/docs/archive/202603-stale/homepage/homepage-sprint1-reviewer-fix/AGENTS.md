# 开发约束: homepage-sprint1-reviewer-fix

> **项目**: homepage-sprint1-reviewer-fix  
> **版本**: v1.0  
> **日期**: 2026-03-21

---

## 1. 开发约束

### 1.1 文件位置约束

| 文件 | 必须位于 | 约束 |
|------|----------|------|
| HomePageStore | `src/stores/homePageStore.ts` | 必须使用 Zustand + persist |
| GridContainer | `src/components/homepage/GridContainer/index.tsx` | 必须有 `index.tsx` 入口文件 |
| 组件 CSS | 同目录 `.module.css` | 必须使用 CSS Modules |

### 1.2 类型约束

```typescript
// ✅ 正确：StepId 使用字面量类型
export type StepId = 'step1' | 'step2' | 'step3' | 'step4' | 'success';
const step: StepId = 'step1';

// ❌ 错误：使用 number
export type Step = number;
const step: Step = 1;

// ✅ 正确：使用 store 状态
const { currentStep } = useHomePageStore();
// ❌ 错误：本地 useState
const [step, setStep] = useState('step1');
```

### 1.3 持久化约束

```typescript
// ✅ 正确：partialize 仅包含布局状态
partialize: (state) => ({
  leftDrawerOpen: state.leftDrawerOpen,
  bottomPanelExpanded: state.bottomPanelExpanded,
  // 不持久化 SSE 状态
  // 不持久化 snapshots（运行时状态）
})

// ❌ 错误：持久化所有字段
partialize: (state) => ({ ...state })
```

### 1.4 步骤约束

```typescript
// ✅ 正确：4 步定义
export const STEP_DEFINITIONS = [
  { id: 'step1', label: '需求录入' },
  { id: 'step2', label: '需求澄清' },
  { id: 'step3', label: '业务流程' },
  { id: 'step4', label: '组件图' },
];

// ❌ 错误：5 步或错误的标签
export const STEPS = [
  { id: 1, label: '需求输入' }, // label 不匹配
  // ... 5 items
];
```

---

## 2. 驳回红线

以下情况必须驳回，不允许合并：

| 规则 | 原因 |
|------|------|
| ❌ `GridContainer/index.tsx` 不存在 | P0 阻塞 |
| ❌ `homePageStore.ts` 不存在 | P0 阻塞 |
| ❌ 步骤数 ≠ 4 | P0 阻塞 |
| ❌ 快照超过 5 个 | ST-9.2 DoD 明确要求 |
| ❌ SSE 重连超过 5 次 | ST-9.4 DoD 明确要求 |
| ❌ TypeScript 错误 | 影响编译 |
| ❌ 测试失败 | 影响质量 |
| ❌ 新增 `any` 类型 | 类型安全 |
| ❌ 破坏已有功能 | 回归风险 |

---

## 3. PR 审查清单

### 功能审查

- [ ] `GridContainer/index.tsx` 文件存在
- [ ] `GridContainer.module.css` 包含 3×3 Grid 和 1400px 居中
- [ ] 响应式断点 `@media (max-width: 1200px)` 和 `@media (max-width: 900px)` 存在
- [ ] `homePageStore.ts` 导出 `useHomePageStore`
- [ ] `partialize` 配置正确（仅持久化布局字段）
- [ ] 快照限制：`.slice(-5)` 逻辑存在
- [ ] SSE 重试策略：`RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]`
- [ ] 步骤数：`STEP_DEFINITIONS.length === 4`
- [ ] 步骤标签：'需求录入' / '需求澄清' / '业务流程' / '组件图'

### 代码质量

- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test homePageStore` 全部通过
- [ ] `pnpm test useSSEStream` 全部通过
- [ ] Store 测试覆盖率 ≥ 80%
- [ ] 无新增 `any` 类型
- [ ] `useHomePageState.ts` 和 `useHomePanel.ts` 中的重复状态已清理

### 性能

- [ ] SSE 重连使用指数退避（1s → 2s → 4s）
- [ ] `setTimeout` 在 cleanup 中正确清除
- [ ] `EventSource.close()` 在 unmount 时调用

---

## 4. Reviewer 审查要点

### P0 阻塞项（必须全部修复）

1. `GridContainer/index.tsx` 是否存在且可渲染？
2. `homePageStore.ts` 是否导出 `useHomePageStore`？
3. 步骤数是否为 4？
4. 快照是否限制最多 5 个？
5. SSE 重连是否限制最多 5 次？

### 集成检查

1. `HomePage.tsx` 是否导入 `GridContainer`？
2. `StepNavigator` 是否使用 `useHomePageStore`？
3. `useSSEStream` 是否更新 `homePageStore` 的 SSE 状态？

### 回归检查

1. 已有测试是否全部通过？
2. 已有组件（Header, BottomPanel, PreviewArea）是否正常工作？

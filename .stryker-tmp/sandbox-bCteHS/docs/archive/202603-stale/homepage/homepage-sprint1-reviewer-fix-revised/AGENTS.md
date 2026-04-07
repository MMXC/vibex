# 开发约束: homepage-sprint1-reviewer-fix-revised

> **项目**: homepage-sprint1-reviewer-fix-revised  
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

### 1.2 六步约束

```typescript
// ✅ 正确：6 步（与 confirmationStore.ConfirmationStep 对齐）
export const STEP_DEFINITIONS: StepInfo[] = [
  { id: 'input',         label: '需求输入' },
  { id: 'context',       label: '限界上下文' },
  { id: 'model',         label: '领域模型' },
  { id: 'clarification', label: '需求澄清' },
  { id: 'flow',          label: '业务流程' },
  { id: 'success',       label: '项目创建' },
];

// ❌ 错误：4 步（不采纳 Option B）
// ❌ 错误：id 使用 number
```

### 1.3 持久化约束

```typescript
// ✅ 正确：仅持久化布局状态
partialize: (state) => ({
  leftDrawerOpen: state.leftDrawerOpen,
  bottomPanelExpanded: state.bottomPanelExpanded,
  // 不持久化: sseStatus, snapshots, reconnectCount
})

// ❌ 错误：持久化 SSE 运行时状态
// ❌ 错误：持久化所有字段
```

---

## 2. 驳回红线

| 规则 | 原因 |
|------|------|
| ❌ `GridContainer/index.tsx` 不存在 | P0 阻塞 |
| ❌ `homePageStore.ts` 不存在 | P0 阻塞 |
| ❌ 步骤数 ≠ 6 | 决策已采纳 Option A |
| ❌ 步骤标签不正确 | 与 PRD 定义不符 |
| ❌ 快照超过 5 个 | ST-9.4 DoD |
| ❌ SSE 重连超过 5 次 | ST-9.5 DoD |
| ❌ TypeScript 错误 | 影响编译 |
| ❌ 测试失败 | 影响质量 |
| ❌ 新增 `any` 类型 | 类型安全 |

---

## 3. PR 审查清单

### 功能审查

- [ ] `GridContainer/index.tsx` 存在
- [ ] `GridContainer.module.css` 包含 3×3 Grid + 1400px 居中
- [ ] 响应式断点 1200px / 900px 存在
- [ ] `homePageStore.ts` 导出 `useHomePageStore`
- [ ] `partialize` 仅持久化布局字段
- [ ] 快照限制 `.slice(-5)` 存在
- [ ] SSE 重试策略 `[1000, 2000, 4000, 8000, 16000]`，最多 5 次
- [ ] `STEP_DEFINITIONS.length === 6`
- [ ] 步骤标签与 PRD 定义一致

### 代码质量

- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test homePageStore` 全部通过
- [ ] Store 测试覆盖率 ≥ 80%
- [ ] 无新增 `any` 类型

### 回归检查

1. 6 个步骤组件（StepRequirementInput, StepBoundedContext, StepDomainModel, StepClarification, StepBusinessFlow, StepProjectCreate）是否正常工作？
2. `confirmationStore` 是否保持不变？
3. 已有 E2E 测试是否通过？

# 实施计划: homepage-sprint1-reviewer-fix-revised

> **项目**: homepage-sprint1-reviewer-fix-revised  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **总工时**: ~9h（1 人日）

---

## 1. 实施阶段

### Phase 1: HomePageStore 创建（4h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 创建 `src/stores/homePageStore.ts`（6 步定义 + Zustand + persist） | `homePageStore.ts` | `expect(useHomePageStore.getState()).toBeDefined()` |
| 1.2 | `partialize` 配置（仅持久化布局状态） | persist 配置 | `expect(localStorage.getItem('vibex-homepage-layout')).toBeTruthy()` |
| 1.3 | 快照功能（saveSnapshot, restoreSnapshot, `.slice(-5)`） | 快照逻辑 | `expect(store.getState().snapshots.length).toBeLessThanOrEqual(5)` |
| 1.4 | SSE 重连逻辑（指数退避 1→2→4→8→16s，最多 5 次） | SSE 状态管理 | 单元测试 |
| 1.5 | 清理 `useHomePageState.ts` 中的重复状态 | 代码清理 | 无重复布局状态 |
| 1.6 | 编写 `homePageStore.test.ts`（覆盖率 ≥ 80%） | 测试文件 | `pnpm test homePageStore` |

### Phase 2: GridContainer 组件（2h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 2.1 | 创建 `GridContainer/index.tsx` | 组件文件 | `test -f GridContainer/index.tsx` |
| 2.2 | 创建 `GridContainer.module.css`（3×3 Grid，1400px，响应式） | 样式文件 | 四种视口布局正确 |
| 2.3 | 在 `HomePage.tsx` 中使用 GridContainer | 集成 | `expect(screen.getByTestId('grid-container')).toBeInTheDocument()` |

### Phase 3: StepNavigator 改造（1.5h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 3.1 | 修改 `StepInfo.id` 从 `number` → 字面量类型 | 类型定义 | TypeScript 编译通过 |
| 3.2 | 更新 `STEP_DEFINITIONS` 为 6 步（需求输入/限界上下文/领域模型/需求澄清/业务流程/项目创建） | 步骤配置 | `expect(STEP_DEFINITIONS.length).toBe(6)` |
| 3.3 | 集成 `useHomePageStore` | store 集成 | store.currentStep 正确更新 |

### Phase 4: useSSEStream 改造（1h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 4.1 | SSE 状态存入 `homePageStore` | store 集成 | `expect(useHomePageStore.getState().sseStatus).toBeDefined()` |
| 4.2 | 更新测试用例 | 测试文件 | `pnpm test useSSEStream` |

### Phase 5: 集成与回归测试（0.5h）

| # | 任务 | 验收 |
|---|------|------|
| 5.1 | `pnpm type-check` | 0 错误 |
| 5.2 | `pnpm test` | 100% 通过 |
| 5.3 | Playwright E2E 回归 | 100% 通过 |

---

## 2. 关键路径

```
Phase 1 (HomePageStore) ───────────────────────────────┐
    │                                                     │
Phase 2 (GridContainer) ── Phase 3 (StepNavigator) ── Phase 4 (useSSEStream) ── Phase 5 (集成)
    │                                                     │
    └────────────────────── 全部依赖 store ───────────────┘
```

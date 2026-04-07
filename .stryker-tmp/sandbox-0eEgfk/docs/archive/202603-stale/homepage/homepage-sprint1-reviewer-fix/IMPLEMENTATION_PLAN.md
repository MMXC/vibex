# 实施计划: homepage-sprint1-reviewer-fix

> **项目**: homepage-sprint1-reviewer-fix  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **总工时**: ~9h（1 人日）

---

## 1. 实施阶段

### Phase 1: HomePageStore 创建（4h）

| 序号 | 任务 | 产出 | 验收 |
|------|------|------|------|
| 1.1 | 创建 `src/stores/homePageStore.ts`（类型 + store + persist） | `homePageStore.ts` | `expect(useHomePageStore.getState()).toBeDefined()` |
| 1.2 | 实现 `partialize` 配置（仅持久化布局状态） | persist 配置 | `expect(useHomePageStore.persist.getStoredState()).toBeTruthy()` |
| 1.3 | 实现快照功能（saveSnapshot, restoreSnapshot, 最多 5 个） | 快照逻辑 | `expect(store.getState().snapshots.length).toBeLessThanOrEqual(5)` |
| 1.4 | 实现 SSE 重连逻辑（指数退避 1→2→4s，最多 5 次） | `setSSEStatus`, `incrementReconnect` | 单元测试 |
| 1.5 | 废弃 `useHomePageState.ts` 和 `useHomePanel.ts` 中的重复状态 | 代码清理 | 无重复状态字段 |
| 1.6 | 编写 `homePageStore.test.ts`（覆盖率 ≥ 80%） | 测试文件 | `pnpm test homePageStore` |

### Phase 2: GridContainer 组件（2h）

| 序号 | 任务 | 产出 | 验收 |
|------|------|------|------|
| 2.1 | 创建 `GridContainer/index.tsx`（3×3 CSS Grid） | 组件文件 | `test -f GridContainer/index.tsx` |
| 2.2 | 创建 `GridContainer.module.css`（1400px + 响应式） | 样式文件 | 四种视口布局正确 |
| 2.3 | 在 `HomePage.tsx` 中使用 GridContainer | 集成 | `expect(screen.getByTestId('grid-container')).toBeInTheDocument()` |
| 2.4 | 移除 `HomePage.tsx` 中的内联布局逻辑 | 代码清理 | 内联 grid styles 数量 = 0 |

### Phase 3: StepNavigator 修复（1h）

| 序号 | 任务 | 产出 | 验收 |
|------|------|------|------|
| 3.1 | 修改 `StepInfo` 类型：`id` 从 `number` → `StepId`（字面量） | 类型定义 | TypeScript 编译通过 |
| 3.2 | 将步骤数从 5 步减少为 4 步（移除第 5 步） | 步骤配置 | `expect(steps.length).toBe(4)` |
| 3.3 | 更新 `STEP_DEFINITIONS` 标签为：需求录入/需求澄清/业务流程/组件图 | 步骤标签 | `expect(steps[0].label).toBe('需求录入')` |
| 3.4 | 集成 `useHomePageStore` 替换本地 `useState` | store 集成 | `expect(useHomePageStore.getState().currentStep).toBeDefined()` |

### Phase 4: useSSEStream 改造（1h）

| 序号 | 任务 | 产出 | 验收 |
|------|------|------|------|
| 4.1 | 改造 `useSSEStream.ts`：SSE 状态存入 `homePageStore` | 集成 store | `expect(useHomePageStore.getState().sseStatus).toBeDefined()` |
| 4.2 | 更新 `useSSEStream.test.ts` 测试用例 | 测试文件 | `pnpm test useSSEStream` |
| 4.3 | 添加重连次数限制（最多 5 次）验证 | 单元测试 | `expect(reconnectCount).toBeLessThanOrEqual(5)` |

### Phase 5: 集成与测试（1h）

| 序号 | 任务 | 产出 | 验收 |
|------|------|------|------|
| 5.1 | 全量 TypeScript 类型检查 | `pnpm type-check` | 0 错误 |
| 5.2 | 全量 ESLint 检查 | `pnpm lint` | 0 错误 |
| 5.3 | 全量单元测试 | `pnpm test` | 100% 通过 |
| 5.4 | Playwright E2E 回归测试 | `pnpm playwright test` | 100% 通过 |

---

## 2. 关键路径

```
Phase 1 (HomePageStore) ───────────────────────────────┐
    │                                                     │
Phase 2 (GridContainer) ── Phase 3 (StepNavigator) ── Phase 4 (useSSEStream) ── Phase 5 (集成测试)
    │                                                     │
    └────────────────────── 全部依赖 store ───────────────┘
```

---

## 3. 优先级排序

```
1. HomePageStore（根因，其他都依赖它）
2. GridContainer（布局基础）
3. StepNavigator（用户可见）
4. useSSEStream（后台逻辑）
5. 集成测试（验证修复）
```

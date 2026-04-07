# 实施计划: homepage-reviewer-failed-fix

> **项目**: homepage-reviewer-failed-fix  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **总工时**: ~7h

---

## 实施阶段

### Phase 1: Epic 1 + 2 — Store + GridContainer（4h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 创建 `src/stores/homePageStore.ts` | Store 文件 | `expect(useHomePageStore).toBeDefined()` |
| 1.2 | `partialize` 配置（仅持久化布局） | persist 配置 | 刷新后状态恢复 |
| 1.3 | 创建 `GridContainer/index.tsx` | 组件文件 | `test -f GridContainer/index.tsx` |
| 1.4 | 创建 `GridContainer.module.css`（3×3 Grid, 1400px） | 样式文件 | 四种视口正确 |
| 1.5 | 快照功能（`.slice(-5)`） | saveSnapshot/restoreSnapshot | 最多 5 个 |
| 1.6 | 编写 `homePageStore.test.ts` | 测试文件 | 覆盖率 ≥ 80% |

### Phase 2: Epic 3 — 步骤数修复（1h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 2.1 | 修改 `STEP_DEFINITIONS` 为 4 步 | 步骤配置 | `expect(STEP_DEFINITIONS.length).toBe(4)` |
| 2.2 | 更新 `StepInfo.id` 类型 | 类型定义 | TypeScript 编译通过 |
| 2.3 | 集成 `useHomePageStore` | store 集成 | currentStep 正确更新 |

### Phase 3: Epic 4 — 快照功能（1h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 3.1 | `saveSnapshot` 逻辑验证 | 快照逻辑 | `expect(snapshots.length).toBeLessThanOrEqual(5)` |
| 3.2 | `restoreSnapshot` 逻辑验证 | 恢复逻辑 | 快照后数据一致 |
| 3.3 | 快照测试用例 | 测试文件 | `pnpm test homePageStore` |

### Phase 4: 回归测试 + Reviewer 审查（1h）

| # | 任务 | 验收 |
|---|------|------|
| 4.1 | `pnpm type-check` | 0 错误 |
| 4.2 | `pnpm test` | 100% 通过 |
| 4.3 | Playwright E2E | 100% 通过 |

---

## 关键路径

```
Phase 1 (Store + GridContainer) ── Phase 2 (4步) ── Phase 3 (快照) ── Phase 4 (回归)
```

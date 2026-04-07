# 实施计划: homepage-redesign-sprint1-reviewer-fix

> **项目**: homepage-redesign-sprint1-reviewer-fix  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **总工时**: ~7h

---

## 实施阶段

### Phase 1: Epic 1 + 2 — Store + GridContainer（4h）
| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 创建 `src/stores/homePageStore.ts` | Store 文件 | `expect(useHomePageStore).toBeDefined()` |
| 1.2 | `partialize` 配置 | persist | 刷新后状态恢复 |
| 1.3 | 创建 `GridContainer/index.tsx` | 组件 | `test -f GridContainer/index.tsx` |
| 1.4 | 创建 `GridContainer.module.css`（3×3, 1400px） | 样式 | 四种视口正确 |
| 1.5 | 快照 `.slice(-5)` | saveSnapshot/restoreSnapshot | ≤5个 |
| 1.6 | `homePageStore.test.ts` | 测试 | 覆盖率 ≥ 80% |

### Phase 2: Epic 3 — 步骤数修复（1h）
| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 2.1 | `STEP_DEFINITIONS` 4步 | 步骤配置 | `length === 4` |
| 2.2 | 集成 `useHomePageStore` | store | currentStep 正确 |

### Phase 3: Epic 4 — 快照功能（1h）
| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 3.1 | saveSnapshot/restoreSnapshot | 快照逻辑 | 单元测试 |
| 3.2 | 快照测试用例 | 测试文件 | `pnpm test homePageStore` |

### Phase 4: 回归测试（1h）
| # | 任务 | 验收 |
|---|------|------|
| 4.1 | `pnpm type-check` + `pnpm test` | 0错误, 100%通过 |
| 4.2 | Playwright E2E | 100%通过 |

---

## 关键路径

```
Phase 1 (Store + GridContainer) → Phase 2 (4步) → Phase 3 (快照) → Phase 4 (回归)
```

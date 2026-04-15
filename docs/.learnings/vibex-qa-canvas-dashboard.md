# vibex-qa-canvas-dashboard 经验沉淀

**项目完成日期**: 2026-04-15
**Epic 数量**: 3
**类型**: Sprint 2 QA 验收（Canvas Dashboard 详细设计画布功能回归测试）

---

## Q1: E5-E2E 验收

### 成果
- `e2e/canvas-project-creation.spec.ts` E2E 测试文件已创建
- `ProjectCreationStep.test.tsx` 单元测试 7/7 passing（TC-E5-01~07）
- Commits: `169bf680`, `956b8667`

### 阻塞项
- **E2E 测试 blocked**: Zustand `skipHydration` 配置问题导致 Playwright E2E 在 CI 环境无法稳定运行
- `canvas-project-creation.spec.ts` 文件已创建但未实际运行成功

### 经验
**QA 项目的 E2E 测试在 CI 环境中常因 Zustand hydration 时序问题而阻塞**，需要在组件 `skipHydration` 彻底解决后才能端到端运行。单元测试（jsdom）可以先行覆盖核心逻辑路径。

---

## Q2: E1-TabState 验收

### 成果
- 复用 `canvas-tab-state.spec.ts`（vibex-fix-canvas-bugs Bug2 项目产出）
- `useCanvasPanels.test.ts` 5/5 passing
- Commit: `bc34f0a6`

### 经验
**跨项目复用测试资产**：QA 验收项目不需要重复编写 E2E，只要被测功能在其他项目中已有覆盖的测试，即可在 changelog 中标注复用关系，避免重复建设。

---

## Q3: E6-三树持久化验收

### 成果
- `useRehydrateCanvasStores.test.ts` 4/4 passing（TC-E6-01~04）
- `canvas-three-tree-persistence.spec.ts` E2E 测试已创建
- Commits: `cfb780c4`, `8ec8c422`, `8ea96dcf`, `4b2a349c`

### 关键实现
- `useRehydrateCanvasStores` hook: Canvas store 延迟 rehydration，避免 SSR hydration mismatch
- `vi.hoisted()` 修复 TDZ（Temporal Dead Zone）错误，确保测试中 mock 变量在引用前初始化

### 经验
**Zustand SSR hydration 最佳实践**：
1. Store 配置 `skipHydration: true`
2. 组件 mount 时手动调用 `store.persist?.rehydrate?.()`
3. Vitest 测试中使用 `vi.hoisted()` 确保 mock 在 TDZ 之前初始化

---

## 项目级经验

### Coord-Completed 检查清单
| 检查项 | 状态 | 说明 |
|--------|------|------|
| Dev commit 存在 | ✅ | 所有 Epic 均有对应 commit |
| 单元测试通过 | ✅ | E5: 7 passing, E1: 5 passing, E6: 4 passing |
| CHANGELOG 更新 | ⚠️ | 补充了 vibex-qa-canvas-dashboard 条目（原缺失） |
| 远程 commit | ✅ | 已 push 到 origin/main |

### CHANGELOG 维护教训
QA 验收项目的 CHANGELOG 条目不能依赖"上游项目已记录"而省略，每个项目应有独立的 CHANGELOG entry，说明该 QA 项目的具体验证范围和结果。

---

## 相关文档
- `docs/vibex-qa-canvas-dashboard/analysis.md`
- `docs/vibex-qa-canvas-dashboard/prd.md`
- `docs/vibex-qa-canvas-dashboard/architecture.md`
- `docs/vibex-qa-canvas-dashboard/IMPLEMENTATION_PLAN.md`
- `docs/vibex-fix-canvas-bugs/.learnings/vibex-fix-canvas-bugs.md`（相关：Bug2 Tab State）
- `docs/react-hydration-fix.md`（相关：Zustand SSR）
- `docs/canvas-testing-strategy.md`（相关：测试策略）

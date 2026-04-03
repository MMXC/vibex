# VibeX 技术债务与体验优化 PRD

**文档版本**: v1.0
**项目**: VibeX
**作者**: PM Agent
**日期**: 2026-04-02
**状态**: 草稿
**方案**: 方案 A — 全面重构（P0+P1，P2 延后）

---

## 1. 执行摘要

### 1.1 背景

VibeX 已跑通「需求输入 → 限界上下文 → 领域模型 → 业务流程 → 组件树」核心流程。但随着功能膨胀，系统性技术债务正在累积：

| 风险维度 | 量化指标 | 严重程度 |
|---------|---------|---------|
| 三树状态模型分裂 | 3 种 checkbox 实现并存 | 🔴 P0 |
| Store 膨胀 | canvasStore 单文件 1433 行 | 🔴 P0 |
| 页面状态污染 | scrollTop = 946（应为 0） | 🟠 P1 |
| UI 变更回归率高 | ~20% 变更引发回归 | 🟠 P1 |
| E2E 测试不稳定 | 通过率 ~80% | 🟡 P2 |
| 测试覆盖率不足 | Statements ~40% | 🟡 P2 |

**紧迫性判断**：VibeX 已进入「功能堆叠 → 系统化」关键节点。如不干预，3 个月后技术债务将阻塞所有新功能开发。

### 1.2 目标

**总体目标**：在 3-4 个 sprint 内建立可测试、可维护、可扩展的 Canvas 前端基线。

| 阶段 | 目标 | 交付物 |
|------|------|--------|
| P0（Sprint N） | 消除结构性风险，建立可测试基线 | 三树统一 + Store 拆分 Phase1 + 稳定 CI |
| P1（Sprint N+1） | 消除状态污染，实现体验一致性 | 页面状态规范 + 交互反馈标准化 |
| P2（Sprint N+2~N+3） | 清理技术债务，建立规范体系 | CSS 拆分 + 覆盖率 > 60% + TypeScript strict |

### 1.3 成功指标（KPI）

| KPI | 当前基线 | Sprint N 目标 | Sprint N+1 目标 | Sprint N+3 目标 |
|-----|---------|--------------|----------------|----------------|
| TypeScript 预存错误数 | 9 | **0** | 0 | 0 |
| canvasStore 行数 | 1433 | 1433（代理中）| 800 | **< 300** |
| E2E 测试通过率 | ~80% | **> 95%** | > 95% | > 95% |
| UI 一致性评分 | 6/10 | 6/10 | **7/10** | **8/10** |
| 状态污染问题（/周） | 3 | 2 | **1** | **< 0.5** |
| 覆盖率（Statements） | ~40% | ~45% | ~50% | **> 60%** |

---

## 2. Epic / Story 分解

### Epic 1: 三树选择模型统一【P0】

**目标**：统一 ContextTree / FlowTree / ComponentTree 的节点状态机与交互行为，消除认知负荷与操作错误。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E1-S1 | 定义节点状态枚举 | 创建 `NodeState` 枚举（idle / selected / confirmed / error），统一三树共享 | 1h | `expect(NodeState.idle).toBe('idle')`；`expect(NodeState.confirmed).toBe('confirmed')`；三树组件均可 import 此枚举 |
| E1-S2 | 统一 checkbox 位置与布局 | 三树 checkbox 均改为 inline 布局（非绝对定位），checkbox 在 badge **前**，绿色 ✓ 在 badge **后** | 2h | `expect(checkboxDOM.compareDocumentPosition(badgeDOM) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()`；三树视觉一致 |
| E1-S3 | 移除不一致样式 | 删除 `nodeUnconfirmed` 黄色边框样式；未确认节点不再触发视觉错误提示 | 1h | `expect(screen.queryByTestId('node-unconfirmed')).not.toBeVisible()`；所有节点无黄色边框 |
| E1-S4 | 统一状态变更行为 | 三树节点状态变更（click / double-click / keyboard）行为一致：通过统一 `useTreeNodeState` hook | 2h | `expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ state: NodeState.selected }))` |
| E1-S5 | E2E 验证三树交互 | 编写/更新 E2E 测试：三树多选 + 确认 + 取消操作流程 | 2h | `await expect(page.locator('.tree-node')).toHaveCount(10)`；`await expect(page.getByRole('checkbox')).toBeChecked()`；`expect(await page.evaluate(() => document.querySelectorAll('.tree-node.confirmed').length)).toBe(5)` |

**Epic 1 总工时**: 8h（不含 E1-S5 E2E 测试，由 Epic 3 统一覆盖）

---

### Epic 2: canvasStore 职责拆分【P0】

**目标**：将 1433 行的 canvasStore 按领域拆分为多个专注 store，消除耦合，支持独立测试。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E2-S1 | 抽取 contextStore（Phase1） | 从 canvasStore 抽取 context 状态，创建 `contextStore.ts`（< 300 行）；原 canvasStore 通过 `create(() => contextStore.getState())` 代理保持 API 兼容 | 3-4h | `expect(linesOfCode('src/stores/contextStore.ts')).toBeLessThan(300)`；`expect(typeof contextStore.getState).toBe('function')`；`BoundedContextTree` 渲染正常 |
| E2-S2 | 抽取 flowStore（Phase2） | 创建 `flowStore.ts`，承载 Flow 相关状态 | 2h | `expect(flowStore.getState()).toHaveProperty('flows')`；FlowTree 组件渲染正常 |
| E2-S3 | 抽取 componentStore（Phase2） | 创建 `componentStore.ts`，承载 Component 相关状态 | 2h | `expect(componentStore.getState()).toHaveProperty('components')`；ComponentTree 组件渲染正常 |
| E2-S4 | 抽取 uiStore（Phase3） | 创建 `uiStore.ts`，承载 UI 状态（activeTab / drawerOpen / scrollTop 等） | 2h | `expect(uiStore.getState()).toHaveProperty('scrollTop')`；页面切换后 scrollTop = 0 |
| E2-S5 | 迁移所有组件引用 | 将所有直接依赖 canvasStore 的组件改为依赖对应子 store；移除/重构原有 canvasStore 中的冗余状态 | 2-3h | `expect(getComponentImports().filter(i => i.store === 'canvasStore').length).toBe(0)` |

**Epic 2 总工时**: P0 Phase1: 3-4h；P2 Phase2-3: 6h；总 9-10h

---

### Epic 3: E2E 测试稳定性加固【P0】

**目标**：消除 CI 门禁的 flaky 测试，提升测试可靠性和开发信心。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E3-S1 | 修复 TypeScript 配置 | 修复 tsconfig include 路径缺失；运行 `tsc --noEmit` 确认 0 错误 | 0.5h | `expect(execSync('npx tsc --noEmit', { cwd: projectRoot }).status).toBe(0)` |
| E3-S2 | 替换 waitForTimeout | 将所有 `waitForTimeout` 替换为 Playwright 条件等待（`waitForSelector` / `waitForResponse`） | 1h | `expect(sourceCode.match(/waitForTimeout/g)).toBeNull()`；所有 E2E 测试通过 |
| E3-S3 | 稳定关键选择器 | 替换不稳定选择器为 data-testid；添加等待条件确保元素可交互 | 1h | `expect(unstableSelectors.length).toBe(0)`；E2E 测试 3 次连续通过 |
| E3-S4 | 验证 CI 通过率 | 连续 3 次 CI 运行全部通过 | 0.5h | `expect(ciRuns.filter(r => r.status === 'passed').length).toBeGreaterThanOrEqual(3)` |

**Epic 3 总工时**: 3h

---

### Epic 4: 依赖安全加固【P0】

**目标**：消除 DOMPurify XSS 间接依赖漏洞，确保依赖树安全。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E4-S1 | DOMPurify 版本管控 | 在 `package.json` 添加 `overrides`，将 monaco-editor 间接依赖 dompurify 固定为 3.3.3 | 0.5h | `expect(execSync('npm ls dompurify').toString()).toContain('3.3.3')`；`expect(execSync('npm audit', { encoding: 'utf-8' })).not.toMatch(/dompurify.*vulnerability/)` |

**Epic 4 总工时**: 0.5h

---

### Epic 5: Canvas 页面信息架构优化【P1】

**目标**：规范 Canvas 页面状态管理，消除跨页面状态污染，提供清晰的布局结构。

| ID | Story | 描述 | 工时 | 验收标准 | 页面集成 |
|----|-------|------|------|---------|---------|
| E5-S1 | scrollTop 状态规范 | Canvas 页面切换时强制重置 scrollTop = 0；面板切换时重置面板内 scrollTop | 2h | `expect(scrollTopAfterNavigation).toBe(0)`；`expect(scrollTopAfterPanelSwitch).toBe(0)` | Canvas.tsx |
| E5-S2 | sticky 工具栏 | 工具栏使用 `position: sticky`，页面滚动时保持可见 | 2h | `expect(toolbarStyle.position).toBe('sticky')`；`expect(toolbarVisibleOnScroll).toBe(true)` | Canvas.tsx |
| E5-S3 | Drawer 层级协议 | 定义统一的 z-index 层级体系（`Drawer < Tooltip < Modal < Toast`）；所有 Drawer 使用标准化 props | 2h | `expect(zIndex('Drawer')).toBeLessThan(zIndex('Tooltip'))`；`expect(zIndex('Tooltip')).toBeLessThan(zIndex('Modal'))` | 全局 Drawer 组件 |
| E5-S4 | 面板状态隔离 | TreePanel tab 切换时清除前一个面板的选中状态；panelRef 在 unmount 时正确清理 | 2h | `expect(activePanelNodeId).not.toBe(prevPanelNodeId)`；`expect(panelRef.current).toBeNull()` after unmount | TreePanel.tsx |
| E5-S5 | 创建 Canvas IA 文档 | 编写 `docs/canvas-information-architecture.md`，记录页面状态规范和组件关系 | 1h | 文件存在且包含 scrollTop / z-index / sticky 规范 | — |

**Epic 5 总工时**: 9h（E5-S1 ~ S4: 8h + S5 文档: 1h）

---

### Epic 6: 交互反馈标准化【P1】

**目标**：统一 VibeX 的用户反馈机制，删除危险操作，提供一致的拖拽和状态反馈体验。

| ID | Story | 描述 | 工时 | 验收标准 | 页面集成 |
|----|-------|------|------|---------|---------|
| E6-S1 | 删除 window.confirm() | 将所有 `window.confirm()` 调用替换为 toast 确认或 inline 确认；高危操作使用 modal | 1h | `expect(sourceCode.match(/window\.confirm/g)).toBeNull()`；高危操作均有 toast 或 modal | 全局搜索替换 |
| E6-S2 | 统一 dragging 状态样式 | 定义 `dragging` 状态标准样式：`opacity: 0.7; transform: scale(0.98)`；三树和 Canvas 拖拽行为一致 | 2h | `expect(draggingStyle.opacity).toBe(0.7)`；`expect(draggingStyle.transform).toContain('scale(0.98)')` | BoundedContextTree / FlowTree / ComponentTree |
| E6-S3 | Feedback Token 文档 | 创建 `docs/design-system/feedback-tokens.md`，定义所有反馈类型的 token（loading / success / error / warning / info） | 1h | 文件存在且包含 loading / success / error / warning token 定义 | — |
| E6-S4 | Toast 系统接入 | 全局接入统一 toast 系统，替换散落的 alert 和 confirm | 3h | `expect(alertSpy).not.toHaveBeenCalled()`；`expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))` | 全局组件 |
| E6-S5 | UI 变更检查清单 | 在 `CONTRIBUTING.md` 添加 UI 变更 checklist（截图对比命令、reviewer 确认要求） | 1h | `CONTRIBUTING.md` 包含 UI 变更 checklist | CONTRIBUTING.md |

**Epic 6 总工时**: 8h（E6-S1 ~ S4: 7h + S5 文档: 1h）

---

### Epic 7: CSS 模块拆分【P2】

**目标**：将 1420 行的 canvas.module.css 按组件拆分为独立 CSS Module，消除样式耦合。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E7-S1 | 提取 BoundedContextTree 样式 | 从 canvas.module.css 提取 `BoundedContextTree` 相关样式为 `BoundedContextTree.module.css` | 2h | `expect(exists('BoundedContextTree.module.css')).toBe(true)`；组件渲染正常 |
| E7-S2 | 提取 FlowTree 样式 | 提取 FlowTree 样式为 `FlowTree.module.css` | 2h | `expect(exists('FlowTree.module.css')).toBe(true)` |
| E7-S3 | 提取 ComponentTree 样式 | 提取 ComponentTree 样式为 `ComponentTree.module.css` | 2h | `expect(exists('ComponentTree.module.css')).toBe(true)` |
| E7-S4 | 清理 canvas.module.css | 删除已迁移样式；canvas.module.css 行数降至 < 800 行 | 2h | `expect(linesOfCode('canvas.module.css')).toBeLessThan(800)`；无样式回归 |
| E7-S5 | 视觉回归测试 | 截图对比工具集成；关键页面视觉回归测试通过 | 1h | 6 个月并行期内旧文件仍有效；无视觉回归 |

**Epic 7 总工时**: 9h

---

### Epic 8: 测试覆盖率提升【P2】

**目标**：建立核心用户旅程 E2E 测试，设置覆盖率门禁，将 tester 介入时机前移至 design review。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E8-S1 | 创建限界上下文旅程测试 | `journey-create-context.spec.ts`：建模者创建限界上下文并确认 | 1h | `await page.getByRole('button', { name: '确认' }).click()`；`expect(await page.locator('.tree-node.confirmed')).toHaveCount(1)` |
| E8-S2 | 创建业务流程旅程测试 | `journey-generate-flow.spec.ts`：生成流程并拖拽调整 | 1h | `expect(flowNodeCount).toBeGreaterThan(0)`；拖拽后位置更新 |
| E8-S3 | 创建多选操作旅程测试 | `journey-multi-select.spec.ts`：三树跨树多选 + 批量确认 | 1h | 多选后批量确认；`expect(confirmedNodes.length).toBe(5)` |
| E8-S4 | 设置覆盖率门禁 | 在 `package.json` 添加 `coverage:check` 脚本，Statements 门禁 > 60% | 1h | `expect(coverage.statements.pct).toBeGreaterThanOrEqual(60)` |
| E8-S5 | 关键路径单元测试 | `handleGenerate` / `confirmContextNode` 单元测试覆盖 | 1h | `expect(confirmContextNode({ id: '1', state: 'selected' })).toEqual(expect.objectContaining({ state: 'confirmed' }))` |
| E8-S6 | Tester 介入设计 review | Tester 参与 design review，提前评审可测试性 | — | 设计评审记录包含 tester 评审意见 |

**Epic 8 总工时**: 5h

---

### Epic 9: PRD / Story 规范落地【P2】

**目标**：统一团队 PRD 和 Story 格式，确保每条需求可测试、可验收。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E9-S1 | PRD 模板 | 创建 `docs/templates/prd-template.md`，包含执行摘要 / Epic 表格 / 验收标准 / DoD | 1h | 文件存在且格式完整；所有新 PRD 使用此模板 |
| E9-S2 | Story 验收标准 GIVEN-WHEN-THEN | 所有 Story 的验收标准使用 GIVEN-WHEN-THEN 格式 | 1h | `expect(story.acceptanceCriteria.match(/GIVEN.*WHEN.*THEN/s)).toBeTruthy()` |
| E9-S3 | DoD 纳入测试要求 | `docs/process/definition-of-done.md` 包含测试用例纳入要求 | 1h | 文件存在且 DoD 包含 E2E 测试通过条件 |

**Epic 9 总工时**: 3h

---

### Epic 10: TypeScript Strict 模式 + 类型统一【P2】

**目标**：消除 TypeScript 预存错误，建立统一类型定义，为长期可维护性奠基。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E10-S1 | 修复 9 个 TS 预存错误 | 逐一修复当前 TS 编译错误 | 1h | `expect(tscErrors).toBe(0)` |
| E10-S2 | 创建 types/canvas.ts 统一类型 | 建立 Canvas 领域统一类型定义文件 | 1h | 文件存在且包含 Context / Flow / Component / UIState 类型 |
| E10-S3 | 渐进启用 TypeScript strict | 分阶段启用：`@typescript-eslint/no-explicit-any` warn → error → strict | 2h | `expect(tscStrictErrors).toBeLessThan(currentErrors)` |

**Epic 10 总工时**: 4h

---

### Epic 11: ADR 规范文档【P2】

**目标**：通过 Architecture Decision Record 固化关键设计决策，避免重复讨论和违背。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E11-S1 | ADR-001 checkbox 语义规范 | 记录 checkbox 在三树中的语义（checked = 选中 / confirmed = 确认） | 1h | `docs/adr/ADR-001-checkbox-semantics.md` 存在 |
| E11-S2 | PR Review Checklist 纳入 ADR 检查 | PR review checklist 包含 ADR 合规性检查项 | 0.5h | PR checklist 包含 "ADR compliance" 检查项 |

**Epic 11 总工时**: 1.5h

---

## 3. 验收标准汇总

### 3.1 P0 验收标准

#### P0-E1: 三树选择模型统一

| 验收项 | 验证方式 |
|--------|---------|
| `npm run build` 无 TypeScript 错误 | `expect(tscErrors).toBe(0)` |
| 三树 checkbox 使用 inline 布局 | DOM 测试 |
| 确认节点显示绿色 ✓，badge 在 checkbox 后 | `expect(confirmedNode).toContainText('✓')` |
| 未确认节点无黄色边框 | `expect(unconfirmedNode).not.toHaveClass(/yellow/)` |
| E2E：三树多选 + 确认流程 100% 通过 | `journey-multi-select.spec.ts` |

#### P0-E2: canvasStore 拆分 Phase1

| 验收项 | 验证方式 |
|--------|---------|
| `contextStore.ts` 存在且 < 300 行 | `expect(linesOfCode).toBeLessThan(300)` |
| 原 canvasStore 通过代理保持 API 兼容 | 功能测试 |
| `BoundedContextTree` 组件渲染正常 | E2E 测试 |
| `npm test` 全部通过 | CI |

#### P0-E3: E2E 测试稳定性

| 验收项 | 验证方式 |
|--------|---------|
| `tsc --noEmit` 无错误 | `expect(status).toBe(0)` |
| 代码中无 `waitForTimeout` | `expect(match).toBeNull()` |
| CI E2E 测试通过率 > 95%（连续 3 次） | CI 记录 |

#### P0-E4: DOMPurify XSS

| 验收项 | 验证方式 |
|--------|---------|
| `npm ls dompurify` 显示 3.3.3 | `expect(output).toContain('3.3.3')` |
| `npm audit` 无 dompurify 漏洞 | `expect(vulns).toBe(0)` |

---

### 3.2 P1 验收标准

#### P1-E5: Canvas 页面信息架构

| 验收项 | 验证方式 |
|--------|---------|
| 进入 Canvas 页面时 `scrollTop = 0` | `expect(scrollTop).toBe(0)` |
| 面板切换后 scrollTop 重置 | 交互测试 |
| 工具栏使用 `position: sticky` | `expect(style.position).toBe('sticky')` |
| Drawer z-index 层级无覆盖冲突 | `expect(zIndex('Drawer')).toBeLessThan(zIndex('Modal'))` |

#### P1-E6: 交互反馈标准化

| 验收项 | 验证方式 |
|--------|---------|
| 代码中 `window.confirm()` = 0 | `expect(confirmCount).toBe(0)` |
| Feedback Token 文档存在 | 文件存在性检查 |
| dragging 状态统一（opacity 0.7 + scale 0.98） | 样式测试 |
| `CONTRIBUTING.md` 包含 UI 变更 checklist | 内容检查 |

---

### 3.3 P2 验收标准

| 验收项 | 目标 | 验证方式 |
|--------|------|---------|
| canvas.module.css 行数 | < 800（原始 1420） | `expect(lines).toBeLessThan(800)` |
| Statement 覆盖率 | > 60% | `istanbul` 报告 |
| TypeScript strict 错误 | 0 或递减 | `tsc --strict` |
| PRD 模板使用率 | 100% 新 PRD | 模板检查 |
| Story GIVEN-WHEN-THEN 格式 | 100% Story | 格式检查 |

---

## 4. DoD（Definition of Done）

### 4.1 功能点完成标准

每个功能点完成后必须满足：

1. **代码完成**：功能代码已合并到 main 分支
2. **测试通过**：
   - 单元测试：覆盖率 ≥ 60%（P2 要求）
   - E2E 测试：通过率 ≥ 95%（连续 3 次）
   - `npm test` 全部绿色
3. **类型安全**：`tsc --noEmit` 0 错误
4. **验收标准满足**：所有验收项的 `expect()` 断言通过
5. **文档更新**：相关文档已同步更新（如有变更）
6. **无回归**：现有功能未受影响

### 4.2 Epic 完成标准

| 阶段 | 完成条件 |
|------|---------|
| P0 Epic | 所有 P0 Story 完成 + E2E 测试稳定 + CI 绿色 |
| P1 Epic | 所有 P1 Story 完成 + scrollTop = 0 + UI 变更 checklist 就位 |
| P2 Epic | 所有 P2 Story 完成 + 覆盖率 > 60% + 规范文档落地 |

### 4.3 Sprint 完成标准

| Sprint | 完成条件 |
|--------|---------|
| Sprint N（P0） | Epic 1 + Epic 2 Phase1 + Epic 3 + Epic 4 全部完成 |
| Sprint N+1（P1） | Epic 5 + Epic 6 全部完成 |
| Sprint N+2~N+3（P2） | Epic 7 + Epic 8 + Epic 9 + Epic 10 + Epic 11 全部完成 |

---

## 5. 工时汇总

| Epic | 阶段 | 工时 |
|------|------|------|
| Epic 1: 三树选择模型统一 | P0 | 8h |
| Epic 2: canvasStore 拆分 | P0 + P2 | 9-10h |
| Epic 3: E2E 测试稳定性 | P0 | 3h |
| Epic 4: 依赖安全加固 | P0 | 0.5h |
| **P0 小计** | | **20.5-21.5h** |
| Epic 5: Canvas 页面信息架构 | P1 | 9h |
| Epic 6: 交互反馈标准化 | P1 | 8h |
| **P1 小计** | | **17h** |
| Epic 7: CSS 模块拆分 | P2 | 9h |
| Epic 8: 测试覆盖率提升 | P2 | 5h |
| Epic 9: PRD/Story 规范 | P2 | 3h |
| Epic 10: TypeScript strict | P2 | 4h |
| Epic 11: ADR 规范文档 | P2 | 1.5h |
| **P2 小计** | | **22.5h** |
| **总计** | | **60-63h** |

---

## 6. 实施路线图

```
Sprint N（本周期）
├── Epic 1: 三树选择模型统一          (8h)  【需页面集成: ContextTree/FlowTree/ComponentTree】
├── Epic 2: canvasStore 拆分 Phase1  (3-4h) 【需页面集成: BoundedContextTree】
├── Epic 3: E2E 测试稳定性            (3h)
├── Epic 4: 依赖安全加固              (0.5h)
└── 交付: 可测试、可维护的 Canvas 前端基线

Sprint N+1
├── Epic 5: Canvas 页面信息架构       (9h)   【需页面集成: Canvas.tsx / TreePanel.tsx / Drawer 组件】
├── Epic 6: 交互反馈标准化            (8h)   【需页面集成: 全局组件】
└── 交付: 体验一致、状态干净的 Canvas 页面

Sprint N+2 ~ N+3
├── Epic 7: CSS 模块拆分              (9h)
├── Epic 8: 测试覆盖率提升            (5h)
├── Epic 9: PRD/Story 规范            (3h)
├── Epic 10: TypeScript strict        (4h)
├── Epic 11: ADR 规范文档             (1.5h)
└── 交付: 健康的前端代码基线
```

---

## 7. 风险缓解

| 风险 ID | 风险描述 | 缓解措施 |
|---------|---------|---------|
| R1 | canvasStore 拆分引入 breaking change | Phase1 使用代理模式保持 API 兼容 |
| R2 | CSS 模块拆分导致样式冲突 | 6 个月并行期，旧文件标记废弃，逐步迁移 |
| R3 | TypeScript strict 发现大量隐式 any | 分阶段引入：warn → error → strict |
| R4 | P2 技术债务优先级被挤压 | P2 进入独立 sprint，与功能开发并行 |
| R5 | 规范文档无人遵守 | 将规范检查加入 PR review checklist |
| R6 | tester 介入时机调整 | 提前到 design review 阶段派发任务 |

---

*PM Agent | VibeX 项目 | 2026-04-02*
*基于 PM / Analyst / Dev / Reviewer / Tester 五方提案汇总*

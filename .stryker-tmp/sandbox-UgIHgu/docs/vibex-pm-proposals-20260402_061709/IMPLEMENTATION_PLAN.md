# VibeX 技术债务与体验优化 — 实施计划

**项目**: VibeX
**文档版本**: v1.0
**作者**: Architect Agent
**日期**: 2026-04-02
**状态**: 已采纳
**提案周期**: vibex-pm-proposals-20260402_061709

---

## 1. Sprint 分解总览

| Sprint | 时间 | Epics | 总工时 |
|--------|------|-------|--------|
| **Sprint N** | 本周期 | Epic 1 + Epic 2 Phase1 + Epic 3 + Epic 4 | 20.5h |
| **Sprint N+1** | 下周期 | Epic 5 + Epic 6 | 17h |
| **Sprint N+2~N+3** | 后续 sprint | Epic 7 + Epic 8 + Epic 9 + Epic 10 + Epic 11 | 22.5h |

### Sprint N 工时细分

| Epic | Story | 工时 | 依赖 |
|------|-------|------|------|
| **E1: 三树选择模型统一** | E1-S1 定义 NodeState 枚举 | 1h | — |
| | E1-S2 统一 checkbox 位置 | 2h | E1-S1 |
| | E1-S3 移除 nodeUnconfirmed 样式 | 1h | E1-S1 |
| | E1-S4 统一 useTreeNodeState hook | 2h | E1-S1 |
| | E1-S5 E2E 验证（由 Epic 3 覆盖） | 0h | E1-S4 |
| **E1 小计** | | **6h** | |
| **E2: canvasStore 拆分 Phase1** | E2-S1 抽取 contextStore | 3-4h | — |
| **E2 Phase1 小计** | | **3-4h** | |
| **E3: E2E 测试稳定性** | E3-S1 修复 TypeScript 配置 | 0.5h | — |
| | E3-S2 替换 waitForTimeout | 1h | — |
| | E3-S3 稳定 data-testid 选择器 | 1h | — |
| | E3-S4 CI 3次连续验证 | 0.5h | E3-S1, E3-S2, E3-S3 |
| **E3 小计** | | **3h** | |
| **E4: DOMPurify 安全** | E4-S1 添加 overrides | 0.5h | — |
| **E4 小计** | | **0.5h** | |
| **Sprint N 合计** | | **13-14.5h** | |

> 注：E1-S5 E2E 验证不单独计工时，由 E3-S3 的 data-testid 稳定化 + 新增 E2E 测试覆盖。

---

## 2. 详细实施步骤

### Sprint N

#### Phase 1: 基础设施修复（E3 + E4，1h，可并行）

**E3-S1: 修复 TypeScript 配置（0.5h）**
1. 打开 `tsconfig.json`
2. 确认 `include` 路径包含 `"src/**"` 和 `"tests/**"`
3. 运行 `npx tsc --noEmit`，验证 0 错误
4. 提交: `fix(tsconfig): add missing include paths`

**E4-S1: DOMPurify 版本固定（0.5h）**
1. 打开 `package.json`
2. 添加 `overrides` 字段: `"dompurify": "3.3.3"`
3. 运行 `npm install`
4. 验证: `npm ls dompurify` 显示 3.3.3
5. 验证: `npm audit` 无 dompurify 漏洞
6. 提交: `security: pin dompurify to 3.3.3 via overrides`

#### Phase 2: 三树状态机重构（E1，6h）

**E1-S1: 定义 NodeState 枚举（1h）**
1. 创建 `src/types/NodeState.ts`
2. 定义枚举: `idle | selected | confirmed | error`
3. 创建单元测试: `src/__tests__/types/NodeState.test.ts`
4. 验证: `npm run type-check` 无错误
5. 提交: `feat(types): add NodeState enum for tree nodes`

**E1-S2: 统一 checkbox 位置与布局（2h，依赖 E1-S1）**
1. 检查三个树的 checkbox DOM 结构
2. 修改 CSS: 移除绝对定位，改为 inline 布局
3. 修改三树组件: checkbox DOM 在 badge DOM 之前
4. 验收: DOM 测试确认 checkbox 在 badge 之前
5. 提交: `style(trees): unify checkbox position before badge`

**E1-S3: 移除 nodeUnconfirmed 样式（1h，依赖 E1-S1）**
1. 全局搜索 `nodeUnconfirmed` 类名
2. 删除 CSS 定义中的黄色边框
3. 更新三树组件，移除 `nodeUnconfirmed` class 条件
4. 验收: 无节点显示黄色边框
5. 提交: `style(trees): remove yellow border from nodeUnconfirmed`

**E1-S4: 统一 useTreeNodeState hook（2h，依赖 E1-S1）**
1. 创建 `src/hooks/useTreeNodeState.ts`
2. 实现状态变更逻辑（click → selected, dblclick → confirmed, error 处理）
3. 导出 `UseTreeNodeStateOptions` 和 `UseTreeNodeStateReturn` 类型
4. 编写单元测试: `src/__tests__/hooks/useTreeNodeState.test.ts`
5. 替换三树中的状态变更逻辑
6. 验收: 三树状态变更行为一致
7. 提交: `feat(hooks): add useTreeNodeState for unified tree node state`

#### Phase 3: canvasStore 拆分 Phase1（E2-S1，3-4h）

**E2-S1: 抽取 contextStore（3-4h）**
1. 读取 `canvasStore.ts`，统计行数（当前 1433 行）
2. 识别属于 context 状态的字段和 action：
   - `contexts[]`, `selectedContextId`, `confirmedContextIds[]`
   - `addContext`, `removeContext`, `selectContext`, `confirmContext`, `unconfirmContext`
3. 创建 `src/stores/contextStore.ts`（目标 < 300 行）
4. 使用 Zustand `create()` 创建 store
5. 保留 `canvasStore.ts` 作为代理: `create(() => contextStore.getState())`
6. 编写单元测试: `src/__tests__/stores/contextStore.test.ts`
7. 验证: `wc -l src/stores/contextStore.ts` < 300
8. 验收: `BoundedContextTree` 组件渲染正常
9. 提交: `refactor(stores): extract contextStore from canvasStore`

#### Phase 4: E2E 稳定性加固（E3，3h，与前 phases 并行）

**E3-S2: 替换 waitForTimeout（1h）**
1. 全局搜索 `waitForTimeout` 在 E2E 测试文件中
2. 逐个替换为 Playwright 条件等待:
   - `waitForSelector` (元素出现)
   - `waitForResponse` (API 响应)
   - `waitForLoadState('networkidle')` (网络空闲)
3. 验证: `grep -r "waitForTimeout" tests/` 返回 0 结果
4. 提交: `test(e2e): replace waitForTimeout with Playwright conditions`

**E3-S3: 稳定 data-testid 选择器（1h）**
1. 创建 `tests/e2e/helpers/selectors.ts`，定义 testIds helper
2. 为三树组件添加 `data-testid` 属性
3. 替换所有硬编码选择器为 `testIds.xxx()` 调用
4. 验证: 所有 E2E 测试通过
5. 提交: `test(e2e): stabilize selectors with data-testid`

**E3-S4: CI 3次连续验证（0.5h）**
1. 配置 CI workflow 3 次矩阵运行
2. 触发 CI，观察 3 次全部通过
3. 如有失败，修复后重新验证
4. 验收: 3 次连续通过
5. 提交: `ci: add 3x consecutive E2E pass gate`

---

### Sprint N+1

#### Phase 5: 页面状态规范（E5，9h）

**E5-S1: scrollTop 状态规范（2h）**
1. 打开 `src/components/Canvas/Canvas.tsx`
2. 添加 `useScrollReset` hook 调用
3. 验证: 页面切换后 `scrollTop = 0`
4. 打开 `src/components/TreePanel/TreePanel.tsx`
5. 添加 tab 切换时的 scrollTop reset
6. 提交: `fix(canvas): reset scrollTop=0 on page/panel navigation`

**E5-S2: sticky 工具栏（2h）**
1. 打开工具栏组件 CSS
2. 添加 `position: sticky; top: 0;`
3. 验证: 滚动后工具栏仍在视口
4. 提交: `style(canvas): make toolbar position sticky`

**E5-S3: Drawer z-index 层级协议（2h）**
1. 定义 CSS 变量: `--z-drawer: 100; --z-tooltip: 500; --z-modal: 1000; --z-toast: 9999`
2. 全局搜索硬编码 z-index 值
3. 替换为 CSS 变量引用
4. 验收: `expect(zIndex('Drawer')).toBeLessThan(zIndex('Tooltip'))`
5. 提交: `feat(ui): implement z-index layer protocol`

**E5-S4: 面板状态隔离（2h）**
1. 打开 `TreePanel.tsx`
2. 添加 `resetPanelState` 在 tab 切换时调用
3. 添加 `panelRef` unmount 清理: `useEffect(() => () => { panelRef.current = null }, [])`
4. 验收: tab 切换后前一面板选中状态清除
5. 提交: `fix(canvas): isolate panel state on tab switch`

**E5-S5: Canvas IA 文档（1h）**
1. 创建 `docs/canvas-information-architecture.md`
2. 记录 scrollTop 规范、z-index 层级、sticky 工具栏规范
3. 包含组件关系图
4. 提交: `docs: add canvas information architecture guide`

#### Phase 6: 交互反馈标准化（E6，8h）

**E6-S1: 删除 window.confirm（1h）**
1. 全局搜索 `window.confirm`
2. 替换为 `useToast().confirm()`
3. 高危操作添加 toast + undo 支持
4. 验收: `grep -r "window.confirm" src/` 返回 0 结果
5. 提交: `refactor(feedback): replace window.confirm with toast`

**E6-S2: 统一 dragging 状态样式（2h）**
1. 定义 CSS 变量: `--dragging-opacity: 0.7; --dragging-scale: scale(0.98)`
2. 应用到三树组件和 Canvas 拖拽逻辑
3. 验证: 拖拽时 opacity=0.7, transform 包含 scale(0.98)
4. 提交: `style(trees): standardize dragging state opacity and scale`

**E6-S3: Feedback Token 文档（1h）**
1. 创建 `docs/design-system/feedback-tokens.md`
2. 定义 loading / success / error / warning / info token 语义
3. 包含使用示例
4. 提交: `docs: add feedback tokens design system`

**E6-S4: Toast 系统接入（3h）**
1. 选择 toast 实现方案（react-hot-toast 或自实现）
2. 创建 `useToast` hook
3. 全局替换 `alert()` 调用
4. 验收: `expect(alertSpy).not.toHaveBeenCalled()`
5. 提交: `feat(feedback): integrate global toast system`

**E6-S5: UI 变更检查清单（1h）**
1. 打开 `CONTRIBUTING.md`
2. 添加 UI 变更 checklist section:
   - 截图对比命令
   - reviewer 确认要求
   - 可访问性检查
3. 提交: `docs: add UI change checklist to CONTRIBUTING.md`

---

### Sprint N+2~N+3

#### Phase 7: canvasStore 拆分 Phase2-3（E2，6h）

**E2-S2: 抽取 flowStore（2h）**
1. 创建 `src/stores/flowStore.ts`（目标 < 300 行）
2. 迁移 flow 相关状态
3. 更新 `FlowTree` 组件引用
4. 验收: `FlowTree` 渲染正常

**E2-S3: 抽取 componentStore（2h）**
1. 创建 `src/stores/componentStore.ts`（目标 < 300 行）
2. 迁移 component 相关状态
3. 更新 `ComponentTree` 组件引用
4. 验收: `ComponentTree` 渲染正常

**E2-S4: 抽取 uiStore（2h）**
1. 创建 `src/stores/uiStore.ts`（目标 < 300 行）
2. 迁移 UI 状态（scrollTop / activeTab / drawerOpen 等）
3. 更新 `Canvas.tsx` 和 `Toolbar.tsx` 引用
4. 验收: scrollTop = 0 正常工作

**E2-S5: 迁移所有组件引用（2-3h）**
1. 全局搜索 `canvasStore` 在组件中的引用
2. 替换为对应子 store
3. 验证: 所有组件引用已迁移
4. 提交: `refactor(stores): migrate all component references to sub-stores`

#### Phase 8: CSS 模块拆分（E7，9h）

**E7-S1: 提取 BoundedContextTree 样式（2h）**
1. 读取 `canvas.module.css`，识别 BoundedContextTree 相关样式
2. 创建 `BoundedContextTree.module.css`
3. 更新组件 import
4. 保留旧文件中样式（标注废弃注释）
5. 验收: `BoundedContextTree` 渲染正常，无样式丢失

**E7-S2: 提取 FlowTree 样式（2h）**
同上模式

**E7-S3: 提取 ComponentTree 样式（2h）**
同上模式

**E7-S4: 清理 canvas.module.css（2h）**
1. 删除已迁移样式（保留 6 个月并行期）
2. 标注废弃: `/* DEPRECATED: migrated to X.module.css (2026-04-02) */`
3. 验收: `wc -l canvas.module.css` < 800

**E7-S5: 视觉回归测试（1h）**
1. 配置 Playwright screenshot 测试
2. 对比关键页面截图
3. 验收: 无视觉回归

#### Phase 9: 测试覆盖率提升（E8，5h）

**E8-S1: 创建限界上下文旅程测试（1h）**
1. 创建 `tests/e2e/journey-create-context.spec.ts`
2. 实现: 打开页面 → 新建上下文 → 确认 → 验证
3. 验收: `expect(confirmed).toHaveCount(1)`

**E8-S2: 创建业务流程旅程测试（1h）**
1. 创建 `tests/e2e/journey-generate-flow.spec.ts`
2. 验收: 流程生成后节点数 > 0

**E8-S3: 创建多选操作旅程测试（1h）**
1. 创建 `tests/e2e/journey-multi-select.spec.ts`
2. 验收: 多选后批量确认，confirmed 数正确

**E8-S4: 设置覆盖率门禁（1h）**
1. 安装 Vitest + @vitest/coverage-v8
2. 在 `package.json` 添加 `coverage:check` 脚本
3. 配置 Statements 门禁 > 60%
4. 提交: `test: add coverage gate at 60% statements`

**E8-S5: 关键路径单元测试（1h）**
1. 为 `handleGenerate` / `confirmContextNode` 编写单元测试
2. 验收: 关键路径 100% 覆盖

#### Phase 10: 文档规范（E9 + E11，4.5h）

**E9-S1: PRD 模板（1h）**
1. 创建 `docs/templates/prd-template.md`
2. 包含执行摘要 / Epic 表格 / 验收标准 / DoD / GIVEN-WHEN-THEN

**E9-S2: Story 格式规范化（1h）**
1. 将现有 Story 验收标准改为 GIVEN-WHEN-THEN 格式
2. 添加格式验证

**E9-S3: DoD 纳入测试要求（1h）**
1. 打开 `docs/process/definition-of-done.md`
2. 添加测试用例纳入要求

**E11-S1: ADR-001 checkbox 语义（1h）**
1. 创建 `docs/adr/ADR-001-checkbox-semantics.md`
2. 记录状态语义和设计决策

**E11-S2: PR Checklist 纳入 ADR 检查（0.5h）**
1. 打开 `.github/pull_request_template.md` 或 `CONTRIBUTING.md`
2. 添加 ADR 合规检查项

#### Phase 11: TypeScript Strict（E10，4h）

**E10-S1: 修复 9 个 TS 预存错误（1h）**
1. 运行 `tsc --noEmit`，逐一修复 9 个错误
2. 验收: 0 错误

**E10-S2: 创建 types/canvas.ts（1h）**
1. 创建 `src/types/canvas/index.ts`
2. 导出所有领域类型
3. 验收: 文件存在且完整

**E10-S3: 渐进启用 TypeScript strict（2h）**
1. 配置 `@typescript-eslint/no-explicit-any` warn → error
2. 修复发现的 any 类型
3. 逐步启用 strict 模式

---

## 3. Testing Execution Plan

### 3.1 测试执行顺序

```
每完成一个 Story：
1. 本地单元测试: vitest run
2. 本地 E2E 测试: npm run e2e
3. 类型检查: npm run type-check
4. 提交 PR

每完成一个 Epic：
1. CI 全量测试（必须 3 次连续通过）
2. 覆盖率检查: npm run coverage:check
3. 视觉回归截图（如有 UI 变更）
```

### 3.2 回归测试策略

| 测试类型 | 范围 | 执行频率 |
|---------|------|---------|
| 单元测试 | 所有 store / hook / utility | 每次 PR |
| E2E 测试 | 核心用户旅程（create-context / generate-flow / multi-select）| 每次 CI |
| 视觉回归 | Canvas 页面、TreePanel | UI 变更时 |
| 覆盖率门禁 | Statements > 60% | 每次 CI |
| E2E 稳定性门禁 | 3次连续通过 | 每次 CI |

---

## 4. Rollback Plan

### 4.1 Breaking Change 应对

| 场景 | 触发条件 | 回滚操作 |
|------|---------|---------|
| E2-S1 contextStore 引入 breaking change | `BoundedContextTree` 渲染失败 | `git revert <commit>`，恢复 `canvasStore.ts` 代理 |
| E2-S5 组件引用迁移后发现缺失状态 | 功能测试失败 | 重新从 `canvasStore` 读取状态，延迟迁移 |
| E7 CSS 模块拆分导致样式丢失 | 视觉回归测试失败 | 删除新 CSS Module，恢复旧文件中注释标注的样式 |

### 4.2 Feature Flag 策略

- **E2 canvasStore 拆分**: Phase1 使用代理模式，不使用 feature flag（代理本身即向后兼容）
- **E7 CSS 拆分**: 6 个月并行期，旧文件不删除，出现问题时自动降级到旧文件

### 4.3 紧急回滚步骤

```bash
# 场景: E2-S1 后 BoundedContextTree 渲染失败
git revert <contextStore-extraction-commit-hash>
npm run build
# 验证 canvasStore.ts 代理正常工作
git push --force-with-lease
```

---

## 5. Acceptance Checklist

### 5.1 Sprint N 完成标准

- [ ] **E1-S1**: `src/types/NodeState.ts` 存在，枚举包含 idle/selected/confirmed/error
- [ ] **E1-S2**: 三树 checkbox 使用 inline 布局，checkbox 在 badge 之前
- [ ] **E1-S3**: 无 `nodeUnconfirmed` 黄色边框样式
- [ ] **E1-S4**: `useTreeNodeState` hook 实现，三树状态变更行为一致
- [ ] **E2-S1**: `contextStore.ts` 存在且 < 300 行，`canvasStore.ts` 代理兼容
- [ ] **E3-S1**: `tsc --noEmit` 返回 0 错误
- [ ] **E3-S2**: `grep -r "waitForTimeout" tests/` 返回 0 结果
- [ ] **E3-S3**: 所有 E2E 选择器使用 `data-testid`
- [ ] **E3-S4**: CI E2E 测试连续 3 次全部通过
- [ ] **E4-S1**: `npm ls dompurify` 显示 3.3.3
- [ ] `npm run type-check` 0 错误
- [ ] `npm run e2e` 100% 通过
- [ ] 所有新文件已提交并通过 review

### 5.2 Sprint N+1 完成标准

- [ ] **E5-S1**: 进入 Canvas 页面时 `scrollTop = 0`
- [ ] **E5-S2**: 工具栏使用 `position: sticky`
- [ ] **E5-S3**: z-index 层级协议已实现（Drawer < Tooltip < Modal < Toast）
- [ ] **E5-S4**: TreePanel tab 切换后前一面板状态已清除
- [ ] **E5-S5**: `docs/canvas-information-architecture.md` 存在且完整
- [ ] **E6-S1**: `grep -r "window.confirm" src/` 返回 0 结果
- [ ] **E6-S2**: dragging 状态统一（opacity 0.7 + scale 0.98）
- [ ] **E6-S3**: `docs/design-system/feedback-tokens.md` 存在
- [ ] **E6-S4**: toast 系统全局接入，无 `alert()` 调用
- [ ] **E6-S5**: `CONTRIBUTING.md` 包含 UI 变更 checklist

### 5.3 Sprint N+2~N+3 完成标准

- [ ] **E2-S2**: `flowStore.ts` 存在且 < 300 行，FlowTree 正常
- [ ] **E2-S3**: `componentStore.ts` 存在且 < 300 行，ComponentTree 正常
- [ ] **E2-S4**: `uiStore.ts` 存在且 < 300 行，scrollTop 正常
- [ ] **E2-S5**: 所有组件引用已迁移，无直接依赖 `canvasStore`
- [ ] **E7-S4**: `canvas.module.css` 行数 < 800（原始 1420 行）
- [ ] **E8-S1~S3**: 3 个用户旅程 E2E 测试存在且通过
- [ ] **E8-S4**: 覆盖率门禁 Statements > 60%
- [ ] **E9-S1**: PRD 模板存在
- [ ] **E9-S2**: Story 验收标准使用 GIVEN-WHEN-THEN 格式
- [ ] **E9-S3**: DoD 包含测试要求
- [ ] **E10-S1**: 9 个 TS 错误全部修复
- [ ] **E10-S2**: `types/canvas.ts` 存在且完整
- [ ] **E10-S3**: TypeScript strict 渐进启用
- [ ] **E11-S1**: ADR-001 文档存在
- [ ] **E11-S2**: PR checklist 包含 ADR 合规检查

---

## 6. 风险与缓解

| ID | 风险 | 概率 | 影响 | 缓解 |
|----|------|------|------|------|
| R1 | E2 canvasStore 拆分 breaking change | 中 | 高 | Phase1 代理模式 + 功能回归测试 |
| R2 | E7 CSS 拆分样式冲突 | 中 | 高 | 6 个月并行期 + 视觉回归测试 |
| R3 | TypeScript strict 发现大量 any | 高 | 中 | 分阶段引入（warn → error → strict） |
| R4 | P2 技术债务被挤压 | 高 | 中 | 独立 sprint，与功能开发并行 |
| R5 | 三树 PR 同时合并协调困难 | 低 | 高 | 使用 stacked PRs 或同一 PR 分支 |

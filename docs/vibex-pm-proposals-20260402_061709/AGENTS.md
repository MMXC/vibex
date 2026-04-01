# VibeX 技术债务与体验优化 — Agent 执行约束

**项目**: VibeX
**文档版本**: v1.0
**作者**: Architect Agent
**日期**: 2026-04-02
**状态**: 已采纳
**提案周期**: vibex-pm-proposals-20260402_061709

---

## 1. Dev Agent 约束

### Epic 1: 三树选择模型统一

#### ✅ DO（必须执行）

- E1-S1: 创建 `src/types/NodeState.ts`，枚举值必须为 `idle | selected | confirmed | error`
- E1-S1: 三树组件（ContextTree / FlowTree / ComponentTree）均从 `src/types/NodeState.ts` import 枚举
- E1-S2: checkbox DOM 必须在 badge DOM 之前（DOM 顺序，非 CSS 定位）
- E1-S2: checkbox 使用 inline 布局（非绝对定位）
- E1-S3: 删除 `nodeUnconfirmed` CSS 类的黄色边框定义
- E1-S4: `useTreeNodeState` hook 必须支持 `onStateChange` 回调
- E1-S4: hook 必须处理 click（→selected/idle）、dblclick（→confirmed/selected）、error 状态

#### ❌ DO NOT（禁止执行）

- 禁止在三树组件中硬编码状态字符串（必须用 `NodeState` 枚举）
- 禁止在 `useTreeNodeState` 中直接修改 DOM（必须通过 state 驱动）
- 禁止修改三树组件的 props 接口（向后兼容）
- 禁止在 E1 相关的 CSS 中引入新的全局样式污染

#### 📁 文件变更清单

```
新增:
  src/types/NodeState.ts
  src/hooks/useTreeNodeState.ts
  src/__tests__/types/NodeState.test.ts
  src/__tests__/hooks/useTreeNodeState.test.ts

修改:
  src/components/BoundedContextTree/BoundedContextTree.tsx   (import NodeState, useTreeNodeState)
  src/components/FlowTree/FlowTree.tsx                         (同上)
  src/components/ComponentTree/ComponentTree.tsx               (同上)
  src/components/BoundedContextTree/BoundedContextTree.module.css   (移除 nodeUnconfirmed, checkbox 布局)
  src/components/FlowTree/FlowTree.module.css                 (同上)
  src/components/ComponentTree/ComponentTree.module.css       (同上)
```

---

### Epic 2: canvasStore 职责拆分

#### ✅ DO（必须执行）

- E2-S1: `contextStore.ts` 行数 < 300（目标）
- E2-S1: 必须使用 Zustand `create()` API
- E2-S1: 必须保留 `getState()` 方法（用于代理兼容）
- E2-S1: 原 `canvasStore.ts` 必须通过 `create(() => contextStore.getState())` 保持代理兼容
- E2-S1: 抽取后 `BoundedContextTree` 必须渲染正常（功能回归测试）
- E2-S2~S4: 同上模式
- E2-S5: 所有组件引用迁移完成后，`canvasStore.ts` 中的代理层代码可以删除

#### ❌ DO NOT（禁止执行）

- 禁止跨 store 直接调用对方状态（如 `contextStore.getState().flows`）
- 禁止在 store 中直接操作 DOM
- 禁止将多个领域的状态混合到一个 store
- 禁止删除 `canvasStore.ts` 中的代理兼容代码直到 E2-S5 完成
- 禁止使用 `as any` 绕过类型检查作为临时修复

#### 📁 文件变更清单

```
新增:
  src/stores/contextStore.ts                      # E2-S1
  src/stores/flowStore.ts                          # E2-S2
  src/stores/componentStore.ts                     # E2-S3
  src/stores/uiStore.ts                            # E2-S4
  src/__tests__/stores/contextStore.test.ts        # E2-S1
  src/__tests__/stores/flowStore.test.ts           # E2-S2
  src/__tests__/stores/componentStore.test.ts      # E2-S3
  src/__tests__/stores/uiStore.test.ts             # E2-S4

修改:
  src/stores/canvasStore.ts                       # 添加代理兼容层
  src/components/BoundedContextTree/*              # 迁移到 contextStore
  src/components/FlowTree/*                       # 迁移到 flowStore
  src/components/ComponentTree/*                  # 迁移到 componentStore
  src/components/Canvas/Canvas.tsx                # 迁移到 uiStore
  src/components/Toolbar/Toolbar.tsx              # 迁移到 uiStore
```

---

### Epic 3: E2E 测试稳定性加固

#### ✅ DO（必须执行）

- E3-S1: `tsconfig.json` include 必须包含 `"src/**"` 和 `"tests/**"`
- E3-S2: 所有 `waitForTimeout(n)` 必须替换为 `page.waitForSelector(selector)` 或 `page.waitForResponse(url)`
- E3-S3: 所有可交互元素必须添加 `data-testid` 属性
- E3-S3: 使用 `tests/e2e/helpers/selectors.ts` 中的 `testIds` helper 生成选择器字符串
- E3-S4: CI 配置必须包含 3 次连续运行（矩阵或顺序均可）

#### ❌ DO NOT（禁止执行）

- 禁止在 E2E 测试中使用 CSS 类名或 XPath 选择器
- 禁止使用 `page.waitForTimeout`（Playwright 原生方式）
- 禁止在 CI 中跳过 flaky 测试（必须修复根本原因）
- 禁止硬编码 `data-testid` 字符串在测试文件中（必须用 `testIds.xxx()`）

#### 📁 文件变更清单

```
新增:
  tests/e2e/helpers/selectors.ts          # E3-S3
  playwright.config.ts (如有修改)          # E3-S3

修改:
  tsconfig.json                            # E3-S1
  tests/e2e/*.spec.ts                     # E3-S2, E3-S3 (替换选择器 + 等待条件)
  .github/workflows/ci.yml                 # E3-S4 (3次连续运行)
```

---

### Epic 4: DOMPurify 安全加固

#### ✅ DO（必须执行）

- E4-S1: 在 `package.json` 顶级添加 `overrides` 字段（不是 `dependencies`）
- E4-S1: 版本必须为 `3.3.3`

#### ❌ DO NOT（禁止执行）

- 禁止修改 `node_modules` 中的文件（临时修复）
- 禁止使用 `resolutions`（npm 不支持，yarn 才用）

---

### Epic 5: Canvas 页面信息架构

#### ✅ DO（必须执行）

- E5-S1: `scrollTop` 重置必须在 `useEffect` 的 cleanup 函数中执行（不是副作用中）
- E5-S2: 工具栏 `position: sticky` 必须配合 `z-index` 避免被其他元素覆盖
- E5-S3: z-index 必须使用 CSS 变量（禁止硬编码）
- E5-S4: `panelRef` 的 cleanup 必须在 `useEffect` return 中同步执行

#### ❌ DO NOT（禁止执行）

- 禁止在 `useEffect` 中直接设置 `scrollTop = 0` 而不清理（会导致循环渲染）
- 禁止在 `uiStore` 中混入会话持久化状态（如 localStorage）

---

### Epic 6: 交互反馈标准化

#### ✅ DO（必须执行）

- E6-S1: 所有 `window.confirm()` 必须替换为 `useToast().confirm()`
- E6-S2: dragging 样式必须通过 CSS class 切换（不是 inline style）
- E6-S4: toast 组件必须使用 React Portal 渲染

#### ❌ DO NOT（禁止执行）

- 禁止在 E2E 测试中使用 `page.on('dialog', ...)` 拦截 confirm 对话框作为替代方案
- 禁止在 `useToast` 中使用 `window.alert()` 作为 fallback

---

### Epic 7: CSS 模块拆分

#### ✅ DO（必须执行）

- E7-S4: 已迁移样式在旧文件中必须标注废弃注释（保留 6 个月并行期）
- E7-S4: 废弃注释格式: `/* DEPRECATED 2026-04-02: migrated to X.module.css */`
- E7-S5: 视觉回归测试必须覆盖 Canvas 主页面和三树页面

#### ❌ DO NOT（禁止执行）

- 禁止直接删除旧文件中的样式（必须保留 6 个月并行期）
- 禁止修改已抽取样式块的 CSS 类名（避免破坏旧引用）

---

### Epic 10: TypeScript Strict

#### ✅ DO（必须执行）

- E10-S1: 修复 TS 错误时必须用正确的类型注解，禁止用 `as any` 作为快捷修复
- E10-S3: 严格模式必须渐进启用（先 `@typescript-eslint/no-explicit-any` warn，再 error）

#### ❌ DO NOT（禁止执行）

- 禁止使用 `// @ts-ignore` 或 `// @ts-expect-error` 作为临时修复
- 禁止引入新的 `any` 类型（修复时必须用 `unknown` 或具体类型）

---

## 2. Reviewer Agent 约束

### 2.1 通用 Review 重点

| 维度 | 关注点 |
|------|--------|
| **类型安全** | 无 `as any`、无 `// @ts-ignore`、无 `as unknown as` |
| **测试覆盖** | 新代码必须有单元测试或 E2E 测试 |
| **无回归** | 现有功能未受影响（运行测试验证）|
| **API 兼容** | 不破坏已有 API（通过代理模式保证）|
| **命名规范** | 符合架构文档中的命名约定 |

### 2.2 Epic 特异 Review 重点

#### Epic 1 审查

- [ ] `NodeState` 枚举被三个树组件正确引用（无重复定义）
- [ ] checkbox 布局使用 CSS inline/flow（非绝对定位）
- [ ] `nodeUnconfirmed` 样式已彻底删除（无残留）
- [ ] `useTreeNodeState` 支持 bulk 操作（`bulkConfirm` / `bulkUnconfirm`）
- [ ] 状态转换图与实现完全匹配

#### Epic 2 审查

- [ ] `contextStore.ts` 行数 < 300（`wc -l` 验证）
- [ ] store 的 `getState()` 方法存在且返回正确类型
- [ ] `canvasStore.ts` 代理兼容层代码正确
- [ ] 组件迁移后无直接导入 `canvasStore`（grep 验证）
- [ ] 无跨 store 依赖（contextStore 不应引用 flowStore）

#### Epic 3 审查

- [ ] `tsconfig.json` include 路径包含 src 和 tests
- [ ] 无 `waitForTimeout` 残留（grep 验证）
- [ ] 所有 `data-testid` 使用 `testIds` helper 生成
- [ ] CI 配置中 E2E 测试运行 3 次

#### Epic 5 审查

- [ ] `scrollTop` reset 在 `useEffect` cleanup 中（不在 effect 体内）
- [ ] z-index 使用 CSS 变量，无硬编码数值
- [ ] `panelRef` cleanup 在 unmount 时执行

#### Epic 6 审查

- [ ] 无 `window.confirm()` 残留（grep 验证）
- [ ] 无 `alert()` 残留
- [ ] dragging 样式通过 CSS class 而非 inline style

### 2.3 驳回标准

满足以下任一条件，PR 必须驳回：

1. 引入 `as any` 或 `// @ts-ignore`
2. 新代码无测试覆盖
3. 破坏现有功能（测试失败）
4. `canvasStore.ts` 行数不降反升
5. E2E 测试中存在 `waitForTimeout`
6. 存在未清理的 `console.log`（生产代码）
7. 引入新的 TypeScript 错误
8. CSS 样式通过 `!important` 强制覆盖

---

## 3. Tester Agent 约束

### 3.1 测试用例清单

#### Epic 1 测试用例

| ID | 测试用例 | 验收标准 |
|----|---------|---------|
| T-E1-01 | `NodeState` 枚举值正确 | `expect(NodeState.idle).toBe('idle')` |
| T-E1-02 | click 切换 idle ↔ selected | 两次 click 后回到 idle |
| T-E1-03 | dblclick 切换 selected → confirmed | 确认节点出现绿色 ✓ |
| T-E1-04 | dblclick confirmed → selected | 取消后绿色 ✓ 消失 |
| T-E1-05 | 三树 checkbox 位置一致 | checkbox DOM 在 badge 之前 |
| T-E1-06 | 无 nodeUnconfirmed 黄色边框 | `toHaveCSS('border-color', 'not-yellow')` |

#### Epic 2 测试用例

| ID | 测试用例 | 验收标准 |
|----|---------|---------|
| T-E2-01 | contextStore < 300 行 | `wc -l src/stores/contextStore.ts < 300` |
| T-E2-02 | confirmContext 添加到 confirmedContextIds | 数组包含该 ID |
| T-E2-03 | BoundedContextTree 渲染正常 | `toBeVisible()` |
| T-E2-04 | 组件无直接导入 canvasStore | `grep -r "from.*canvasStore" src/components` = 0 |

#### Epic 3 测试用例

| ID | 测试用例 | 验收标准 |
|----|---------|---------|
| T-E3-01 | tsc --noEmit 0 错误 | `expect(status).toBe(0)` |
| T-E3-02 | 无 waitForTimeout 残留 | `expect(match).toBeNull()` |
| T-E3-03 | data-testid 选择器生效 | `page.locator(testIds.contextTreeNode('1')).toBeVisible()` |
| T-E3-04 | CI 3次连续通过 | 3 次全部 `passed` |

#### Epic 5 测试用例

| ID | 测试用例 | 验收标准 |
|----|---------|---------|
| T-E5-01 | scrollTop = 0 on page load | `expect(scrollTop).toBe(0)` |
| T-E5-02 | scrollTop = 0 on tab switch | 同上 |
| T-E5-03 | toolbar sticky on scroll | `getComputedStyle(position).toBe('sticky')` |
| T-E5-04 | z-index 层级正确 | `zIndex('Drawer') < zIndex('Tooltip') < zIndex('Modal')` |
| T-E5-05 | panelRef cleaned on unmount | `expect(panelRef.current).toBeNull()` |

#### Epic 6 测试用例

| ID | 测试用例 | 验收标准 |
|----|---------|---------|
| T-E6-01 | 无 window.confirm 残留 | `expect(count).toBe(0)` |
| T-E6-02 | destructive action shows toast | `expect(toast).toBeVisible()` |
| T-E6-03 | dragging opacity = 0.7 | `getComputedStyle(opacity).toBe('0.7')` |
| T-E6-04 | FeedbackToken 枚举完整 | 包含 loading/success/error/warning/info |

### 3.2 验收标准执行

- 每个 Story 完成必须执行对应的测试用例
- 测试用例失败 → Story 未完成 → 不进入 review
- Epic 完成后执行完整的 E2E 旅程测试
- Sprint 结束后执行完整回归测试套件

### 3.3 E2E 测试执行命令

```bash
# 单次运行
npm run e2e

# 带 UI 运行（调试）
npm run e2e:headed

# 特定测试文件
npx playwright test tests/e2e/journey-multi-select.spec.ts

# 截图对比（视觉回归）
npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

---

## 4. 文件变更总览（File Change Manifest）

### 新增文件汇总

| 文件路径 | 属于 Epic | 创建者 | 优先级 |
|---------|---------|-------|--------|
| `src/types/NodeState.ts` | E1-S1 | Dev | P0 |
| `src/hooks/useTreeNodeState.ts` | E1-S4 | Dev | P0 |
| `src/hooks/useScrollReset.ts` | E5-S1 | Dev | P1 |
| `src/hooks/useToast.ts` | E6-S4 | Dev | P1 |
| `src/stores/contextStore.ts` | E2-S1 | Dev | P0 |
| `src/stores/flowStore.ts` | E2-S2 | Dev | P2 |
| `src/stores/componentStore.ts` | E2-S3 | Dev | P2 |
| `src/stores/uiStore.ts` | E2-S4 | Dev | P2 |
| `src/types/FeedbackToken.ts` | E6-S3 | Dev | P1 |
| `src/types/canvas/index.ts` | E10-S2 | Dev | P2 |
| `src/components/BoundedContextTree/BoundedContextTree.module.css` | E7-S1 | Dev | P2 |
| `src/components/FlowTree/FlowTree.module.css` | E7-S2 | Dev | P2 |
| `src/components/ComponentTree/ComponentTree.module.css` | E7-S3 | Dev | P2 |
| `tests/e2e/journey-create-context.spec.ts` | E8-S1 | Tester | P2 |
| `tests/e2e/journey-generate-flow.spec.ts` | E8-S2 | Tester | P2 |
| `tests/e2e/journey-multi-select.spec.ts` | E8-S3 | Tester | P2 |
| `tests/e2e/helpers/selectors.ts` | E3-S3 | Dev | P0 |
| `docs/adr/ADR-001-checkbox-semantics.md` | E11-S1 | Dev | P2 |
| `docs/canvas-information-architecture.md` | E5-S5 | Dev | P1 |
| `docs/design-system/feedback-tokens.md` | E6-S3 | Dev | P1 |
| `docs/templates/prd-template.md` | E9-S1 | PM | P2 |
| `docs/process/definition-of-done.md` | E9-S3 | PM | P2 |

### 修改文件汇总

| 文件路径 | 属于 Epic | 审查重点 |
|---------|---------|---------|
| `src/stores/canvasStore.ts` | E2 | 代理兼容层 + 行数 |
| `src/components/BoundedContextTree/BoundedContextTree.tsx` | E1 | NodeState import + useTreeNodeState |
| `src/components/FlowTree/FlowTree.tsx` | E1 | 同上 |
| `src/components/ComponentTree/ComponentTree.tsx` | E1 | 同上 |
| `src/components/Canvas/Canvas.tsx` | E5, E2 | scrollTop reset + uiStore |
| `src/components/TreePanel/TreePanel.tsx` | E5 | panel state cleanup |
| `src/components/Toolbar/Toolbar.tsx` | E5, E6 | sticky + dragging |
| `src/components/Drawer/*` | E5, E6 | z-index 协议 |
| `canvas.module.css` | E7 | 1420行 → <800行 |
| `package.json` | E4, E8 | overrides + coverage script |
| `tsconfig.json` | E3 | include paths |
| `CONTRIBUTING.md` | E6, E9, E11 | UI checklist + ADR check |
| `playwright.config.ts` | E3 | 配置更新 |
| `.github/workflows/ci.yml` | E3 | 3x E2E gate |

### 关键指标追踪

| 指标 | 当前基线 | Sprint N 目标 | Sprint N+1 目标 | Sprint N+3 目标 |
|-----|---------|--------------|----------------|----------------|
| canvasStore 行数 | 1433 | 1433（代理中）| 800 | **< 300** |
| E2E 测试通过率 | ~80% | **> 95%** | > 95% | > 95% |
| TypeScript 错误 | 9 | **0** | 0 | 0 |
| canvas.module.css 行数 | 1420 | 1420 | 1420 | **< 800** |
| Statement 覆盖率 | ~40% | ~45% | ~50% | **> 60%** |

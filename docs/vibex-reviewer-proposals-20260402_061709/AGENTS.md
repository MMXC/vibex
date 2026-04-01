# VibeX 代码质量治理 — Agent 执行规范

**项目**: vibex-reviewer-proposals-20260402_061709
**版本**: 1.0
**日期**: 2026-04-02
**作者**: Architect Agent
**状态**: Proposed

---

## 1. 角色定义与任务分配

| 角色 | 负责人 | 核心职责 |
|------|--------|---------|
| **Dev** | Dev Agent | 实现代码修改、store 拆分、CSS 迁移 |
| **Reviewer** | Reviewer Agent | 代码审查、ADR 合规检查、CI gate 验证 |
| **Tester** | Tester Agent | 测试编写、E2E 验证、覆盖率达标 |
| **PM** | PM Agent | 进度跟踪、Sprint 验收、风险预警 |

---

## 2. Dev Agent 约束规范

### 2.1 Epic S0: 紧急止血（3.5h）

#### S0-1: 修复 9 个预存 TS 错误（1.0h）

**✅ DO（必须执行）**
- 运行 `npm run build` 收集所有 TS 错误
- 按错误代码分类（TS6133/TS2322/TS1005 等）
- 逐文件修复，每个错误单独 commit
- 修复后验证 `npm run build` 退出码为 0

**❌ DON'T（禁止执行）**
- 不要修改与 TS 错误无关的文件
- 不要在修复过程中引入新的 TS 错误
- 不要使用 `// @ts-ignore` 抑制错误（除非有特殊注释说明）

**文件变更范围**:
```
src/ — 预计修改 3-5 个文件
```

---

#### S0-2: 修复 E2E 测试 TS 错误（2.0h）

**✅ DO**
- 将 `tests/` 添加到 `tsconfig.json` 的 `include` 数组
- 修复 `tests/e2e/canvas-expand.spec.ts` 的 TS1434 和 TS1128
- 全局替换 `waitForTimeout` 为 Playwright 条件等待：
  - `waitForTimeout(1000)` → `waitForSelector(locator, { state: 'visible', timeout: 1000 })`
  - `waitForTimeout(2000)` → `waitForResponse(predicate, { timeout: 2000 })`
- 验证 `npx tsc --project tests/e2e/tsconfig.json --noEmit` 无 TS 错误

**❌ DON'T**
- 不要使用 `waitForTimeout` 替代方案以外的任何硬编码等待
- 不要在 E2E 测试中使用 `// @ts-ignore`
- 不要修改 E2E 测试的业务逻辑（只修 TS 语法）

**文件变更范围**:
```
tsconfig.json — 添加 "tests" 到 include
tests/e2e/canvas-expand.spec.ts — 修复 TS 错误
```

---

#### S0-3: DOMPurify XSS 修复（0.5h）

**✅ DO**
- 在 `package.json` 添加 `overrides.dompurify: "3.3.3"`
- 运行 `npm install` 应用 override
- 运行 `npm ls dompurify` 验证所有版本为 3.3.3
- 运行 `npm audit --audit-level=high` 验证无 high/critical

**❌ DON'T**
- 不要修改 monaco-editor 或其他依赖的版本
- 不要删除其他已有的 overrides

**文件变更范围**:
```
package.json — 添加 overrides 字段
package-lock.json — 自动更新
```

---

### 2.2 Epic S1: 架构基础建设（20h）

#### S1-1: TypeScript 严格模式建立（4.0h）

**✅ DO**
- 在 `tsconfig.json` 添加 `"strict": true` 和 `"noUncheckedIndexedAccess": true`
- 运行 `npx tsc --noEmit` 分析新增错误
- 逐类修复新增错误（TS18046/TS2345/TS2532/TS2775）
- 添加 `type-check:strict` npm script

**❌ DON'T**
- 不要一次性启用所有 strict 系列选项（会导致大量错误难以控制）
- 不要使用 `any` 类型抑制错误
- 不要跳过 `exactOptionalPropertyTypes`（Phase 3 可选）

**文件变更范围**:
```
tsconfig.json — 添加 strict 选项
src/**/*.{ts,tsx} — 预计修改 10-20 个文件（类型注解）
package.json — 添加 type-check:strict script
```

---

#### S1-2: canvasStore 最小化拆分（8-12h）

**✅ DO**
- 创建 `src/lib/canvas/stores/` 目录结构
- 创建 `contextStore.ts`（< 200 行）：包含 ContextNode 状态 + confirmContextNode + selectContext
- 创建 `flowStore.ts`（< 200 行）：包含 FlowNode 状态 + confirmFlowNode + selectFlow
- 创建 `componentStore.ts`（< 200 行）：包含 ComponentNode 状态 + confirmComponentNode + selectComponent
- 创建 `uiStore.ts`（< 150 行）：包含 activeTab + panelOpen + scrollTop
- 每个 store 使用 Zustand `devtools` middleware
- 每个 store 配套 `__tests__/*.test.ts` 单元测试
- 使用选择器订阅（`store(s => s.nodes)`）避免过度 re-render

**❌ DON'T**
- 不要在一个 store 中混用多个领域的状态（context + flow 不可混）
- 不要直接修改 `canvasStore.ts`（仅保留为兼容层，逐步清空）
- 不要使用 `any` 作为 store 状态类型
- 不要在 store 中直接操作 DOM
- 不要在 store 拆分期间修改三树组件的业务逻辑

**文件变更范围**:
```
src/lib/canvas/stores/contextStore.ts      (新建，< 200 行)
src/lib/canvas/stores/flowStore.ts         (新建，< 200 行)
src/lib/canvas/stores/componentStore.ts    (新建，< 200 行)
src/lib/canvas/stores/uiStore.ts           (新建，< 150 行)
src/lib/canvas/stores/__tests__/           (新建，每个 store 配套测试)
src/components/canvas/BoundedContextTree.tsx (修改：useCanvasStore → useContextStore)
src/components/canvas/BusinessFlowTree.tsx   (修改：useCanvasStore → useFlowStore)
src/components/canvas/ComponentTree.tsx      (修改：useCanvasStore → useComponentStore)
src/lib/canvas/canvasStore.ts               (修改：标记 @deprecated，逐步清空)
```

---

#### S1-3: ADR-001 三树 Checkbox 语义对齐（1.0h ADR + 4-6h 实现）

**✅ DO**
- 创建 `docs/adr/ADR-001-checkbox-semantics.md`（由 Dev 或 PM 撰写）
- 实现统一的 `confirm*Node(id)` API（三树各一个）
- 实现统一的 `select*` 多选 API
- checkbox 视觉位置：在 type badge 之前
- 状态机实现：`idle → selected → confirmed → error`

**❌ DON'T**
- 不要在 ADR 中引入复杂的跨树交互（保持简单）
- 不要在实现时引入 ADR 中未定义的 checkbox 状态
- 不要修改持久化 schema（三树状态仅存在前端内存）

**文件变更范围**:
```
docs/adr/ADR-001-checkbox-semantics.md  (新建)
src/lib/canvas/stores/contextStore.ts   (实现 confirmContextNode)
src/lib/canvas/stores/flowStore.ts      (实现 confirmFlowNode)
src/lib/canvas/stores/componentStore.ts (实现 confirmComponentNode)
src/components/canvas/BoundedContextTree.tsx   (更新 checkbox UI)
src/components/canvas/BusinessFlowTree.tsx     (更新 checkbox UI)
src/components/canvas/ComponentTree.tsx         (更新 checkbox UI)
```

---

#### S1-4: 测试覆盖率门禁基线（3.0h）

**✅ DO**
- 创建 `scripts/check-coverage.js`（纯 Node，无额外依赖）
- 配置 `vitest.config.ts` 使用 `@vitest/coverage-v8`
- 添加 `coverage:check` 和 `precommit` npm scripts
- 首次运行覆盖率，检查哪些模块覆盖率低
- 补充关键路径的单元测试（优先：store 逻辑、工具函数）

**❌ DON'T**
- 不要为覆盖而写无意义的测试（如只调用 `expect(true).toBe(true)`）
- 不要在覆盖率报告中排除核心业务逻辑
- 不要将 `check-coverage.js` 改为非 Node 脚本（保持零依赖）

**文件变更范围**:
```
scripts/check-coverage.js        (新建)
vitest.config.ts                (新建或更新)
package.json                    (添加 scripts)
src/**/__tests__/*.test.ts       (补充测试，优先覆盖 store)
```

---

### 2.3 Epic S2: 质量提升（15h）

#### S2-1: CSS Modules 组件拆分（6.0h）

**✅ DO**
- 分析 `canvas.module.css` 的选择器归属
- 创建 `BoundedContextTree.module.css`（~200 行）
- 创建 `BusinessFlowTree.module.css`（~200 行）
- 创建 `ComponentTree.module.css`（~150 行）
- 创建 `canvas-layout.module.css`（~300 行，公共布局）
- 创建 `canvas-variables.module.css`（~50 行，CSS 变量）
- 更新三树组件的 `import styles from` 路径
- 每个 CSS 迁移后截图对比验证

**❌ DON'T**
- 不要在 CSS 中使用全局选择器（如 `body { }`、`.container { }`）
- 不要在 CSS Modules 中使用 `:global()`
- 不要在迁移期间修改组件的 HTML 结构
- 不要删除 `canvas.module.css`（保留兼容层，逐步清空）

**文件变更范围**:
```
src/components/canvas/BoundedContextTree.module.css  (新建)
src/components/canvas/BusinessFlowTree.module.css    (新建)
src/components/canvas/ComponentTree.module.css        (新建)
src/components/canvas/canvas-layout.module.css       (新建)
src/components/canvas/canvas-variables.module.css    (新建)
src/components/canvas/BoundedContextTree.tsx  (修改 import 路径)
src/components/canvas/BusinessFlowTree.tsx    (修改 import 路径)
src/components/canvas/ComponentTree.tsx        (修改 import 路径)
src/components/canvas/canvas.module.css       (逐步清空，目标 < 200 行)
```

---

#### S2-2: Playwright E2E 核心旅程（8-10h）

**✅ DO**
- 创建 `tests/e2e/journey-create-context.spec.ts`（3 个测试用例）
- 创建 `tests/e2e/journey-generate-flow.spec.ts`（2-3 个测试用例）
- 创建 `tests/e2e/journey-multi-select.spec.ts`（2 个测试用例）
- 所有测试使用 `waitForSelector` 等条件等待 API
- 每个测试有清晰的 `test.describe` 分组和注释
- 使用 `[data-testid]` 属性进行元素定位（更稳定）

**❌ DON'T**
- 不要在 E2E 测试中使用 `waitForTimeout`
- 不要在 E2E 测试中使用 `page.click()` + `page.waitForTimeout()` 组合
- 不要硬编码 CSS 选择器（使用 `data-testid` 或 ARIA role）
- 不要在 E2E 测试中使用 `sleep()` 或其他同步等待

**文件变更范围**:
```
tests/e2e/journey-create-context.spec.ts   (新建)
tests/e2e/journey-generate-flow.spec.ts   (新建)
tests/e2e/journey-multi-select.spec.ts    (新建)
```

---

#### S2-3: Git 工作流规范（1.0h）

**✅ DO**
- 创建 `.github/CONTRIBUTING.md`
- 包含 Conventional Commits 规范
- 包含完整 PR Checklist（所有检查项列出）
- Checklist 包含 ADR 合规检查
- Checklist 包含覆盖率 gate 检查

**❌ DON'T**
- 不要在 CONTRIBUTING 中使用模糊语言（如"尽量"、"建议"）— 使用"必须"
- 不要遗漏任何拒绝标准

**文件变更范围**:
```
.github/CONTRIBUTING.md  (新建)
```

---

## 3. Reviewer Agent 约束规范

### 3.1 Sprint 0 Review 重点

#### 审查 S0-1 和 S0-2
- 验证 `npm run build` 退出码为 0
- 验证 `npm run type-check:strict` 退出码为 0（若脚本已添加）
- 验证 `npx playwright test canvas-expand.spec.ts` 无 TS 编译错误

#### 审查 S0-3
- 验证 `package.json` 包含正确的 `overrides.dompurify`
- 验证 `npm ls dompurify` 所有版本 >= 3.3.3
- 验证 `npm audit --audit-level=high` 输出无 high/critical

**拒绝标准（Sprint 0）**:
- [ ] 仍存在任何 `error TS` 编译错误
- [ ] DOMPurify 版本低于 3.3.3
- [ ] 引入新的 high/critical 安全漏洞

---

### 3.2 Sprint 1 Review 重点

#### 审查 S1-1 TypeScript 严格模式
- 验证 `tsconfig.json` 包含 `"strict": true`
- 验证 `npm run type-check:strict` 退出码为 0
- 检查无 `// @ts-ignore` 滥用

#### 审查 S1-2 Store 拆分
- 验证 `src/lib/canvas/stores/` 下每个文件 < 300 行
- 验证 `wc -l src/lib/canvas/stores/*.ts | awk '$1>300'` 无输出
- 验证每个 store 有对应的 `__tests__/*.test.ts`
- 验证三树组件不再直接依赖 `canvasStore.ts`
- 验证 store 使用选择器订阅（无过度 re-render）

#### 审查 S1-3 ADR-001 合规
- 验证 `docs/adr/ADR-001-checkbox-semantics.md` 存在
- 验证 `grep -E "confirmContextNode|confirmFlowNode|confirmComponentNode" src/components/canvas/*.tsx | wc -l` >= 3
- 验证三树 checkbox 视觉位置在 type badge 之前

#### 审查 S1-4 覆盖率门禁
- 验证 `scripts/check-coverage.js` 存在且可执行
- 验证 `node scripts/check-coverage.js` 退出码 0
- 验证覆盖率报告存在 `coverage/index.html`
- 检查 Statements >= 50%、Branches >= 45%、Functions >= 55%

**拒绝标准（Sprint 1）**:
- [ ] TypeScript 严格模式未通过
- [ ] 任何 store 文件 > 300 行
- [ ] 无 store 单元测试
- [ ] 三树 checkbox 语义不符合 ADR-001
- [ ] 覆盖率未达标

---

### 3.3 Sprint 2 Review 重点

#### 审查 S2-1 CSS 拆分
- 验证每个 `*.module.css` < 500 行
- 验证 `wc -l src/components/canvas/*.module.css | awk '$1>500'` 无输出
- 验证 `canvas.module.css` < 200 行
- 验证无全局 CSS 污染（无 `:global()` 滥用）

#### 审查 S2-2 E2E 旅程
- 验证 3 个 `journey-*.spec.ts` 文件存在
- 验证所有测试使用 Playwright 条件等待（无 `waitForTimeout`）
- 验证 `npx playwright test tests/e2e/journey-*.spec.ts` 全部 passed
- 验证连续 3 次执行结果一致（0 flaky）

#### 审查 S2-3 CONTRIBUTING.md
- 验证 `.github/CONTRIBUTING.md` 存在
- 验证包含 Conventional Commits 规范
- 验证包含完整 PR Checklist
- 验证 Checklist 包含 ADR 合规检查
- 验证 Checklist 包含覆盖率 gate 检查

**拒绝标准（Sprint 2）**:
- [ ] 任何 CSS 模块 > 500 行
- [ ] `canvas.module.css` > 200 行
- [ ] E2E 测试仍使用 `waitForTimeout`
- [ ] 任何 E2E 旅程测试失败
- [ ] E2E 测试 flaky（3 次执行结果不一致）
- [ ] CONTRIBUTING.md 缺少关键检查项

---

## 4. Tester Agent 约束规范

### 4.1 单元测试要求

#### S1-2 Store 测试（必须覆盖）
```typescript
// 每个 store 必须有至少以下测试：
describe('addXxx', () => {
  it('添加后节点包含 id 和 createdAt')
  it('添加后 confirmed 为 false')
  it('添加后 selected 为 false')
})

describe('confirmXxxNode', () => {
  it('confirm 后 isXxxConfirmed 返回 true')
  it('重复 confirm 不抛错')
})

describe('selectXxx (多选)', () => {
  it('多选后可获取多个 selected 节点')
  it('clearSelection 清空所有 selected')
})

describe('getSelected', () => {
  it('空选择返回空数组')
  it('返回所有 selected 为 true 的节点')
})
```

### 4.2 E2E 测试要求

#### Journey 1: journey-create-context.spec.ts
| 测试用例 | 验收标准 |
|---------|---------|
| 用户成功创建 Context | 1 个 context-node 可见，名称匹配 |
| 确认 checkbox | data-confirmed="true" |
| Ctrl+Click 多选 | 2 个节点 data-selected="true" |

#### Journey 2: journey-generate-flow.spec.ts
| 测试用例 | 验收标准 |
|---------|---------|
| 从 Context 生成 Flow | FlowTree 包含新生成节点 |
| Flow 多选 | 2 个 flow-node 可多选 |

#### Journey 3: journey-multi-select.spec.ts
| 测试用例 | 验收标准 |
|---------|---------|
| 批量确认多个 Context | 所有选中节点 confirmed=true |
| 空选择按钮禁用 | confirm selected 按钮 Disabled |

### 4.3 覆盖率验证测试用例
```typescript
// scripts/__tests__/check-coverage.test.js（Vitest 测试 check-coverage.js 逻辑）

test('覆盖率达标时退出码为 0', async () => {
  // Mock coverage-summary.json 达标数据
  // 运行 checkCoverage()
  // 期望: exitCode === 0
})

test('覆盖率不达标时退出码为 1', async () => {
  // Mock coverage-summary.json 不达标数据
  // 期望: exitCode === 1
})

test('失败指标正确汇总', async () => {
  // Mock statements=40%, branches=30%, functions=40%
  // 期望 failedMetrics 包含所有 3 项
})
```

---

## 5. 文件变更清单

### 5.1 Sprint 0 文件清单

| 文件 | 操作 | 状态 |
|------|------|------|
| `tsconfig.json` | 修改 | 待实现 |
| `package.json` | 修改（添加 overrides） | 待实现 |
| `tests/e2e/canvas-expand.spec.ts` | 修改 | 待实现 |
| `src/**/*.{ts,tsx}` | 修改（修复 TS 错误） | 待实现 |

### 5.2 Sprint 1 文件清单

| 文件 | 操作 | 状态 |
|------|------|------|
| `tsconfig.json` | 修改（strict: true） | 待实现 |
| `package.json` | 修改（添加 scripts） | 待实现 |
| `vitest.config.ts` | 新建/修改 | 待实现 |
| `scripts/check-coverage.js` | 新建 | 待实现 |
| `src/lib/canvas/stores/contextStore.ts` | 新建 | 待实现 |
| `src/lib/canvas/stores/flowStore.ts` | 新建 | 待实现 |
| `src/lib/canvas/stores/componentStore.ts` | 新建 | 待实现 |
| `src/lib/canvas/stores/uiStore.ts` | 新建 | 待实现 |
| `src/lib/canvas/stores/__tests__/*.test.ts` | 新建 | 待实现 |
| `docs/adr/ADR-001-checkbox-semantics.md` | 新建 | 待实现 |
| `src/components/canvas/BoundedContextTree.tsx` | 修改 | 待实现 |
| `src/components/canvas/BusinessFlowTree.tsx` | 修改 | 待实现 |
| `src/components/canvas/ComponentTree.tsx` | 修改 | 待实现 |
| `src/lib/canvas/canvasStore.ts` | 修改（标记 deprecated） | 待实现 |

### 5.3 Sprint 2 文件清单

| 文件 | 操作 | 状态 |
|------|------|------|
| `src/components/canvas/BoundedContextTree.module.css` | 新建 | 待实现 |
| `src/components/canvas/BusinessFlowTree.module.css` | 新建 | 待实现 |
| `src/components/canvas/ComponentTree.module.css` | 新建 | 待实现 |
| `src/components/canvas/canvas-layout.module.css` | 新建 | 待实现 |
| `src/components/canvas/canvas-variables.module.css` | 新建 | 待实现 |
| `src/components/canvas/canvas.module.css` | 修改（逐步清空） | 待实现 |
| `src/components/canvas/BoundedContextTree.tsx` | 修改（import 路径） | 待实现 |
| `src/components/canvas/BusinessFlowTree.tsx` | 修改（import 路径） | 待实现 |
| `src/components/canvas/ComponentTree.tsx` | 修改（import 路径） | 待实现 |
| `tests/e2e/journey-create-context.spec.ts` | 新建 | 待实现 |
| `tests/e2e/journey-generate-flow.spec.ts` | 新建 | 待实现 |
| `tests/e2e/journey-multi-select.spec.ts` | 新建 | 待实现 |
| `.github/CONTRIBUTING.md` | 新建 | 待实现 |

---

## 6. 验收里程碑

| 里程碑 | 时间 | 验收条件 |
|--------|------|---------|
| Sprint 0 完成 | Day 1 末 | CI 构建 0 TS 错误 + DOMPurify ≥ 3.3.3 + E2E 可执行 |
| Sprint 1 完成 | Day 5 末 | TS strict 通过 + 每个 store < 300 行 + ADR-001 建立 + 覆盖率达标 |
| Sprint 2 完成 | Day 8 末 | CSS 每文件 < 500 行 + 3 个 E2E 旅程全部 passed + CONTRIBUTING.md 就位 |
| **项目完成** | Day 8 末 | 所有里程碑通过 + canvasStore.ts 清空至 < 100 行 + PM + Reviewer 共同签字验收 |

---

*Architect Agent | VibeX 代码质量治理 Agent 执行规范 | 2026-04-02*

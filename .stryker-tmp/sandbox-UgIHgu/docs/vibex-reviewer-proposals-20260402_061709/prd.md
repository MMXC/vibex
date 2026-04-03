# VibeX 代码质量治理 PRD
**项目代号**: VibeX Reviewer Proposals
**版本**: 1.0
**日期**: 2026-04-02
**作者**: PM Agent
**状态**: Draft

---

## 1. 执行摘要

### 1.1 背景

VibeX 当前处于"功能验证期"，代码质量和技术债务是制约研发效率的核心瓶颈。Reviewer Agent 联合 Analyst、Dev、PM、Tester 四个 Agent 交叉提案，识别出 5 个最高 ROI 的质量改进方向：

| # | 核心问题 | 现状 | 风险等级 |
|---|---------|------|---------|
| 1 | CI 门禁形同虚设 | 9 个预存 TS 错误 + E2E 测试 TS 语法错误 | 🔴 P0 |
| 2 | DOMPurify XSS 漏洞 | 间接依赖版本 < 3.3.3 | 🔴 P0 |
| 3 | canvasStore 单文件膨胀 | 1433 行单文件，所有状态集中管理 | 🟡 P1 |
| 4 | 三树 checkbox 语义混乱 | Context/Flow/Component 三树行为不一致 | 🟡 P1 |
| 5 | 测试覆盖率无门禁 | 关键路径缺乏回归屏障 | 🟢 P2 |

### 1.2 目标

在 **2 个 Sprint（约 38.5h）** 内，修复所有 P0 阻塞项，建立代码质量基础设施：

- **Sprint 0**: 解除 CI 阻塞 + 安全漏洞（3.5h）
- **Sprint 1**: 建立架构基础 + TypeScript 严格化（20h）
- **Sprint 2**: CSS 模块化 + E2E 核心旅程（15h）

### 1.3 成功指标

| 指标 | 当前基线 | Sprint 1 目标 | Sprint 2 目标 |
|------|---------|-------------|-------------|
| CI 构建错误数 | 9 个 TS 错误 | 0 个 | 0 个 |
| E2E 测试可执行率 | 0%（TS 语法错误）| 100% | 100% |
| npm audit high/critical | > 0 | 0 | 0 |
| canvasStore 最大行数 | 1433 行 | < 400 行 | < 300 行 |
| 三树 checkbox 语义一致性 | 0（无 ADR）| ADR 已建立 | 全部对齐 |
| 测试覆盖率（Statements）| 无基线 | > 50% | > 60% |
| 关键旅程 E2E 通过率 | 0（不可执行）| — | 100% |

---

## 2. Epic / Story 表格

### Epic S0: 紧急止血（P0 阻塞修复）

| ID | 功能点 | 描述 | 工时 | 验收标准（expect() 断言）| 页面集成 |
|----|--------|------|------|------------------------|---------|
| S0-1 | 修复预存 TypeScript 错误 | 修复 vibex-frontend 中 9 个预存 TS 编译错误（废弃 API / 类型缺失 / 路径别名）| 1h | `expect(buildStderr.match(/error TS/g) ?? []).toHaveLength(0)` | ❌ |
| S0-2 | 修复 E2E 测试 TypeScript 错误 | 修复 canvas-expand.spec.ts 的 TS1434/TS1128；将 `tests/` 加入 tsconfig.json include；替换 `waitForTimeout` 为 Playwright 条件等待 | 2h | `expect(e2eTscStderr.match(/error TS/g) ?? []).toHaveLength(0)` | ❌ |
| S0-3 | DOMPurify 安全漏洞修复 | 通过 `overrides.domapify: "3.3.3"` 强制版本升级，验证 monaco-editor 兼容性 | 0.5h | `expect(npmAuditCriticalCount).toBe(0)` | ❌ |

---

### Epic S1: 架构基础建设（TypeScript + Store 模块化）

| ID | 功能点 | 描述 | 工时 | 验收标准（expect() 断言）| 页面集成 |
|----|--------|------|------|------------------------|---------|
| S1-1 | TypeScript 严格模式建立 | 启用 `strict: true`、`noUncheckedIndexedAccess`；修复新增的类型错误 | 4h | `expect(tscExitCode).toBe(0)` | ❌ |
| S1-2 | canvasStore 最小化拆分 | 按领域拆分：contextStore.ts / flowStore.ts / componentStore.ts / uiStore.ts，每文件 < 300 行 | 8-12h | `expect(maxStoreLines).toBeLessThan(300)` | ❌ |
| S1-3 | ADR-001 三树 Checkbox 语义规范 | 编写 ADR-001-checkbox-semantics.md；实现统一的 `confirmContextNode` / `confirmFlowNode` / `confirmComponentNode` API | 1h（ADR）+ 4-6h（实现对齐）| `expect(adrFileExists).toBe(true)` + `expect(unifiedConfirmAPICount).toBeGreaterThanOrEqual(3)` | ✅ 三树页面 |
| S1-4 | 测试覆盖率门禁基线 | 配置 vitest v8 coverage；`check-coverage.js` 脚本；CI gate 标准：Statements > 50%、Branches > 45%、Functions > 55% | 3h | `expect(coverageStatements).toBeGreaterThanOrEqual(50)` | ❌ |

---

### Epic S2: 质量提升（CSS 模块化 + E2E 旅程）

| ID | 功能点 | 描述 | 工时 | 验收标准（expect() 断言）| 页面集成 |
|----|--------|------|------|------------------------|---------|
| S2-1 | canvas.module.css 组件拆分 | 按组件拆分：BoundedContextTree.module.css / BusinessFlowTree.module.css / ComponentTree.module.css / canvas-layout.module.css / canvas-variables.module.css | 6h | `expect(maxCssModuleLines).toBeLessThan(500)` + `expect(canvasModuleLines).toBeLessThan(200)` | ✅ canvas 页面 |
| S2-2 | Playwright E2E 核心旅程覆盖 | 实现 3 个关键旅程 E2E：journey-create-context.spec.ts / journey-generate-flow.spec.ts / journey-multi-select.spec.ts；全部使用条件等待，0 个 flaky | 8-10h | `expect(journeyTestPassRate).toBe(1.0)` | ❌ |
| S2-3 | Git 工作流规范 | 编写 `.github/CONTRIBUTING.md` 规范 commit 格式、PR 流程、review checklist（包含 ADR 遵守检查）| 1h | `expect(contributingFileExists).toBe(true)` | ❌ |

---

## 3. 详细功能规格

### S0-1: 修复预存 TypeScript 错误

**问题**: `npm run build` 输出 9 个 `error TS` 前缀的编译错误，CI gate 无法作为质量门禁。

**技术方案**:
```bash
# 步骤 1: 收集错误
cd /root/.openclaw/vibex/vibex-frontend && npm run build 2>&1 | grep "error TS"

# 步骤 2: 分类
# - TS6133: 未使用的变量/导入 → 删除或加 `_` 前缀
# - TS2322: 类型不匹配 → 添加类型注解
# - TS1005/TS1107: 语法/废弃 API → 使用替代 API

# 步骤 3: 验证
# 期望: npm run build 退出码 0，无 error TS 输出
```

**Acceptance Criteria**:
- [ ] `npm run build` 退出码为 0，无 `error TS` 输出
- [ ] `npm run type-check:strict` 退出码为 0
- [ ] 无 regression（不影响现有功能）

---

### S0-2: 修复 E2E 测试 TypeScript 错误

**问题**: `tests/e2e/canvas-expand.spec.ts` 包含 TS1434（异步上下文）和 TS1128（语法错误），导致 Playwright 无法执行测试。

**技术方案**:
```typescript
// 1. tsconfig.json 添加 tests/ 到 include
{
  "include": ["src", "tests"]
}

// 2. 替换 waitForTimeout 为条件等待
// 错误: await page.waitForTimeout(1000);
// 正确: await page.waitForSelector('.canvas-panel', { state: 'visible' });

// 3. 修复 TS1434: 在异步测试函数中正确使用 await
// 4. 修复 TS1128: 添加必要的分号/括号闭合
```

**Acceptance Criteria**:
- [ ] `npx tsc --noEmit` 对 tests/ 目录无 TS 错误
- [ ] `npx playwright test canvas-expand.spec.ts` 可正常执行（无 TS 编译错误）
- [ ] 所有 `waitForTimeout` 替换为 Playwright 条件等待 API

---

### S0-3: DOMPurify 安全漏洞修复

**问题**: `npm audit` 报告 dompurify 间接依赖版本低于 3.3.3，存在 XSS 风险。

**技术方案**:
```json
// package.json
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

**Acceptance Criteria**:
- [ ] `npm audit --audit-level=high` 输出无 high/critical 漏洞
- [ ] `npm ls dompurify` 所有版本 >= 3.3.3
- [ ] monaco-editor 功能正常（staging 验证）

---

### S1-1: TypeScript 严格模式建立

**问题**: 当前 tsconfig 未启用严格模式，类型安全不足。

**技术方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Acceptance Criteria**:
- [ ] `npx tsc --noEmit` 退出码 0
- [ ] 新增类型错误 < 5 个（分阶段修复）
- [ ] CI 流程 `type-check:strict` 通过

---

### S1-2: canvasStore 最小化拆分

**问题**: `canvasStore.ts` 1433 行单文件，所有状态集中管理，是最大单点风险。

**技术方案**:
```typescript
// lib/canvas/stores/
// contextStore.ts    — BoundedContextTree 专用，< 200 行
// flowStore.ts       — BusinessFlowTree 专用，< 200 行
// componentStore.ts  — ComponentTree 专用，< 200 行
// uiStore.ts         — 面板开关、scrollTop 等 UI 状态，< 150 行
// canvasStore.ts     — 根 store（临时兼容层，逐步清空）
```

**Acceptance Criteria**:
- [ ] `wc -l lib/canvas/stores/*.ts` 每文件 < 300 行
- [ ] `grep -r "useCanvasStore" src/components/canvas/` 直接引用 < 5 个（过渡期）
- [ ] 三树组件各自使用独立 store，不直接依赖 canvasStore
- [ ] Zustand devtools 正常工作
- [ ] 现有 E2E 测试全部通过（无 regression）

---

### S1-3: ADR-001 三树 Checkbox 语义规范 【需页面集成】

**问题**: ContextTree / FlowTree / ComponentTree 的 checkbox 语义混乱（三树不一致）。

**技术方案**:
```markdown
# docs/adr/ADR-001-checkbox-semantics.md
## Selection Checkbox
- 用途: 多选场景（Ctrl+Click）
- 状态: selected（boolean）
- 视觉: checkbox 在 type badge 之前

## Confirmation Checkbox
- 用途: 单节点确认
- 状态: isActive / confirmed（boolean）
- API: confirmContextNode(id) / confirmFlowNode(id) / confirmComponentNode(id)

## 状态机
idle → selected → confirmed → error
```

**Acceptance Criteria**:
- [ ] `docs/adr/ADR-001-checkbox-semantics.md` 存在且包含 selection/confirmation 定义
- [ ] 三树组件均使用统一 `confirm*Node(id)` API
- [ ] BoundedContextTree 页面：checkbox 交互行为符合 ADR
- [ ] BusinessFlowTree 页面：checkbox 交互行为符合 ADR
- [ ] ComponentTree 页面：checkbox 交互行为符合 ADR
- [ ] `grep -E "confirmContextNode|confirmFlowNode|confirmComponentNode" src/components/canvas/*.tsx` 输出 >= 3 行

---

### S1-4: 测试覆盖率门禁基线

**问题**: 无测试覆盖率基线和 CI gate，测试套件质量无法量化。

**技术方案**:
```json
// package.json
{
  "scripts": {
    "coverage:check": "vitest run --coverage --coverage.provider=v8 && node scripts/check-coverage.js",
    "precommit": "npm run coverage:check && npm run type-check:strict"
  }
}

// scripts/check-coverage.js
// 门禁标准: Statements > 50%, Branches > 45%, Functions > 55%
// 退出码: 任意项不达标返回 1
```

**Acceptance Criteria**:
- [ ] `npm run coverage:check` 生成 `coverage/index.html`
- [ ] Statements 覆盖率 >= 50%
- [ ] Branches 覆盖率 >= 45%
- [ ] Functions 覆盖率 >= 55%
- [ ] `npm run precommit` 在覆盖率不达标时返回非零退出码

---

### S2-1: canvas.module.css 组件拆分 【需页面集成】

**问题**: `canvas.module.css` 单文件行数过多，CSS 冲突风险高。

**技术方案**:
```
src/components/canvas/
  BoundedContextTree.module.css   (~200 行)
  BusinessFlowTree.module.css     (~200 行)
  ComponentTree.module.css        (~150 行)
  canvas-layout.module.css       (~300 行，公共布局)
  canvas-variables.module.css     (~50 行，CSS 变量)
  canvas.module.css              (兼容层，逐步清空，目标 < 200 行)
```

**Acceptance Criteria**:
- [ ] `wc -l src/components/canvas/*.module.css` 每文件 < 500 行
- [ ] `canvas.module.css` 最终 < 200 行
- [ ] 三个树组件页面样式与拆分前一致（视觉回归测试截图对比）
- [ ] CSS 变量（颜色、间距）统一迁移到 `canvas-variables.module.css`

---

### S2-2: Playwright E2E 核心旅程覆盖 【需页面集成】

**问题**: 缺乏关键用户旅程的 E2E 回归测试。

**技术方案**:
```typescript
// tests/e2e/journey-create-context.spec.ts
test('用户创建 BoundedContext', async ({ page }) => {
  await page.goto('/canvas');
  await page.getByRole('button', { name: 'Add Context' }).click();
  await page.getByPlaceholder('Context Name').fill('Order Service');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('.context-node')).toHaveCount(1);
});

// tests/e2e/journey-generate-flow.spec.ts
test('用户从 Context 生成 Flow', async ({ page }) => {
  // ... 多步骤流程
});

// tests/e2e/journey-multi-select.spec.ts
test('用户多选节点并批量确认', async ({ page }) => {
  // ... Ctrl+Click 多选
});
```

**Acceptance Criteria**:
- [ ] `journey-create-context.spec.ts` 通过，期望: 1 个 context-node 存在
- [ ] `journey-generate-flow.spec.ts` 通过，期望: FlowTree 包含生成节点
- [ ] `journey-multi-select.spec.ts` 通过，期望: selected 状态节点 >= 2
- [ ] 所有 E2E 测试 0 个 flaky（连续 3 次执行结果一致）
- [ ] 所有 E2E 测试使用 Playwright 条件等待，无 `waitForTimeout`

---

### S2-3: Git 工作流规范

**问题**: 缺乏团队协作规范，代码质量标准不统一。

**技术方案**:
```markdown
# .github/CONTRIBUTING.md
## Commit 规范
- feat: 新功能
- fix: Bug 修复
- refactor: 重构
- test: 测试
- docs: 文档

## PR Checklist
- [ ] npm run build 通过
- [ ] npm run type-check:strict 通过
- [ ] npm run coverage:check 通过（Statements >= 50%）
- [ ] 新组件符合 ADR-001 checkbox 语义规范
- [ ] 新 store < 300 行（Zustand slice 模式）
- [ ] 新 CSS 使用 *.module.css（无全局污染）
```

**Acceptance Criteria**:
- [ ] `.github/CONTRIBUTING.md` 存在且包含完整 PR checklist
- [ ] checklist 包含 ADR 遵守检查项
- [ ] checklist 包含覆盖率门禁检查项

---

## 4. 验收标准汇总

### 4.1 Sprint 0 验收（3.5h）

| 验收项 | 检查命令 | 期望结果 |
|--------|---------|---------|
| S0-1 TS 错误修复 | `npm run build 2>&1 \| grep "error TS" \| wc -l` | 0 |
| S0-2 E2E TS 修复 | `cd tests/e2e && npx tsc --noEmit 2>&1 \| grep -c "error"` | 0 |
| S0-2 E2E 可执行 | `npx playwright test canvas-expand.spec.ts` | 无 TS 编译错误 |
| S0-3 DOMPurify 修复 | `npm audit --audit-level=high 2>&1 \| grep -c "high\|critical"` | 0 |

### 4.2 Sprint 1 验收（20h）

| 验收项 | 检查命令 | 期望结果 |
|--------|---------|---------|
| S1-1 严格模式 | `npm run type-check:strict; echo $?` | 0 |
| S1-2 Store 拆分 | `wc -l lib/canvas/stores/*.ts \| awk '$1>300'` | 无输出 |
| S1-3 ADR 建立 | `test -f docs/adr/ADR-001-checkbox-semantics.md && echo PASS` | PASS |
| S1-3 三树对齐 | `grep -E "confirmContextNode\|confirmFlowNode\|confirmComponentNode" src/components/canvas/*.tsx` | >= 3 行 |
| S1-4 覆盖率基线 | `node scripts/check-coverage.js` | Statements >= 50% |

### 4.3 Sprint 2 验收（15h）

| 验收项 | 检查命令 | 期望结果 |
|--------|---------|---------|
| S2-1 CSS 拆分 | `wc -l src/components/canvas/*.module.css \| awk '$1>500'` | 无输出 |
| S2-2 旅程测试 | `npx playwright test tests/e2e/journey-*.spec.ts` | 全部 passed |
| S2-2 无 flaky | 连续 3 次执行 `npx playwright test` | 结果一致 |
| S2-3 贡献规范 | `test -f .github/CONTRIBUTING.md && echo PASS` | PASS |

---

## 5. Definition of Done (DoD)

### Sprint 0 DoD

- [ ] `npm run build` 退出码 0，输出无 `error TS`
- [ ] `tests/e2e/canvas-expand.spec.ts` 可被 Playwright 正常加载执行
- [ ] `npm ls dompurify` 所有版本 >= 3.3.3
- [ ] `npm audit --audit-level=high` 无 high/critical 漏洞
- [ ] PR 已合并到 main 分支
- [ ] CI pipeline 全绿（至少 3 次连续通过）

### Sprint 1 DoD

- [ ] `npm run type-check:strict` 退出码 0
- [ ] `lib/canvas/stores/` 下每个 store 文件 < 300 行
- [ ] `docs/adr/ADR-001-checkbox-semantics.md` 已创建并经过 team review
- [ ] 三树组件代码符合 ADR-001 规范
- [ ] `npm run coverage:check` 达标（Statements >= 50%）
- [ ] `scripts/check-coverage.js` 在不达标时正确返回非零退出码
- [ ] PR 已合并，包含所有 4 个功能点

### Sprint 2 DoD

- [ ] `src/components/canvas/` 下每个 *.module.css < 500 行，`canvas.module.css` < 200 行
- [ ] 三树页面视觉回归测试通过（截图 diff）
- [ ] `journey-*.spec.ts` 全部 3 个 E2E 旅程测试通过
- [ ] 连续 3 次执行 E2E 测试结果一致（0 flaky）
- [ ] `.github/CONTRIBUTING.md` 包含完整 PR checklist
- [ ] 最终 `npm run build` + `npm run type-check:strict` + `npm run coverage:check` 全部通过

### 整体项目 DoD

- [ ] 所有 Sprint 0/1/2 验收项通过
- [ ] 技术债务可视化：canvasStore 从 1433 行降至 < 300 行
- [ ] CI 门禁从"形同虚设"变为"可信质量门禁"
- [ ] Reviewer Agent 确认代码质量符合标准
- [ ] PM 和 Reviewer 共同验收签字

---

## 6. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | CI 全流程（build + type-check + coverage）< 5 分钟 |
| **兼容性** | DOMPurify override 不破坏 monaco-editor 编辑器功能 |
| **可维护性** | 每个 store < 300 行，每个 CSS 模块 < 500 行 |
| **测试质量** | E2E 测试 0 flaky，关键旅程 100% 覆盖 |
| **安全性** | npm audit high/critical 漏洞 0 个 |
| **文档** | ADR、CONTRIBUTING、check-coverage.js 脚本齐全 |

---

## 7. 实施路线图

```
Week 1 (Sprint 0 — 紧急止血)
  Day 1: S0-1 (1h) + S0-2 (2h) + S0-3 (0.5h)
  Day 1: 验证 CI gate 恢复绿色

Week 2-3 (Sprint 1 — 架构基础)
  Day 2-3: S1-1 (4h) + S1-2 (8-12h)
  Day 4: S1-3 ADR 编写 (1h)
  Day 4-5: S1-3 实现对齐 (4-6h)
  Day 5: S1-4 覆盖率门禁 (3h)

Week 4-5 (Sprint 2 — 质量提升)
  Day 6-7: S2-1 CSS 拆分 (6h)
  Day 7-8: S2-2 E2E 旅程 (8-10h)
  Day 8: S2-3 Git 工作流规范 (1h)

总计: ~38.5h（约 2 个 Sprint）
```

---

## 8. 风险与缓解

| # | 风险 | 可能性 | 影响 | 缓解策略 |
|---|------|--------|------|---------|
| R1 | DOMPurify override 导致 monaco-editor 不兼容 | 中 | 高 | staging 验证，保留回滚预案 |
| R2 | canvasStore 拆分引入 regression | 中 | 高 | 每个 store 独立测试，PR 前全量 E2E |
| R3 | CSS 拆分期间样式冲突 | 低 | 中 | 并行期 6 个月，实时截图对比 |
| R4 | ADR 规范推行受阻 | 中 | 中 | 纳入 PR review checklist（强制）|
| R5 | 覆盖率门禁过高导致 CI 阻塞 | 低 | 中 | 从 50% 基线起步，每 sprint +5% |
| R6 | E2E 测试 CI 环境 flaky | 中 | 中 | 使用 Playwright 条件等待替代 waitForTimeout |

---

*Product Manager | VibeX Reviewer Proposals PRD | 2026-04-02*

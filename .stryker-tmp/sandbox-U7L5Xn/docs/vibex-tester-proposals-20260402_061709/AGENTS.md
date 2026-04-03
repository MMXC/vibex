# VibeX 测试改进 — Agent 执行约束

**文档版本**: v1.0
**编写日期**: 2026-04-02
**编写角色**: Architect
**项目**: vibex-tester-proposals-20260402_061709

---

## 目录

1. [Epic 1 — 修复测试阻塞问题](#1-epic-1--修复测试阻塞问题)
2. [Epic 2 — 建立 Playwright E2E 基础](#2-epic-2--建立-playwright-e2e-基础)
3. [Epic 3 — 视觉回归 + 用户旅程](#3-epic-3--视觉回归--用户旅程)
4. [通用约束（所有 Epic）](#4-通用约束所有-epic)

---

## 1. Epic 1 — 修复测试阻塞问题

### 1.1 Dev 约束

#### ✅ DO（必须做）

| ID | 约束 | 理由 |
|----|------|------|
| D1.1 | 修改 `jest.config.ts` 的 `moduleNameMapper` 确保 `'^@/(.*)$': '<rootDir>/src/$1'` | 确保 `@/lib/canvas/canvasStore` 在测试中正确解析 |
| D1.2 | 修改 `vibex-fronted/BoundedContextTree.test.tsx` 添加 E1 测试用例 | 验证 checkbox 数量为 1 |
| D1.3 | 修改 `vibex-fronted/ComponentTree.test.tsx` 添加 E2 测试用例 | 验证 checkbox 在 `.node-item` 内 |
| D1.4 | 更新 `AGENTS.md` 的 DoD 部分，增加测试同步约束 | 从流程上保证测试同步率 |
| D1.5 | 修改 `package.json` scripts 分离快慢套件 | `test:unit` <60s，`test:e2e` 独立运行 |
| D1.6 | 每个测试文件修改后执行 `npm run test -- --testPathPattern="<file>"` 验证 | 确保修改不破坏现有测试 |

#### ❌ DON'T（禁止做）

| ID | 约束 | 理由 |
|----|------|------|
| X1.1 | 不要迁移到 Vitest | 项目已用 Jest，迁移成本高且收益低（见 ADR-001）|
| X1.2 | 不要删除现有测试文件 | 只增不改，保留原有测试覆盖 |
| X1.3 | 不要修改 `jest.setup.ts` / `jest.setup.js` | 除非 S2.7 Zustand fixture 需要 |
| X1.4 | 不要将所有测试文件迁移到 `tests/` 目录 | 保持 `src/__tests__/` 和 `src/components/*/__tests__/` 的就近原则 |

---

### 1.2 Reviewer 约束

#### 🔍 Review Focus Areas（重点审查）

1. **E1/E2 测试断言是否可执行**
   - 必须使用 `expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` 而非注释描述
   - 必须包含具体 `expect` 断言，拒绝只有 `it()` 描述的占位测试

2. **快慢套件分离是否正确**
   - `testPathIgnorePatterns` 是否正确排除 e2e 和 heavy 测试
   - `npm run test:unit` 时间是否 <60s

3. **DoD 更新是否完整**
   - AGENTS.md DoD 必须包含 "测试文件与实现同步更新"
   - 不得使用模糊描述（如 "测试覆盖" 而非具体断言）

4. **Jest alias 是否正确**
   - `'^@/(.*)$': '<rootDir>/src/$1'` 必须存在
   - 不得使用相对路径（如 `'@/lib/canvas/canvasStore'` 写死为 `'./src/lib/canvas/canvasStore'`）

#### 🚫 Rejection Criteria（驳回标准）

满足以下任一条件，Reviewer 必须驳回 PR：

- [ ] E1/E2 测试用例存在但无 `expect` 断言
- [ ] `npm run test:unit` 退出码非 0
- [ ] AGENTS.md DoD 未包含测试同步约束
- [ ] `npm run test:unit` 时间 >60s 且无明确优化计划
- [ ] 新增测试破坏现有测试（覆盖率下降）

---

### 1.3 Tester 约束

#### 🧪 Test Cases（必须覆盖）

| ID | 测试用例 | 输入 | 预期输出 | 验证方式 |
|----|---------|------|---------|---------|
| TC1.1 | E1: checkbox 数量验证 | `BoundedContextTree` 渲染 | `checkbox.length === 1` | `screen.queryAllByRole('checkbox').length === 1` |
| TC1.2 | E2: checkbox 位置验证 | `ComponentTree` 渲染 | checkbox 在 `.node-item` 内 | `container.querySelector('.node-item .checkbox') !== null` |
| TC1.3 | DoD 测试同步验证 | PR checklist | 包含测试相关检查项 | checklist 中有 "测试准备" 项 |

#### ✅ Acceptance Criteria（通过标准）

- [ ] `npm run test -- --testPathPattern="BoundedContextTree"` PASS
- [ ] `npm run test -- --testPathPattern="ComponentTree"` PASS
- [ ] E1/E2 测试断言可执行，Reviewer 可直接运行验证
- [ ] AGENTS.md DoD 已更新

---

## 2. Epic 2 — 建立 Playwright E2E 基础

### 2.1 Dev 约束

#### ✅ DO（必须做）

| ID | 约束 | 理由 |
|----|------|------|
| D2.1 | 修改 `playwright-canvas-crash-test.config.cjs` 确保 projects 仅含 chromium | macOS Safari/WebKit CI 不稳定（见 ADR-002）|
| D2.2 | 创建 `tests/fixtures/canvasStore.fixture.ts` Zustand fixture 库 | 替代重 mock，提升可维护性 |
| D2.3 | 创建 `.github/workflows/e2e.yml` 集成 E2E 到 CI | 确保每次 PR 运行 E2E |
| D2.4 | E2E 测试必须等待 `page.waitForLoadState('networkidle')` 后再断言 | 避免竞态条件导致的 flaky |
| D2.5 | E2E 测试添加 `timeout: 10_000` 或更长到关键断言 | CI 环境下网络延迟更高 |
| D2.6 | `npx playwright install chromium` 在 CI workflow 中显式执行 | 确保 CI 环境有 chromium binary |

#### ❌ DON'T（禁止做）

| ID | 约束 | 理由 |
|----|------|------|
| X2.1 | 不要添加 `@firefox` / `@webkit` 到 projects 配置 | 违反 Chromium Only 决策 |
| X2.2 | 不要使用 `page.goto()` 后直接断言（无 waitForLoadState）| 竞态条件导致 flaky |
| X2.3 | 不要在 E2E 测试中 mock canvasStore | E2E 必须测试真实组件交互 |
| X2.4 | 不要将 E2E 测试文件命名为 `.test.ts` | E2E 必须使用 `.spec.ts` 命名，与 Jest 单元测试区分 |
| X2.5 | 不要修改现有 `jest.config.ts` 中的 `testPathIgnorePatterns` 移除 `/tests/e2e/` | E2E 测试不得被 Jest 捕获 |

---

### 2.2 Reviewer 约束

#### 🔍 Review Focus Areas（重点审查）

1. **Playwright 配置正确性**
   - `projects` 仅含 chromium
   - `workers: 1`（避免 canvas 状态竞争）
   - `retries: 1`（CI 环境容错）

2. **E2E 测试稳定性**
   - 是否有 `waitForLoadState('networkidle')`
   - 关键断言是否有 timeout
   - 选择器是否稳定（避免 XPath 动态路径）

3. **CI workflow 完整性**
   - 是否包含 `npx playwright install chromium`
   - dev server 是否有足够 wait time（建议 ≥20s）
   - 是否上传 test-results artifact

4. **canvasStore fixture 质量**
   - fixture 是否有 `beforeEach`/`afterEach` 清理
   - 是否兼容现有所有 canvasStore 测试

#### 🚫 Rejection Criteria（驳回标准）

满足以下任一条件，Reviewer 必须驳回 PR：

- [ ] `npx playwright test` 在本地失败
- [ ] projects 配置包含 chromium 以外的浏览器
- [ ] E2E 测试有 flaky 选择器（动态 class、nth() 裸用无 timeout）
- [ ] CI workflow 缺少 `playwright install` 步骤
- [ ] fixture 未正确清理状态（afterEach 缺失）

---

### 2.3 Tester 约束

#### 🧪 Test Cases（必须覆盖）

| ID | 测试用例 | 步骤 | 预期输出 | 验收标准 |
|----|---------|------|---------|---------|
| T1 | 三棵树加载验证 | 打开 `/canvas` → 等待 networkidle | 三棵树均 `isVisible()` | `expect(page.locator('.context-tree')).toBeVisible()` 通过 |
| T2 | 节点单选 checkbox | 打开 `/canvas` → 点击 `.node-item` | `checkbox.checked` 数量为 1 | `expect(page.locator('.checkbox.checked')).toHaveCount(1)` |
| T3 | isActive 确认反馈 | 选择节点 → 点击 `.confirm-btn` | `.node-item.active` 含 `isActive` class | `expect(page.locator('.node-item.active')).toHaveClass(/isActive/)` |
| T4 | 黄色边框移除 | 打开 `/canvas` → 点击 `.style-change-btn` | `.node-item` 不含 `yellow-border` class | `expect(node).not.toHaveClass(/yellow-border/)` |
| TC2.1 | Fixture 兼容性 | 运行现有 BoundedContextTree 测试 | 所有测试 PASS | `npm run test -- --testPathPattern="BoundedContextTree"` |

#### ✅ Acceptance Criteria（通过标准）

- [ ] T1/T2/T3/T4 四个 E2E 测试全部 PASS
- [ ] `npx playwright test` 在本地通过（chromium only）
- [ ] CI E2E 测试通过（GitHub Actions 日志验证）
- [ ] E2E flaky rate <5%（连续 3 次 CI run 统计）
- [ ] canvasStore fixture 不破坏现有测试

---

## 3. Epic 3 — 视觉回归 + 用户旅程

### 3.1 Dev 约束

#### ✅ DO（必须做）

| ID | 约束 | 理由 |
|----|------|------|
| D3.1 | 创建 `tests/visual-baselines/` 目录并纳入 git lfs | 管理大文件 PNG |
| D3.2 | 安装 `pixelmatch` 和 `pngjs` 依赖 | 视觉回归对比引擎 |
| D3.3 | 创建 `tests/update-baselines.ts` baseline 更新脚本 | 简化 baseline 维护 |
| D3.4 | `tsconfig.json` 开启 `strict: true` | 组件状态命名一致性 |
| D3.5 | 创建 `docs/testing/component-state-naming.md` 命名规范文档 | 指导命名决策 |
| D3.6 | 创建 `commitlint.config.js` 并配置 husky hook | 强制 commit message 格式 |

#### ❌ DON'T（禁止做）

| ID | 约束 | 理由 |
|----|------|------|
| X3.1 | 不要对动态内容（时间戳、随机 ID）页面做视觉回归 | 必然失败，浪费 CI 时间 |
| X3.2 | 不要设置 pixelmatch threshold > 0.1 | 容忍度过高会漏掉真实 UI 退化 |
| X3.3 | 不要在视觉回归测试中对整个页面截图 | 仅对关键面板截图，减少误报 |
| X3.4 | 不要强制所有测试通过而不修复问题 | 视觉回归失败表示真实 UI 变更，需要 review |
| X3.5 | 不要在 commitlint 中关闭 `type-enum` 规则 | conventional commits 是团队约定 |

---

### 3.2 Reviewer 约束

#### 🔍 Review Focus Areas（重点审查）

1. **视觉回归配置合理性**
   - 关键页面清单是否合理（4 张：Canvas 首页、ContextTree、ComponentTree、设计系统）
   - threshold 是否 ≤0.1
   - 是否对静态面板而非整页截图

2. **用户旅程测试完整性**
   - 是否覆盖完整流程（创建项目 → 添加上下文 → 生成 → 导出）
   - 断言是否具体（组件树节点数 >0，`.export-success` 可见）
   - 是否有 JS error 检测（`page.on('console')`）

3. **TS strict 变更影响评估**
   - `npx tsc --noEmit` 失败数是否可控（<20 个文件需修改）
   - 是否只修改类型错误，不改变运行时行为

4. **Commitlint 配置正确性**
   - 是否 extends `@commitlint/config-conventional`
   - husky hook 路径是否正确

#### 🚫 Rejection Criteria（驳回标准）

满足以下任一条件，Reviewer 必须驳回 PR：

- [ ] 视觉回归测试无 baseline 快照（首次运行未生成 PNG）
- [ ] pixelmatch threshold > 0.1
- [ ] 用户旅程测试有 `// TODO` / `test.skip()` 未解决
- [ ] `npx tsc --noEmit` 有 >20 个 strict 错误
- [ ] commitlint 配置缺少 `extends: ['@commitlint/config-conventional']`

---

### 3.3 Tester 约束

#### 🧪 Test Cases（必须覆盖）

| ID | 测试用例 | 步骤 | 预期输出 | 验收标准 |
|----|---------|------|---------|---------|
| V1 | Canvas 首页视觉回归 | 截图 → pixelmatch 对比 | diff ratio < 1% | `expect(diffRatio).toBeLessThan(0.01)` |
| V2 | ContextTree 面板视觉回归 | 截图 → pixelmatch 对比 | diff ratio < 1% | 同上 |
| V3 | ComponentTree 面板视觉回归 | 截图 → pixelmatch 对比 | diff ratio < 1% | 同上 |
| V4 | 设计系统组件视觉回归 | 截图 → pixelmatch 对比 | diff ratio < 1% | 同上 |
| UJ1 | 创建项目 → 添加限界上下文 | 新项目 → 填名 → 提交 → 添加上下文 | 上下文数量为 1 | `expect(page.locator('.bounded-context')).toHaveCount(1)` |
| UJ2 | 生成组件树 → 导出代码 | 生成 → 等待节点 → 导出 | 导出成功弹窗可见 | `expect(page.locator('.export-success')).toBeVisible()` |
| CL1 | Commit message lint | commit 后运行 commitlint | PASS | `npx commitlint --from HEAD~1 --to HEAD` 退出码 0 |

#### ✅ Acceptance Criteria（通过标准）

- [ ] V1/V2/V3/V4 四个视觉回归测试全部 PASS（或正确生成 baseline）
- [ ] UJ1 用户旅程测试 PASS
- [ ] UJ2 用户旅程测试 PASS
- [ ] `npx tsc --noEmit` 退出码 0（或已知文件列表 <20 个错误）
- [ ] `commitlint` 配置正确，CI 检查生效

---

## 4. 通用约束（所有 Epic）

### 4.1 所有 Agent 必须遵守

| ID | 约束 |
|----|------|
| G1 | 工作目录：`cd /root/.openclaw/vibex/vibex-fronted` 执行所有前端命令 |
| G2 | 每个文件修改后执行对应测试验证 |
| G3 | PR commit message 符合 conventional commits（`feat:` / `fix:` / `refactor:` 等）|
| G4 | 不要修改 `package.json` 的 lock 文件或手动编辑 pnpm-lock.yaml |
| G5 | 每次提交前运行 `pnpm lint` 确保代码风格正确 |
| G6 | 不要在测试文件中使用 `// @ts-ignore` / `// @ts-expect-error` 掩盖类型错误 |

### 4.2 文件变更清单

| 文件路径 | 操作 | Epic | 优先级 |
|---------|------|------|-------|
| `vibex-fronted/jest.config.ts` | 修改 | S1.4 | P1 |
| `vibex-fronted/src/components/canvas/BoundedContextTree.test.tsx` | 修改 | S1.2 | P0 |
| `vibex-fronted/src/components/canvas/ComponentTree.test.tsx` | 修改 | S1.2 | P0 |
| `AGENTS.md` | 修改 | S1.3 | P1 |
| `vibex-fronted/package.json` | 修改 | S1.4 / S3.6 | P1 |
| `vibex-fronted/playwright-canvas-crash-test.config.cjs` | 修改 | S2.1 | P1 |
| `vibex-fronted/tests/e2e/canvas-tree-load.spec.ts` | 新增 | S2.2 | P1 |
| `vibex-fronted/tests/e2e/canvas-node-select.spec.ts` | 新增 | S2.3 | P1 |
| `vibex-fronted/tests/e2e/canvas-node-confirm.spec.ts` | 新增 | S2.4 | P1 |
| `vibex-fronted/tests/e2e/canvas-style-change.spec.ts` | 新增 | S2.5 | P1 |
| `vibex-fronted/tests/fixtures/canvasStore.fixture.ts` | 新增 | S2.7 | P1 |
| `.github/workflows/e2e.yml` | 新增 | S2.6 | P1 |
| `vibex-fronted/tests/visual-baselines/` | 新增目录 | S3.2 | P2 |
| `vibex-fronted/tests/visual/canvas-visual.spec.ts` | 新增 | S3.1 | P2 |
| `vibex-fronted/tests/e2e/user-journey-create-project.spec.ts` | 新增 | S3.3 | P2 |
| `vibex-fronted/tests/e2e/user-journey-generate-export.spec.ts` | 新增 | S3.4 | P2 |
| `vibex-fronted/tsconfig.json` | 修改 | S3.5 | P2 |
| `commitlint.config.js` | 新增 | S3.6 | P2 |
| `docs/testing/component-state-naming.md` | 新增 | S3.5 | P2 |
| `vibex-fronted/tests/update-baselines.ts` | 新增 | S3.2 | P2 |

### 4.3 测试分层验收

```
Phase 1 完成 → Dev 自测 → Reviewer Review → 合并
     ↓
Phase 2 完成 → Dev 自测 → Reviewer Review → Tester E2E 验证 → 合并
     ↓
Phase 3 完成 → Dev 自测 → Reviewer Review → Tester 全量验证 → 合并
```

---

_Agent 执行约束完成。产出物：vibex-tester-proposals-20260402_061709/AGENTS.md_

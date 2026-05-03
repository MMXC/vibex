# VibeX Sprint 24 PRD

**Agent**: PM
**日期**: 2026-05-03
**项目**: vibex-proposals-sprint24
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 完成 Sprint 1-23，已交付核心 Canvas 编辑、Design Review、Firebase Presence、模板库、E2E CI 等能力。Analyst Sprint 24 审查（gstack 验证）识别出 5 个待处理项：E2E Slack 配置验证收尾、TypeScript 债务确认、新手引导流程（Onboarding）、API 模块测试补全、跨 Canvas 版本对比。

### 目标

Sprint 24 落地以下改进：
- P001: 验证 E2E Slack Webhook 配置，CI 报告链路 100% 打通
- P002: 全面审计 TypeScript 编译状态，清除剩余 TS 债务
- P003: 为新用户提供 5 步 Onboarding 引导，降低首次使用摩擦
- P004: 为 auth/project/canvas 模块补充 Vitest 单元测试，覆盖率目标 ≥ 60%
- P005: 支持跨 Canvas 版本对比，支持迭代回顾和需求变更追踪

### 成功指标

| 指标 | 目标 |
|------|------|
| P001: Slack 报告覆盖率 | 100%（每次 CI run 均推送，webhook 配置验证通过） |
| P002: TS 编译状态 | 前端 0 errors，后端已识别待修复清单 |
| P003: Onboarding 完成率 | 新用户首次引导完成率 > 60% |
| P004: API 测试覆盖率 | auth + project 模块覆盖率 ≥ 60%，新增 ≥ 20 个测试用例 |
| P005: 跨 Canvas diff | diff 视图可用，报告可导出 JSON |
| P001-P005 全部 | `pnpm run build` → 0 errors |

---

## 2. Epic 拆分

### Epic E1: E2E Slack 配置验证收尾（P001）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S1.1 | GitHub repo secrets 配置验证 | 0.5h | P1 | 待验证 |
| S1.2 | Webhook dry-run 验证脚本 | 0.5h | P1 | 待开发 |

**技术方案**: 方案 A — Webhook 配置验证。在 CI workflow 添加 webhook dry-run step，确认 SLACK_WEBHOOK_URL 已正确配置并可响应。降级兜底：webhook 不可用时 Slack 消息标注"webhook 未配置"，不影响 CI exit code。

---

### Epic E2: TypeScript 债务确认（P002）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S2.1 | 前端 TS 全面审计（已清零验证） | 0.5h | P1 | 已知 0 errors |
| S2.2 | 后端/mcp-server TS 状态审计 | 0.5h | P1 | 待验证 |
| S2.3 | CI typecheck job 稳定性验证 | 0.5h | P1 | 待验证 |

**技术方案**: 方案 B — 重新评估范围。前端 TS 已清零，重点审计后端/mcp-server TS 状态。如果后端 0 errors，P002 降为"验证性"提案。

---

### Epic E3: Onboarding 新手引导（P003）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S3.1 | Onboarding store + localStorage flag | 1h | P1 | 新增 |
| S3.2 | 5 步引导 Overlay 组件 | 2h | P1 | 新增 |
| S3.3 | 引导内容填充（创建→添加→生成→导出→完成） | 1h | P1 | 新增 |
| S3.4 | 跳过/完成 flag 持久化 | 0.5h | P1 | 新增 |

**技术方案**: 方案 A — 轻量 Overlay。在 NewProjectModal 完成后首次打开 Canvas 时显示 5 步引导，每个步骤有 skip 按钮。完成或跳过记录到 localStorage。已跳过用户不再展示。

---

### Epic E4: API 模块测试补全（P004）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S4.1 | auth.test.ts（login/logout/refresh token） | 1人日 | P1 | 新增 |
| S4.2 | project.test.ts（CRUD/list/search） | 1人日 | P1 | 新增 |
| S4.3 | Canvas API endpoints 测试 | 1人日 | P2 | 新增 |
| S4.4 | CI quality gate 配置（覆盖率 ≥ 60%） | 0.5h | P1 | 新增 |

**技术方案**: 方案 A — MSW + Vitest。复用 S13 已完成的 MSW handlers（S13 FR-013），为 auth/project/canvas 模块编写 Vitest 单元测试。覆盖率目标 ≥ 60%，新增 ≥ 20 个测试用例。

---

### Epic E5: 跨 Canvas 版本对比（P005）

| Story ID | 描述 | 工时 | 优先级 | 状态 |
|----------|------|------|--------|------|
| S5.1 | 跨 Canvas 选择器（选择两个 Canvas） | 1h | P1 | 新增 |
| S5.2 | compareCanvasProjects diff 算法 | 2h | P1 | 新增 |
| S5.3 | diff 视图（新增红/移除绿/修改黄） | 1h | P1 | 新增 |
| S5.4 | diff 报告 JSON 导出 | 0.5h | P1 | 新增 |

**技术方案**: 方案 A — JSON Diff Service。基于 S23 E2 reviewDiff.ts 的 diff 算法，新增 `compareCanvasProjects(A, B)` 函数，比较两个 Canvas 的 requirement chapter JSON 结构。diff 降级为 JSON 结构 diff，不做语义对比。

---

## 3. 功能点详细规格

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Webhook 配置验证 | GitHub secrets 中 SLACK_WEBHOOK_URL 已配置且可响应 | expect(webhookResponse).toBe(200) | 【需 CI 配置】 |
| F1.2 | Webhook dry-run | CI workflow 中有 dry-run 验证 step | expect(workflowYml).toContain('curl.*SLACK_WEBHOOK_URL') | 【需 CI 配置】 |
| F2.1 | 前端 TS 零错误 | vibex-fronted `tsc --noEmit` → 0 errors | expect(tscFrontend.errors).toBe(0) | 【无需页面集成】 |
| F2.2 | 后端 TS 状态审计 | 后端/mcp-server TS 错误已识别清单 | expect(backendTSC.errors).toBeDefined() | 【无需页面集成】 |
| F3.1 | Onboarding overlay | 首次登录用户看到 5 步引导（可跳过） | expect(screen.getByTestId('onboarding-overlay')).toBeVisible() | 【需页面集成】 |
| F3.2 | 引导 skip 功能 | 跳过后 localStorage flag 正确 | expect(localStorage.getItem('onboarding_skipped')).toBe('true') | 【需页面集成】 |
| F3.3 | 引导完成 flag | 完成引导后不再展示 | expect(localStorage.getItem('onboarding_completed')).toBe('true') | 【需页面集成】 |
| F4.1 | auth.test.ts | 覆盖 login/logout/refresh，覆盖率 ≥ 60% | expect(authCoverage).toBeGreaterThanOrEqual(60) | 【无需页面集成】 |
| F4.2 | project.test.ts | 覆盖 CRUD/list/search，覆盖率 ≥ 60% | expect(projectCoverage).toBeGreaterThanOrEqual(60) | 【无需页面集成】 |
| F4.3 | CI quality gate | 覆盖率 < 60% 时 CI 失败 | expect(coverage).toBeGreaterThanOrEqual(60) | 【无需页面集成】 |
| F5.1 | 跨 Canvas 选择器 | 用户可选择两个 Canvas 进行对比 | expect(screen.getByTestId('canvas-diff-selector')).toBeVisible() | 【需页面集成】 |
| F5.2 | diff 算法 | 新增（红）/ 移除（绿）/ 修改（黄）节点 | expect(diffView.getByTestId('diff-item-added')).toHaveClass(/text-red/) | 【需页面集成】 |
| F5.3 | diff 报告导出 | diff 报告可导出 JSON 文件 | expect(screen.getByTestId('diff-export-btn')).toBeVisible() | 【需页面集成】 |

---

## 4. 验收标准（expect() 断言）

### E1 验收标准

```typescript
// S1.1: Webhook 配置验证
expect(existsSync('.github/workflows/test.yml')).toBe(true)
expect(readFileSync('.github/workflows/test.yml')).toContain('SLACK_WEBHOOK_URL')
// webhook dry-run（需真实配置验证）
// expect(curlDryRun.status).toBe(200)

// S1.2: Webhook dry-run step
expect(readFileSync('.github/workflows/test.yml')).toMatch(/curl.*SLACK_WEBHOOK_URL.*-d.*test/)
expect(readFileSync('.github/workflows/test.yml')).toContain('if: always()')
```

### E2 验收标准

```typescript
// S2.1: 前端 TS 零错误（已知）
// pnpm --filter vibex-fronted exec tsc --noEmit → 0 errors ✅

// S2.2: 后端 TS 审计
// pnpm --filter vibex-backend exec tsc --noEmit → N errors
// P002 范围重新评估：后端有错误则量化，无错误则 P002 降为验证性

// S2.3: CI typecheck job
expect(readFileSync('.github/workflows/test.yml')).toContain('tsc --noEmit')
```

### E3 验收标准

```typescript
// S3.1: Onboarding overlay
expect(screen.getByTestId('onboarding-overlay')).toBeVisible()
expect(screen.getByTestId('onboarding-step-1')).toBeVisible()

// S3.2: 引导步骤
expect(screen.getByTestId('onboarding-skip-btn')).toBeVisible()
expect(screen.getByTestId('onboarding-next-btn')).toBeVisible()
userEvent.click(screen.getByTestId('onboarding-skip-btn'))
expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument()
expect(localStorage.getItem('onboarding_skipped')).toBe('true')

// S3.3: 引导内容（5步）
expect(screen.getByText(/创建项目/)).toBeInTheDocument()     // step 1
expect(screen.getByText(/添加.*节点/)).toBeInTheDocument()    // step 2
expect(screen.getByText(/生成/)).toBeInTheDocument()         // step 3
expect(screen.getByText(/导出/)).toBeInTheDocument()         // step 4
expect(screen.getByText(/完成/)).toBeInTheDocument()         // step 5
```

### E4 验收标准

```typescript
// S4.1: auth.test.ts
expect(existsSync('src/services/api/modules/auth.test.ts')).toBe(true)
const authResult = vitest.run('src/services/api/modules/auth.test.ts')
expect(authResult.coverage).toBeGreaterThanOrEqual(60)
expect(authResult.tests).toBeGreaterThanOrEqual(5)

// S4.2: project.test.ts
expect(existsSync('src/services/api/modules/project.test.ts')).toBe(true)
const projectResult = vitest.run('src/services/api/modules/project.test.ts')
expect(projectResult.coverage).toBeGreaterThanOrEqual(60)
expect(projectResult.tests).toBeGreaterThanOrEqual(5)

// S4.3: Canvas API tests
expect(existsSync('src/services/api/modules/canvas.test.ts')).toBe(true)

// S4.4: CI quality gate
expect(readFileSync('.github/workflows/test.yml')).toContain('coverage')
expect(coverageThreshold).toBeGreaterThanOrEqual(60)
```

### E5 验收标准

```typescript
// S5.1: 跨 Canvas 选择器
expect(screen.getByTestId('canvas-diff-selector')).toBeVisible()
expect(screen.getByTestId('canvas-a-selector')).toBeVisible()
expect(screen.getByTestId('canvas-b-selector')).toBeVisible()

// S5.2: diff 视图
expect(screen.getByTestId('diff-view')).toBeInTheDocument()
expect(screen.getByTestId('diff-item-added')).toHaveClass(/text-red/)
expect(screen.getByTestId('diff-item-removed')).toHaveClass(/text-green/)
expect(screen.getByTestId('diff-item-changed')).toHaveClass(/text-yellow/)

// S5.3: diff 导出
expect(screen.getByTestId('diff-export-btn')).toBeVisible()
userEvent.click(screen.getByTestId('diff-export-btn'))
expect(downloadedFile.name).toMatch(/\.json$/)
```

---

## 5. Specs 目录引用

> 详细四态规格见 specs/ 目录：
> - `specs/01-p001-e2e-slack-validation.md`
> - `specs/02-p002-typescript-debt-confirm.md`
> - `specs/03-p003-onboarding-guide.md`
> - `specs/04-p004-api-module-tests.md`
> - `specs/05-p005-cross-canvas-diff.md`

---

## 6. 依赖关系图

```
E1: S1.1 ──▶ S1.2（串行）
E2: S2.1 → S2.2 → S2.3（可串行验证）
E3: S3.1 ──▶ S3.2 ──▶ S3.3 ──▶ S3.4（串行）
E4: S4.1 // S4.2 // S4.3（可并行）──▶ S4.4（串行）
E5: S5.1 ──▶ S5.2 ──▶ S5.3 ──▶ S5.4（串行）
```

**并行度**: E1 / E2 / E4 可并行（Week 1）；E3 / E5 可并行（Week 2）

---

## 7. 工时汇总

| Epic | 故事数 | 总工时 | 说明 |
|------|--------|--------|------|
| E1 | 2 | 1h | 配置验证，降级为维护项 |
| E2 | 3 | 1.5h | 审计为主，范围可能进一步降级 |
| E3 | 4 | 4.5h | Onboarding overlay 新开发 |
| E4 | 4 | 2.5人日 | MSW + Vitest，2-3人并行 |
| E5 | 4 | 4.5h | diff 算法 + 视图新开发 |
| **合计** | **17** | **1 + 1.5 + 4.5 + 2.5人日 + 4.5h** | |

---

## 8. DoD (Definition of Done)

### E1 DoD
- [ ] GitHub repo secrets 中 `SLACK_WEBHOOK_URL` 已配置且 dry-run 通过
- [ ] CI workflow 包含 webhook 验证 step（curl dry-run）
- [ ] `postToSlack()` 永不抛出，CI exit code 与 E2E 结果一致
- [ ] `pnpm run build` → 0 errors

### E2 DoD
- [ ] `pnpm --filter vibex-fronted exec tsc --noEmit` → 0 errors（已知）
- [ ] `pnpm --filter vibex-backend exec tsc --noEmit` → 错误清单已量化
- [ ] CI typecheck job 稳定性已验证
- [ ] `pnpm run build` → 0 errors

### E3 DoD
- [ ] 首次登录用户看到 5 步 Onboarding overlay（可跳过）
- [ ] `data-testid="onboarding-overlay"` 存在
- [ ] `data-testid="onboarding-skip-btn"` 存在
- [ ] 跳过后 `onboarding_skipped` flag 写入 localStorage
- [ ] 完成引导后 `onboarding_completed` flag 写入 localStorage
- [ ] 已跳过/已完成用户不再展示引导（空状态降级）
- [ ] `pnpm run build` → 0 errors

### E4 DoD
- [ ] `src/services/api/modules/auth.test.ts` 存在，覆盖率 ≥ 60%，≥ 5 个测试用例
- [ ] `src/services/api/modules/project.test.ts` 存在，覆盖率 ≥ 60%，≥ 5 个测试用例
- [ ] Canvas API endpoints 有 Vitest 测试用例
- [ ] 新增测试用例总数 ≥ 20
- [ ] CI 配置覆盖率 threshold ≥ 60%
- [ ] `pnpm run build` → 0 errors

### E5 DoD
- [ ] 跨 Canvas diff 页面/区域存在（`data-testid="canvas-diff-selector"`）
- [ ] 用户可选择两个 Canvas 进行对比
- [ ] DiffView 显示新增（红）/ 移除（绿）/ 修改（黄）节点
- [ ] diff 报告可导出 JSON（`data-testid="diff-export-btn"`）
- [ ] 首次选择时 diff 区域显示引导文案"请选择要对比的第二个 Canvas 项目"
- [ ] `pnpm run build` → 0 errors

---

## 9. 识别的问题

| 问题 | Epic | 影响 | 行动 |
|------|------|------|------|
| P002 范围需重新评估 | E2 | 中 | Coord 确认后端 TS 范围，P002 可能降级为验证性 |
| P005 数据层设计 | E5 | 中 | Architect 确认跨 Canvas diff 数据层方案 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint24
- **执行日期**: 2026-05-03

---

*生成时间: 2026-05-03 09:07 GMT+8*
*PM Agent | VibeX Sprint 24 PRD*
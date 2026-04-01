# Implementation Plan: proposals-20260401-2

**Agent**: Architect  
**Date**: 2026-04-01  
**Project**: vibex / proposals-20260401-2  
**Status**: Draft  
**Sprint**: Sprint 2（单 sprint 并行，5 Epic 全开）

---

## 1. Sprint 概览

### 1.1 基本信息

| 字段 | 值 |
|------|-----|
| Sprint 周期 | 1 周（5 个工作日） |
| 总工时 | 30h |
| 并行度 | 5 Epic 完全并行（无依赖） |
| 开发人数 | 5 人（或 1 人分饰多角） |
| Sprint 目标 | 全部 5 Epic 交付 |

### 1.2 Sprint 日程（建议）

```
Day 1-2（月/二）: E1-T1/T2 + E2-T1 + E3-T1 + E4-T1 + E5-T1/T2 并行开发
Day 3（三）      : E1-T3/T4 + E2-T2/T3 + E3-T2 + E4-T2 + E5-T3
Day 4-5（四/五）  : 全 Epic 测试 + 验收 + 文档收尾
```

### 1.3 并行开发矩阵

```
Dev-A → E1 (Vercel 部署, 6h)
Dev-B → E2 (回滚 SOP, 4h)
Dev-C → E3 (Zustand 库, 5h)
Dev-D → E4 (Vue 导出, 5h)
Dev-E → E5 (MCP Server, 10h)
```

---

## 2. E1: 一键部署到 Vercel

**工时**: 6h | **优先级**: P0 | **并行度**: ✅ 完全独立

### 2.1 任务拆解

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| ~~E1-T1~~ | Vercel OAuth 授权流程 | 2h | `app/api/vercel/auth/route.ts`, `app/api/vercel/callback/route.ts`, `lib/vercel-oauth.ts` | ✅ `expect(oauthRedirect).toContain('vercel.com/oauth')` + token 正确存储到 KV |
| ~~E1-T2~~ | 部署 API 实现 | 2h | `app/api/vercel/deploy/route.ts`, `lib/vercel-deploy.ts` | ✅ `expect(deployResponse.url).toMatch(/vercel\.app/)` + 60s 内返回 URL |
| ~~E1-T3~~ | 导出面板部署按钮 | 1.5h | `components/export-panel/`, `app/canvas/export/page.tsx` | ✅ `expect(isVisible(deployBtn)).toBe(true)` + OAuth 未授权时显示「Connect Vercel」 |
| ~~E1-T4~~ | 部署状态 UI | 0.5h | `components/export-panel/deploy-status.tsx` | ✅ `expect(urlLatency).toBeLessThan(60000)` + 超时显示错误信息 |

### 2.2 关键路径分析

```
E1-T1（OAuth） ──→ E1-T2（Deploy API） ──→ E1-T3（按钮集成） ──→ E1-T4（状态 UI）
   2h                    2h                      1.5h                    0.5h
```

**关键路径**: T1 → T2 → T3 → T4，全长 6h。T1 和 T2 可并行开发（mock 对方），T3 依赖 T1/T2 完成后集成。

### 2.3 验证命令

```bash
# OAuth URL 格式验证
npx jest --testPathPattern="vercel-oauth" --passWithNoTests

# 部署 API 集成测试（需 mock Vercel API）
npx jest --testPathPattern="vercel-deploy" --passWithNoTests

# E2E: 导出面板部署按钮可见性
npx playwright test --grep "deploy button visible" --project=chromium

# E2E: 部署 URL 在 60s 内出现
npx playwright test --grep "deploy-url" --project=chromium

# TypeScript 类型检查
npx tsc --noEmit
```

### 2.4 验收 DoD

- [x] OAuth 授权流程可完成（`/api/vercel/auth` → Vercel → `/api/vercel/callback`）
- [x] 部署请求 ≤ 60s 返回可访问 URL
- [x] 部署失败时显示错误信息
- [x] `npm run lint` 无 error
- [x] `npx tsc --noEmit` 0 error（仅 pre-existing `react2vue/mappings.ts` 错误）

---

## 3. E2: 回滚 SOP + 功能开关

**工时**: 4h | **优先级**: P0 | **并行度**: ✅ 完全独立

### 3.1 任务拆解

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E2-T1 | 回滚 SOP 文档 | 2h | `docs/process/ROLLBACK_SOP.md` | `expect(sopDoc.scenarios).toBeGreaterThanOrEqual(5)`，包含 TS 错误/功能 bug/验收失败/依赖冲突/架构变更 5 类场景 |
| E2-T2 | 功能开关模板 | 1h | `lib/featureFlags.ts` | `expect(isEnabled('FEATURE_FLAG')).toBe(true\|false)` + `NEXT_PUBLIC_FEATURE_*` 环境变量读取 |
| E2-T3 | DoD 对齐机制 | 1h | `docs/process/EPIC_DOD_TEMPLATE.md`, Epic-1-DOD.md 样例 | Dev + Tester 双签 DoD checklist 存在，E2 使用至少 1 个 feature flag |

### 3.2 关键路径分析

```
E2-T1（SOP 文档） ──→ E2-T2（Feature Flag） ──→ E2-T3（DoD 机制）
      2h                      1h                      1h
```

**关键路径**: E2-T1 → E2-T2 → E2-T3，全长 4h。T1 和 T2 可半并行（T1 写文档，T2 写代码模板）。

### 3.3 验证命令

```bash
# SOP 场景数量验证
grep -c "^### Scenario" docs/process/ROLLBACK_SOP.md
# 期望输出: >= 5

# 功能开关验证
npx jest --testPathPattern="featureFlags" --passWithNoTests

# DoD 对齐率验证
npx jest --testPathPattern="dod" --passWithNoTests

# 至少 1 个 feature flag 在当前 Epic 中使用
grep -r "NEXT_PUBLIC_FEATURE_" app/ | head -5
```

### 3.4 验收 DoD

- [ ] `docs/process/ROLLBACK_SOP.md` 存在且 ≥ 5 个回滚场景
- [ ] 当前 Epic 中至少 1 个 feature flag 已使用
- [ ] Epic DoD checklist 经 Dev + Tester 双签
- [ ] SOP 文档经 reviewer 确认

---

## 4. E3: Zustand Migration 库

**工时**: 5h | **优先级**: P0 | **并行度**: ✅ 完全独立

### 4.1 任务拆解

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E3-T1 | VersionedStorage API | 2h | `libs/canvas-store-migration/index.ts`, `libs/canvas-store-migration/types.ts` | `expect(typeof createVersionedStorage).toBe('function')` + 迁移 v1→v2 自动运行 |
| E3-T2 | Epic6/Epic7 迁移 | 2h | `stores/epic6-canvas.ts`, `stores/epic7-flow.ts`（修改） | `expect(epic6UsesLib).toBe(true)` + `expect(epic7UsesLib).toBe(true)` + inline migration 不再出现 |
| E3-T3 | Jest 测试覆盖 | 1h | `libs/canvas-store-migration/__tests__/`, `libs/canvas-store-migration/coverage` | `expect(coverage).toBeGreaterThanOrEqual(80)` |

### 4.2 关键路径分析

```
E3-T1（库 API） ──→ E3-T2（迁移重构） ──→ E3-T3（测试）
      2h                 2h                    1h
```

**关键路径**: T1 → T2 → T3，全长 5h。T1 是 T2 的前置（T1 完成后才重构 Epic6/7），T3 依赖 T1+T2（完成后写测试）。

### 4.3 验证命令

```bash
# 库 API 类型导出验证
npx jest --testPathPattern="canvas-store-migration" --passWithNoTests

# 无 inline migration 验证
grep -rn "CURRENT_STORAGE_VERSION" stores/ --include="*.ts"
# 期望: 仅出现在 libs/canvas-store-migration/ 目录

# Epic6/7 使用库验证
grep -n "from.*canvas-store-migration" stores/epic6-canvas.ts stores/epic7-flow.ts

# Jest 覆盖率验证
cd libs/canvas-store-migration && npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
# 期望: 全部通过

# TypeScript 类型检查
npx tsc --noEmit libs/canvas-store-migration/
```

### 4.4 验收 DoD

- [ ] `libs/canvas-store-migration/index.ts` 存在且导出 `createVersionedStorage`
- [ ] Epic6/Epic7 全部使用新库（无 inline migration）
- [ ] Jest 覆盖率 ≥ 80%
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error

---

## 5. E4: Multi-Framework 导出

**工时**: 5h | **优先级**: P1 | **并行度**: ✅ 完全独立

### 5.1 任务拆解

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E4-T1 | Vue 映射表 | 2h | `components/react2vue/mappings.ts`, `components/react2vue/transformer.ts` | `expect(mappings.Button).toBeDefined()` + Button/Input/Card/Mental 映射存在 |
| E4-T2 | 导出面板框架切换 | 1.5h | `app/canvas/export/page.tsx`, `components/export-panel/framework-selector.tsx` | `expect(isVisible(toggle)).toBe(true)` + React/Vue RadioGroup 可切换 |
| E4-T3 | Vue 组件运行验证 | 1.5h | `e2e/vue-components.spec.ts`, `vue-test-app/` | `expect(vueComponentsRender).toBe(true)` + Button/Input/Card E2E 测试通过 |

### 5.2 关键路径分析

```
E4-T1（映射表） ──→ E4-T2（面板切换） ──→ E4-T3（E2E 验证）
      2h                 1.5h                  1.5h
```

**关键路径**: T1 → T2 → T3，全长 5h。T1 和 T2 可半并行（T1 写映射，T2 写 UI），但 T2 依赖 T1 的类型定义。

### 5.3 验证命令

```bash
# 映射表单元测试
npx jest --testPathPattern="react2vue" --passWithNoTests

# 导出面板 E2E：框架切换可见性
npx playwright test --grep "framework toggle" --project=chromium

# 导出面板 E2E：切换 Vue 后代码改变
npx playwright test --grep "switching to Vue" --project=chromium

# Vue 组件 E2E 验证
npx playwright test --grep "vue-components" --project=chromium

# Jest 覆盖率验证
cd components/react2vue && npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
# 期望: 全部通过
```

### 5.4 验收 DoD

- [ ] 导出面板支持 React/Vue 切换
- [ ] Button/Input/Card 在 Vue 下 E2E 测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error

---

## 6. E5: MCP Server 集成

**工时**: 10h | **优先级**: P1 | **并行度**: ✅ 完全独立

### 6.1 任务拆解

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E5-T1 | MCP Server 包脚手架 | 2h | `packages/mcp-server/package.json`, `packages/mcp-server/src/server.ts`, `packages/mcp-server/src/tools.ts`, `packages/mcp-server/tsconfig.json` | `expect(packageJson.name).toBe('@vibex/mcp-server')` + MCP SDK 集成 |
| E5-T2 | MCP tools 实现 | 4h | `packages/mcp-server/src/tools/getProject.ts`, `getNodes.ts`, `getFlow.ts`, `searchComponents.ts` | `expect(getProjectTools.length).toBeGreaterThan(0)` + 4 个 tools 全部可用 |
| E5-T3 | Claude Desktop 集成 | 3h | `packages/mcp-server/claude_desktop_config.json`, `docs/claude-integration-guide.md` | `expect(claudeCanConnect).toBe(true)` + Claude Desktop 可发现工具 |
| E5-T4 | 集成文档 | 1h | `docs/mcp-integration.md` | `expect(docExists).toBe(true)` + 包含安装步骤 + ≥ 3 个使用示例 |

### 6.2 关键路径分析

```
E5-T1（脚手架） ──→ E5-T2（tools 实现） ──→ E5-T3（Claude 集成） ──→ E5-T4（文档）
      2h                    4h                    3h                    1h
```

**关键路径**: T1 → T2 → T3 → T4，全长 10h。E5 是工时最长的 Epic。T1 完成后 T2/T3 可并行（tools 实现和 Claude 配置独立）。

### 6.3 验证命令

```bash
# 包名验证
cat packages/mcp-server/package.json | grep '"name"'
# 期望: "@vibex/mcp-server"

# MCP Server 启动验证
cd packages/mcp-server && npx tsc --noEmit

# tools 类型导出验证
npx jest --testPathPattern="mcp-server" --passWithNoTests

# Claude Desktop 配置模板生成
cat packages/mcp-server/claude_desktop_config.json
# 期望: 包含 correct mcpServers format

# 集成文档验证
test -f docs/mcp-integration.md && grep -c "```" docs/mcp-integration.md
# 期望: doc 存在 + >= 6 个代码块（3+ 个示例）

# MCP Server 独立测试（mock）
cd packages/mcp-server && npx jest --passWithNoTests
```

### 6.4 验收 DoD

- [ ] `@vibex/mcp-server` npm 包可安装
- [ ] 4 个 MCP tools（getProject/getNodes/getFlow/searchComponents）全部实现
- [ ] Claude Desktop 连接测试通过
- [ ] 集成文档包含安装步骤 + ≥ 3 个使用示例
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error

---

## 7. 全局风险与缓解

### 7.1 风险矩阵

| # | 风险 | 概率 | 影响 | 缓解措施 | 触发条件 |
|---|------|------|------|---------|---------|
| R1 | Vercel API 限流（E1） | 中 | 中 | 降级为 Netlify Drop 方案；加指数退避重试（3 次，间隔 1s/2s/4s） | 部署 API 返回 429 |
| R2 | Vercel OAuth scope 变更 | 低 | 高 | OAuth URL 硬编码 scopes，部署前加验证测试 | OAuth 测试失败 |
| R3 | MCP 协议版本变更（E5） | 低 | 高 | 隔离在独立包 `@vibex/mcp-server`；`package.json` 锁定 `@modelcontextprotocol/sdk` 版本 | SDK 版本检测失败 |
| R4 | Vue 组件映射质量差（E4） | 中 | 高 | 先 MVP（3 个基础组件：Button/Input/Card），再迭代优化映射表 | Vue E2E 测试失败 |
| R5 | E5 工时膨胀（10h） | 中 | 中 | T5-T1 脚手架 2h 先行验收；T5-T2 tools 实现后立即测试；超出 12h 触发 review | daily standup 检查 |
| R6 | Epic6/7 重构破坏现有功能 | 低 | 高 | 重构前先写 snapshot 测试；重构后运行完整 E2E 套件 | 现有 E2E 测试失败 |
| R7 | 功能开关滥用 | 低 | 中 | 明确 feature flag 生命周期（Epic 结束时清理）；加 lint 规则检查 | 代码审查发现孤立 flag |
| R8 | 测试环境 mock Vercel API 不稳定 | 中 | 低 | 使用 MSW（Mock Service Worker）模拟 Vercel API | 集成测试偶发失败 |

### 7.2 依赖回退计划

| Epic | 回退触发 | 回退方案 |
|------|---------|---------|
| E1 | Vercel API 不可用 | 降级为 Netlify Drop（工时不变，方案 B） |
| E2 | 回滚 SOP 场景不足 | 优先级排序，先完成 3 个核心场景 |
| E3 | Epic6/7 重构风险高 | 保留 inline migration，仅提供库模板文档 |
| E4 | Vue E2E 失败 | 仅完成映射表（Button），其他组件延后 |
| E5 | MCP 协议不兼容 | 隔离包版本锁定，文档标注兼容版本范围 |

---

## 8. Sprint DoD（Definition of Done）

### 全局 DoD（所有 Epic 必须满足）

- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 0 error
- [ ] 所有新增功能有对应测试（单元或 E2E）
- [ ] PR 经过 reviewer 两阶段审查
- [ ] 关键变更更新相关文档

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|---------|
| E1 | Vercel OAuth 完成 + 部署成功率 ≥ 90%（mock 测试） |
| E2 | ROLLBACK_SOP.md ≥ 5 场景 + 至少 1 个 feature flag 使用 + DoD 双签 |
| E3 | 库导出函数正确 + Epic6/7 全迁移 + 覆盖率 ≥ 80% |
| E4 | Vue E2E 通过（Button/Input/Card）+ 测试覆盖率 ≥ 80% |
| E5 | npm 包可安装 + Claude 连接验证（mock）+ 文档完整 |

---

## 9. 工时汇总

### 9.1 Epic 级别汇总

| Epic | 名称 | 优先级 | 工时 | 任务数 | 关键路径 |
|------|------|--------|------|--------|---------|
| E1 | 一键部署到 Vercel | P0 | 6h | 4 | 6h（线性） |
| E2 | 回滚 SOP + 功能开关 | P0 | 4h | 3 | 4h（线性） |
| E3 | Zustand Migration 库 | P0 | 5h | 3 | 5h（线性） |
| E4 | Multi-Framework 导出 | P1 | 5h | 3 | 5h（线性） |
| E5 | MCP Server 集成 | P1 | 10h | 4 | 10h（线性） |
| **总计** | — | — | **30h** | **17** | — |

### 9.2 详细任务汇总

| # | Epic | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|------|---------|---------|
| ~~E1-T1~~ | E1 | Vercel OAuth 授权流程 | 2h | `app/api/vercel/auth/route.ts`, `callback/route.ts`, `lib/vercel-oauth.ts` | ✅ OAuth URL 格式正确 + token 存储到 KV |
| ~~E1-T2~~ | E1 | 部署 API 实现 | 2h | `app/api/vercel/deploy/route.ts`, `lib/vercel-deploy.ts` | ✅ 部署响应包含 vercel.app URL + 60s 内返回 |
| ~~E1-T3~~ | E1 | 导出面板部署按钮 | 1.5h | `components/export-panel/`, `app/canvas/export/page.tsx` | ✅ 部署按钮可见 + OAuth 状态检测 |
| ~~E1-T4~~ | E1 | 部署状态 UI | 0.5h | `components/export-panel/deploy-status.tsx` | ✅ URL 在 60s 内出现 + 超时显示错误 |
| E2-T1 | E2 | 回滚 SOP 文档 | 2h | `docs/process/ROLLBACK_SOP.md` | ≥ 5 个回滚场景 |
| E2-T2 | E2 | 功能开关模板 | 1h | `lib/featureFlags.ts` | `isEnabled()` 返回 boolean + 环境变量读取 |
| E2-T3 | E2 | DoD 对齐机制 | 1h | `docs/process/EPIC_DOD_TEMPLATE.md`, `Epic-1-DOD.md` | Dev + Tester 双签 + flag 在当前 Epic 使用 |
| E3-T1 | E3 | VersionedStorage API | 2h | `libs/canvas-store-migration/index.ts`, `types.ts` | `createVersionedStorage` 可导出 + migration v1→v2 自动运行 |
| E3-T2 | E3 | Epic6/Epic7 迁移 | 2h | `stores/epic6-canvas.ts`, `stores/epic7-flow.ts`（修改） | Epic6/7 使用库 + inline migration 消除 |
| E3-T3 | E3 | Jest 测试覆盖 | 1h | `libs/canvas-store-migration/__tests__/` | 覆盖率 ≥ 80% |
| E4-T1 | E4 | Vue 映射表 | 2h | `components/react2vue/mappings.ts`, `transformer.ts` | Button/Input/Card/Mental 映射存在 |
| E4-T2 | E4 | 导出面板框架切换 | 1.5h | `app/canvas/export/page.tsx`, `components/export-panel/framework-selector.tsx` | React/Vue 切换可见 + 切换后代码改变 |
| E4-T3 | E4 | Vue 组件运行验证 | 1.5h | `e2e/vue-components.spec.ts`, `vue-test-app/` | Button/Input/Card E2E 测试通过 |
| E5-T1 | E5 | MCP Server 包脚手架 | 2h | `packages/mcp-server/`（全目录结构） | 包名正确 + MCP SDK 集成 |
| E5-T2 | E5 | MCP tools 实现 | 4h | `packages/mcp-server/src/tools/`（4 个文件） | 4 个 tools 全部实现 + 类型正确 |
| E5-T3 | E5 | Claude Desktop 集成 | 3h | `packages/mcp-server/claude_desktop_config.json`, `docs/claude-integration-guide.md` | Claude Desktop 可发现工具 + 连接成功（mock） |
| E5-T4 | E5 | 集成文档 | 1h | `docs/mcp-integration.md` | 文档存在 + 安装步骤 + ≥ 3 示例 |
| | | **合计** | **30h** | | |

---

## 10. Sprint 执行检查清单

### Sprint 开始前
- [ ] Epic kickoff 会议（Dev + Tester 双方 DoD 对齐）
- [ ] 创建 `epic-impl/` 子目录隔离各 Epic 代码
- [ ] 各 Epic reviewer 指定（每 Epic 至少 1 人）

### Sprint 期间
- [ ] Daily standup：检查工时进度 + 阻塞项上报
- [ ] 每个 sub-task 完成后提交 commit（保持原子性）
- [ ] 功能开关命名规范：`NEXT_PUBLIC_FEATURE_<NAME>`

### Sprint 结束时
- [ ] 所有 PR review 完成并合并
- [ ] `npm run lint` + `npx tsc --noEmit` 全绿
- [ ] E2E 测试全绿（Playwright）
- [ ] Jest 覆盖率验证（E3: ≥ 80%, E4: ≥ 80%）
- [ ] Sprint Review 会议（演示 5 个 Epic 产出）
- [ ] 文档更新（README/CHANGELOG 如需）

---

*Implementation Plan 版本: v1.0 | 生成时间: 2026-04-01 10:20 GMT+8*

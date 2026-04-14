# PRD: VibeX Dev 提案 — 开发体验与工程质量

**Project**: vibex-dev-proposals-20260414_143000
**Stage**: create-prd
**PM**: PM Agent
**Date**: 2026-04-14
**Status**: Draft

---

## 执行决策
- **决策**: 已采纳（Sprint 1 纳入 P0 清理，Sprint 2 纳入 P1）
- **执行项目**: vibex-dev-proposals-20260414_143000
- **执行日期**: 2026-04-14

---

## 1. 执行摘要

### 背景

Dev 提案 14 项，聚焦开发者体验（DX）和工程质量。当前核心问题：
- **TypeScript 配置失准**：后端误配 Next.js 插件，测试文件被排除 → CI 类型检查形同虚设
- **Bundle 失控**：lib 目录 2MB，多处缺少 dynamic import 管控 → 首屏性能隐患
- **开发规范缺失**：hooks/stores 无统一规范，TODO 残留 → 新成员认知成本高
- **安全盲区**：认证覆盖不完整、console.log 残留 → 潜在数据泄露风险

### 目标

| 目标 | 指标 |
|------|------|
| CI 类型检查可信 | `tsc --noEmit` 前后端均 0 错误 |
| Bundle 体积可控 | 增长 < 200KB，新增 dynamic import 覆盖 3+ 大组件 |
| 开发规范落地 | hooks 命名规范 100% 覆盖，TODO 关联 GitHub Issue |
| console.log 清除 | 后端 src/ 目录（除 __tests__）零 console.log |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| `tsc --noEmit` 错误数 | 0 |
| Vitest 测试退出码 | 0 |
| Bundle 增长 | < 200KB |
| 后端 console.log | 0 |
| TODO 关联 Issue 率 | 100% |

---

## 2. Feature List（来自 Analysis）

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | 前端 tsconfig 修复 | 移除 `"next"` 插件引用，修正 types 配置 | Dev P0-1 | 0.5h |
| F1.2 | 后端 tsconfig 修复 | 移除 `"next"` 插件，配置 Cloudflare Workers types | Dev P0-1 | 0.5h |
| F1.3 | Vitest exclude 修复 | 移除不合理的 exclude 规则，确保测试文件被包含 | Dev P0-2 | 1h |
| F1.4 | tsc --noEmit CI gate | 前后端 tsc 检查集成到 CI pipeline | Dev P0-1 | 1h |
| F2.1 | Bundle 体积审计 | 使用 bundlephobia/webpack-bundle-analyzer 识别 > 200KB 依赖 | Dev P0-3 | 2h |
| F2.2 | Dynamic import 改造 | 对 3+ 个大组件（> 200KB）实施 `dynamic()` | Dev P0-3 | 4h |
| F2.3 | Bundle size CI 阈值 | 集成 bundlesize 或 size-limit，CI 自动 fail 超限 | Dev P0-3 | 2h |
| F3.1 | Hooks 命名规范 | 制定 `use + Domain + Action` 规范，ESLint rule | Dev P1-2 | 2h |
| F3.2 | Zustand stores 规范化 | 全部 stores 在 stores/index.ts 导出，slice pattern | Dev P1-3 | 2h |
| F3.3 | TODO 清理 | 所有 TODO 关联 GitHub Issue 格式，CI grep 检测 | Dev P1-4 | 4h |
| F4.1 | console.log pre-commit hook | Husky pre-commit hook 检测并阻断 console.log 提交 | Dev P1-6 | 1h |
| F4.2 | 后端 console.log 清除 | 清除 vibex-backend/src/ 下所有 console.log | Dev P1-6 | 2h |
| F5.1 | Vitest 迁移规划 | Jest → Vitest 迁移方案（2 Sprint 执行）| Dev P1-1 | 1h |
| F5.2 | 认证中间件规划 | 认证白名单 + 中间件方案（待 Architect P0-3 前置）| Dev P1-5 | 2h |
| **合计** | | | | **27h** |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | CI 质量门禁 | 3h | P0 | S1.1, S1.2, S1.3, S1.4 |
| E2 | Bundle 与性能基线 | 8h | P0 | S2.1, S2.2, S2.3 |
| E3 | 开发规范落地 | 8h | P1 | S3.1, S3.2, S3.3 |
| E4 | 安全基线 | 3h | P1 | S4.1, S4.2 |
| E5 | 长期规划 | 5h | P2 | S5.1, S5.2 |

**总工时**: 27h（含 2h 缓冲）

---

### Epic 1: CI 质量门禁（P0）

**目标**: `tsc --noEmit` 前后端均 0 错误，Vitest 能发现并运行所有测试。

#### Story S1.1: 前端 tsconfig 修复

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 前端 tsconfig.json | 移除 `"next"` 相关插件引用 | `expect(config).not.toContain('"next"')` | 否 |
| F1.1.1 | types 配置 | `types: ["node"]` 等正确配置 | `expect(types).toBeDefined()` | 否 |
| F1.1.2 | tsc --noEmit 前端 | `cd vibex-fronted && tsc --noEmit` 退出码 0 | `expect(exitCode).toBe(0)` | 否 |

**DoD**: 前端 `tsc --noEmit` 无错误。

#### Story S1.2: 后端 tsconfig 修复

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2 | 后端 tsconfig.json | 移除 `"next"` 插件，配置 `@cloudflare/workers-types` | `expect(config).not.toContain('"next"')` | 否 |
| F1.2.1 | Cloudflare types | `types: ["@cloudflare/workers-types"]` | `expect(types).toContain('cloudflare')` | 否 |
| F1.2.2 | tsc --noEmit 后端 | `cd vibex-backend && tsc --noEmit` 退出码 0 | `expect(exitCode).toBe(0)` | 否 |

**DoD**: 后端 `tsc --noEmit` 无错误。

#### Story S1.3: Vitest exclude 修复

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.3 | vitest.config.ts | 移除不合理的 exclude 规则 | `expect(excludeRules).toBeDefined()` | 否 |
| F1.3.1 | 测试发现 | 新增测试文件时 vitest 自动发现 | `expect(testDiscovery).toBe(true)` | 否 |
| F1.3.2 | 现有测试通过 | 52+ 个现有测试仍然通过 | `expect(testPassCount).toBeGreaterThanOrEqual(52)` | 否 |
| F1.3.3 | Vitest 退出码 | `vitest run` 退出码 0 | `expect(vitestExitCode).toBe(0)` | 否 |

**DoD**: Vitest 发现并运行所有测试，退出码 0。

#### Story S1.4: CI TypeScript Gate

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.4 | CI tsc step | GitHub Actions / CI pipeline 包含 `tsc --noEmit` 步骤 | `expect(ciHasTscStep).toBe(true)` | 否 |
| F1.4.1 | 前后端覆盖 | CI 同时检查前端和后端 | `expect(ciCoversBoth).toBe(true)` | 否 |
| F1.4.2 | 阻断合并 | tsc 失败时 CI 阻断 merge | `expect(failBlocksMerge).toBe(true)` | 否 |

**DoD**: CI pipeline 包含前后端 tsc gate，失败阻断合并。

---

### Epic 2: Bundle 与性能基线（P0）

**目标**: Bundle 体积可监控，防止性能随迭代退化。

#### Story S2.1: Bundle 体积审计

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Bundle 审计工具 | 使用 bundlephobia 或 webpack-bundle-analyzer 分析 | `expect(auditToolRuns).toBe(true)` | 否 |
| F2.1.1 | 识别大依赖 | 识别 3+ 个 > 200KB 的直接依赖 | `expect(largeDeps).toHaveLengthGreaterThanOrEqual(3)` | 否 |
| F2.1.2 | 审计报告 | 生成 bundle 体积报告（top 10 依赖）| `expect(reportGenerated).toBe(true)` | 否 |

**DoD**: Bundle 审计完成，目标依赖清单确定。

#### Story S2.2: Dynamic Import 改造

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2 | dynamic() 改造 | 对 3+ 个大组件实施 `dynamic(() => import(...))` | `expect(dynamicImportCount).toBeGreaterThanOrEqual(3)` | 否 |
| F2.2.1 | 功能验证 | 动态导入组件正常渲染 | `expect(lazyRender).toBe(true)` | 否 |
| F2.2.2 | Fallback UI | 加载失败时有 fallback UI | `expect(fallbackDefined).toBe(true)` | 否 |
| F2.2.3 | 首屏 LCP | LCP < 2.5s（使用 Lighthouse）| `expect(lcp).toBeLessThan(2500)` | 否 |

**DoD**: 3+ 大组件改为 dynamic import，首屏性能不劣化。

#### Story S2.3: Bundle Size CI 阈值

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.3 | size-limit/bundlesize | CI 配置 bundle 增长阈值（< 200KB）| `expect(thresholdConfig).toBeDefined()` | 否 |
| F2.3.1 | 基线记录 | 当前 bundle 大小记录为基线 | `expect(baselineRecorded).toBe(true)` | 否 |
| F2.3.2 | CI 自动 fail | 增长超限时 CI 失败 | `expect(ciFailsOnGrowth).toBe(true)` | 否 |

**DoD**: Bundle 增长 > 200KB 时 CI 自动 fail。

---

### Epic 3: 开发规范落地（P1）

**目标**: hooks/stores 规范落地，TODO 清理完毕。

#### Story S3.1: Hooks 命名规范

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 命名规范文档 | 制定 `use + Domain + Action` 规范（如 `useProjectCreate`）| `expect(namingDoc).toBeDefined()` | 否 |
| F3.1.1 | ESLint rule | 新增 ESLint 规则检查命名规范 | `expect(eslintRule).toBe(true)` | 否 |
| F3.1.2 | stores/index.ts 导出 | 所有 hooks 在 `stores/index.ts` 统一导出 | `expect(indexExport).toBe(true)` | 否 |
| F3.1.3 | 现有 hooks 命名检查 | 现有 hooks 符合规范或已重构 | `expect(existingNaming).toBeCompliant())` | 否 |

**DoD**: Hooks 命名规范文档存在，ESLint rule 生效。

#### Story S3.2: Zustand Stores 规范化

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.2 | stores/index.ts | 所有 Zustand stores 在 `stores/index.ts` 导出 | `expect(allStoresExported).toBe(true)` | 否 |
| F3.2.1 | Slice Pattern | 新建 stores 使用 slice pattern（create + combine）| `expect(slicePattern).toBeUsed()` | 否 |
| F3.2.2 | TypeScript 类型 | 所有 stores 有完整的 TypeScript 类型 | `expect(storeTypes).toBeComplete())` | 否 |

**DoD**: 所有 stores 在 index.ts 导出，slice pattern 被遵循。

#### Story S3.3: TODO 清理

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.3 | TODO → GitHub Issue | 所有 TODO 注释包含 GitHub Issue 格式（`#123`）| `expect(todoIssueFormat).toMatch(/#\d+/)` | 否 |
| F3.3.1 | CI grep 检测 | CI 中 grep 检测无 Issue 的 TODO | `expect(ciGrepExists).toBe(true)` | 否 |
| F3.3.2 | TODO 数量 | 清理完成后 TODO 数量减少 80% | `expect(todoReduction).toBeGreaterThanOrEqual(0.8)` | 否 |

**DoD**: 所有 TODO 关联 GitHub Issue，CI 检测生效。

---

### Epic 4: 安全基线（P1）

**目标**: 消除 console.log 残留，建立安全开发规范。

#### Story S4.1: console.log pre-commit hook

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | Husky pre-commit | Husky pre-commit hook 检测 `console.log/debug/error` | `expect(huskyHook).toBeDefined()` | 否 |
| F4.1.1 | 阻断提交 | 检测到 console.log 时阻断提交并提示 | `expect(blocksCommit).toBe(true)` | 否 |
| F4.1.2 | 白名单 | `__tests__/` 目录例外（测试代码允许 console）| `expect(testExcluded).toBe(true)` | 否 |

**DoD**: pre-commit hook 检测并阻断 console.log。

#### Story S4.2: 后端 console.log 清除

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.2 | 后端清除 | `vibex-backend/src/` 下所有 `.ts` 文件清除 console.log | `expect(consoleLogCount).toBe(0)` | 否 |
| F4.2.1 | 替换方案 | 使用统一日志库（如 `console.info` 或项目日志模块）| `expect(replacementDefined).toBe(true)` | 否 |
| F4.2.2 | 验证命令 | `grep -rn "console\.\(log\|debug\|error\)" src/ --include="*.ts" --exclude-dir=__tests__` 返回空 | `expect(grepReturnsEmpty).toBe(true)` | 否 |

**DoD**: 后端 src/ 目录零 console.log。

---

### Epic 5: 长期规划（P2）

**目标**: 为后续 Sprint 提供技术方案和规划。

#### Story S5.1: Vitest 迁移规划

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | Jest → Vitest 方案 | 制定迁移方案：2 个 Sprint 执行 | `expect(migrationPlan).toBeDefined()` | 否 |
| F5.1.1 | 估算工时 | 迁移总工时估算（~24h）| `expect(estimate).toBe(24)` | 否 |
| F5.1.2 | Sprint 划分 | Sprint 2 执行 Phase1（基础设施），Sprint 3 执行 Phase2（测试迁移）| `expect(sprintPhases).toBeDefined()` | 否 |
| F5.1.3 | 风险缓解 | 回滚方案（保留 Jest 兼容模式）| `expect(rollbackPlan).toBeDefined()` | 否 |

**DoD**: Vitest 迁移方案文档完整，包含工时、阶段、风险缓解。

#### Story S5.2: 认证中间件规划

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.2 | 认证白名单方案 | 制定 API routes 认证白名单 + 中间件方案 | `expect(authPlan).toBeDefined())` | 否 |
| F5.2.1 | 依赖前置 | Architect P0-3（路由重组）是前置依赖 | `expect(dependencyNoted).toBe(true)` | 否 |
| F5.2.2 | 估算工时 | 认证中间件工时估算（~12h）| `expect(estimate).toBe(12)` | 否 |

**DoD**: 认证中间件方案文档存在，Architect 依赖明确。

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 前端 tsc --noEmit | 运行 | 退出码 0，无错误输出 | P0 |
| AC2 | 后端 tsc --noEmit | 运行 | 退出码 0，无错误输出 | P0 |
| AC3 | Vitest run | 运行 | 退出码 0，现有测试全通过 | P0 |
| AC4 | CI pipeline | 运行 | 前后端 tsc gate 生效，失败阻断 merge | P0 |
| AC5 | Bundle 审计 | 运行 | 报告生成，识别 3+ 个大依赖 | P0 |
| AC6 | Dynamic import | 部署 | 3+ 大组件改为 dynamic()，LCP < 2.5s | P0 |
| AC7 | CI bundle check | 运行 | 增长 > 200KB 时 CI fail | P0 |
| AC8 | Hooks 命名 | 新建 | 使用 `use + Domain + Action` 格式 | P1 |
| AC9 | Stores index.ts | 审查 | 所有 stores 在 index.ts 导出 | P1 |
| AC10 | TODO 注释 | 审查 | 全部关联 GitHub Issue（`#123` 格式）| P1 |
| AC11 | Pre-commit hook | 提交含 console.log | 提交被阻断，提示清除 | P1 |
| AC12 | 后端 src/ 目录 | grep 检测 | 零 console.log（__tests__ 除外）| P1 |
| AC13 | Vitest 迁移方案 | Sprint 2 开始前 | 方案文档完整，包含阶段和回滚 | P2 |
| AC14 | 认证中间件方案 | Sprint 3 开始前 | 方案文档完整，依赖 Architect P0-3 | P2 |

---

## 5. DoD (Definition of Done)

### E1 完成标准
- [ ] 前端 `tsc --noEmit` 退出码 0
- [ ] 后端 `tsc --noEmit` 退出码 0
- [ ] Vitest 发现并运行所有测试，退出码 0
- [ ] CI pipeline 包含前后端 tsc gate，失败阻断 merge

### E2 完成标准
- [ ] Bundle 审计报告生成
- [ ] 3+ 大组件改为 `dynamic()` 导入
- [ ] Fallback UI 定义
- [ ] CI bundle size 阈值配置，基线记录
- [ ] 增长 > 200KB 时 CI fail

### E3 完成标准
- [ ] Hooks 命名规范文档存在
- [ ] ESLint rule 生效
- [ ] 所有 stores 在 `stores/index.ts` 导出
- [ ] 新建 stores 使用 slice pattern
- [ ] TODO 全部关联 GitHub Issue
- [ ] CI grep 检测生效

### E4 完成标准
- [ ] Husky pre-commit hook 检测 console.log
- [ ] `__tests__/` 目录例外
- [ ] 后端 `src/` 目录零 console.log

### E5 完成标准
- [ ] Vitest 迁移方案文档完整（工时/阶段/回滚）
- [ ] 认证中间件方案文档完整（工时/依赖）

---

## 6. Sprint 划分建议

| Sprint | 内容 | Epic | 工时 |
|--------|------|------|------|
| Sprint 1 | CI门禁 + Bundle | E1 + E2 | 11h |
| Sprint 2 | 开发规范 + 安全基线 + Vitest迁移Phase1 | E3 + E4 + S5.1 | 13h |
| Sprint 3 | 认证中间件 + Vitest迁移Phase2 | S5.2 + S5.1 Phase2 | ~16h |

---

## 7. 规格文件（Specs）

| 文件 | 内容 |
|------|------|
| `specs/E1-tsconfig-fix.md` | tsconfig 修复 + CI gate 详细规格 |
| `specs/E1-vitest-fix.md` | Vitest exclude 修复详细规格 |
| `specs/E2-bundle-audit.md` | Bundle 审计 + dynamic import 规格 |
| `specs/E3-hooks-naming.md` | Hooks 命名规范 + ESLint rule 规格 |
| `specs/E3-stores-index.md` | Zustand stores 规范化规格 |
| `specs/E4-console-cleanup.md` | console.log 清除 + pre-commit hook 规格 |
| `specs/E5-vitest-migration.md` | Vitest 迁移方案规划 |
| `specs/E5-auth-middleware.md` | 认证中间件方案规划 |

---

*PRD Version: 1.0*
*Created by: PM Agent*
*Last Updated: 2026-04-14*

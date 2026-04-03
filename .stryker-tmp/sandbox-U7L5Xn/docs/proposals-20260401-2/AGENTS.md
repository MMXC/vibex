# AGENTS.md — proposals-20260401-2 开发约束

**项目**: vibex (Sprint 2)
**版本**: v1.0
**日期**: 2026-04-01
**范围**: E1–E5 Epic 实现约束

---

## 1. 代码规范

### 1.1 TypeScript 严格模式

- 所有新代码必须启用 `strict: true`（含 `strictNullChecks`、`noImplicitAny`、`noUncheckedIndexedAccess`）
- 新增 `.ts` / `.tsx` 文件禁止包含 `// @ts-ignore` 或 `// @ts-nocheck`（已有文件除外）
- `as any` 仅在明确记录的技术债务场景中使用，使用后追加 `// TODO: type-safe fix in Epic-X`
- PR 中的 `as any` 新增行数将触发 reviewer 重点审查

### 1.2 提交规范（Conventional Commits）

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**type 映射**:

| type | 触发时机 | 示例 |
|------|----------|------|
| `feat` | 新功能 | `feat(e1): add Vercel OAuth flow` |
| `fix` | Bug 修复 | `fix(e3): correct migration version detection` |
| `refactor` | 重构（无行为变更） | `refactor(e4): extract react2vue mappings` |
| `test` | 测试用例添加 | `test(e5): add MCP getProject unit test` |
| `docs` | 文档更新 | `docs: update ROLLBACK_SOP.md scenarios` |
| `chore` | 构建/工具/依赖 | `chore: upgrade @modelcontextprotocol/sdk` |
| `perf` | 性能优化 | `perf(e1): add deploy API timeout` |

**scope 限制**: 使用 Epic 编号（`e1`–`e5`）或具体模块（`api`、`store`、`ui`）。无 scope 仅用于全项目级 CI/配置变更。

**格式要求**:
- Subject 每行 ≤ 72 字符，使用祈使语气
- Breaking changes 在 footer 标注 `BREAKING CHANGE:`
- 每个 Epic 最后一个 commit 以 `[epic-eN-done]` 结尾

### 1.3 文件路径约定

```
vibex/
├── apps/
│   └── web/                     # Next.js 主应用
│       ├── app/api/vercel/      # E1: Vercel API routes
│       ├── app/api/deploy/       # E1: Deploy API
│       └── components/           # React 组件
├── libs/
│   └── canvas-store-migration/  # E3: Zustand migration 库
│       ├── index.ts              # 导出 createVersionedStorage
│       ├── __tests__/            # Jest 测试
│       └── src/
├── packages/
│   └── mcp-server/               # E5: MCP Server npm 包
│       ├── src/
│       │   ├── index.ts
│       │   ├── tools/
│       │   └── server.ts
│       └── package.json
├── components/
│   └── react2vue/                # E4: Multi-Framework 导出
│       ├── mappings.ts          # React→Vue 映射表
│       ├── generator.ts          # 代码生成器
│       └── __tests__/
├── docs/
│   ├── process/
│   │   └── ROLLBACK_SOP.md       # E2: 回滚 SOP
│   └── mcp-integration.md         # E5: MCP 集成文档
└── lib/
    ├── featureFlags.ts           # E2: 功能开关统一读取
    └── vercel.ts                 # E1: Vercel API 封装
```

**命名约定**:
- React 组件: `PascalCase.tsx`（如 `DeployButton.tsx`）
- 工具函数/库: `camelCase.ts`（如 `featureFlags.ts`）
- 测试文件: `*.test.ts` 或 `*.spec.ts`
- MCP tools: `kebab-case.ts`（如 `get-project.ts`）

---

## 2. Per-Epic 约束

### 2.1 E1 — 一键部署到 Vercel

| # | 约束 | 级别 |
|---|------|------|
| E1-C1 | Vercel API Token 必须存储在后端（session/KV），**严禁**暴露到前端 | 🚨 强制 |
| E1-C2 | `/api/vercel/deploy` 路由必须在调用 Vercel API 前验证用户认证 | 🚨 强制 |
| E1-C3 | 前端仅接收部署 URL，**永不**接收 token | 🚨 强制 |
| E1-C4 | 禁止硬编码 Vercel team/project ID，全部使用环境变量 | 🚨 强制 |
| E1-C5 | 部署 API 调用超时上限: **60s**，超时返回 `{ error: 'Deploy timeout' }` | 🚨 强制 |
| E1-C6 | `lib/vercel.ts` 封装所有 Vercel API 调用，前端通过 `/api/vercel/*` 路由间接调用 | 必须 |
| E1-C7 | OAuth 授权 URL 中 `scope` 必须包含 `deployment` + `project` | 必须 |
| E1-C8 | 导出面板「Deploy to Vercel」按钮状态: 未授权→"Connect Vercel"；已授权→"Deploy to Vercel" | 必须 |

**环境变量清单**:

```bash
# .env.local (server-side only, NOT exposed to frontend)
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
VERCEL_TEAM_ID=        # optional, read from env
VERCEL_PROJECT_ID=      # optional, read from env

# Next.js public runtime vars (frontend-safe)
# Vercel token is NEVER exposed to NEXT_PUBLIC_*
```

### 2.2 E2 — 回滚 SOP + 功能开关

| # | 约束 | 级别 |
|---|------|------|
| E2-C1 | Feature flag 命名: `NEXT_PUBLIC_FEATURE_<NAME>` 全大写下划线 | 🚨 强制 |
| E2-C2 | 所有 feature flag 必须通过 `lib/featureFlags.ts` 封装读取，**禁止**在组件内直接访问 `process.env` | 🚨 强制 |
| E2-C3 | 回滚 **必须**使用新 commit 修复，**禁止**使用 `git revert` | 🚨 强制 |
| E2-C4 | Epic kickoff 前 dev + tester 必须对 DoD 验收标准签字确认 | 🚨 强制 |
| E2-C5 | 回滚 SOP 文档 `docs/process/ROLLBACK_SOP.md` 至少覆盖 **5 个场景** | 必须 |
| E2-C6 | `docs/process/ROLLBACK_SOP.md` 中禁止出现 `git revert` 命令 | 必须 |

**`lib/featureFlags.ts` 强制签名**:

```typescript
// lib/featureFlags.ts
export function isFeatureEnabled(flagName: string): boolean {
  const value = process.env[`NEXT_PUBLIC_FEATURE_${flagName}`];
  return value === 'true' || value === '1';
}

// 使用示例
if (isFeatureEnabled('MY_FEATURE')) { ... }
```

### 2.3 E3 — Zustand Migration 库

| # | 约束 | 级别 |
|---|------|------|
| E3-C1 | `CURRENT_STORAGE_VERSION` 必须仅在 `libs/canvas-store-migration/index.ts` 中定义 | 🚨 强制 |
| E3-C2 | 所有 store 文件**禁止**包含 inline migration 代码（不得在 store 文件中定义 version 或 migrations） | 🚨 强制 |
| E3-C3 | 所有使用 persist 的 store 必须从 `libs/canvas-store-migration` 导入 storage | 🚨 强制 |
| E3-C4 | Migration 函数必须为纯函数（无副作用，不访问外部状态，不调用 API） | 🚨 强制 |
| E3-C5 | 迁移库 Jest 覆盖率 ≥ 80%（branches / functions / lines 全部达标） | 🚨 强制 |
| E3-C6 | `libs/canvas-store-migration/` 独立于主应用，可单独导入测试 | 必须 |
| E3-C7 | 库内必须有 `__tests__/` 目录，测试必须覆盖 migration 路径和边界情况 | 必须 |
| E3-C8 | 未知版本迁移路径必须抛出明确错误（`throw new Error('Unknown migration path: ...')`） | 必须 |

**存储版本管理**:

```typescript
// libs/canvas-store-migration/index.ts
export const CURRENT_STORAGE_VERSION = 3;  // E3-C1: ONLY here

export function createVersionedStorage(options: VersionedStorageOptions) {
  // E3-C4: Pure migration functions
  return { getItem, setItem, removeItem };
}
```

### 2.4 E4 — Multi-Framework 导出

| # | 约束 | 级别 |
|---|------|------|
| E4-C1 | React-to-Vue 映射表必须完整覆盖: `Button`, `Input`, `Card`, `Container`, `Text`（至少 5 个） | 🚨 强制 |
| E4-C2 | 导出面板框架切换必须将用户选择持久化到 `localStorage` | 🚨 强制 |
| E4-C3 | 生成的 Vue 代码必须是**有效的 Vue 3 Composition API SFC**（`<template>`, `<script setup>`, `<style scoped>`） | 🚨 强制 |
| E4-C4 | 生成的 Vue 代码**禁止**包含任何运行时 React 依赖 | 🚨 强制 |
| E4-C5 | 框架切换不改变已选节点状态（节点选中状态跨框架保持） | 必须 |
| E4-C6 | `components/react2vue/mappings.ts` 必须包含完整的类型声明 | 必须 |

**映射表要求**:

```typescript
// components/react2vue/mappings.ts
export const reactToVueMappings: Record<string, VueComponentConfig> = {
  Button:   { vueTag: 'VButton',   style: 'scoped' },
  Input:    { vueTag: 'VInput',    style: 'scoped' },
  Card:     { vueTag: 'div',      className: 'vibex-card', style: 'scoped' },
  Container:{ vueTag: 'div',      className: 'vibex-container', style: 'scoped' },
  Text:     { vueTag: 'span',     style: 'scoped' },
  Modal:    { vueTag: 'Teleport', target: 'body', style: 'scoped' },
  // E4-C1: 必须覆盖以上 5 个基础组件
};
```

### 2.5 E5 — MCP Server 集成

| # | 约束 | 级别 |
|---|------|------|
| E5-C1 | `@vibex/mcp-server` 包必须可独立安装（`npm install @vibex/mcp-server` 在 monorepo 外正常工作） | 🚨 强制 |
| E5-C2 | 所有 MCP tools 必须优雅处理错误（返回 `{ error: string }` 对象，**禁止** `throw`） | 🚨 强制 |
| E5-C3 | Claude Desktop 配置模板必须存放在 `docs/mcp-integration.md` | 🚨 强制 |
| E5-C4 | 所有 MCP tool schemas 必须有文档说明（参数、返回值、示例） | 🚨 强制 |
| E5-C5 | MCP server 入口文件 `src/server.ts` 必须导出 `start()` 和 `tools` | 必须 |
| E5-C6 | 每个 tool 必须有对应的单元测试（使用 Jest 或 MCP SDK 内置测试） | 必须 |
| E5-C7 | 工具函数必须返回结构化 JSON，禁止返回裸字符串（除错误场景） | 必须 |

**MCP Tool 错误处理模式**:

```typescript
// ✅ 正确
async function getProject(args: GetProjectArgs) {
  if (!args.projectId) {
    return { error: 'projectId is required' };
  }
  try {
    const project = await loadProject(args.projectId);
    return { success: true, data: project };
  } catch (e) {
    return { error: `Failed to load project: ${e.message}` };
  }
}

// ❌ 错误
async function getProject(args: GetProjectArgs) {
  if (!args.projectId) throw new Error('projectId is required'); // E5-C2 违反
}
```

---

## 3. 测试要求

### 3.1 覆盖率目标

| 范围 | 覆盖率门槛 | 工具 |
|------|------------|------|
| `libs/canvas-store-migration/` | ≥ 80%（branches/functions/lines） | Jest + `--coverage` |
| `components/react2vue/` | ≥ 80%（branches/functions/lines） | Jest + `--coverage` |
| `@vibex/mcp-server` | 每个 tool 1 个正向 + 1 个边界测试 | Jest |
| API routes (`/api/vercel/*`) | 集成测试（Happy path + 错误路径） | Jest + Supertest / Playwright |
| 新增 React/Vue 组件 | Storybook + Playwright E2E | Storybook / Playwright |

### 3.2 测试运行命令

```bash
# E3: Migration 库覆盖率
cd libs/canvas-store-migration && npx jest --coverage

# E4: React2Vue 覆盖率
cd components/react2vue && npx jest --coverage

# E5: MCP Server 测试
cd packages/mcp-server && npx jest

# E1: API routes 集成测试
npx jest --testPathPattern="api/vercel"

# 全量测试
npx jest
npx tsc --noEmit
npx next lint
```

### 3.3 E2E 测试约定

- 所有 E2E 测试使用 Playwright，测试文件放在 `__tests__/e2e/` 或 `*.e2e.test.ts`
- 每个 Epic 导出面板相关功能必须有 E2E 测试覆盖
- E2E 测试中的选择器必须使用 `data-testid`（禁止使用 CSS 选择器做断言）

---

## 4. 禁止模式（Prohibited Patterns）

以下模式在实现中被**立即拒绝**（immediate reject），reviwer 有权 blocking merge：

### 4.1 🚨 P1 — 安全类（安全漏洞级别）

| # | 禁止模式 | 正确做法 | 例外 |
|---|----------|----------|------|
| PP-1 | Vercel token 出现在前端代码（`NEXT_PUBLIC_VERCEL_*`, `window.*`, `localStorage`） | 仅存 server-side（session/cookie/KV/env） | 无例外 |
| PP-2 | 敏感凭证硬编码 | 使用 `process.env.*`（server-side）或 `.env.local` | 无例外 |

### 4.2 🚨 P2 — 架构违规类

| # | 禁止模式 | 正确做法 | 例外 |
|---|----------|----------|------|
| PP-3 | 组件内直接访问 `process.env` 获取 feature flag | 通过 `lib/featureFlags.ts` | 无例外 |
| PP-4 | `CURRENT_STORAGE_VERSION` 定义在 `libs/canvas-store-migration/` 之外 | 仅在 `libs/canvas-store-migration/index.ts` | 无例外 |
| PP-5 | Store 文件内 inline migration 代码 | 通过 `createVersionedStorage()` 封装 | 无例外 |
| PP-6 | 生成的 Vue 代码包含 React 运行时依赖 | 使用纯 Vue 3 Composition API | 无例外 |
| PP-7 | 使用 `git revert` 进行 Epic 回滚 | 使用新的 fix commit | 无例外 |

### 4.3 🚨 P3 — 质量门槛类

| # | 禁止模式 | 正确做法 | 例外 |
|---|----------|----------|------|
| PP-8 | PR 引入新的 TypeScript error | 先修复 `tsc --noEmit` | 无例外 |
| PP-9 | Migration 函数产生副作用 | 重构为纯函数 | 无例外 |
| PP-10 | MCP tool `throw` 而非返回错误对象 | 返回 `{ error: string }` | 无例外 |

### 4.4 例外申请流程

> 例外仅在以下情况下可申请，由 reviewer 最终裁定：
> 1. 存在明确的技术债务记录（`// TODO: ...` 标注 + ticket 链接）
> 2. 在 PR description 中声明例外理由
> 3. reviewer 明确书面批准（Slack/PR comment）

---

## 5. Dev 自检清单（每 Epic 完成时执行）

### E1 自检 — 一键部署到 Vercel

完成 E1 编码后，Dev 提交 PR 前逐项确认：

```markdown
## E1 自检清单

- [ ] `lib/vercel.ts` 存在且所有 API 调用通过此文件封装
- [ ] `VERCEL_CLIENT_ID` / `VERCEL_CLIENT_SECRET` 仅在 server-side env 中（grep 确认无 `NEXT_PUBLIC_VERCEL`）
- [ ] `/api/vercel/deploy` 路由第一行包含 auth 验证
- [ ] 部署 API 调用有 `try/catch`，超时设置为 60s
- [ ] 前端 `DeployButton` 组件从不接收 token（grep 确认）
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 无 error
- [ ] API route 集成测试通过（Happy path + auth reject + timeout）
- [ ] Playwright E2E:「Deploy to Vercel」按钮可见
- [ ] Playwright E2E: 部署 URL 在 60s 内出现
```

### E2 自检 — 回滚 SOP + 功能开关

```markdown
## E2 自检清单

- [ ] `docs/process/ROLLBACK_SOP.md` 存在且包含 ≥ 5 个回滚场景
- [ ] `ROLLBACK_SOP.md` 内容不包含 `git revert` 命令
- [ ] `lib/featureFlags.ts` 存在且导出 `isFeatureEnabled(flagName: string): boolean`
- [ ] 当前 Epic 使用至少 1 个 `NEXT_PUBLIC_FEATURE_*` flag
- [ ] 所有组件使用 `isFeatureEnabled()` 而非直接 `process.env`（grep 确认）
- [ ] Epic kickoff 产生 `docs/epic/Epic-N-DOD.md` 且有 Dev + Tester 签字
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 无 error
- [ ] PR description 包含 DoD checklist
```

### E3 自检 — Zustand Migration 库

```markdown
## E3 自检清单

- [ ] `libs/canvas-store-migration/index.ts` 存在并导出 `createVersionedStorage`
- [ ] `CURRENT_STORAGE_VERSION` 仅在 `libs/canvas-store-migration/index.ts` 中定义（grep 确认其他文件无定义）
- [ ] 所有 store 文件不包含 inline migration（grep 确认无 `migrations: {` 在 stores/ 下）
- [ ] 所有使用 persist 的 store 从 `libs/canvas-store-migration` 导入
- [ ] Migration 函数为纯函数（无 `fetch`, `localStorage`, `Math.random()` 等副作用）
- [ ] `cd libs/canvas-store-migration && npx jest --coverage` 覆盖率 ≥ 80%
- [ ] 未知版本迁移抛出明确错误
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 无 error
```

### E4 自检 — Multi-Framework 导出

```markdown
## E4 自检清单

- [ ] `components/react2vue/mappings.ts` 存在且映射覆盖: Button, Input, Card, Container, Text
- [ ] 导出面板有 React/Vue 框架切换 UI（RadioGroup 或 Toggle）
- [ ] 框架选择持久化到 `localStorage`（切换页面后仍保持）
- [ ] 生成的 Vue 代码包含 `<template>`、`<script setup>`、`<style scoped>`
- [ ] 生成的 Vue 代码无 React 运行时引用（grep 确认无 `import React`、`React.`、`from 'react'`）
- [ ] 框架切换不影响已选节点状态
- [ ] `cd components/react2vue && npx jest --coverage` 覆盖率 ≥ 80%
- [ ] Playwright E2E: 切换到 Vue 后代码预览区显示 `.vue` 文件
- [ ] Playwright E2E: Vue 模式下 Button/Input/Card 组件可运行（基础 E2E）
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 无 error
```

### E5 自检 — MCP Server 集成

```markdown
## E5 自检清单

- [ ] `packages/mcp-server/package.json` 的 `name` 为 `@vibex/mcp-server`
- [ ] `npm install @vibex/mcp-server` 在 monorepo 外可独立安装（`npm pack --dry-run`）
- [ ] `src/server.ts` 导出 `start()` 和 `tools`
- [ ] 所有 tools 返回 `{ error: string }` 而非 `throw`（grep 确认无 `throw new Error` 在 tool handler 中）
- [ ] `docs/mcp-integration.md` 存在且包含:
      - Claude Desktop 配置步骤（`claude_desktop_config.json` 示例）
      - 安装命令（`npm install @vibex/mcp-server`）
      - ≥ 3 个使用示例（code block）
      - 故障排查 FAQ
- [ ] 每个 tool 有 ≥ 1 个单元测试
- [ ] `cd packages/mcp-server && npx jest` 全绿
- [ ] `npm run lint` 无 error
- [ ] `npx tsc --noEmit` 无 error
- [ ] `packages/mcp-server/tsconfig.json` 可独立编译（`tsc -p tsconfig.json`）
```

---

## 6. 全局 DoD 门槛（所有 Epic 必须通过）

> 以下门槛为 merge gate，任意一项未通过则 reviewer 有权 blocking PR。

| # | 检查项 | 命令 |
|---|--------|------|
| GD-1 | TypeScript 编译 0 error | `npx tsc --noEmit` |
| GD-2 | ESLint 0 error | `npm run lint` |
| GD-3 | 全量测试通过 | `npx jest --passWithNoTests` |
| GD-4 | PR 通过两阶段 review | reviewer 明确 approve |
| GD-5 | 关键文档已更新 | 涉及 API 变更则 OpenAPI spec 更新；涉及 SOP 则 `ROLLBACK_SOP.md` 更新 |
| GD-6 | 无新增 prohibited pattern | reviewer 在 review 阶段主动 grep 确认 |

---

*AGENTS.md 版本: v1.0 | 关联 PRD: `docs/proposals-20260401-2/prd.md` | 最后更新: 2026-04-01*

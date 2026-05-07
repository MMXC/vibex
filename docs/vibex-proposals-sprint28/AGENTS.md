# VibeX Sprint 28 — 开发约束文档（AGENTS.md）

**Agent**: architect
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint28
**状态**: Adopted

---

## 1. 开发规范

### 1.1 TypeScript 严格模式

| 配置项 | 值 | 理由 |
|--------|----|------|
| `tsconfig.json` — `strict: true` | 必须 | 启用所有严格类型检查 |
| `tsconfig.json` — `noImplicitAny: true` | 必须 | 禁止隐式 any |
| `tsconfig.json` — `strictNullChecks: true` | 必须 | 严格 null/undefined 检查 |
| `tsconfig.json` — `noUnusedLocals: true` | 必须 | 禁止未使用变量 |
| `tsconfig.json` — `noUnusedParameters: true` | 必须 | 禁止未使用参数 |

**CI 门控**: `tsc --noEmit` 必须 exit 0，任何 error 导致 PR blocked。

### 1.2 代码风格

**工具链**: ESLint + Prettier，双锁强制。

| 工具 | 配置 | 强制方式 |
|------|------|---------|
| ESLint | `next/core-web-vitals` + `typescript-eslint/recommended` | CI pre-commit hook |
| Prettier | `printWidth: 100`, `singleQuote: true`, `semi: true` | CI pre-commit hook |

**禁止规则**:
- `any` — 全部禁用，使用 `unknown` 代替
- `// @ts-ignore` — 全部禁用，必须使用 `// @ts-expect-error` 并附理由
- `console.log` — 生产代码禁止，使用 `console.error` 或 structured logger
- `setTimeout` callback — 必须显式标注返回类型

### 1.3 目录结构约定

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React 组件
│   ├── canvas/             # Canvas 相关组件
│   ├── dashboard/         # Dashboard 组件
│   └── onboarding/         # Onboarding 组件
├── hooks/                  # React hooks（use* 前缀）
├── lib/                    # 工具函数 / Firebase / API clients
├── pages/api/              # API Routes（/api/v1/*）
└── types/                  # 全局 TypeScript 类型定义
packages/mcp-server/        # MCP Server 独立包
```

---

## 2. API 设计规范

### 2.1 RESTful 约定

| 方法 | 端点 | 语义 | 成功状态码 |
|------|------|------|-----------|
| GET | `/api/v1/templates` | 列表资源 | 200 |
| GET | `/api/v1/templates/:id` | 获取单个资源 | 200 |
| POST | `/api/v1/templates` | 创建资源 | 201 |
| PUT | `/api/v1/templates/:id` | 更新资源（全量） | 200 |
| PATCH | `/api/v1/templates/:id` | 更新资源（部分） | 200 |
| DELETE | `/api/v1/templates/:id` | 删除资源 | 200（硬删除）或 204 |

### 2.2 错误码规范

| 错误类型 | 格式 | 示例 |
|---------|------|------|
| 客户端错误 4xx | `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }` | 400/401/403/404/422 |
| 服务端错误 5xx | `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }` | 500/502/503 |

**禁止**: 永远不要在 error response 中暴露 stack trace。

### 2.3 API 版本策略

- 所有 API 必须置于 `/api/v1/` 前缀下
- Breaking changes 必须发布新版本（`/api/v2/`）
- 非破坏性变更（如添加字段）可在当前版本内进行

---

## 3. 前端组件规范

### 3.1 组件文件结构

每个组件目录遵循以下结构：

```
ComponentName/
├── index.tsx              # 主组件导出
├── ComponentName.tsx      # 主组件实现
├── ComponentName.test.tsx # 单元测试
└── styles.ts             # 内联样式或 CSS modules（可选）
```

**命名约定**:
- 组件文件：`PascalCase.tsx`（如 `DDSCanvasPage.tsx`）
- Hook 文件：`camelCase.ts`（如 `useRealtimeSync.ts`）
- 测试文件：`*.test.tsx`（单元）或 `*.spec.ts`（E2E）

### 3.2 React Hooks 命名规范

| 规则 | 正确 | 错误 |
|------|------|------|
| 必须 `use` 前缀 | `usePresence`, `useRealtimeSync` | `getPresence`, `syncNodes` |
| 必须是名词或动词 | `useUser`, `useTemplates` | `useUserDataFetching` |
| 副作用 hook 必须有清理 | `useEffect(() => { ... return cleanup }, [deps])` | 无 cleanup 的 listener |

### 3.3 状态管理约定

| 场景 | 推荐方案 |
|------|---------|
| 组件内本地状态 | `useState` |
| 跨组件共享状态 | React Context（轻量场景）/ Zustand（复杂场景）|
| 服务端状态 | React Query（`@tanstack/react-query`）|
| 表单状态 | React Hook Form |
| 持久化状态（localStorage） | `useLocalStorage` hook |

**禁止**: 不要在组件 render 中直接调用 `fetch` 或执行昂贵的计算。

---

## 4. 测试规范

### 4.1 单元测试

| 指标 | 要求 |
|------|------|
| 覆盖率阈值 | **> 80% line coverage** |
| 测试框架 | Vitest |
| 配置文件 | `vitest.config.ts` |
| 强制方式 | CI gate: `vitest run --coverage` |

**核心测试用例必须覆盖**:
- API endpoint 正常路径 + 错误路径
- Hook 逻辑（特别是 `useRealtimeSync`, `useClarifyAI`）
- 工具函数（schema validation, data transformation）
- React 组件交互（用户点击 → 状态变化）

### 4.2 E2E 测试

| 规则 | 要求 |
|------|------|
| 命名约定 | `*.spec.ts`（Playwright 默认） |
| 路径 | `tests/e2e/` |
| 强制方式 | CI gate: `npx playwright test` |
| 必测场景 | 所有验收标准中 `expect(...)` 断言 |

**Playwright 配置**:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3000' }
});
```

### 4.3 Mock 策略

| 场景 | Mock 方式 |
|------|---------|
| Firebase / RTDB | `vi.mock('lib/firebase/rtdb')` — 注入 mock data |
| OpenAI API | `vi.mock('lib/openai')` — 返回预设结构化 JSON |
| localStorage | `global.localStorage = { getItem: vi.fn(() => null), ... }` |
| next/router | `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))` |

**禁止**: 不要 mock 真实第三方服务（Firebase/OpenAI）在 E2E 之外。

---

## 5. 安全规范

### 5.1 环境变量命名约定

| 变量类型 | 前缀 | 示例 |
|---------|------|------|
| Firebase 配置 | `FIREBASE_` | `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN` |
| OpenAI 配置 | `OPENAI_` | `OPENAI_API_KEY`, `OPENAI_ORG_ID` |
| 应用配置 | `NEXT_PUBLIC_` | `NEXT_PUBLIC_APP_URL` |
| 内部密钥 | `APP_SECRET_` | `APP_SECRET_JWT` |

### 5.2 禁止暴露规则

| 规则 | 说明 |
|------|------|
| 禁止客户端暴露密钥 | 所有 `FIREBASE_*`, `OPENAI_*`, `APP_SECRET_*` 只能出现在 server-side（API route / Server Component）|
| 客户端可读变量 | 仅 `NEXT_PUBLIC_*`，且必须在 `.env.local` 中明确声明 |
| Git 禁止提交凭证 | `.env*` 文件必须加入 `.gitignore`，除了 `.env.example` |

---

## 6. Git Workflow

### 6.1 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature（Epic 任务） | `feat/s28-epic-*` | `feat/s28-e01-presence-merge`, `feat/s28-e02-virtualization` |
| Bug Fix | `fix/s28-*` | `fix/s28-e06-errorboundary` |
| Hotfix | `hotfix/*` | `hotfix/prod-canvas-crash` |
| Chore | `chore/*` | `chore/s28-lighthouse-ci` |

### 6.2 PR Checklist

创建 PR 前必须满足以下所有条目：

- [ ] `tsc --noEmit` exit 0
- [ ] `vitest run` 通过（无 skipped/failed tests）
- [ ] `npx playwright test` 通过（针对涉及的功能）
- [ ] 新增代码行覆盖率 > 80%（使用 `vitest --coverage` 验证）
- [ ] 所有 Epic-specific constraints 已遵循（见本文档第 9 节）
- [ ] PR 描述包含：关联的 Story ID / 验收标准 / 测试结果
- [ ] Review 至少 1 人 approved

**禁止**: 禁止将未完成功能合并到 main（用 Draft PR）。

---

## 7. 性能门控

### 7.1 编译门控

| 门控 | 命令 | 阈值 |
|------|------|------|
| TypeScript 编译 | `tsc --noEmit` | **0 errors**，warnings 需逐一确认 |
| ESLint 检查 | `eslint src/ --max-warnings 0` | 0 warnings |
| Prettier 格式 | `prettier --check src/` | 0 files modified |

**强制方式**: CI pipeline（GitHub Actions / GitLab CI）必须全部绿灯才能合并。

### 7.2 Lighthouse Performance

| 页面 | 指标 | 阈值 |
|------|------|------|
| Design Output（DDSCanvasPage） | Performance Score | **≥ 85** |
| 300 节点渲染时间 | DevTools Performance | **< 200ms** |
| 主包大小 | gzipped JS | **< 200KB**（初始加载）|

**验证方法**:
```bash
# 本地运行
npx lighthouse http://localhost:3000/dashboard --output=json --output-path=./lighthouse-report.json
# CI 中使用 CI=true 环境变量，绕过需要登录的页面
```

---

## 8. CI Pipeline 流水线

```
stages:
  - lint
  - type-check
  - test
  - e2e
  - performance

lint:
  script: eslint src/ --max-warnings 0

type-check:
  script: tsc --noEmit

unit-test:
  script: vitest run --coverage --coverage.threshold.lines 80

e2e:
  script: npx playwright test
  timeout: 10m

lighthouse:
  script: lighthouse http://localhost:3000 --score=85
```

---

## 9. Epic-Specific Constraints

### 9.1 Epic E01 — 实时协作整合

| 约束项 | 值 | 备注 |
|--------|----|------|
| Firebase RTDB 路径 | `/projects/{projectId}/nodes/{nodeId}` | 层级结构，projectId 隔离多租户 |
| Conflict 策略 | **last-write-wins** | 不使用 CRDT，简化实现 |
| Presence 更新频率 | **≤ 1Hz**（每秒最多 1 次）| 防止过量写入 |
| Hook 命名 | `useRealtimeSync` | 需实现单元测试 |
| 集成测试 | `tests/e2e/presence-mvp.spec.ts` | mock Firebase，降级通过 |

### 9.2 Epic E02 — Design Output 性能优化

| 约束项 | 值 | 备注 |
|--------|----|------|
| react-window | `List` (v2) | `rowHeight` 必须是**固定常量**（传入 `120 as const`，不动态计算）|
| 所有子组件 | `React.memo` 包裹 | 包括 `CardItem`, `BoundedContextCard`, `FlowStepCard` 等所有子组件 |
| 禁止 render 中 expensive computation | 任何 > 10ms 的计算必须 `useMemo` | 列表渲染 / 复杂逻辑均需 memo |
| DevTools 验证 | 300 节点渲染 < 200ms | DevTools Performance panel 截图留存 |

**实现**: `ChapterPanel.tsx` — react-window List，rowHeight=120 固定常量，CardItem memo 包裹，selectedIndex useMemo |

### 9.3 Epic E03 — AI 辅助需求解析

| 约束项 | 值 | 备注 |
|--------|----|------|
| API timeout | **硬编码 30s** | `AbortSignal.timeout(30_000)` |
| 降级路径 | 必须实现 | 无 API Key / timeout → rule engine 降级，不阻断 Onboarding |
| 组件 | `ClarifyAI.tsx` | 在 ClarifyStep 中集成，结果可编辑确认 |
| Hook | `useClarifyAI` | 需实现 mock 测试 |

### 9.4 Epic E04 — 模板 API 完整 CRUD

| 约束项 | 值 | 备注 |
|--------|----|------|
| 存储 | **内存存储（V1）** | 不引入数据库，模板数据存 `globalThis` 或 module-level Map |
| 导入 JSON | 必须 **schema validation** | 使用 Zod / JSON Schema，invalid JSON → 错误消息，不 crash |
| 删除 | **硬删除** | DELETE 后 GET 返回 404，不软删除 |
| Dashboard | `/dashboard/templates` | 列表 + 新建 + 编辑 + 删除 + 导入 + 导出 |

### 9.5 Epic E05 — PRD → Canvas 自动流程

| 约束项 | 值 | 备注 |
|--------|----|------|
| PRD Chapter | → Canvas **左栏**（type: `context`） | bounded context 节点 |
| PRD Step | → Canvas **中栏**（type: `flow`） | business flow 步骤节点 |
| PRD Requirement | → Canvas **右栏**（type: `design`） | 设计详情节点 |
| 同步方向 | **单向同步**：PRD 变更 → Canvas 更新 | Canvas 编辑不影响 PRD |
| 触发延迟 | < 1s | PRD change → canvas update |

### 9.6 Epic E06 — Canvas 错误边界完善

| 约束项 | 值 | 备注 |
|--------|----|------|
| 包裹位置 | DDSCanvasPage **外层**包裹 ErrorBoundary | 不在内层单独包裹 |
| Fallback 内容 | **必须**包含 "重试" 按钮 | 点击后 `resetErrorBoundary()` 恢复组件 |
| 组件标记 | 必须 `"use client"` | ErrorBoundary 组件需要客户端 hydration |
| 测试方法 | 模拟 `throw new Error()` 触发 | 验证 Fallback 渲染 + 重试恢复 |

### 9.7 Epic E07 — MCP Server 集成完善

| 约束项 | 值 | 备注 |
|--------|----|------|
| 健康检查响应 | `{ status: "ok", timestamp: "..." }` | ISO 8601 时间戳格式 |
| 工具注册路径 | `/packages/mcp-server/` | 独立包，Node.js 实现 |
| 集成测试 | `tests/e2e/mcp-integration.spec.ts` | Playwright E2E，验证工具注册 |
| 配置文档 | `docs/mcp-claude-desktop-setup.md` | 更新简化步骤 |

---

## 10. 验收标准速查表

| Epic | 功能点 | 验收标准（摘要） | 页面集成 |
|------|--------|-----------------|----------|
| E01 | PresenceLayer 合并 | CanvasPage rendered, PresenceLayer mounted | CanvasPage |
| E01 | 实时节点同步 | node update within 500ms, last-write-wins | CanvasPage |
| E01 | Firebase 凭证 | .env.staging 含 FIREBASE_*, 连接无 error | — |
| E02 | 虚拟化列表 | DOM nodes ~20 for 300-item list, Lighthouse >= 85 | DDSCanvasPage |
| E02 | Memo 优化 | tsc --noEmit exit 0, 子组件 React.memo | DDSCanvasPage |
| E03 | /api/ai/clarify | POST → 200, timeout 30s 降级 | — |
| E03 | ClarifyAI 组件 | 结果可编辑确认，不阻断 Onboarding | ClarifyStep |
| E04 | CRUD API | POST → 201, PUT → 200, DELETE → GET 404 | — |
| E04 | 模板 Dashboard | /dashboard/templates 可访问, 功能完整 | /dashboard/templates |
| E05 | from-prd API | nodes.length > 0, chapter → 左栏节点 | — |
| E05 | 一键生成 | button click → 1s 内 canvas 填充 | PRD Editor + Canvas |
| E06 | ErrorBoundary | Fallback 含 "重试" 按钮，点击恢复无页面刷新 | DDSCanvasPage |
| E07 | 健康检查 | GET → 200, { status, timestamp } | — |
| E07 | 集成测试 | mcp-integration.spec.ts passes | — |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint28
- **执行日期**: 2026-05-07

---

*本文件由 architect 基于 PRD（prd.md）+ Analyst 报告（analysis.md）产出，用于约束 Sprint 28 团队开发行为。*
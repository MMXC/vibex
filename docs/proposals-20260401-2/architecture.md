# Architecture: proposals-20260401-2 — Sprint 2 落地架构

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**项目**: proposals-20260401-2（vibex）
**状态**: 已完成

---

## 执行摘要

Sprint 2 包含 5 个 Epic，聚焦「消除导出后使用摩擦」+「工程能力固化」：
- **E1** (P0, 6h): 一键部署到 Vercel
- **E2** (P0, 4h): 回滚 SOP + 功能开关
- **E3** (P0, 5h): Zustand Migration 库
- **E4** (P1, 5h): Multi-Framework 导出
- **E5** (P1, 10h): MCP Server 集成

**总工时**: 30h（1.5 周单人）

---

## 1. Tech Stack Decisions

### 1.1 依赖版本选择

| Epic | 依赖 | 版本 | 理由 |
|------|------|------|------|
| E1 | Vercel REST API（直接调用） | `v13` | REST API 文档更完整，SDK 文档滞后；Vercel API 足够稳定 |
| E1 | `node-fetch` | `^3.3` | Cloudflare Workers 不内置 fetch（需 polyfill） |
| E3 | `zustand` | `^5.0` | 已有 `^4.x`，升级到 v5 享受更小 bundle |
| E3 | `zod` | `^3.23` | 已有，schema 验证 migration 输入 |
| E4 | `@babel/parser` | `^7.24` | JSX → Vue SFC 需要 AST 解析 |
| E4 | `@vue/compiler-sfc` | `^3.5` | 生成合规 Vue SFC |
| E5 | `@modelcontextprotocol/sdk` | `^0.5.0` | MCP 官方 SDK，stdio 服务端支持 |
| 全局 | `typescript` | `^5.4` | 已有，workspace 一致 |

**不引入新依赖**（已有）: zod, jest, playwright (via CI)

### 1.2 技术选型决策

| 决策 | 选项 | 选择 | 理由 |
|------|------|------|------|
| Vercel 部署方式 | Vercel SDK vs REST API | **REST API** | 文档完整，无 SDK 版本同步问题，Cloudflare Workers 兼容性更好 |
| MCP Server 打包 | 独立 npm 包 vs monorepo 包 | **独立 npm 包** `@vibex/mcp-server` | 见 ADR-E5-001 |
| Migration 库设计 | Class-based vs Functional | **Functional** | 已有 stores 均为函数式，一致性更高，见 ADR-E3-001 |
| Vue 代码生成 | AST 转换 vs 模板替换 | **AST 转换** | 可靠处理复杂 JSX 结构 |
| Vercel Token 存储 | 数据库 vs Cloudflare KV | **Cloudflare KV** | TTL 支持，边缘读取，无需 Prisma migration |
| Feature Flag 访问 | 运行时读取 vs 构建时注入 | **运行时读取** | 支持动态切换，无需重新部署 |
| 回滚 SOP 形式 | 独立服务 vs 静态文档 | **静态文档** `ROLLBACK_SOP.md` | Sprint 1 教训：过度工程化 SOP 服务增加维护成本 |

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph "Frontend (vibex-fronted) — Next.js 14"
        subgraph "Components"
            ExportPanel["ExportPanel\n(src/components/export/)"]
            DeployButton["DeployButton\n[data-testid='vercel-deploy-btn']"]
            FrameworkToggle["FrameworkToggle\n[data-testid='framework-toggle']"]
        end

        subgraph "Stores (Zustand)"
            designStore["designStore.ts\n(persist + migration lib)"]
            canvasStore["canvasStore.ts\n(persist + migration lib)"]
        end

        subgraph "Feature Flags"
            FF["featureFlags.ts\n(process.env wrapper)"]
        end

        subgraph "Code Generation"
            ReactGen["reactCodeGen.ts"]
            VueGen["vueCodeGen.ts\n(libs/react2vue/)"]
        end
    end

    subgraph "Backend (vibex-backend) — Cloudflare Workers + Hono"
        subgraph "API Routes"
            VercelAuth["/api/vercel/auth\n(OAuth redirect)"]
            VercelCallback["/api/vercel/callback\n(Token exchange)"]
            VercelDeploy["/api/vercel/deploy\n(Proxy to Vercel API)"]
        end

        subgraph "Storage"
            KV["Cloudflare KV\n(userId → Vercel token, TTL)"]
            Prisma["Prisma (SQLite)\nProject, User, FlowData"]
        end
    end

    subgraph "Shared Libraries"
        MigrationLib["libs/canvas-store-migration/\ncreateVersionedStorage()"]
        React2Vue["libs/react2vue-mappings/\nmappings.ts"]
    end

    subgraph "packages (@vibex/mcp-server)"
        MCPServer["@vibex/mcp-server\npackages/mcp-server/"]
        MCPTools["MCP Tools:\ngetProject, getNodes,\ngetFlow, searchComponents"]
    end

    subgraph "External Services"
        VercelAPI["Vercel API\n(api.vercel.com/v13/deployments)"]
        ClaudeDesktop["Claude Desktop\n(claude_desktop_config.json)"]
    end

    subgraph "Documentation"
        ROLLBACK_SOP["docs/process/ROLLBACK_SOP.md"]
        MCP_DOC["docs/mcp-integration.md"]
    end

    %% E1: Vercel Deploy
    ExportPanel -->|"F1.3 DeployButton|click|DeployButton"
    DeployButton -->|"if not auth|VercelAuth"
    VercelAuth -->|"302 redirect|VercelOAuth"
    VercelOAuth["Vercel OAuth 2.0"] -->|"callback|VercelCallback"
    VercelCallback -->|"store token|KV"
    DeployButton -->|"POST /api/vercel/deploy|VercelDeploy"
    VercelDeploy -->|"read token|KV"
    VercelDeploy -->|"POST api.vercel.com/v13/deployments|VercelAPI"
    VercelAPI -->|"deployment URL|VercelDeploy"
    VercelDeploy -->|"{url, id}|DeployButton"
    DeployButton -->|"F1.4 DeployState|DeployState"

    %% E2: Feature Flags + Rollback SOP
    designStore -->|"import|FF"
    canvasStore -->|"import|FF"
    FF -.->|"process.env|NEXT_PUBLIC_FEATURE_*"
    ROLLBACK_SOP -.->|"static doc|Team"

    %% E3: Zustand Migration Library
    designStore -->|"persist|migrationLib"
    canvasStore -->|"persist|migrationLib"
    MigrationLib -->|"CURRENT_STORAGE_VERSION|migrationLib"
    Prisma -.->|"project metadata|FlowData"

    %% E4: Multi-Framework Export
    ExportPanel -->|"React|Vue|FrameworkToggle"
    FrameworkToggle -->|"framework=vue|ReactGen"
    ReactGen -->|"JSX|React2Vue"
    React2Vue -->|"Vue SFC|VueGen"
    VueGen -->|"Vue .vue files|ExportPanel"

    %% E5: MCP Server
    MCPServer -->|"stdio|ClaudeDesktop"
    ClaudeDesktop -->|"MCP protocol|MCPTools"
    MCPTools -->|"read Prisma data|Prisma"
    MCPTools -->|"read KV|KV"
    MCPTools -->|"Project structure|MCPServer"
    MCP_DOC -.->|"install guide|Team"
```

---

## 3. API Definitions

### 3.1 E1 — Vercel Deploy APIs

#### GET `/api/vercel/auth`
发起 Vercel OAuth 授权重定向。

```typescript
// Request
// Query: ?redirect_uri=https://app.vibex.ai/api/vercel/callback

// Response: 302 Redirect
// Location: https://vercel.com/oauth/authorize
//   ?client_id={VERCEL_CLIENT_ID}
//   &redirect_uri={redirect_uri}
//   &scope=deployment+project
//   &response_type=code
```

#### GET `/api/vercel/callback`
交换 Authorization Code 为 Access Token。

```typescript
// Request
// Query: ?code=xxx&state=xxx

// Response: 200 OK
interface VercelCallbackResponse {
  success: true;
  teamId: string;
  teamName: string;
}

// Error: 400 | 401
interface VercelCallbackError {
  success: false;
  error: string;
}
```

#### POST `/api/vercel/deploy`
代理部署请求到 Vercel API（token 不暴露前端）。

```typescript
// Request
interface VercelDeployRequest {
  projectName: string;       // e.g. "vibex-project-abc123"
  zipData: string;           // base64-encoded ZIP file
  teamId?: string;           // optional, from stored token
}

// Response: 200 OK
interface VercelDeployResponse {
  success: true;
  url: string;               // e.g. "https://vibex-project-abc123.vercel.app"
  id: string;                // Vercel deployment ID
  status: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
  createdAt: string;         // ISO timestamp
}

// Error: 400 | 500
interface VercelDeployError {
  success: false;
  error: string;
  code?: 'TOKEN_EXPIRED' | 'DEPLOY_TIMEOUT' | 'RATE_LIMITED' | 'INVALID_ZIP';
}

// Internal: calls Vercel REST API
// POST https://api.vercel.com/v13/deployments
// Headers: Authorization: Bearer {token}
```

#### GET `/api/vercel/status`
查询部署状态。

```typescript
// Request
// Query: ?deploymentId=xxx

// Response: 200 OK
interface VercelStatusResponse {
  id: string;
  url: string;
  status: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyAt?: string;
  error?: { code: string; message: string };
}
```

### 3.2 E2 — Feature Flags API

```typescript
// src/utils/featureFlags.ts

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return process.env[`NEXT_PUBLIC_FEATURE_${flag}`] === 'true';
}

export function getFeatureFlag(flag: FeatureFlag, defaultValue: boolean = false): boolean {
  const val = process.env[`NEXT_PUBLIC_FEATURE_${flag}`];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return defaultValue;
}

export type FeatureFlag =
  | 'MULTI_FRAMEWORK_VUE'
  | 'VERCEL_DEPLOY'
  | 'MCP_SERVER'
  | 'ROLLBACK_MODE'
  | string;  // open-ended for future flags

// Usage in components:
// if (isFeatureEnabled('MULTI_FRAMEWORK_VUE')) { ... }
```

### 3.3 E3 — Zustand Migration Library API

```typescript
// libs/canvas-store-migration/index.ts

export const CURRENT_STORAGE_VERSION: number;

export interface MigrationFn<T = unknown> {
  (state: T): T;
}

export interface VersionedStorageOptions<T = unknown> {
  /** Target version after all migrations */
  version: number;
  /** Migration functions keyed by target version.
   *  Key = target version number, Value = migration function from (version-1) → version
   *  Example: { 2: (s) => ({...s, count: s.count * 10}) }
   *  means migration to reach version 2 */
  migrations: Partial<Record<number, MigrationFn<T>>>;
  /** Optional logger for debugging */
  logger?: {
    info: (msg: string, context?: Record<string, unknown>) => void;
    warn: (msg: string, context?: Record<string, unknown>) => void;
  };
}

export interface VersionedStorage<T = unknown> {
  /** Get item from storage, running migrations if needed */
  getItem: (key: string, rawValue: string | null) => T | null;
  /** Set item to storage, preserving version metadata */
  setItem: (key: string, value: T) => string;
  /** Remove item */
  removeItem: (key: string) => void;
  /** Manual migration trigger (for testing) */
  migrate: (state: T, fromVersion: number) => T;
}

export function createVersionedStorage<T = unknown>(
  options: VersionedStorageOptions<T>
): VersionedStorage<T>;

// Validation schemas (using zod)
export const MigrationStateSchema: z.ZodType<{
  [key: string]: unknown;
  _version: number;
}>;
```

### 3.4 E4 — React2Vue Mapping API

```typescript
// libs/react2vue-mappings/index.ts

export interface ComponentMapping {
  vueTag: string;                    // e.g., "Button", "Input"
  importFrom?: string;               // e.g., "@headlessui/vue", "vue"
  propsTransform?: (props: Record<string, unknown>) => Record<string, unknown>;
  childrenTransform?: (children: React.ReactNode) => string;
  styleTransform?: (css: string) => string;  // CSS → scoped CSS
}

export const REACT_VUE_MAPPINGS: Record<string, ComponentMapping>;

// Main transformation function
export function reactJsxToVueSfc(
  componentName: string,
  jsxSource: string,
  options?: {
    addScopedStyles?: boolean;
    targetVueVersion?: 3;
  }
): string;  // Returns Vue SFC source code

// Individual transformers
export function transformReactProps(props: Record<string, unknown>): Record<string, unknown>;
export function transformVueTemplate(jsxSource: string): string;  // JSX → template
export function transformVueScriptSetup(jsxSource: string): string;  // JSX → script setup
export function transformVueStyles(css: string): string;  // CSS → scoped CSS
```

### 3.5 E5 — MCP Server Tools API

```typescript
// packages/mcp-server/src/server.ts

// MCP Tool: getProject
interface GetProjectRequest {
  projectId: string;
}

interface GetProjectResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  flowCount: number;
}

// MCP Tool: getNodes
interface GetNodesRequest {
  projectId: string;
  nodeType?: 'domain-entity' | 'value-object' | 'aggregate' | 'domain-event';
}

interface GetNodesResponse {
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    properties: Record<string, unknown>;
    position?: { x: number; y: number };
  }>;
}

// MCP Tool: getFlow
interface GetFlowRequest {
  projectId: string;
}

interface GetFlowResponse {
  flow: {
    nodes: Array<{ id: string; type: string; data: unknown }>;
    edges: Array<{ id: string; source: string; target: string; label?: string }>;
  };
  metadata: {
    totalNodes: number;
    totalEdges: number;
  };
}

// MCP Tool: searchComponents
interface SearchComponentsRequest {
  projectId: string;
  query: string;
  limit?: number;
}

interface SearchComponentsResponse {
  components: Array<{
    id: string;
    type: string;
    name: string;
    code?: string;
    previewUrl?: string;
  }>;
}

// Server entry
export function createMCPServer(config: {
  databaseUrl?: string;  // Prisma SQLite path
  kvNamespace?: KVNamespace;
}): Promise<{
  server: McpServer;
  tools: Tool[];
}>;
```

---

## 4. Data Model

### 4.1 New Prisma Models

**File**: `vibex-backend/prisma/schema.prisma`（additions only）

```prisma
// Existing models (User, Project, etc.) remain unchanged

model VercelConnection {
  id           String   @id @default(cuid())
  userId       String   @unique
  teamId       String   // Vercel team ID
  teamName     String
  accessToken  String   // Encrypted, stored server-side only
  refreshToken String?  // Encrypted, for token refresh
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// Note: Deployment metadata stored by Vercel, no need to replicate
// Frontend stores: { projectName, deploymentUrl, deploymentId } in localStorage
```

**No new Prisma models required for E2, E3, E4, E5**:
- E2 (Feature Flags): env vars, no DB
- E3 (Migration Lib): version metadata in localStorage/IndexedDB via Zustand persist
- E4 (Multi-Framework): transformation is stateless, no persistence
- E5 (MCP Server): reads existing Project/UINode/FlowData models

### 4.2 Cloudflare KV Schema

**Namespace**: `VERCEL_TOKENS` (per-user token storage)

```
Key:   {userId}                    (e.g., "user_abc123")
Value: JSON string
{
  "teamId": "team_xxx",
  "accessToken": "xxx",            // encrypted with Cloudflare KV secret
  "refreshToken": "xxx",          // optional
  "expiresAt": 1743571200000,     // TTL timestamp (epoch ms)
  "createdAt": "2026-04-01T00:00:00Z"
}
TTL: 90 days (7776000 seconds)
```

### 4.3 Zustand Storage Schema (E3)

**Key**: `design-storage` (in localStorage/IndexedDB via Zustand persist)

```typescript
interface PersistedDesignState {
  // ... actual state fields
  _version: number;            // CURRENT_STORAGE_VERSION (from migration lib)
  _lastMigratedAt: string;   // ISO timestamp
}
```

**Migration Library Internal State** (in library only, not stored):

```typescript
interface MigrationContext {
  currentVersion: number;      // from CURRENT_STORAGE_VERSION
  targetVersion: number;      // from options.version
  appliedMigrations: number[]; // versions already applied
}
```

### 4.4 MCP Server Data Access

MCP Server reads existing Prisma models (no new models):

```prisma
// Read by MCP tools (existing models)
Project        → getProject
UINode         → getNodes (filtered by projectId)
FlowData       → getFlow
BusinessDomain → searchComponents (name/description search)
```

---

## 5. Testing Strategy

### 5.1 Test Framework & Tooling

| 层级 | 框架 | 工具 | 目标 |
|------|------|------|------|
| 单元测试 | Jest | `jest --coverage` | E3 库, E4 映射表, E5 工具函数 |
| 集成测试 | Jest | `@jest/globals` + Prisma | E1 API routes, E3 store migration |
| E2E 测试 | Playwright | `@playwright/test` | E1 部署流程, E4 Vue 组件渲染 |
| 手动验证 | — | — | E5 Claude Desktop 连接 |

### 5.2 Coverage Requirements

| Epic | 文件/模块 | 覆盖率目标 |
|------|-----------|-----------|
| E1 | `src/app/api/vercel/*.ts` | ≥ 80% 分支 |
| E3 | `libs/canvas-store-migration/**/*.ts` | **≥ 80%** (DoD 强制) |
| E4 | `libs/react2vue-mappings/**/*.ts` | **≥ 80%** (DoD 强制) |
| E4 | `components/react2vue/**/*.ts` | ≥ 60% |
| E5 | `packages/mcp-server/src/**/*.ts` | ≥ 70% |

### 5.3 Key Test Case Examples

#### E1: Vercel Deploy

```typescript
// e1-auth.test.ts — Unit test
describe('Vercel Auth', () => {
  test('OAuth URL contains required params', () => {
    const url = buildVercelOAuthUrl({ redirectUri: 'https://app.vibex.ai/callback' });
    expect(url).toContain('vercel.com/oauth/authorize');
    expect(url).toMatch(/client_id=\w+/);
    expect(url).toMatch(/scope=deployment/);
  });

  test('token storage uses userId as key', async () => {
    const kv = createMockKV();
    await storeVercelToken(kv, 'user_123', { accessToken: 'tok_xxx' });
    const stored = await kv.get('user_123');
    expect(stored.accessToken).toBe('tok_xxx');
  });
});

// e1-deploy.e2e.ts — E2E test
test('Deploy button visible and deploys within 60s', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="export-btn"]');
  await expect(page.locator('[data-testid="vercel-deploy-btn"]')).toBeVisible();

  await page.click('[data-testid="vercel-deploy-btn"]');
  await expect(page.locator('[data-testid="deploy-spinner"]')).toBeVisible();

  const start = Date.now();
  await page.waitForSelector('[data-testid="deploy-url"]', { timeout: 65000 });
  expect(Date.now() - start).toBeLessThan(60000);

  const url = await page.textContent('[data-testid="deploy-url"]');
  expect(url).toMatch(/https:\/\/.+\.vercel\.app/);
});
```

#### E2: Feature Flags

```typescript
// e2-feature-flags.test.ts
describe('Feature Flags', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_MULTI_FRAMEWORK_VUE', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_VERCEL_DEPLOY', 'false');
  });

  test('isFeatureEnabled returns true for enabled flag', () => {
    expect(isFeatureEnabled('MULTI_FRAMEWORK_VUE')).toBe(true);
  });

  test('isFeatureEnabled returns false for disabled flag', () => {
    expect(isFeatureEnabled('VERCEL_DEPLOY')).toBe(false);
  });

  test('getFeatureFlag returns default when env var not set', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_NEW_FLAG', '');
    expect(getFeatureFlag('NEW_FLAG', true)).toBe(true);
  });
});
```

#### E3: Zustand Migration Library

```typescript
// migration.test.ts
describe('createVersionedStorage', () => {
  test('exports a function', () => {
    expect(typeof createVersionedStorage).toBe('function');
  });

  test('migrates from v1 to v2 automatically on getItem', () => {
    const storage = createVersionedStorage<{ count: number }>({
      version: 2,
      migrations: {
        2: (s) => ({ ...s, count: s.count * 10, _version: 2 })
      }
    });

    const raw = JSON.stringify({ count: 5, _version: 1 });
    const result = storage.getItem('key', raw);
    expect(result?.count).toBe(50); // 5 * 10
    expect(result?._version).toBe(2);
  });

  test('chains multiple migrations v1→v2→v3', () => {
    const storage = createVersionedStorage({
      version: 3,
      migrations: {
        2: (s) => ({ ...s, count: s.count * 10, _version: 2 }),
        3: (s) => ({ ...s, label: 'migrated', _version: 3 })
      }
    });

    const raw = JSON.stringify({ count: 5, _version: 1 });
    const result = storage.getItem('key', raw);
    expect(result.count).toBe(50);
    expect(result.label).toBe('migrated');
    expect(result._version).toBe(3);
  });

  test('handles unknown version gracefully', () => {
    const storage = createVersionedStorage({ version: 2, migrations: {} });
    expect(() => storage.migrate({ count: 0 }, 99))
      .toThrow(/Unknown migration path/);
  });

  test('CURRENT_STORAGE_VERSION is exported', () => {
    expect(typeof CURRENT_STORAGE_VERSION).toBe('number');
    expect(CURRENT_STORAGE_VERSION).toBeGreaterThan(0);
  });
});

// integration: epic6 store uses library
test('Epic6 store uses migration library (no inline CURRENT_STORAGE_VERSION)', () => {
  const storeContent = readFileSync('stores/epic6-canvas.ts', 'utf-8');
  const allMatches = storeContent.match(/CURRENT_STORAGE_VERSION\s*=\s*[0-9]+/g) || [];
  // Should NOT have inline version definition — should import from library
  expect(allMatches.filter(m => !m.includes('canvas-store-migration')).length).toBe(0);
});
```

#### E4: Multi-Framework Export

```typescript
// react2vue-mappings.test.ts
describe('React to Vue Mappings', () => {
  test('Button mapping exists and has required fields', () => {
    expect(REACT_VUE_MAPPINGS.Button).toBeDefined();
    expect(REACT_VUE_MAPPINGS.Button.vueTag).toBe('Button');
  });

  test('Card mapping uses div fallback', () => {
    expect(REACT_VUE_MAPPINGS.Card.vueTag).toBe('div');
    expect(REACT_VUE_MAPPINGS.Card.propsTransform).toBeDefined();
  });
});

describe('reactJsxToVueSfc', () => {
  test('transforms basic Button component to Vue SFC', () => {
    const vue = reactJsxToVueSfc('MyButton', `<Button variant="primary">Click</Button>`);
    expect(vue).toContain('<template>');
    expect(vue).toContain('<script setup>');
    expect(vue).toContain('<style scoped>');
    expect(vue).toContain('<Button variant="primary">Click</Button>');
  });

  test('adds scoped CSS wrapper', () => {
    const vue = reactJsxToVueSfc('Card', `<div className="card">Content</div>`, {
      addScopedStyles: true
    });
    expect(vue).toContain('<style scoped>');
  });
});

// E2E: Vue components render in test app
test('Button renders in Vue test app', async ({ page }) => {
  await page.goto('/vue-test-app');
  await page.click('[data-testid="vibex-btn"]');
  await expect(page.locator('.toast')).toBeVisible();
});
```

#### E5: MCP Server

```typescript
// mcp-server.test.ts
describe('@vibex/mcp-server', () => {
  test('package.json name is @vibex/mcp-server', () => {
    const pkg = JSON.parse(readFileSync('packages/mcp-server/package.json', 'utf-8'));
    expect(pkg.name).toBe('@vibex/mcp-server');
  });

  test('tools include all required MCP tools', () => {
    const { tools } = require('@vibex/mcp-server');
    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain('getProject');
    expect(toolNames).toContain('getNodes');
    expect(toolNames).toContain('getFlow');
    expect(toolNames).toContain('searchComponents');
  });

  test('getProject returns project structure', async () => {
    const { tools } = require('@vibex/mcp-server');
    const getProject = tools.find((t: any) => t.name === 'getProject');
    const result = await getProject.handler({ projectId: 'test-project' });
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('status');
  });

  test('searchComponents returns matching components', async () => {
    const { tools } = require('@vibex/mcp-server');
    const search = tools.find((t: any) => t.name === 'searchComponents');
    const result = await search.handler({ projectId: 'test', query: 'Button' });
    expect(Array.isArray(result.components)).toBe(true);
  });
});
```

### 5.4 Rollback SOP Coverage

```typescript
// e2-rollback-sop.test.ts
describe('ROLLBACK_SOP.md coverage', () => {
  test('SOP document exists with >= 5 scenarios', () => {
    const doc = readFileSync('docs/process/ROLLBACK_SOP.md', 'utf-8');
    const scenarios = doc.match(/^### Scenario \d+/gm) || [];
    expect(scenarios.length).toBeGreaterThanOrEqual(5);
  });

  test('SOP covers: deploy failure, migration failure, feature flag misfire', () => {
    const doc = readFileSync('docs/process/ROLLBACK_SOP.md', 'utf-8');
    expect(doc.toLowerCase()).toContain('deploy');
    expect(doc.toLowerCase()).toContain('migration');
    expect(doc.toLowerCase()).toContain('feature');
  });
});
```

---

## 6. ADR — Architecture Decision Records

### ADR-E5-001: MCP Server Package Location

**Status**: Accepted

**Context**:
MCP Server 可以作为 monorepo 内的一个 workspace 包（`packages/mcp-server`），也可以发布为独立的 npm 包（`@vibex/mcp-server`）。Claude Desktop 连接需要通过 `claude_desktop_config.json` 引用本地安装的包。

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A: Monorepo package | `packages/mcp-server/` in vibex repo | Single repo, easy cross-repo access | Claude Desktop 无法直接引用本地路径 |
| B: Standalone npm | Publish `@vibex/mcp-server` to npm | Claude Desktop 易于配置 `npx` 安装 | 需维护独立版本发布流程 |
| C: GitHub tarball | Reference GitHub raw tarball URL | 无需 npm publish | URL 格式复杂，版本管理困难 |

**Decision**: Option B — **Standalone npm package `@vibex/mcp-server`**

**Rationale**:
1. Claude Desktop `claude_desktop_config.json` 配置简单: `npx @vibex/mcp-server` 即可启动
2. 独立版本管理，与 frontend/backend 解耦
3. MCP 协议可能快速迭代，独立包便于 breaking change 版本控制
4. npm publish 是工程标准，成本可接受（~3min）

**Consequences**:
- ✅ Claude Desktop 用户安装简单: `npm install -g @vibex/mcp-server`
- ✅ Protocol isolation: MCP breaking changes 不影响主应用
- ⚠️ 需要额外的 CI pipeline 发布 npm 包
- ⚠️ 需要维护 `@vibex/mcp-server` package.json 独立依赖

---

### ADR-E3-001: Migration Library Design — Class vs Functional

**Status**: Accepted

**Context**:
Zustand stores 已有迁移模式（Sprint 1 Epic6/7），需要封装为可复用库。设计选项：Class-based (OOP) vs Functional (FP)。

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A: Class-based | `class VersionedStorage { migrate() {} }` | Methods discoverable, `this` context | 需 `new` 实例，增加 bundle size |
| B: Functional | `createVersionedStorage(options)` returns object | Tree-shakeable, no `new`, composable | Less discoverable for some devs |
| C: HOC | `withVersioning(Store)` HOC wrapper | Works with existing store patterns | HOC 增加嵌套层级 |

**Decision**: Option B — **Functional API (`createVersionedStorage`)**

**Rationale**:
1. **Tree-shaking**: Functional factory 不需要实例化，不增加 runtime 开销
2. **Bundle size**: Zustand 已有 `create()` 模式，开发者熟悉 factory pattern
3. **Type safety**: TypeScript inference 更好，无需泛型类继承
4. **Existing patterns**: 已有 stores 使用 `create()` from Zustand，保持一致

**Consequences**:
- ✅ 小 bundle size，Cloudflare Workers 冷启动更快
- ✅ 类型推断自然，IDE autocomplete 友好
- ✅ 与 Zustand persist middleware 集成简单
- ⚠️ 需要开发者理解闭包/工厂模式（低学习成本）

---

## 7. File Structure

```
vibex/
├── vibex-fronted/                          # Frontend (Next.js 14)
│   └── src/
│       ├── app/api/
│       │   └── vercel/
│       │       ├── auth/route.ts           # GET /api/vercel/auth
│       │       ├── callback/route.ts       # GET /api/vercel/callback
│       │       ├── deploy/route.ts        # POST /api/vercel/deploy
│       │       └── status/route.ts         # GET /api/vercel/status
│       ├── components/export/
│       │   ├── ExportPanel.tsx             # Main export panel
│       │   ├── DeployButton.tsx           # F1.3 Deploy button
│       │   ├── DeployState.tsx             # F1.4 Deploy status UI
│       │   └── FrameworkToggle.tsx         # F4.2 React/Vue toggle
│       ├── stores/
│       │   ├── designStore.ts              # Uses persist + migration lib
│       │   ├── canvasStore.ts             # Uses persist + migration lib
│       │   └── onboardingStore.ts         # Uses persist
│       └── utils/
│           └── featureFlags.ts            # F2.2 Feature flag wrapper
│
├── vibex-backend/                          # Backend (Cloudflare Workers)
│   ├── prisma/
│   │   └── schema.prisma                   # + VercelConnection model
│   └── src/
│       ├── vercel/
│       │   ├── oauth.ts                    # Vercel OAuth logic
│       │   ├── deploy.ts                  # Deploy proxy logic
│       │   └── kv.ts                      # KV token storage
│       └── mcp/
│           └── server.ts                  # (optional, or in packages/)
│
├── libs/                                    # Shared libraries
│   └── canvas-store-migration/
│       ├── index.ts                        # createVersionedStorage()
│       ├── CURRENT_STORAGE_VERSION.ts      # Single source of truth for version
│       ├── __tests__/
│       │   └── migration.test.ts
│       └── package.json
│
├── packages/                                # Standalone packages
│   └── mcp-server/                         # @vibex/mcp-server
│       ├── src/
│       │   ├── server.ts                  # MCP server entry
│       │   ├── tools/
│       │   │   ├── getProject.ts
│       │   │   ├── getNodes.ts
│       │   │   ├── getFlow.ts
│       │   │   └── searchComponents.ts
│       │   └── index.ts                    # exports tools[]
│       ├── package.json                    # name: "@vibex/mcp-server"
│       ├── tsconfig.json
│       ├── jest.config.js
│       └── __tests__/
│
├── docs/
│   ├── proposals-20260401-2/
│   │   ├── prd.md
│   │   ├── analysis.md
│   │   ├── architecture.md                 # ← This file
│   │   └── specs/
│   │       ├── e1-vercel-deploy.md
│   │       ├── e2-rollback-sop.md
│   │       ├── e3-zustand-migration.md
│   │       ├── e4-multi-framework.md
│   │       └── e5-mcp-integration.md
│   ├── process/
│   │   └── ROLLBACK_SOP.md               # F2.1 Rollback SOP document
│   └── mcp-integration.md                 # F5.3 MCP integration guide
│
└── claude_desktop_config.json              # Claude Desktop MCP config
```

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: proposals-20260401-2
- **执行日期**: 2026-04-01

# 架构设计：VibeX 文档健康度修复

**项目**: vibex-doc-health-fix-20260328
**任务**: design-architecture (architect)
**创建时间**: 2026-03-28 13:45 GMT+8
**Architect**: subagent (coord dispatch)
**工作目录**: /root/.openclaw/vibex

---

## 1. 架构目标

两个 Epic 的技术架构方案：

| Epic | 目标 | 核心架构决策 |
|------|------|------------|
| **E1** | API Contract 从 14 路径扩展至 51+ 路径 | CLI 驱动 YAML 生成 + CI 验证 |
| **E2** | 归档 47 个废弃文档 | 分类归档 + README 同步 |

---

## 2. Epic 1：API Contract 重建

### 2.1 路径标准化策略

**现状分析**：
- 后端 Hono server：`/api/...` 路由 + `/api/v1/...` gateway
- 前端 API 模块：直接调用相对路径（如 `/auth/me`、`/flow/generate`）
- 当前 yaml：`/api/...` 前缀（旧格式）

**决策：统一 `/api/v1/` 前缀**

| 层级 | 现状 | 目标 |
|------|------|------|
| API Contract paths | `/auth/login` | `/api/v1/auth/login` |
| 前端 httpClient.baseUrl | 空（相对路径） | `/api/v1` |
| 后端 `/api/...` 路由 | 保留（兼容旧） | 保留，gateway 代理 |
| 后端 `/api/v1/...` 路由 | 已存在 | 主路径 |

**原因**：
1. PRD 明确要求 v1 前缀统一
2. Hono gateway 已在 `/api/v1` 注册，无需改动后端路由注册
3. 前端 httpClient 只需改 baseUrl，无需逐文件修改
4. 契约文档有了版本边界，未来 v2 可平滑演进

### 2.2 CLI 工具链架构

```
scripts/
├── extract-backend-routes.ts      # E1-S1.1: 提取后端完整路由清单
├── extract-frontend-calls.ts      # E1-S1.2: 提取前端实际调用清单
├── generate-api-contract.ts       # E1-S1.3: 生成新版 api-contract.yaml
├── validate-api-contract.ts       # E1-S1.4: YAML 格式与覆盖率验证
└── archive-docs.ts                # E2-S2.x: 文档归档脚本
```

#### 2.2.1 `extract-backend-routes.ts`

**职责**：扫描后端所有路由文件，生成结构化路由清单

**输入**：`vibex-backend/src/routes/*.ts`

**处理逻辑**：
1. 解析每个路由文件的 `router.get/post/put/delete()` 调用
2. 读取 Hono `index.ts` 的 `app.route('/api/...')` 注册顺序，推断完整路径
3. 对齐 `/api/` vs `/api/v1/` 双写，统一输出 `/api/v1/xxx` 格式
4. 输出 JSON 清单

**输出格式**：
```json
{
  "generatedAt": "2026-03-28T...",
  "totalRoutes": 90,
  "routes": [
    {
      "path": "/api/v1/auth/login",
      "method": "POST",
      "file": "vibex-backend/src/routes/auth/login.ts",
      "group": "Auth",
      "summary": "用户登录",
      "description": "...",
      "requestSchema": "LoginRequest",
      "responseSchema": "AuthResponse",
      "authenticated": true,
      "frontendStatus": "implemented" // implemented | missing | unknown
    }
  ]
}
```

#### 2.2.2 `extract-frontend-calls.ts`

**职责**：扫描前端 API 模块，提取所有实际 HTTP 调用

**输入**：`vibex-fronted/src/services/api/modules/*.ts`

**处理逻辑**：
1. 解析 `httpClient.get/post/put/delete()` 调用
2. 提取 path 模板（如 `/requirements/{id}/analyze`）
3. 交叉对比后端路由，标注 `✅ 对齐` / `❌ 缺口` / `🔧 后端独有`
4. 输出 JSON 清单

**输出格式**：
```json
{
  "generatedAt": "2026-03-28T...",
  "totalCalls": 51,
  "calls": [
    {
      "path": "/auth/me",
      "method": "GET",
      "file": "vibex-fronted/src/services/api/modules/auth.ts",
      "frontendStatus": "✅ 对齐",
      "backendRoute": "/api/v1/auth/me",
      "contractStatus": "missing" // present | missing
    }
  ]
}
```

#### 2.2.3 `generate-api-contract.ts`

**职责**：基于两个清单，生成完整 OpenAPI YAML

**处理逻辑**：
1. 读取 `backend-routes.json` + `frontend-calls.json`
2. 优先保留现有 yaml 中已有的正确定义（`/api/v1/` 格式）
3. 追加所有 `frontendStatus=implemented` 但 `contractStatus=missing` 的路径
4. 按功能域分组组织 paths
5. 自动生成缺失的 schemas（基础字段推断）
6. 输出 `api-contract.yaml`

**Schema 命名规范**（按功能域分组）：

```
components/schemas/
  # Auth
  LoginRequest, RegisterRequest, AuthResponse, UserToken
  # User
  User, UserUpdate, UserProfile
  # Project
  Project, ProjectCreate, ProjectUpdate, ProjectRole, DeletedProject
  # Page
  Page, PageCreate, PageUpdate, PageContent
  # Message
  Message, MessageCreate
  # Agent
  Agent, AgentCreate, AgentUpdate
  # Flow
  FlowData, FlowDataUpdate, FlowGenerateRequest, FlowDerivationRequest
  # Requirements
  Requirement, RequirementCreate, RequirementUpdate, RequirementAnalysis, Clarification, Domain
  # DDD
  BoundedContext, BusinessFlow, DomainModel
  # Diagnosis
  DiagnosisRequest, DiagnosisResponse, DiagnosisOptimization
  # Design
  DesignSession, DesignSessionCreate
  # Prototype
  PrototypeSnapshot, PrototypeGenerateRequest
  # Entity Relations
  EntityRelation, EntityDerivationRequest
  # Common
  SuccessResponse, ErrorResponse, Pagination, PaginatedResponse
```

#### 2.2.4 `validate-api-contract.ts`

**职责**：CI 级别的 YAML 验证

**验证维度**：

| 验证项 | 检查逻辑 |
|--------|---------|
| YAML 可解析 | `yaml.parse()` 不抛异常 |
| OpenAPI 版本 | `openapi` 字段为 `3.0.x` 或 `3.1.x` |
| 路径数量 | `Object.keys(paths).length >= 51` |
| v1 前缀规范 | 所有路径以 `/api/v1/` 开头，无 `/api/auth/` 双写 |
| 路径参数格式 | 符合 `{paramName}` 规范 |
| Schema 完整性 | 所有 `$ref` 引用均有对应 schema |
| 必需字段 | 每个 operation 有 `summary` + `description` |
| 前端覆盖率 | 所有前端调用路径存在于 paths |
| HTTP 方法 | GET/POST/PUT/DELETE/OPTIONS 合法 |

**Exit codes**：
- `0` — 全部通过
- `1` — 验证失败，打印详细错误

### 2.3 Schema $ref 复用策略

为避免 schema 膨胀，采用三层复用：

```
Tier 1 (通用): ErrorResponse, SuccessResponse, Pagination, PaginatedResponse
Tier 2 (领域): Project, User, Agent (核心业务实体)
Tier 3 (操作): ProjectCreate, ProjectUpdate, LoginRequest (操作特定)
```

每个 operation 只引用必要的 schema，不重复定义字段。

### 2.4 前端 API Client 改造

**改动范围**：`vibex-fronted/src/services/api/client.ts`

```ts
// Before
const httpClient = createHttpClient({ baseUrl: '' });

// After
const httpClient = createHttpClient({ baseUrl: '/api/v1' });
```

**影响分析**：所有模块内路径自动追加 `/api/v1` 前缀，一次改动全链路生效。

---

## 3. Epic 2：文档归档

### 3.1 归档目录结构

```
docs/
├── archive/
│   └── 202603-stale/          # 本次归档（2026-03）
│       ├── README.md           # 归档清单与说明
│       ├── tester-checklist/   # 7个 P0 文件
│       │   ├── tester-checklist-coord-workflow-improvement.md
│       │   ├── tester-checklist-domain-model-crash-fix.md
│       │   ├── tester-checklist-navbar-projects-fix.md
│       │   ├── tester-checklist-vibex-domain-model-crash.md
│       │   ├── tester-checklist-vibex-domain-model-render-fix-v2.md
│       │   ├── tester-checklist-vibex-issue-knowledge-base.md
│       │   └── tester-checklist-vibex-template-ecosystem.md
│       ├── homepage/            # 20个 首页迭代类项目目录
│       ├── domain-model/        # 5个 域名模型修复类
│       ├── api/                # 6个 API 修复类
│       ├── security/            # 4个 安全修复类
│       ├── test-infra/          # 5个 测试基础设施类
│       ├── proposals/           # 8个 提案/工作流类
│       └── review-reports/      # 30+ 审查报告（20260323）
└── README.md                   # 更新：标注 archive/ 目录用途
```

### 3.2 归档脚本 `archive-docs.ts`

**职责**：自动化归档操作 + 引用链路检查

**处理流程**：
```
1. 扫描 docs/ 下所有子目录
2. 匹配归档清单（来自 analysis.md）
3. 对每个待归档项目：
   a. 检查是否有其他文件引用它（grep docs/README.md、CLAUDE.md 等）
   b. 记录引用点，生成 ref-map.json
   c. 移动到对应 archive/ 子目录
4. 更新 docs/README.md（删除引用 + 添加归档说明）
5. 输出归档报告（移动了哪些、引用是否已清理）
```

**安全红线**：
- 永远只 `mv`，不 `rm`
- 归档前必须有 ref-map 报告
- CLAUDE.md / AGENTS.md 中的引用同步更新

### 3.3 README 更新策略

docs/README.md 更新内容：

```markdown
## 归档目录

已完成项目的文档归档在 `archive/` 目录下：

- `archive/202603-stale/` — 2026年3月归档（47个项目目录 + 7个checklist文件）

> ⚠️ 归档文件仅供历史参考，不再维护。如需查看，请到 archive/ 目录。
```

---

## 4. CI/CD 集成

### 4.1 Pre-commit Hook

```yaml
# .husky/pre-commit 或 package.json scripts
"api-contract:validate": "tsx scripts/validate-api-contract.ts"
"api-contract:extract": "tsx scripts/extract-backend-routes.ts && tsx scripts/extract-frontend-calls.ts"
```

**触发时机**：每次 `git commit` 前运行 `validate-api-contract.ts`

**失败条件**：任一验证项不通过 → commit 被拒绝

### 4.2 GitHub Actions CI

```yaml
# .github/workflows/api-contract.yml
name: API Contract Validation
on:
  push:
    paths:
      - 'vibex-fronted/src/services/api/modules/**'
      - 'vibex-backend/src/routes/**'
      - 'docs/api-contract.yaml'
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm --filter @vibex/api-tools run extract
      - run: pnpm --filter @vibex/api-tools run validate
```

### 4.3 覆盖率追踪

在 `api-contract.yaml` 头部增加元数据：

```yaml
x-metadata:
  generatedAt: "2026-03-28T..."
  frontendCallCoverage: 100/51  # 100% of 51 calls covered
  backendRouteCoverage: 90/90  # 90 backend routes documented
  lastValidatedBy: "validate-api-contract.ts"
  ciCommit: "abc1234"
```

---

## 5. 实施计划

### 5.1 依赖关系图（DAG）

```
[E1-S1.1] extract-backend-routes.ts
  └─→ [E1-S1.3] generate-api-contract.ts
[E1-S1.2] extract-frontend-calls.ts
  └─→ [E1-S1.3] generate-api-contract.ts
[E1-S1.3] api-contract.yaml (generated)
  └─→ [E1-S1.4] validate-api-contract.ts

[E2-S2.1] 创建 archive/ 目录
  ├─→ [E2-S2.2] 归档 tester-checklist
  └─→ [E2-S2.3] 归档项目目录
[E2-S2.2 + E2-S2.3] 归档完成
  └─→ [E2-S2.4] 更新 docs/README.md

E1-S1.4 和 E2-S2.4 可并行执行
```

### 5.2 工时估算

| Story | 任务 | 工时 | 说明 |
|-------|------|------|------|
| E1-S1.1 | extract-backend-routes.ts | 1h | 扫描 ~60 个路由文件 |
| E1-S1.2 | extract-frontend-calls.ts | 1h | 扫描 ~15 个 API 模块 |
| E1-S1.3 | generate-api-contract.ts | 1.5h | YAML 生成逻辑 + schema 推断 |
| E1-S1.4 | validate-api-contract.ts | 30min | 9 维度验证 |
| E2-S2.1 | 创建 archive/ 目录 | 15min | 简单 mkdir |
| E2-S2.2 | 归档 7 个 checklist 文件 | 15min | mv 操作 |
| E2-S2.3 | 归档 40+ 项目目录 | 30min | 批量 mv |
| E2-S2.4 | 更新 docs/README.md | 15min | 文本编辑 |
| **合计** | | **~5h** | **与 PRD 估算一致** |

### 5.3 风险缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 前端 httpClient.baseUrl 改动影响范围大 | 低 | 中 | 先 grep 统计影响文件数，再改 baseUrl |
| 归档后 CLAUDE.md 引用失效 | 中 | 高 | 归档脚本生成 ref-map，提前同步更新 |
| v1 迁移期间后端路由断裂 | 低 | 高 | gateway `/api/v1/` 已存在，不影响旧路由 |

---

## 6. 产物清单

| 产物 | 路径 | Story |
|------|------|-------|
| 后端路由提取器 | `scripts/extract-backend-routes.ts` | E1-S1.1 |
| 前端调用提取器 | `scripts/extract-frontend-calls.ts` | E1-S1.2 |
| API Contract 生成器 | `scripts/generate-api-contract.ts` | E1-S1.3 |
| API Contract 验证器 | `scripts/validate-api-contract.ts` | E1-S1.4 |
| CLI 工具包 | `packages/api-tools/` | E1 全链路 |
| 归档脚本 | `scripts/archive-docs.ts` | E2-S2.x |
| 归档目录 | `docs/archive/202603-stale/` | E2-S2.x |
| 新版 API Contract | `docs/api-contract.yaml` | E1-S1.3 |
| 归档后 README | `docs/README.md` | E2-S2.4 |
| IMPLEMENTATION_PLAN | 见下方第 7 节 | - |

---

## 7. IMPLEMENTATION_PLAN.md

### Phase 1: 路由提取（并行）

**E1-S1.1 + E1-S1.2 可并行执行**

#### Step 1: 创建工具包目录
```bash
mkdir -p packages/api-tools/src
```

#### Step 2: 编写 extract-backend-routes.ts
- 扫描 `vibex-backend/src/routes/*.ts`
- 解析 router 方法调用
- 对齐 Hono index.ts 中的 app.route 注册
- 输出 `backend-routes.json`

#### Step 3: 编写 extract-frontend-calls.ts
- 扫描 `vibex-fronted/src/services/api/modules/*.ts`
- 解析 httpClient 调用
- 输出 `frontend-calls.json`

**验收**：`node scripts/extract-backend-routes.ts` 输出一致，`wc -l backend-routes.json >= 90`

### Phase 2: YAML 生成（依赖 Phase 1）

#### Step 4: 编写 generate-api-contract.ts
- 读取两个 JSON 清单
- 生成 OpenAPI 3.0 YAML
- 输出到 `docs/api-contract.yaml`

**验收**：`node scripts/generate-api-contract.ts && wc -l docs/api-contract.yaml >= 500`

#### Step 5: 前端 baseUrl 改造
- 修改 `vibex-fronted/src/services/api/client.ts` baseUrl → `/api/v1`

**验收**：git diff 显示单文件改动

### Phase 3: 验证与归档

#### Step 6: 编写 validate-api-contract.ts
- 9 维度验证
- exit code 0/1

**验收**：`node scripts/validate-api-contract.ts && echo $? → 0`

#### Step 7: 归档脚本 + 执行
- 创建 `docs/archive/202603-stale/` 及子目录
- 移动 47 个废弃文档
- 生成 ref-map.json
- 更新 docs/README.md

**验收**：`ls docs/archive/202603-stale/ | wc -l >= 47`

### Phase 4: CI/CD

#### Step 8: 添加 pre-commit hook + GitHub Actions
- husky pre-commit: `validate-api-contract.ts`
- `.github/workflows/api-contract.yml`

**验收**：模拟 PR 触发 CI，手动验证

---

## 8. AGENTS.md 任务注入

本次架构方案交付后，建议由 Dev Agent 执行以下工作（按 DAG 顺序）：

```
dev agent → 实现 extract-backend-routes.ts  (E1-S1.1)
dev agent → 实现 extract-frontend-calls.ts  (E1-S1.2)
dev agent → 实现 generate-api-contract.ts    (E1-S1.3)
dev agent → 前端 baseUrl 改造                (E1 附带)
dev agent → 实现 validate-api-contract.ts     (E1-S1.4)
dev agent → 实现 archive-docs.ts + 执行归档   (E2-S2.1~3)
dev agent → 更新 docs/README.md              (E2-S2.4)
dev agent → CI/CD 配置                       (额外)
```

**Architect 签收**：architecture.md 完成，方案闭环，可进入开发阶段。

---

**版本**: 1.0
**状态**: 已完成
**下一步**: coord-decision → 决定是否开启阶段二开发

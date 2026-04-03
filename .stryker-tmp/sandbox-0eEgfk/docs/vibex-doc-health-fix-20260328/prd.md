# PRD: VibeX 文档健康度修复

**项目**: vibex-doc-health-fix-20260328
**任务**: create-prd (pm)
**创建时间**: 2026-03-28 13:36 GMT+8
**PM**: subagent (coord dispatch)
**工作目录**: /root/.openclaw/vibex

---

## 1. 背景与目标

### 1.1 背景

VibeX 项目历经 40+ 迭代周期，积累了严重的技术债务：

| 问题 | 现状 | 目标 |
|------|------|------|
| API Contract 与实现脱节 | YAML 仅 14 端点，后端有 90 路由，前端调用 51 路径 | 100% 对齐 |
| 废弃文档堆积 | 47 个废弃文档散布在 docs/ 目录 | 归档率 100% |

### 1.2 目标

1. **重建 api-contract.yaml**，使契约覆盖 100% 的前端实际调用
2. **归档废弃文档**，将 47 个废弃文档移入 `docs/archive/202603-stale/`

---

## 2. Epic & Story 拆分

---

### Epic 1: API Contract 重建 (E1)

**目标**: 将 api-contract.yaml 从 14 端点扩展至覆盖 51 个前端调用路径

---

#### Story 1.1: 提取后端路由完整清单

| 字段 | 值 |
|------|-----|
| **Story ID** | E1-S1.1 |
| **标题** | 提取后端路由完整清单并分类 |
| **工作目录** | /root/.openclaw/vibex |
| **验收标准** | |

```js
// 验收测试: E1-S1.1
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs/vibex-doc-health-fix-20260328');

// 期望: 存在后端路由清单文件
expect(fs.existsSync(path.join(docsDir, 'backend-routes.md'))).toBe(true);

// 期望: 清单包含 90+ 条路由记录
const routes = fs.readFileSync(path.join(docsDir, 'backend-routes.md'), 'utf-8');
const routeMatches = routes.match(/\|\s*[\/`]/g);
expect(routeMatches.length).toBeGreaterThanOrEqual(90);

// 期望: 清单按功能领域分组（认证、项目、页面、Agent、消息等）
const groups = ['认证', '项目管理', '页面管理', 'Agent', '消息', 'DDD', '诊断', '生成'];
groups.forEach(group => {
  expect(routes).toContain(group);
});
```

---

#### Story 1.2: 提取前端 API 调用清单

| 字段 | 值 |
|------|-----|
| **Story ID** | E1-S1.2 |
| **标题** | 提取前端 API 调用完整清单 |
| **工作目录** | /root/.openclaw/vibex |
| **验收标准** | |

```js
// 验收测试: E1-S1.2
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs/vibex-doc-health-fix-20260328');

// 期望: 存在前端调用清单文件
expect(fs.existsSync(path.join(docsDir, 'frontend-calls.md'))).toBe(true);

// 期望: 清单包含 51 条调用记录
const calls = fs.readFileSync(path.join(docsDir, 'frontend-calls.md'), 'utf-8');
const lineMatches = calls.match(/\/\w+/g);
expect(lineMatches.length).toBeGreaterThanOrEqual(51);

// 期望: 清单包含 HTTP 方法标注 (GET/POST/PUT/DELETE)
expect(calls).toMatch(/GET|POST|PUT|DELETE/);
```

---

#### Story 1.3: 生成新版 api-contract.yaml

| 字段 | 值 |
|------|-----|
| **Story ID** | E1-S1.3 |
| **标题** | 生成新版 api-contract.yaml |
| **工作目录** | /root/.openclaw/vibex |
| **验收标准** | |

```js
// 验收测试: E1-S1.3
const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

const docsDir = path.join(__dirname, '../docs/vibex-doc-health-fix-20260328');
const frontendCalls = fs.readFileSync(path.join(docsDir, 'frontend-calls.md'), 'utf-8');

// 期望: api-contract.yaml 存在于项目根目录
const yamlPath = path.join(__dirname, '../../api-contract.yaml');
expect(fs.existsSync(yamlPath)).toBe(true);

// 期望: YAML 可正常解析
const contract = yaml.parse(fs.readFileSync(yamlPath, 'utf-8'));
expect(contract).toHaveProperty('openapi');
expect(contract).toHaveProperty('paths');

// 期望: 路径数量 >= 51 (覆盖所有前端调用)
const pathCount = Object.keys(contract.paths).length;
expect(pathCount).toBeGreaterThanOrEqual(51);

// 期望: 不含 v1 双写路径 (统一为 /api/v1 前缀)
Object.keys(contract.paths).forEach(p => {
  expect(p).not.toMatch(/^\/api\/auth\//);  // 无 v1 双写
  expect(p).not.toMatch(/^\/api\/projects\//);
  expect(p).not.toMatch(/^\/api\/pages\//);
  expect(p).not.toMatch(/^\/api\/agents\//);
  expect(p).not.toMatch(/^\/api\/messages\//);
  expect(p).not.toMatch(/^\/api\/flows\//);
  expect(p).not.toMatch(/^\/api\/users\//);
});

// 期望: 关键核心路径必须存在
const requiredPaths = [
  '/api/v1/auth/login', '/api/v1/auth/logout', '/api/v1/auth/me',
  '/api/v1/projects', '/api/v1/projects/{projectId}',
  '/api/v1/pages', '/api/v1/pages/{pageId}',
  '/api/v1/messages', '/api/v1/messages/{messageId}',
  '/api/v1/agents', '/api/v1/agents/{agentId}',
  '/api/v1/flows/{flowId}',
  '/api/v1/users/{userId}',
  '/api/v1/requirements', '/api/v1/requirements/{id}',
  '/api/v1/entity-relations', '/api/v1/entity-relations/{id}',
  '/api/v1/flows/generate',
  '/api/v1/domain-entities', '/api/v1/domains/{id}',
  '/api/v1/clarifications/{id}', '/api/v1/clarify/ask', '/api/v1/clarify/accept',
  '/api/v1/ddd/bounded-context', '/api/v1/ddd/business-flow', '/api/v1/ddd/domain-model',
  '/api/v1/design/session',
  '/api/v1/diagnosis/analyze', '/api/v1/diagnosis/optimize',
  '/api/v1/domain/derive', '/api/v1/domain/generate',
  '/api/v1/flow/derive', '/api/v1/flow/generate',
  '/api/v1/pages/derive', '/api/v1/pages/generate',
  '/api/v1/prototype/generate', '/api/v1/prototype-snapshots', '/api/v1/prototype-snapshots/{id}',
];
requiredPaths.forEach(p => {
  expect(contract.paths, `Missing path: ${p}`).toHaveProperty(p);
});

// 期望: 每个路径有 HTTP 方法和 summary
Object.entries(contract.paths).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, def]) => {
    if (method !== 'parameters') {
      expect(def, `${path} ${method} missing summary`).toHaveProperty('summary');
      expect(def, `${path} ${method} missing description`).toHaveProperty('description');
    }
  });
});
```

---

#### Story 1.4: 验证 YAML 格式与可解析性

| 字段 | 值 |
|------|-----|
| **Story ID** | E1-S1.4 |
| **标题** | 验证 api-contract.yaml 格式正确性 |
| **工作目录** | /root/.openclaw/vibex |
| **验收标准** | |

```js
// 验收测试: E1-S1.4
const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

const yamlPath = path.join(__dirname, '../../api-contract.yaml');
const content = fs.readFileSync(yamlPath, 'utf-8');

// 期望: YAML 格式无错误
let parsed;
expect(() => { parsed = yaml.parse(content); }).not.toThrow();

// 期望: OpenAPI 版本合法 (3.0.x 或 3.1.x)
expect(parsed.openapi).toMatch(/^3\.[01]\.\d+$/);

// 期望: 所有 $ref 引用有效 (无悬空引用)
const refPattern = /#\/components\/schemas\/(\w+)/g;
const refs = [...content.matchAll(refPattern)].map(m => m[1]);
const schemaNames = Object.keys(parsed.components?.schemas || {});
refs.forEach(ref => {
  expect(schemaNames, `Dangling ref: ${ref}`).toContain(ref);
});

// 期望: 所有路径参数格式正确 ({paramName} 形式)
Object.keys(parsed.paths).forEach(p => {
  expect(p).toMatch(/^\/api\/v1\//); // 统一 v1 前缀
  expect(p).not.toMatch(/^\/api\/(auth|projects|pages|agents|messages|flows|users)\//); // 无 v1 双写
});
```

---

### Epic 2: 文档归档 (E2)

**目标**: 将 47 个废弃文档归档至 `docs/archive/202603-stale/`

---

#### Story 2.1: 创建归档目录结构

| 字段 | 值 |
|------|-----|
| **Story ID** | E2-S2.1 |
| **标题** | 创建归档目录结构 |
| **工作目录** | /root/.openclaw/vibex/docs |
| **验收标准** | |

```js
// 验收测试: E2-S2.1
const fs = require('fs');
const path = require('path');

const archiveDir = path.join(__dirname, '../../docs/archive/202603-stale');

// 期望: 归档目录存在
expect(fs.existsSync(archiveDir)).toBe(true);

// 期望: 目录为空 (归档前状态)
expect(fs.readdirSync(archiveDir)).toHaveLength(0);
```

---

#### Story 2.2: 归档 P0 tester-checklist 文件 (7个)

| 字段 | 值 |
|------|-----|
| **Story ID** | E2-S2.2 |
| **标题** | 归档 7 个 tester-checklist 文件 |
| **工作目录** | /root/.openclaw/vibex/docs |
| **待归档文件** | |

```
tester-checklist-coord-workflow-improvement.md
tester-checklist-domain-model-crash-fix.md
tester-checklist-navbar-projects-fix.md
tester-checklist-vibex-domain-model-crash.md
tester-checklist-vibex-domain-model-render-fix-v2.md
tester-checklist-vibex-issue-knowledge-base.md
tester-checklist-vibex-template-ecosystem.md
```

```js
// 验收测试: E2-S2.2
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../../docs');
const archiveDir = path.join(docsDir, 'archive/202603-stale');

const checklistFiles = [
  'tester-checklist-coord-workflow-improvement.md',
  'tester-checklist-domain-model-crash-fix.md',
  'tester-checklist-navbar-projects-fix.md',
  'tester-checklist-vibex-domain-model-crash.md',
  'tester-checklist-vibex-domain-model-render-fix-v2.md',
  'tester-checklist-vibex-issue-knowledge-base.md',
  'tester-checklist-vibex-template-ecosystem.md',
];

// 期望: 7 个文件全部从 docs/ 根目录消失
checklistFiles.forEach(f => {
  expect(fs.existsSync(path.join(docsDir, f)), `${f} should be removed from docs/`).toBe(false);
});

// 期望: 7 个文件全部出现在归档目录
checklistFiles.forEach(f => {
  expect(fs.existsSync(path.join(archiveDir, f)), `${f} should exist in archive`).toBe(true);
});
```

---

#### Story 2.3: 归档已完成项目文档目录 (40+ 个)

| 字段 | 值 |
|------|-----|
| **Story ID** | E2-S2.3 |
| **标题** | 归档 40+ 个已完成项目目录 |
| **工作目录** | /root/.openclaw/vibex/docs |
| **归档范围** | |

**分类归档子目录**:

| 子目录 | 内容 | 数量 |
|--------|------|------|
| `archive/202603-stale/homepage/` | 首页迭代类 | ~20 |
| `archive/202603-stale/domain-model/` | 域名模型修复类 | ~5 |
| `archive/202603-stale/api/` | API 修复类 | ~6 |
| `archive/202603-stale/security/` | 安全修复类 | ~4 |
| `archive/202603-stale/test-infra/` | 测试基础设施类 | ~5 |
| `archive/202603-stale/proposals/` | 提案/工作流类 | ~8 |
| `archive/202603-stale/review-reports/` | 审查报告 (20260323) | ~30 |

```js
// 验收测试: E2-S2.3
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../../docs');
const archiveDir = path.join(docsDir, 'archive/202603-stale');
const staleProjectsDir = path.join(archiveDir);

// 期望: 归档后 docs/ 下只有活跃项目目录
const docsEntries = fs.readdirSync(docsDir);
const archivedProjects = [
  'homepage-redesign', 'homepage-v4-fix', 'homepage-flow-fix',
  'homepage-crash-fix', 'homepage-hydration-fix', 'homepage-mermaid-fix',
  'homepage-sketch', 'domain-model-crash', 'domain-model-mermaid-fix',
  'domain-model-mermaid-render', 'domain-model-not-rendering',
  'domain-model-render-fix-v3', 'domain-model-render-fix-v4',
  'api-endpoint-fix', 'api-domain-model-fix', 'auth-e2e-fix',
  'auth-state-sync', 'api-retry-circuit', 'requirements-sync',
  'xss-token-security', 'secure-storage-fix', 'security-hardening',
  'security-auto-detect', 'test-infra-fix', 'test-infra-improve',
  'test-orphans-fix', 'jest-esm-fix', 'pre-existing-test-failures',
  'proposal-dedup-mechanism', 'dedup-path-fix', 'eslint-perf-fix',
  'fix-lint-error', 'uuid-fix', 'button-split', 'button-style-fix',
  'image-and-button-fix', 'css-tokens-migration',
];

archivedProjects.forEach(p => {
  expect(fs.existsSync(path.join(docsDir, p)), `${p} should be removed`).toBe(false);
  expect(fs.existsSync(path.join(staleProjectsDir, p)), `${p} should exist in archive`).toBe(true);
});

// 期望: 归档总数 >= 40
const archivedCount = fs.readdirSync(staleProjectsDir).filter(e => {
  return fs.statSync(path.join(staleProjectsDir, e)).isDirectory();
}).length;
expect(archivedCount).toBeGreaterThanOrEqual(40);
```

---

#### Story 2.4: 更新 docs/README.md

| 字段 | 值 |
|------|-----|
| **Story ID** | E2-S2.4 |
| **标题** | 更新 docs/README.md 标注归档目录 |
| **工作目录** | /root/.openclaw/vibex/docs |
| **验收标准** | |

```js
// 验收测试: E2-S2.4
const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '../../docs/README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

// 期望: README 包含归档目录说明
expect(readme).toContain('archive');
expect(readme).toContain('202603-stale');
expect(readme).toContain('归档');

// 期望: README 不包含已归档项目的引用
const staleProjects = ['homepage-redesign', 'domain-model-crash', 'api-endpoint-fix'];
staleProjects.forEach(p => {
  expect(readme, `${p} should not be referenced in README`).not.toContain(p);
});
```

---

## 3. 优先级矩阵

| Feature ID | 功能 | 预估工时 | 优先级 | 依赖 |
|------------|------|----------|--------|------|
| **E1-S1.1** | 提取后端路由清单 | 30min | P0 | 无 |
| **E1-S1.2** | 提取前端调用清单 | 30min | P0 | 无 |
| **E1-S1.3** | 生成新版 api-contract.yaml | 1.5h | P0 | E1-S1.1, E1-S1.2 |
| **E1-S1.4** | 验证 YAML 格式 | 30min | P1 | E1-S1.3 |
| **E2-S2.1** | 创建归档目录结构 | 15min | P0 | 无 |
| **E2-S2.2** | 归档 tester-checklist (7个) | 15min | P0 | E2-S2.1 |
| **E2-S2.3** | 归档项目目录 (40+ 个) | 30min | P0 | E2-S2.1 |
| **E2-S2.4** | 更新 docs/README.md | 15min | P1 | E2-S2.2, E2-S2.3 |

### 执行顺序

```
P0 先行 (可并行):
  ├─ E1-S1.1 (后端路由提取)
  ├─ E1-S1.2 (前端调用提取)
  └─ E2-S2.1 (创建归档目录)

P0 串行 (依赖 P0 前置):
  ├─ E1-S1.3 (生成 YAML) → 依赖 E1-S1.1 + E1-S1.2
  ├─ E2-S2.2 (归档 checklist) → 依赖 E2-S2.1
  └─ E2-S2.3 (归档项目目录) → 依赖 E2-S2.1

P1 收尾:
  ├─ E1-S1.4 (验证 YAML)
  └─ E2-S2.4 (更新 README)
```

---

## 4. 约束与红线

| # | 约束 | 违反后果 |
|---|------|----------|
| C1 | 归档操作只能移动文件，不得删除 | 数据丢失风险 |
| C2 | api-contract.yaml 不得删除已有的正确定义 | 破坏已有契约 |
| C3 | v1 双写路由统一迁移至 /api/v1/ 前缀 | API 版本混乱 |
| C4 | 测试 checklist 文件不得移动（仅归档对应的 tester-checklist 文档） | 测试基础设施损坏 |
| C5 | CLAUDE.md 中对归档文件的引用需同步更新 | 其他 agent 路径失效 |

---

## 5. 输出产物清单

| 产物 | 路径 | 对应 Story |
|------|------|------------|
| 后端路由清单 | `docs/vibex-doc-health-fix-20260328/backend-routes.md` | E1-S1.1 |
| 前端调用清单 | `docs/vibex-doc-health-fix-20260328/frontend-calls.md` | E1-S1.2 |
| 新版 API Contract | `api-contract.yaml` | E1-S1.3 |
| 归档目录 | `docs/archive/202603-stale/` | E2-S2.1~3 |
| 更新的 README | `docs/README.md` | E2-S2.4 |

---

## 6. 风险登记

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 后端路由实际有差异（路由动态注册） | 中 | 高 | 扫描所有 route.ts 文件 + 运行时路由注册代码 |
| 归档导致其他 agent 引用失效 | 低 | 中 | 更新 CLAUDE.md 引用 + 更新 AGENTS.md |
| YAML 生成后 Swagger UI 渲染异常 | 低 | 中 | E1-S1.4 验收测试包含 redoc 渲染验证 |

---

**PRD 版本**: 1.0
**预计总工时**: 4 小时
**下一步**: 等待 Architect 阶段 — 确认 YAML schema 设计和归档操作影响评估

# AGENTS.md: VibeX 文档健康度修复 — Dev Agent 任务卡

**项目**: vibex-doc-health-fix-20260328
**架构方案**: `docs/vibex-doc-health-fix-20260328/architecture.md`
**实施计划**: `docs/vibex-doc-health-fix-20260328/IMPLEMENTATION_PLAN.md`
**PRD**: `docs/vibex-doc-health-fix-20260328/prd.md`

---

## 背景

VibeX 项目历经 40+ 迭代，积累了两类技术债务：
1. **API Contract 脱节**：yaml 仅 14 路径，后端有 90 路由，前端调用 51 路径
2. **废弃文档堆积**：47 个废弃文档散布在 `docs/`，无人清理

---

## Dev Agent 任务列表

### 🎯 E1-S1.1: extract-backend-routes.ts

**目标**：从后端源码提取完整路由清单

**输入**：`vibex-backend/src/routes/*.ts` + `vibex-backend/src/index.ts`

**输出**：
- `scripts/extract-backend-routes.ts` — 可执行脚本
- `docs/vibex-doc-health-fix-20260328/backend-routes.json` — 路由清单

**关键实现点**：
- 解析 `router.get/post/put/delete()` 调用
- 读取 `index.ts` 的 `app.route('/api/...')` 注册推导完整路径
- 对齐 `/api/` vs `/api/v1/` 双写，统一输出 `/api/v1/xxx`
- 输出 JSON 包含：`path, method, file, group, summary, frontendStatus`

**验收**：JSON 包含 >= 90 条路由记录

---

### 🎯 E1-S1.2: extract-frontend-calls.ts

**目标**：从前端源码提取实际 API 调用清单

**输入**：`vibex-fronted/src/services/api/modules/*.ts`

**输出**：
- `scripts/extract-frontend-calls.ts` — 可执行脚本
- `docs/vibex-doc-health-fix-20260328/frontend-calls.json` — 调用清单

**关键实现点**：
- 解析 `httpClient.get/post/put/delete()` 调用
- 提取 path 模板（如 `/requirements/{id}/analyze`）
- 交叉对比后端路由，标注 `✅对齐` / `❌缺口` / `🔧后端独有`

**验收**：JSON 包含 >= 51 条调用记录

---

### 🎯 E1-S1.3: generate-api-contract.ts

**目标**：生成完整 OpenAPI YAML

**输入**：`backend-routes.json` + `frontend-calls.json` + 现有 `docs/api-contract.yaml`

**输出**：`docs/api-contract.yaml`（覆盖现有文件）

**关键实现点**：
- 保留现有 yaml 中已有的正确定义（不被覆盖）
- 追加所有 `frontendStatus=implemented` 但 `contractStatus=missing` 的路径
- Schema 按功能域组织（Auth/User/Project/Page/Agent/Message/Flow/Requirements/DDD/Diagnosis/Design/Prototype/Entity）
- 所有 operation 有 `summary` + `description`
- 统一 `/api/v1/` 前缀

**验收**：
- `yaml.parse()` 不抛异常
- `Object.keys(paths).length >= 51`
- 所有路径以 `/api/v1/` 开头
- 所有 `$ref` 引用有效

---

### 🎯 E1 附带: 前端 baseUrl 改造

**目标**：前端 API client 统一使用 `/api/v1` 前缀

**文件**：`vibex-fronted/src/services/api/client.ts`

**改动**：
```ts
// Before
const httpClient = createHttpClient({ baseUrl: '' });

// After
const httpClient = createHttpClient({ baseUrl: '/api/v1' });
```

**验收**：`pnpm build` 通过

---

### 🎯 E1-S1.4: validate-api-contract.ts

**目标**：CLI 级别的 API Contract 验证

**输出**：`scripts/validate-api-contract.ts` — exit code 0=通过, 1=失败

**验证维度**（全部通过才 exit 0）：
1. YAML 可解析
2. OpenAPI 版本 `3.0.x` 或 `3.1.x`
3. 路径数量 >= 51
4. 所有路径以 `/api/v1/` 开头（无 v1 双写）
5. 路径参数格式 `{paramName}` 规范
6. 所有 `$ref` 引用有对应 schema
7. 100% operation 有 `summary` + `description`
8. 100% 前端调用存在于 paths
9. HTTP 方法合法

---

### 🎯 E2-S2.1~3: archive-docs.ts + 执行归档

**目标**：将 47 个废弃文档归档到 `docs/archive/202603-stale/`

**输出**：`scripts/archive-docs.ts` + 实际归档操作

**关键实现点**：
- 只 mv 不 rm（安全红线）
- 扫描 `docs/` 下所有子目录
- 对每个待归档项目检查引用（ref-map.json）
- 同步更新 `docs/README.md`
- 同步更新 `CLAUDE.md` 中的引用

**归档清单（精确）**：
- `docs/tester-checklist-*.md` (7个) → `docs/archive/202603-stale/tester-checklist/`
- `docs/homepage-*/` (20个) → `docs/archive/202603-stale/homepage/`
- `docs/domain-model-*/` (6个) → `docs/archive/202603-stale/domain-model/`
- `docs/api-*/` + `docs/auth-*/` + `docs/requirements-sync/` (6个) → `docs/archive/202603-stale/api/`
- `docs/security-*/` (4个) → `docs/archive/202603-stale/security/`
- `docs/test-infra-*/` (5个) → `docs/archive/202603-stale/test-infra/`
- `docs/proposal-*/` + `docs/dedup-*` + `docs/eslint-*` + `docs/fix-*` + `docs/uuid-*` + `docs/button-*` + `docs/css-*` (9个) → `docs/archive/202603-stale/proposals/`
- `docs/review-reports/20260323/` → `docs/archive/202603-stale/review-reports/`

**验收**：`ls docs/archive/202603-stale/` 子目录数 >= 7，文件总数 >= 47

---

### 🎯 E2-S2.4: 更新 docs/README.md

**目标**：标注归档目录，删除已归档项目引用

**验收**：
- README 包含 `archive` 和 `202603-stale` 说明
- README 不包含已归档项目的目录名

---

### 🎯 额外: CI/CD 配置

**目标**：防止未来文档健康度再次恶化

**产出**：
1. `.husky/pre-commit` hook → 运行 `validate-api-contract.ts`
2. `.github/workflows/api-contract.yml` → PR 时自动验证

---

## 执行顺序建议

```
Day 1 AM:
  ├─ E1-S1.1 (extract-backend-routes.ts)
  └─ E1-S1.2 (extract-frontend-calls.ts)

Day 1 PM:
  ├─ E1-S1.3 (generate-api-contract.ts)
  └─ 前端 baseUrl 改造 (与 E1-S1.3 并行)

Day 2 AM:
  ├─ E1-S1.4 (validate-api-contract.ts)
  ├─ E2-S2.1~3 (archive-docs.ts + 执行归档)
  └─ E2-S2.4 (更新 README.md)

Day 2 PM:
  └─ CI/CD 配置
```

---

## 参考文件

- 分析报告：`docs/vibex-doc-health-fix-20260328/analysis.md`
- PRD：`docs/vibex-doc-health-fix-20260328/prd.md`
- 架构方案：`docs/vibex-doc-health-fix-20260328/architecture.md`
- 实施计划：`docs/vibex-doc-health-fix-20260328/IMPLEMENTATION_PLAN.md`

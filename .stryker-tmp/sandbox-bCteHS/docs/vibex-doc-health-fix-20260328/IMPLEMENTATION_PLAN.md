# IMPLEMENTATION_PLAN: VibeX 文档健康度修复

**项目**: vibex-doc-health-fix-20260328
**版本**: 1.0
**创建时间**: 2026-03-28 13:50 GMT+8

---

## 执行检查表

### Pre-flight（开工前必检）

- [ ] `vibex-backend/src/routes/` 下所有路由文件已确认
- [ ] `vibex-fronted/src/services/api/modules/` 下所有 API 模块已确认
- [ ] 归档清单（47 文件）已与 analyst 确认
- [ ] 前端 baseUrl 改动范围已评估（影响文件数统计）

---

## Phase 1: CLI 工具开发

### Day 1 AM: extract-backend-routes.ts

| 检查项 | 验收标准 |
|--------|---------|
| 扫描 `vibex-backend/src/routes/*.ts` | 输出 `backend-routes.json` 包含 90+ 条记录 |
| 路由路径正确（对齐 app.route 注册） | `/api/v1/...` 格式，非 `/api/...` |
| HTTP 方法识别 | GET/POST/PUT/DELETE 均有标注 |
| 功能分组 | Auth/Project/Page/Agent/Message/DDD/Diagnosis 等 |

### Day 1 AM: extract-frontend-calls.ts

| 检查项 | 验收标准 |
|--------|---------|
| 扫描 `vibex-fronted/src/services/api/modules/*.ts` | 输出 `frontend-calls.json` 包含 51 条记录 |
| HTTP 方法识别 | GET/POST/PUT/DELETE 均有标注 |
| 交叉对比后端路由 | 每个调用标注 `✅对齐` / `❌缺口` / `🔧后端独有` |

### Day 1 PM: generate-api-contract.ts

| 检查项 | 验收标准 |
|--------|---------|
| 读取两个 JSON 清单 | `backend-routes.json` + `frontend-calls.json` |
| 保留已有正确定义 | 现有 yaml 中 14 条 `/api/v1/` 路径不被覆盖 |
| 输出 OpenAPI 3.0 YAML | `docs/api-contract.yaml` 存在且可解析 |
| 路径数量 | >= 51 条 paths |
| Schema 命名 | 按功能域命名，无重复 |
| $ref 引用 | 所有引用指向存在的 schema |

### Day 1 PM: 前端 baseUrl 改造

| 检查项 | 验收标准 |
|--------|---------|
| 修改 `client.ts` baseUrl | 改动行数 <= 2 |
| 不破坏其他模块 | `pnpm build` 通过 |

### Day 2 AM: validate-api-contract.ts

| 检查项 | 验收标准 |
|--------|---------|
| YAML 可解析 | `yaml.parse()` 无异常 |
| OpenAPI 版本 | `3.0.x` 或 `3.1.x` |
| 路径数量 | >= 51 |
| v1 前缀规范 | 100% 路径以 `/api/v1/` 开头 |
| Schema 完整性 | 所有 `$ref` 有对应 schema |
| 必需字段 | 100% operation 有 `summary` + `description` |
| 前端覆盖率 | 100% 前端调用存在于 paths |
| Exit code | 0 = 通过，1 = 失败 |

---

## Phase 2: 文档归档

### Day 2 AM: archive-docs.ts + 执行归档

| 检查项 | 验收标准 |
|--------|---------|
| 创建 `docs/archive/202603-stale/` | 目录存在且为空 |
| 移动 7 个 checklist 文件 | 到 `archive/202603-stale/tester-checklist/` |
| 移动 40+ 项目目录 | 到对应子目录 |
| ref-map.json 生成 | 记录所有引用点 |
| docs/README.md 更新 | 包含归档目录说明，无已归档项目引用 |

### 归档文件清单（精确版）

**tester-checklist（7个）**：
```
docs/tester-checklist-coord-workflow-improvement.md
docs/tester-checklist-domain-model-crash-fix.md
docs/tester-checklist-navbar-projects-fix.md
docs/tester-checklist-vibex-domain-model-crash.md
docs/tester-checklist-vibex-domain-model-render-fix-v2.md
docs/tester-checklist-vibex-issue-knowledge-base.md
docs/tester-checklist-vibex-template-ecosystem.md
```

**项目目录（精确分类）**：
- `docs/homepage-redesign/` → `docs/archive/202603-stale/homepage/`
- `docs/homepage-v4-fix/`, `docs/homepage-flow-fix/`, `docs/homepage-crash-fix/`, `docs/homepage-hydration-fix/`, `docs/homepage-mermaid-fix/`, `docs/homepage-sketch/` → 同上
- `docs/domain-model-crash/`, `docs/domain-model-mermaid-fix/`, `docs/domain-model-mermaid-render/`, `docs/domain-model-not-rendering/`, `docs/domain-model-render-fix-v3/`, `docs/domain-model-render-fix-v4/` → `docs/archive/202603-stale/domain-model/`
- `docs/api-endpoint-fix/`, `docs/api-domain-model-fix/`, `docs/auth-e2e-fix/`, `docs/auth-state-sync/`, `docs/api-retry-circuit/`, `docs/requirements-sync/` → `docs/archive/202603-stale/api/`
- `docs/xss-token-security/`, `docs/secure-storage-fix/`, `docs/security-hardening/`, `docs/security-auto-detect/` → `docs/archive/202603-stale/security/`
- `docs/test-infra-fix/`, `docs/test-infra-improve/`, `docs/test-orphans-fix/`, `docs/jest-esm-fix/`, `docs/pre-existing-test-failures/` → `docs/archive/202603-stale/test-infra/`
- `docs/proposal-dedup-mechanism/`, `docs/dedup-path-fix/`, `docs/eslint-perf-fix/`, `docs/fix-lint-error/`, `docs/uuid-fix/`, `docs/button-split/`, `docs/button-style-fix/`, `docs/image-and-button-fix/`, `docs/css-tokens-migration/` → `docs/archive/202603-stale/proposals/`
- `docs/review-reports/20260323/` → `docs/archive/202603-stale/review-reports/`

---

## Phase 3: CI/CD

| 检查项 | 验收标准 |
|--------|---------|
| husky pre-commit hook | `git commit` 触发 validate-api-contract.ts |
| GitHub Actions workflow | `.github/workflows/api-contract.yml` 存在 |
| CI 通过 | PR 触发后 validate 步骤显示 ✅ |

---

## 通永风险检查

- [ ] 归档只 mv 不 rm
- [ ] api-contract.yaml 不覆盖已有正确定义
- [ ] baseUrl 改动后前端 build 通过
- [ ] CLAUDE.md 中归档项目的引用已更新

# 架构设计：VibeX 文档健康度修复

**项目**: vibex-doc-fix-20260328
**任务**: design-architecture (architect)
**版本**: 1.0.0
**日期**: 2026-03-28
**工作目录**: /root/.openclaw/vibex
**分析依据**: analysis.md + prd.md + 源码交叉扫描

---

## 1. 端点映射总表

### 1.1 当前状态

| 维度 | 数量 |
|------|------|
| api-contract.yaml 现有路径 | 14 个 |
| 后端实际路由文件 (route.ts) | 39 个前缀 / 57 个文件 |
| 前端实际 API 调用 | 62 个 HTTP 端点 |
| 契约缺口率 | 72.5% (48/62 缺失) |

### 1.2 重建后的目标路径结构

新版 `api-contract.yaml` 将按以下 **14 个 Tag 分组**，从 14 路径扩展到 **90+ 路径**：

| Tag | 路径前缀 | 方法数 | 状态 | 说明 |
|-----|----------|--------|------|------|
| Auth | /auth | 4 | ✅ 新增 /auth/me | 登录/注册/登出/当前用户 |
| Users | /users/{userId} | 2 | ✅ 已存在 | 用户信息读写 |
| Projects | /projects | 11 | ⚠️ 重建 | 含软删除/恢复/角色/回收站 |
| Requirements | /requirements | 11 | ⚠️ 重建 | 含分析/澄清/域关联 |
| DomainEntities | /domain-entities, /domains | 5 | ⚠️ 重建 | 域实体 CRUD |
| EntityRelations | /entity-relations | 5 | ⚠️ 重建 | 实体关系 CRUD |
| Clarifications | /clarifications/{id} | 2 | ⚠️ 重建 | 澄清问答 |
| DDD | /ddd | 3 | ⚠️ 重建 | BoundedContext/域模型/业务流程 |
| Design | /clarify, /domain, /flow, /pages, /prototype, /design | 13 | ⚠️ 重建 | 设计流程全链路 |
| Flows | /flows | 4 | ✅ 已存在 | 含 /flows/generate |
| PrototypeSnapshots | /prototype-snapshots | 5 | ⚠️ 重建 | 含 update 端点 |
| Agents | /agents | 5 | ✅ 已存在 | Agent CRUD |
| Pages | /pages | 5 | ✅ 已存在 | 页面 CRUD |
| Chat | /chat | 2 | ✅ 已存在 | 流式对话 |
| Plan | /plan/analyze | 1 | ⚠️ 重建 | 需求分析计划 |

---

## 2. 新版 api-contract.yaml 结构设计

### 2.1 YAML 文件位置
```
docs/api-contract.yaml  →  保持不变（已在 docs/ 下）
```

### 2.2 路径分组策略

**原则**：每个 HTTP 端点独立成 path key，不按功能前缀合并。

#### Group A: 已对齐（保留 + 补全 Schema）

| 路径 | 方法 | 处理 |
|------|------|------|
| /auth/login | POST | 保留 ✅ |
| /auth/register | POST | 保留 ✅ |
| /auth/logout | POST | 保留 ✅ |
| /auth/me | GET | **新增**（当前缺失） |
| /users/{userId} | GET, PUT | 保留 ✅ |
| /projects | GET, POST | 保留 ✅ |
| /projects/{projectId} | GET, PUT, DELETE | 保留 ✅ |
| /projects/deleted | GET | **新增** |
| /projects/deleted-all | DELETE | **新增** |
| /projects/{projectId}/soft-delete | PATCH | **新增** |
| /projects/{projectId}/restore | PATCH | **新增** |
| /projects/{projectId}/permanent | DELETE | **新增** |
| /projects/{projectId}/role | GET | **新增** |
| /messages | GET, POST | 保留 ✅ |
| /messages/{messageId} | DELETE | 保留 ✅ |
| /flows/{flowId} | GET, PUT, DELETE | 保留 ✅ |
| /flows/generate | POST | **新增** |
| /agents | GET, POST | 保留 ✅ |
| /agents/{agentId} | GET, PUT, DELETE | 保留 ✅ |
| /pages | GET, POST | 保留 ✅ |
| /pages/{pageId} | GET, PUT, DELETE | 保留 ✅ |
| /chat | POST, GET | 保留 ✅ |

#### Group B: 新增端点（当前契约缺失，前端已在调用）

| 路径 | 方法 | 调用来源 |
|------|------|----------|
| /requirements | GET, POST | requirement.ts |
| /requirements/{requirementId} | GET, PUT, DELETE | requirement.ts |
| /requirements/{requirementId}/analyze | POST | requirement.ts |
| /requirements/{requirementId}/reanalyze | POST | requirement.ts |
| /requirements/{requirementId}/analysis | GET | requirement.ts |
| /requirements/{requirementId}/clarifications | GET, POST | clarification.ts |
| /requirements/{requirementId}/domains | POST | domain-entity.ts |
| /domain-entities | GET | domain-entity.ts |
| /domains/{entityId} | GET, PUT, DELETE | domain-entity.ts |
| /entity-relations | GET, POST | entity-relation.ts |
| /entity-relations/{relationId} | GET, PUT, DELETE | entity-relation.ts |
| /clarifications/{clarificationId} | PUT | clarification.ts |
| /ddd/bounded-context | POST | ddd.ts |
| /ddd/domain-model | POST | ddd.ts |
| /ddd/business-flow | POST | ddd.ts |
| /clarify/ask | POST | design/index.ts |
| /clarify/accept | POST | design/index.ts |
| /domain/generate | POST | design/index.ts |
| /domain/derive | POST | design/index.ts |
| /flow/generate | POST | design/index.ts |
| /flow/derive | POST | design/index.ts |
| /pages/generate | POST | design/index.ts |
| /pages/derive | POST | design/index.ts |
| /prototype/generate | POST | design/index.ts |
| /design/session | POST | design/index.ts |
| /design/session/{sessionId} | GET, DELETE | design/index.ts |
| /plan/analyze | POST | plan/plan-service.ts |
| /prototype-snapshots | GET, POST | prototype.ts |
| /prototype-snapshots/{snapshotId} | GET, PUT, DELETE | prototype.ts |

#### Group C: 后端独有（前端未调用，标注但不删除）

| 路径前缀 | 方法数 | 状态 | 说明 |
|----------|--------|------|------|
| /oauth/{provider}/* | 5 | ⚠️ 未调用 | OAuth 集成 |
| /canvas/* | 7 | ⚠️ 未调用 | Canvas 生成（批量） |
| /github/* | 3 | ⚠️ 未调用 | GitHub 集成 |
| /ai-ui-generation | 1 | ⚠️ 未调用 | AI UI 批量生成 |

#### Group D: v1 双写路由（废弃）

| 原路径 | v1 路径 | 策略 |
|--------|---------|------|
| /api/auth/* | /api/v1/auth/* | 废弃 v1，保留无前缀版本 |
| /api/projects/* | /api/v1/projects/* | 同上 |
| /api/messages/* | /api/v1/messages/* | 同上 |
| /api/agents/* | /api/v1/agents/* | 同上 |
| /api/pages/* | /api/v1/pages/* | 同上 |
| /api/flows/* | /api/v1/flows/* | 同上 |
| /api/chat | /api/v1/chat | 同上 |

**策略**：v1 双写路由废弃，新版契约只定义无 v1 前缀的路由。后端继续兼容 v1，前端统一使用无前缀路径。

### 2.3 Schema 补全清单

当前契约缺少以下 Schema 组件，需要新增：

| Schema 名 | 来源 | 用途 |
|-----------|------|------|
| Requirement | frontend/types/prototype/requirement.ts | 需求实体 |
| RequirementCreate | frontend/types/prototype/requirement.ts | 创建需求请求体 |
| RequirementUpdate | frontend/types/prototype/requirement.ts | 更新需求请求体 |
| AnalysisResult | frontend/types/prototype/requirement.ts | 分析结果 |
| Clarification | frontend/types/prototype/ui-schema.ts | 澄清问答 |
| DomainEntity | frontend/types/prototype/domain.ts | 域实体 |
| EntityRelation | frontend/types/prototype/domain.ts | 实体关系 |
| BoundedContext | frontend/types/prototype/domain.ts | 限界上下文 |
| DesignSession | frontend/types (推断) | 设计会话 |
| PrototypeSnapshot | frontend/types/prototype/ui-schema.ts | 原型快照 |
| ProjectRole | frontend/types/project.ts | 项目角色枚举 |
| PlanAnalysisRequest | frontend/services/plan/plan-service.ts | 计划分析请求 |
| PlanAnalysisResult | frontend/services/plan/plan-service.ts | 计划分析结果 |

### 2.4 YAML 生成执行方案

**工具**: `yq` CLI + Python 脚本辅助

**步骤**:
1. 备份当前 `docs/api-contract.yaml` → `docs/api-contract.yaml.bak-20260328`
2. 以现有 api-contract.yaml 为蓝本（保留所有 components/schemas）
3. 在 `paths:` 下追加 Group A 的新路径（4 个）
4. 在 `paths:` 下追加 Group B 的新路径（34 个）
5. 添加 Group C 的后端独有路径（带 `x-backend-only: true` 扩展字段）
6. 添加 Group D 的废弃 v1 路径（带 `deprecated: true` 标记）
7. 补充缺失的 Schema（13 个）
8. 验证：`yq eval '.' docs/api-contract.yaml | wc -c` > 100
9. 验证：`yq eval '.paths | length' docs/api-contract.yaml` ≥ 60

---

## 3. 归档目录结构设计

### 3.1 归档目标目录
```
docs/archive/202603-stale/
```

### 3.2 归档清单（47+ 个文件/目录）

#### 目录结构
```
docs/archive/202603-stale/
├── README.md                          # 归档说明
├── tester-checklists/                 # tester-checklist 文件（7 个）
│   ├── tester-checklist-coord-workflow-improvement.md
│   ├── tester-checklist-domain-model-crash-fix.md
│   ├── tester-checklist-navbar-projects-fix.md
│   ├── tester-checklist-vibex-domain-model-crash.md
│   ├── tester-checklist-vibex-domain-model-render-fix-v2.md
│   ├── tester-checklist-vibex-issue-knowledge-base.md
│   └── tester-checklist-vibex-template-ecosystem.md
├── homepage/                          # 首页迭代历史（20+ 个）
│   ├── homepage-crash-fix.md
│   ├── homepage-flow-fix.md
│   ├── homepage-hydration-fix.md
│   ├── homepage-mermaid-fix.md
│   ├── homepage-redesign.md
│   ├── homepage-sketch.md
│   ├── homepage-v4-fix.md
│   ├── homepage-urgent-fixes.md
│   ├── homepage-three-column-layout.md
│   ├── homepage-skeleton-redesign.md
│   ├── homepage-thinking-panel.md
│   ├── homepage-thinking-panel-fix.md
│   ├── homepage-thinking-panel-fix-v2.md
│   ├── homepage-ux-redesign.md
│   ├── homepage-event-audit.md
│   ├── homepage-cardtree-debug.md
│   ├── homepage-flow-redesign.md
│   ├── homepage-iteration.md
│   ├── homepage-layout-fix.md
│   ├── homepage-layout-iteration.md
│   ├── homepage-modular-refactor.md
│   ├── homepage-redesign-v2.md
│   ├── homepage-api-alignment.md
│   ├── homepage-core-layout.md
│   ├── homepage-final-review.md
│   ├── homepage-final-review/specs/
│   ├── homepage-redesign-analysis.md
│   ├── homepage-sprint1-reviewer-fix.md
│   ├── homepage-sprint1-reviewer-fix-revised.md
│   ├── homepage-reviewer-failed-fix.md
│   ├── homepage-redesign-reviewer-sprint1-fix.md
│   ├── homepage-redesign-sprint1-reviewer-fix.md
│   ├── homepage-redesign/specs/
│   ├── homepage-v4-fix/specs/
│   ├── homepage-v4-fix-reviewer-aipanel-fix.md
│   ├── homepage-v4-fix-epic1-aipanel-test.md
│   ├── homepage-v4-fix-epic3-layout-test.md
│   ├── homepage-theme-api-analysis-epic3-test-fix.md
│   ├── homepage-theme-api-analysis-epic3-test-fix/specs/
│   ├── homepage-theme-integration.md
│   ├── homepage-theme-wrapper-timing-fix.md
│   ├── homepage-epic4-integration-fix.md
│   ├── homepage-event-epic1-optimize-fix.md
│   ├── homepage-issues-20260317.md
│   ├── homepage-redesign/specs/
│   ├── docs/vibex-homepage-module-fix/   # 子目录内含 docs/
│   ├── docs/vibex-proposals-20260322/
│   ├── docs/vibex-step2-incomplete/
│   └── docs/homepage-redesign-reviewer-sprint1-fix/
├── domain-model/                      # 域名模型修复历史（7 个）
│   ├── domain-model-crash.md
│   ├── domain-model-mermaid-fix.md
│   ├── domain-model-mermaid-render.md
│   ├── domain-model-not-rendering.md
│   ├── domain-model-parsing-stuck.md
│   ├── domain-model-render-fix-v3.md
│   ├── domain-model-render-fix-v4.md
│   ├── domain-model-step-not-advancing.md
│   ├── domain-model-crash-fix.md
│   ├── vibex-domain-model-crash.md
│   ├── vibex-domain-model-mermaid-fix.md
│   ├── vibex-domain-model-mermaid-render.md
│   ├── vibex-domain-model-not-rendering.md
│   ├── vibex-domain-model-render-fix-v3.md
│   ├── vibex-domain-model-render-fix-v4.md
│   └── vibex-domain-model-step-not-advancing.md
├── button-style/                      # 按钮/样式修复（4 个）
│   ├── button-split.md
│   ├── button-style-fix.md
│   ├── image-and-button-fix.md
│   ├── css-tokens-migration.md
│   └── vibex-button-split.md
│   └── vibex-button-style-fix.md
│   └── vibex-image-and-button-fix.md
├── api-fixes/                         # API 修复（6 个）
│   ├── api-endpoint-fix.md
│   ├── api-domain-model-fix.md
│   ├── auth-e2e-fix.md
│   ├── auth-state-sync.md
│   ├── api-retry-circuit.md
│   ├── requirements-sync.md
│   ├── ddd-api-fix.md
│   ├── ddd-api-fix/specs/
│   └── vibex-api-endpoint-fix.md
│   └── vibex-api-domain-model-fix.md
│   └── vibex-auth-e2e-fix.md
│   └── vibex-auth-state-sync.md
│   └── vibex-requirements-sync.md
│   └── vibex-ddd-api-fix.md
├── security/                          # 安全修复（4 个）
│   ├── xss-token-security.md
│   ├── secure-storage-fix.md
│   ├── security-hardening.md
│   ├── security-auto-detect.md
│   ├── vibex-xss-token-security.md
│   ├── vibex-secure-storage-fix.md
│   ├── vibex-security-hardening.md
│   └── vibex-security-auto-detect.md
├── test-infra/                        # 测试基础设施（5 个）
│   ├── test-infra-fix.md
│   ├── test-infra-improve.md
│   ├── test-orphans-fix.md
│   ├── jest-esm-fix.md
│   ├── pre-existing-test-failures.md
│   ├── vibex-test-infra-fix.md
│   ├── vibex-test-infra-improve.md
│   ├── vibex-test-orphans-fix.md
│   ├── vibex-jest-esm-fix.md
│   └── vibex-jest-esm-fix/specs/
│   └── vibex-pre-existing-test-failures.md
├── proposals-dedup/                   # 提案去重/工作流（8 个）
│   ├── proposal-dedup-mechanism.md
│   ├── proposal-dedup-mechanism/specs/
│   ├── dedup-path-fix.md
│   ├── eslint-perf-fix.md
│   ├── eslint-perf-fix/specs/
│   ├── fix-lint-error.md
│   ├── uuid-fix.md
│   ├── dedup-path-fix.md
│   ├── eslint-perf-fix.md
│   ├── fix-lint-error.md
│   ├── uuid-fix.md
│   ├── taskmanager-syntaxwarning-fix.md
│   ├── proposal-dedup-reviewer1-fix.md
│   ├── vibex-proposal-dedup-mechanism.md
│   ├── vibex-dedup-path-fix.md
│   ├── vibex-eslint-perf-fix.md
│   ├── vibex-fix-lint-error.md
│   └── vibex-uuid-fix.md
├── review-reports/                    # 历史审查报告（按日期归档）
│   ├── 20260323/
│   ├── 20260324/
│   ├── 20260325/
│   ├── 20260326/
│   └── 20260327/
├── other-stale/                       # 其他零散废弃文档
│   ├── heartbeat-template-optimization.md
│   ├── heartbeat-report-template.md
│   ├── coord-workflow-improvement.md
│   ├── on-boarding-redesign.md
│   ├── user-onboarding-optimization.md
│   ├── page-tree-diagram.md
│   ├── page-structure-consolidation/
│   ├── page-structure-consolidation/specs/
│   ├── simplified-flow.md
│   ├── simplified-flow/specs/
│   ├── simplified-flow-test-fix.md
│   ├── simplified-flow-test-fix/specs/
│   ├── canvas-analysis.md
│   ├── canvas-redesign-20260325.md
│   ├── canvas-api-fix-20260326.md
│   ├── canvas-api-fix-20260326/specs/
│   ├── mermaid-display-bug.md
│   ├── mermaid-render-bug.md
│   ├── mermaid-render-fix.md
│   ├── mermaid-render-fix/specs/
│   ├── mermaid-progress-bug.md
│   ├── mermaid-test-regression.md
│   ├── mermaid-fix-verify.md
│   ├── state-render-fix.md
│   ├── state-optimization.md
│   ├── hooks-fix.md
│   ├── zustand-missing.md
│   ├── ts-strict.md
│   ├── ts-strict/specs/
│   ├── type-safety-boost.md
│   ├── type-safety-cleanup.md
│   ├── gitignore-fix.md
│   ├── github-figma-import.md
│   ├── new-process-design-20260318.md
│   ├── new-process-impl-20260318.md
│   ├── new-process-impl-20260318-v2.md
│   ├── nextjs-upgrade.md
│   ├── nextjs-upgrade/specs/
│   ├── phase1-infra-20260316.md
│   ├── phase1-infra-20260317.md
│   ├── phase2-core-20260316.md
│   ├── phase2-core-features-20260316.md
│   ├── phase2-infra.md
│   ├── phase3-enhancements.md
│   ├── p1-impl-20260314.md
│   ├── p1-security-fix.md
│   ├── production-polish.md
│   ├── quality-optimization-20260317.md
│   ├── react-query-refactor.md
│   ├── reactflow-visualization.md
│   ├── particle-effects.md
│   ├── stage-integration.md
│   ├── plan-build-mode.md
│   ├── proposal-api-split.md
│   ├── proposal-five-step-flow.md
│   ├── proposal-rca-tool.md
│   ├── proposal-report-template.md
│   ├── step-context-fix-20260326.md
│   ├── step-context-fix-reviewer-fix-phase1.md
│   ├── step-modular-architecture.md
│   ├── task-state-20260326.md
│   ├── task-state-20260326/specs/
│   ├── three-trees-enhancement-20260326.md
│   ├── three-trees-enhancement-20260326/specs/
│   ├── bc-filter-fix-20260326.md
│   ├── bc-prompt-optimize-20260326.md
│   ├── navbar-projects-fix.md
│   ├── vibex-navbar-projects-fix.md
│   ├── session-smart-compress.md
│   ├── process-optimization.md
│   ├── issue-knowledge-base.md
│   ├── template-ecosystem.md
│   ├── frontend-analysis-20260327.md
│   ├── frontend-sse-display-fix.md
│   ├── cicd-optimization.md
│   ├── code-quality.md
│   ├── console-log-sanitize.md
│   ├── frontend-analysis-20260327.md
│   ├── backend-integration-20260325.md
│   ├── sample-input-fix.md
│   ├── step2-issues.md
│   ├── step2-issues/specs/
│   ├── step2-regression.md
│   ├── step2-regression/specs/
│   └── proposal-rca-tool.md
```

**归档执行原则**:
- **只移不删**: 所有文件通过 `mv` 移动，不执行删除
- **保留文件名和时间戳**: 归档后仍可通过文件名追溯来源
- **分类存放**: 按功能领域分子目录，便于后续恢复
- **最近 30 天活跃**: `agent-self-evolution-*` 和 `vibex-doc-fix-*` 不归档

### 3.3 归档后 docs/ 根目录预期文件（保留）

```
docs/
├── api-contract.yaml          ← 核心文档，保留
├── architecture.md            ← 核心文档，保留
├── changelog.md               ← 核心文档，保留
├── prd.md                     ← 核心文档，保留
├── LEARNINGS.md               ← 核心文档，保留
├── CLAUDE.md (如存在)         ← 核心文档，保留
├── DESIGN.md                  ← 核心文档，保留
├── analysis/                  ← 分析资产，保留
├── architecture/              ← 架构资产，保留
├── guides/                    ← 指南文档，保留
├── knowledge/                 ← 知识库，保留
├── knowledge-base/            ← 知识库，保留
├── prd/                       ← PRD 模板，保留
├── templates/                 ← 模板，保留
├── proposals/                 ← 活跃提案目录，保留
├── review-reports/            ← 仅保留最新（今日），旧归档到 archive/
├── agent-self-evolution-*/    ← 最近活跃，保留
├── vibex-doc-fix-20260328/   ← 当前项目，保留
├── vibex-canvas-*/            ← 近期活跃项目，保留
├── vibex-homepage-improvements/ ← 近期活跃，保留
├── vibex-api-retry-circuit/   ← 近期活跃，保留
├── vibex-image-cdn/           ← 近期活跃，保留
├── vibex-issue-knowledge-base/ ← 近期活跃，保留
├── vibex-frontend-sse-display-fix/ ← 近期活跃，保留
└── archive/                   ← 新建归档目录
```

### 3.4 归档脚本伪代码

```bash
# 1. 创建归档目录结构
mkdir -p docs/archive/202603-stale/{tester-checklists,homepage,domain-model,button-style,api-fixes,security,test-infra,proposals-dedup,review-reports,other-stale}

# 2. 移动 tester-checklist 文件
find docs -maxdepth 1 -name "tester-checklist-*.md" -exec mv {} docs/archive/202603-stale/tester-checklists/ \;

# 3. 移动 homepage 相关
find docs -maxdepth 1 -name "homepage-*.md" -o -name "homepage-*/" | xargs -I{} mv {} docs/archive/202603-stale/homepage/

# 4. 移动 domain-model 相关
find docs -maxdepth 1 \( -name "*domain-model*.md" -o -name "*domain-model*/" \) -not -name "domain.md" | xargs -I{} mv {} docs/archive/202603-stale/domain-model/

# 5. 移动其余类别...
# 6. 移动 review-reports/（历史子目录）
find docs/review-reports -mindepth 1 -maxdepth 1 -type d -name "202603*" | xargs -I{} mv {} docs/archive/202603-stale/review-reports/

# 7. 保留 docs/review-reports/ 本身（空壳或只含今日报告）
```

---

## 4. 工时估算

### Epic 1: API Contract 重建

| Task | 描述 | 工时 | 依赖 |
|------|------|------|------|
| T1.1 | 提取后端路由清单并分类 | 30min | 无 |
| T1.2 | 提取前端 API 调用清单 | 30min | 无 |
| T1.3 | 生成新版 api-contract.yaml（含 90+ 端点） | 2h | T1.1, T1.2 |
| T1.4 | 验证 YAML 格式正确性 | 30min | T1.3 |
| T1.5 | 标注后端独有路由（unused-routes.md） | 1h | T1.3 |

**Epic 1 总工时**: 4.5h

### Epic 2: 废弃文档归档

| Task | 描述 | 工时 | 依赖 |
|------|------|------|------|
| T2.1 | 创建 archive/ 目录结构 | 15min | 无 |
| T2.2 | 归档 47+ 个废弃文档 | 1.5h | T2.1 |
| T2.3 | 更新 docs/README.md | 30min | T2.2 |
| T2.4 | 验证 CLAUDE.md 无已归档文件引用 | 30min | T2.2 |

**Epic 2 总工时**: 2.75h

### 总工时

| Epic | 工时 |
|------|------|
| Epic 1: API Contract 重建 | 4.5h |
| Epic 2: 废弃文档归档 | 2.75h |
| **总计** | **7.25h ≈ 1 人天** |

---

## 5. 风险与 Trade-off

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 归档后 CLAUDE.md 引用失效 | 高 | T2.4 执行脚本扫描并更新引用 |
| v1 双写路由废弃导致线上问题 | 高 | 后端保留 v1 兼容，YAML 仅标注 deprecated |
| 后端独有路由前端未来可能调用 | 低 | 用 `x-backend-only: true` 标注，保留定义 |
| 归档目录过大（200+ 文件） | 低 | 按类别分子目录，命名清晰 |

### Trade-off 决策

1. **YAML 路径合并 vs 拆分**: 选择每个 HTTP 端点独立成 path key，而非按功能前缀合并。这样前端可以精确引用每个端点。
2. **v1 双写保留 vs 废弃**: 废弃 v1 路径（YAML 中 deprecated 标记），但后端继续支持，确保向后兼容。
3. **归档粒度**: 选择保留子目录结构（如 homepage/, domain-model/），而非全平铺，便于后续按类别恢复。
4. **契约文档位置**: 保持 `docs/api-contract.yaml` 不变，避免破坏现有引用。

---

**架构设计完成**: 2026-03-28 13:55 GMT+8
**Architect**: subagent (coord dispatch)
**下一步**: Dev 阶段 — 执行 api-contract.yaml 重建和文档归档

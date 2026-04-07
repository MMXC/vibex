# 分析报告：VibeX 文档健康度修复

**项目**: vibex-doc-fix-20260328
**任务**: analyze-requirements (analyst)
**分析时间**: 2026-03-28 13:17 GMT+8
**Analyst**: subagent (coord dispatch)
**工作目录**: /root/.openclaw/vibex

---

## 1. 问题定义（验证结果）

### 1.1 问题确认

| # | 问题描述 | 验证结果 | 真实性 |
|---|----------|----------|--------|
| P0 | api-contract.yaml 仅 14 端点，后端有 90 路由 | ✅ 真实 | 确认 |
| P0 | 40+ 个废弃文档需要清理 | ✅ 真实 | 确认 |
| P1 | 部分后端路由前端未调用 | ✅ 真实 | 确认 |
| P2 | 部分前端 API 调用未在契约中定义 | ✅ 真实 | 确认 |

### 1.2 根因分析

- **历史债务积累**: 项目历经 40+ 迭代周期，每次迭代只增不减 API 和文档
- **契约治理缺失**: api-contract.yaml 自 2026-03-14 创建后再未更新
- **文档生命周期管理缺失**: 项目完成后的 docs/ 目录无人归档清理
- **v1 API 双写问题**: 存在 `/api/...` 和 `/api/v1/...` 两套路由，增加了复杂度

---

## 2. 现状定量分析

### 2.1 后端路由统计

```
Next.js App Router (src/app/api/):
  路径前缀数: 39 个
  完整路由文件数: 57 个 route.ts

Express Routes (src/routes/):
  路由文件数: 58 个 (含 __tests__/templates.test.ts)

合计: ~90+ 路由 (与任务描述吻合)
```

### 2.2 后端路由按功能分组

| 分组 | 路径前缀 | 文件数 | 状态 |
|------|----------|--------|------|
| **认证** | /api/auth/*, /api/v1/auth/* | 6 | 前端已集成 ✅ |
| **OAuth** | /api/oauth/* | 5 | 前端未调用 ⚠️ |
| **项目管理** | /api/projects/*, /api/v1/projects/* | 4 | 前端已集成 ✅ |
| **页面管理** | /api/pages/*, /api/v1/pages/* | 4 | 前端已集成 ✅ |
| **Agent** | /api/agents/*, /api/v1/agents/* | 4 | 前端已集成 ✅ |
| **消息** | /api/messages/*, /api/v1/messages/* | 4 | 前端已集成 ✅ |
| **原型快照** | /api/prototype-snapshots/*, /api/v1/* | 4 | 前端已集成 ✅ |
| **流程图** | /api/flows/*, /api/v1/flows/* | 2 | 前端已集成 ✅ |
| **用户** | /api/users/*, /api/v1/users/* | 2 | 前端已集成 ✅ |
| **Canvas 生成** | /api/canvas/* | 7 | 前端未调用 ⚠️ |
| **AI UI 生成** | /api/ai-ui-generation, /api/v1/ai-ui-generation | 2 | 前端已集成 ✅ |
| **域名模型** | /api/domain-model/*, /api/v1/domain-model/* | 2 | 前端已集成 ✅ |
| **澄清问答** | /api/clarify/chat, /api/clarifications/* | 3 | 前端已集成 ✅ |
| **GitHub 集成** | /api/github/* | 3 | 前端未调用 ⚠️ |
| **需求管理** | /api/requirements/* | 3 | 前端已集成 ✅ |
| **计划分析** | /api/plan/analyze, /api/v1/analyze/* | 3 | 前端已集成 ✅ |

### 2.3 API Contract vs Frontend 实际调用对比

**API Contract YAML 当前定义**: 14 个路径
**前端实际调用**: 51 个路径

#### 已定义且前端已调用 (✅ 对齐):
| 路径 | HTTP 方法 | 状态 |
|------|----------|------|
| /auth/login | POST | ✅ |
| /auth/register | POST | ✅ |
| /auth/logout | POST | ✅ |
| /projects | GET, POST | ✅ |
| /projects/{projectId} | GET, PUT, DELETE | ✅ |
| /pages | GET, POST | ✅ |
| /pages/{pageId} | GET, PUT, DELETE | ✅ |
| /messages | GET, POST | ✅ |
| /messages/{messageId} | DELETE | ✅ |
| /flows/{flowId} | GET, PUT, DELETE | ✅ |
| /agents | GET, POST | ✅ |
| /agents/{agentId} | GET, PUT, DELETE | ✅ |
| /users/{userId} | GET, PUT | ✅ |

#### 前端已调用但未在契约中定义 (❌ 缺口):
| 路径 | HTTP 方法 | 说明 |
|------|----------|------|
| /auth/me | GET | 获取当前用户状态 |
| /projects/deleted | GET | 获取已删除项目列表 |
| /projects/deleted-all | DELETE | 清空回收站 |
| /projects/{id}/soft-delete | POST | 软删除 |
| /projects/{id}/restore | POST | 恢复项目 |
| /projects/{id}/permanent | DELETE | 永久删除 |
| /projects/{id}/role | GET | 获取项目角色 |
| /requirements | GET, POST | 需求列表/创建 |
| /requirements/{id} | GET, PUT | 需求详情/更新 |
| /requirements/{id}/analyze | POST | 触发分析 |
| /requirements/{id}/reanalyze | POST | 重新分析 |
| /requirements/{id}/analysis | GET | 获取分析结果 |
| /requirements/{id}/clarifications | GET, POST | 澄清问答 |
| /requirements/{id}/domains | GET, POST | 关联域 |
| /entity-relations | GET | 实体关系查询 |
| /entity-relations/{id} | PUT, DELETE | 更新/删除关系 |
| /flows/generate | POST | 生成流程图 |
| /domain-entities | GET | 获取域实体 |
| /domains/{id} | GET, DELETE | 域详情/删除 |
| /clarifications/{id} | GET | 澄清详情 |
| /clarify/ask | POST | 提问 |
| /clarify/accept | POST | 接受澄清 |
| /ddd/bounded-context | POST | DDD bounded context |
| /ddd/business-flow | POST | DDD 业务流程 |
| /ddd/domain-model | POST | DDD 领域模型 |
| /design/session | POST | 设计会话 |
| /diagnosis/analyze | POST | 诊断分析 |
| /diagnosis/optimize | POST | 诊断优化 |
| /domain/derive | POST | 域推导 |
| /domain/generate | POST | 域生成 |
| /flow/derive | POST | 流程推导 |
| /flow/generate | POST | 流程生成 |
| /pages/derive | POST | 页面推导 |
| /pages/generate | POST | 页面生成 |
| /prototype/generate | POST | 原型生成 |
| /prototype-snapshots | GET, POST | 原型快照 |
| /prototype-snapshots/{id} | GET, DELETE | 快照详情/删除 |

**缺口率**: 37/51 = 72.5% 的前端 API 调用未在契约中定义

### 2.4 废弃文档清单 (共 47 个)

#### P0 - tester-checklist 文件 (7个) - 明确归档:
| 文件 | 原因 |
|------|------|
| tester-checklist-coord-workflow-improvement.md | 对应项目已完成 |
| tester-checklist-domain-model-crash-fix.md | 缺陷已修复 |
| tester-checklist-navbar-projects-fix.md | 缺陷已修复 |
| tester-checklist-vibex-domain-model-crash.md | 缺陷已修复 |
| tester-checklist-vibex-domain-model-render-fix-v2.md | 缺陷已修复 |
| tester-checklist-vibex-issue-knowledge-base.md | 功能已上线 |
| tester-checklist-vibex-template-ecosystem.md | 项目已完成 |

#### P1 - 已完成项目目录 (40+ 个) - 建议归档:
| 类别 | 数量 | 示例 |
|------|------|------|
| 首页迭代类 | ~20 | homepage-redesign, homepage-v4-fix, homepage-flow-fix, homepage-crash-fix, homepage-hydration-fix, homepage-mermaid-fix, homepage-sketch... |
| 域名模型修复类 | ~5 | domain-model-crash, domain-model-mermaid-fix, domain-model-mermaid-render, domain-model-not-rendering, domain-model-render-fix-v3/v4... |
| 按钮/样式修复类 | ~4 | button-split, button-style-fix, image-and-button-fix, css-tokens-migration... |
| API 修复类 | ~6 | api-endpoint-fix, api-domain-model-fix, auth-e2e-fix, auth-state-sync, api-retry-circuit, requirements-sync... |
| 安全类 | ~4 | xss-token-security, secure-storage-fix, security-hardening, security-auto-detect... |
| 测试基础设施工具类 | ~5 | test-infra-fix, test-infra-improve, test-orphans-fix, jest-esm-fix, pre-existing-test-failures... |
| 提案重复/工作流类 | ~8 | proposal-dedup-mechanism, dedup-path-fix, eslint-perf-fix, fix-lint-error, uuid-fix... |
| 已归档 review-reports (20260323) | 1 | 目录内 30+ 个单次审查报告 |

---

## 3. 解决方案

### 3.1 推荐方案: 分阶段增量修复

#### Phase 1: API Contract 重建 (工作量: 3h)
1. 提取后端全部路由前缀 (39 个路径前缀)
2. 标注每个路径的 HTTP 方法和功能描述
3. 交叉对比前端 API 调用 (51 个路径)
4. 区分三类状态: `✅ 已对齐` / `⚠️ 缺口` / `🔧 后端独有`
5. 生成新版 api-contract.yaml

#### Phase 2: 文档归档 (工作量: 1h)
1. 创建 `docs/archive/202603-stale/` 目录
2. 移动 47 个废弃文档到归档目录
3. 更新 docs/README.md 标注归档目录用途
4. 保留最近 30 天内活跃项目的文档

### 3.2 验收标准

| 验收项 | 目标 | 验证方法 |
|--------|------|----------|
| API Contract 覆盖率 | 100% 前端调用都有定义 | 脚本交叉对比 |
| 路由分组合理性 | 按领域分组，结构清晰 | 人工审查 |
| 废弃文档归档率 | 100% 废弃文档已归档 | 检查 archive/ |
| API Contract 可解析 | Swagger UI / redoc 可正常渲染 | 手动测试 |

---

## 4. 实施计划

### Epic 1: API Contract 修复

| Task | 描述 | 工作量 | 优先级 |
|------|------|--------|--------|
| T1.1 | 提取后端路由完整清单并分类 | 30min | P0 |
| T1.2 | 提取前端 API 调用完整清单 | 30min | P0 |
| T1.3 | 生成新版 api-contract.yaml | 1.5h | P0 |
| T1.4 | 验证 YAML 格式正确性 | 30min | P1 |

### Epic 2: 文档归档

| Task | 描述 | 工作量 | 优先级 |
|------|------|--------|--------|
| T2.1 | 创建 archive/ 目录结构 | 15min | P0 |
| T2.2 | 移动 47 个废弃文档 | 30min | P0 |
| T2.3 | 更新 docs/README.md | 15min | P1 |

---

## 5. 约束与风险

- **约束 1**: 不得删除任何归档文件，只能移动
- **约束 2**: api-contract.yaml 不得删除已有的正确定义
- **约束 3**: 使用 gstack 技能验证修复效果
- **风险**: 部分后端路由可能已被前端废弃但未清理 → 清理前需与 coord 确认
- **风险**: 归档操作可能导致其他 agent 引用路径失效 → 更新 CLAUDE.md 引用

---

**分析完成**: 2026-03-28 13:20 GMT+8
**预计总工时**: 4-5 小时
**下一步**: PM 阶段 - 确认归档范围和 API Contract 更新优先级

# MVP 首页后端支持分析报告

**项目**: mvp-backend-analysis  
**分析时间**: 2026-03-22 15:42  
**目标**: 分析 MVP 首页流程所需的后端支持，识别关键 API 稳定性问题

---

## 执行摘要

MVP 首页六步流程需要 **12 个 API 端点**，其中 **4 个前端已实现但后端可能未实现**，**1 个使用 SSE 但无后端支持**，**7 个端点完全缺失**。

---

## 一、前端 API 模块盘点

| 模块 | 端点 | 前端状态 | 后端状态 | 稳定性 |
|------|------|---------|---------|--------|
| ddd.ts | `POST /ddd/bounded-context` | ✅ | ⚠️ 需验证 | 未知 |
| ddd.ts | `POST /ddd/domain-model` | ✅ | ⚠️ 需验证 | 未知 |
| ddd.ts | `POST /ddd/flow` | ✅ | ⚠️ 需验证 | 未知 |
| useSSEStream | `GET /analyze/stream` | ✅ SSE | ❌ 缺失 | 高风险 |
| clarificationApi | `POST /clarify/chat` | ✅ | ❌ 缺失 | 高风险 |
| clarification.ts | `GET/PATCH /clarifications` | ✅ | ⚠️ 需验证 | 未知 |
| project.ts | `GET/POST /projects` | ✅ | ✅ 已有 | 稳定 |
| homepageAPI | `GET /homepage` | ✅ | ⚠️ 需验证 | 中风险 |
| prototype.ts | `GET /prototype-snapshots` | ✅ | ⚠️ 需验证 | 未知 |

---

## 二、缺失/不稳定 API 详细分析

### 2.1 SSE 流式接口（高风险）

**端点**: `GET /api/v1/analyze/stream?requirement=xxx`

**前端实现**: `useSSEStream.ts` — 完整的 SSE 客户端，含重连逻辑

**问题**: 
- 后端 `api.vibex.top` 是否实现了 SSE endpoint？
- SSE 需要 `Transfer-Encoding: chunked`，与标准 REST 不同
- SSE 事件类型：`thinking`, `step_context`, `step_model`, `step_flow`, `step_components`, `done`, `error`

**验证命令**:
```bash
curl -N -H "Accept: text/event-stream" "https://api.vibex.top/api/v1/analyze/stream?requirement=test"
# 预期: 返回 SSE 流
# 实际: 可能 404 或 timeout
```

### 2.2 Clarification Chat（高风险）

**端点**: `POST /api/clarify/chat`

**前端实现**: `clarificationApi.ts` — 对话式需求澄清客户端

**问题**:
- 后端 `/clarify/chat` 完全缺失
- 此端点是 MVP 第四步（需求澄清）的核心

**Clarification.ts 模块**（另一个澄清 API）:
- `GET /clarifications/:requirementId`
- `PATCH /clarifications/:requirementId/:clarificationId`  
- 与 `/clarify/chat` 是不同的端点，前者是 CRUD，后者是 AI 对话

### 2.3 homepageAPI（中风险）

**端点**: `GET /api/v1/homepage`

**前端实现**: `homepageAPI.ts` — 返回 `{ theme, userPreferences, lastUpdated }`

**问题**:
- `theme-binding.test.tsx` 测试失败显示 API 返回 500
- 需要确认是后端 bug 还是测试环境问题

**验证命令**:
```bash
curl "https://api.vibex.top/api/v1/homepage"
# 预期: {"theme":"dark","userPreferences":{},"lastUpdated":"..."}
```

### 2.4 缺失的 API 端点

| 功能 | 端点 | 状态 |
|------|------|------|
| 诊断 | `POST /api/v1/analyze/diagnose` | ❌ 缺失 |
| 优化 | `POST /api/v1/analyze/optimize` | ❌ 缺失 |
| 重新生成 | `POST /api/v1/analyze/regenerate` | ❌ 缺失 |
| 保存草稿 | `POST /api/v1/drafts` | ❌ 缺失 |
| 加载草稿 | `GET /api/v1/drafts` | ❌ 缺失 |
| 历史记录 | `GET /api/v1/history` | ❌ 缺失 |

---

## 三、MVP 六步流程 API 依赖

```
Step 1 需求输入
    └─ useSSEStream.connect() → GET /analyze/stream SSE ⚠️

Step 2 限界上下文
    └─ ddd.ts.generateBoundedContext() → POST /ddd/bounded-context ⚠️

Step 3 领域模型
    └─ ddd.ts.generateDomainModel() → POST /ddd/domain-model ⚠️

Step 4 需求澄清
    └─ clarificationApi.sendMessage() → POST /clarify/chat ❌
    └─ clarification.ts.getClarifications() → GET /clarifications ⚠️

Step 5 业务流程
    └─ ddd.ts.generateBusinessFlow() → POST /ddd/flow ⚠️

Step 6 项目创建
    └─ project.ts.createProject() → POST /projects ✅
```

**图例**: ✅ 稳定 | ⚠️ 需验证 | ❌ 缺失

---

## 四、API 稳定性评估

### 4.1 稳定 API（可直接使用）

| API | 证据 |
|-----|------|
| `POST /projects` | project.ts 有完整实现，含 retry 和 cache |
| `GET /projects/:id` | 同上 |
| `GET/POST /flows` | flow.ts 有完整实现 |

### 4.2 需验证的 API（可能工作但不保证）

| API | 验证方法 | 通过标准 |
|-----|---------|---------|
| `POST /ddd/bounded-context` | curl 发送测试需求 | 返回 bounded contexts JSON |
| `POST /ddd/domain-model` | curl 发送 contexts | 返回 domain models JSON |
| `POST /ddd/flow` | curl 发送 models | 返回 flow JSON |
| `GET /homepage` | curl 请求 | 返回 200 + theme JSON（非 500） |
| `GET /clarifications` | curl | 返回 JSON（非 404） |

### 4.3 缺失/高风险 API

| API | 影响 | 缓解方案 |
|-----|------|---------|
| `GET /analyze/stream` SSE | Step1 无法流式返回 | 降级为 REST（慢但可用） |
| `POST /clarify/chat` | Step4 完全不可用 | 实现后端对话 API |
| `POST /analyze/diagnose` | ActionBar 诊断按钮无效 | Phase 2 实现 |
| `POST /analyze/optimize` | ActionBar 优化按钮无效 | Phase 2 实现 |
| `GET /history` | ActionBar 历史按钮无效 | Phase 2 实现 |
| `POST /drafts` | ActionBar 保存按钮无效 | Phase 2 实现 |

---

## 五、后端实现建议

### 5.1 MVP 必需（Phase 1）

按优先级实现：

| # | 端点 | 工作量 | 说明 |
|---|------|--------|------|
| 1 | `POST /ddd/bounded-context` | 2h | 复用现有 AI 分析逻辑 |
| 2 | `POST /ddd/domain-model` | 2h | 依赖 Step 2 数据 |
| 3 | `POST /ddd/flow` | 2h | 依赖 Step 3 数据 |
| 4 | `POST /projects` 验证 | 0.5h | 确认现有实现可用 |
| 5 | `GET /homepage` 修复 | 1h | 修复返回 500 的问题 |

### 5.2 MVP 延期（Phase 2）

| # | 端点 | 工作量 | 说明 |
|---|------|--------|------|
| 6 | `GET /analyze/stream` SSE | 4h | 需要 SSE 实现 + 事件类型定义 |
| 7 | `POST /clarify/chat` | 3h | AI 对话逻辑 |
| 8 | `POST /drafts` | 1h | 草稿持久化 |
| 9 | `GET /history` | 1h | 历史记录查询 |
| 10 | `POST /analyze/diagnose` | 2h | 诊断逻辑 |
| 11 | `POST /analyze/optimize` | 2h | 优化逻辑 |

---

## 六、验收标准

| ID | 标准 | 测试方法 |
|----|------|---------|
| V1 | `curl POST /ddd/bounded-context` 返回有效 JSON | `jq .boundedContexts` 成功解析 |
| V2 | `curl POST /ddd/domain-model` 返回有效 JSON | `jq .domainModels` 成功解析 |
| V3 | `curl POST /ddd/flow` 返回有效 JSON | `jq .businessFlow` 成功解析 |
| V4 | `curl GET /homepage` 返回 200（非 500） | HTTP 状态码 = 200 |
| V5 | 前端 Step 1-6 至少各有一个 API 调用成功 | 集成测试 |
| V6 | SSE endpoint 存在（即使不完美） | `curl -N` 不返回 404 |

---

## 七、风险与缓解

| 风险 | 等级 | 缓解 |
|------|------|------|
| SSE 后端未实现导致 Step1 无反馈 | 🔴 高 | 降级为普通 POST + loading 状态 |
| `/clarify/chat` 缺失导致 Step4 无法澄清 | 🔴 高 | Phase 2 优先实现 |
| homepage API 返回 500 导致主题功能失效 | 🟡 中 | 修复后端或前端 fallback |
| DDD API 后端逻辑缺失 | 🟡 中 | 先用 mock 数据验证前端流程 |
| API 版本不一致（/api/v1 vs /ddd） | 🟢 低 | 统一 baseURL 配置 |

---

*分析人: Analyst Agent | 2026-03-22*

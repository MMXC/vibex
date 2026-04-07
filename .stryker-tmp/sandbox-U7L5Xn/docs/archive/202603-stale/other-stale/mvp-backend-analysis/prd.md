# PRD: MVP 首页后端支持

**项目**: mvp-backend-analysis  
**版本**: v1.0  
**日期**: 2026-03-22  
**负责人**: PM Agent  
**状态**: 已完成分析

---

## 一、项目背景

### 1.1 问题陈述

MVP 首页六步流程（需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → 项目创建）依赖 **12 个 API 端点**，但存在严重的 API 缺口：

- **1 个 SSE 流式接口**（Step 1 核心）完全缺失后端实现
- **1 个 Clarification Chat 接口**（Step 4 核心）完全缺失
- **7 个辅助 API 端点**（诊断/优化/草稿/历史等）缺失
- **3 个 DDD 接口**需验证稳定性

导致 MVP 六步流程无法端到端走通，用户体验严重受损。

### 1.2 预期收益

| 指标 | 当前 | 目标 |
|------|------|------|
| MVP 六步流程可走通率 | 约 50% | 100% |
| 核心 API 成功率 | < 60% | > 95% |
| Step 1 实时反馈 | ❌ 无 | ✅ 流式返回 |
| Step 4 需求澄清 | ❌ 不可用 | ✅ 可对话澄清 |

---

## 二、Epic 拆分

### Epic 1: SSE 流式分析接口
- **Story E1.1**: 实现 `GET /api/v1/analyze/stream` SSE endpoint（7 种事件类型）
- **Story E1.2**: 前端 SSE Hook 与后端联调

### Epic 2: DDD 生成 API
- **Story E2.1**: 实现 `POST /ddd/bounded-context` 限界上下文生成
- **Story E2.2**: 实现 `POST /ddd/domain-model` 领域模型生成
- **Story E2.3**: 实现 `POST /ddd/business-flow` 业务流程生成
- **Story E2.4**: 验证 Project CRUD 端点可用性

### Epic 3: Clarification 对话与澄清 API
- **Story E3.1**: 实现 `POST /api/clarify/chat` AI 对话澄清接口
- **Story E3.2**: 实现 `GET /requirements/:requirementId/clarifications` 澄清记录查询
- **Story E3.3**: 实现 `PUT /clarifications/:clarificationId` 澄清回答/跳过

### Epic 4: Homepage API 修复与 ActionBar 辅助端点
- **Story E4.1**: 修复 `GET /api/v1/homepage` 返回 500 问题
- **Story E4.2**: 实现 `POST /api/v1/drafts` 保存草稿
- **Story E4.3**: 实现 `GET /api/v1/drafts` 加载草稿
- **Story E4.4**: 实现 `GET /api/v1/history` 历史记录
- **Story E4.5**: 实现 `POST /api/v1/analyze/diagnose` 诊断
- **Story E4.6**: 实现 `POST /api/v1/analyze/optimize` 优化
- **Story E4.7**: 实现 `POST /api/v1/analyze/regenerate` 重新生成

---

## 三、功能需求

### 3.1 Epic 1: SSE 流式分析接口

#### F1.1 SSE 流式分析端点

| 字段 | 值 |
|------|-----|
| **ID** | F1.1 |
| **功能点** | SSE 流式分析接口 |
| **描述** | 实现 `GET /api/v1/analyze/stream` 端点，通过 Server-Sent Events 将 MVP 分析过程分步推送至前端。支持 7 种 SSE 事件类型：thinking（思考过程）、step_context（限界上下文）、step_model（领域模型）、step_flow（业务流程）、step_components（组件关系）、done（完成）、error（错误）。前端使用 EventSource 连接，支持指数退避重连（1s → 2s → 4s，最多 3 次）。 |
| **验收标准** | `expect(res.headers['content-type']).toContain('text/event-stream')`<br>`expect(eventType).toMatch(/^thinking\|step_context\|step_model\|step_flow\|step_components\|done\|error$/)`<br>`expect(SSEStreamParser.parse(eventData)).toHaveProperty('content')`<br>`expect(sseEndpoint).resolves.not.toThrow()`<br>`expect(curl -N -H "Accept: text/event-stream" "/api/v1/analyze/stream?requirement=test").resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】`useSSEStream.ts` Hook 已实现，后端 SSE endpoint 需要与其对接 |

#### F1.2 SSE 事件类型规范

| 字段 | 值 |
|------|-----|
| **ID** | F1.2 |
| **功能点** | SSE 事件 payload 格式定义 |
| **描述** | 定义 7 种 SSE 事件的数据结构。thinking 事件推送思考过程文本；step_context/step_model/step_flow/step_components 推送分析结果含 content、mermaidCode、confidence；done 推送 projectId；error 推送错误信息。 |
| **验收标准** | `expect(thinkingEvent.data).toBeDefined()`<br>`expect(contextEvent.data).toHaveProperty('content')`<br>`expect(contextEvent.data).toHaveProperty('mermaidCode')`<br>`expect(contextEvent.data).toHaveProperty('confidence')`<br>`expect(doneEvent.data).toHaveProperty('projectId')` |
| **页面集成** | ❌ 纯后端规范，前端解析逻辑在 `useSSEStream.ts` 中已固定 |

---

### 3.2 Epic 2: DDD 生成 API

#### F2.1 限界上下文生成

| 字段 | 值 |
|------|-----|
| **ID** | F2.1 |
| **功能点** | `POST /ddd/bounded-context` 限界上下文生成 |
| **描述** | 接收需求文本，返回 DDD 限界上下文分析结果。前端 `ddd.ts.generateBoundedContext()` 调用此端点。请求体包含 `requirementText` 和可选 `projectId`。返回 `BoundedContextResponse`。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response.boundedContexts).toBeDefined()`<br>`expect(Array.isArray(response.boundedContexts)).toBe(true)`<br>`expect(response.boundedContexts.length).toBeGreaterThan(0)`<br>`expect(curl -X POST -d '{"requirementText":"test"}' /ddd/bounded-context).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】`src/services/api/modules/ddd.ts` 中 `generateBoundedContext()` 已实现 |

#### F2.2 领域模型生成

| 字段 | 值 |
|------|-----|
| **ID** | F2.2 |
| **功能点** | `POST /ddd/domain-model` 领域模型生成 |
| **描述** | 接收限界上下文和需求文本，生成 DDD 领域模型。前端 `ddd.ts.generateDomainModel()` 调用此端点。依赖 Step 2 数据。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response.success).toBe(true)`<br>`expect(response.domainModels).toBeDefined()`<br>`expect(response.mermaidCode).toBeDefined()`<br>`expect(typeof response.mermaidCode).toBe('string')` |
| **页面集成** | 【需页面集成】`src/services/api/modules/ddd.ts` 中 `generateDomainModel()` 已实现 |

#### F2.3 业务流程生成

| 字段 | 值 |
|------|-----|
| **ID** | F2.3 |
| **功能点** | `POST /ddd/business-flow` 业务流程生成 |
| **描述** | 接收领域模型和需求文本，生成业务流程。前端 `ddd.ts.generateBusinessFlow()` 调用此端点。注意前端调用路径是 `/ddd/business-flow`（含 business-），需与后端路由一致。依赖 Step 3 数据。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response.success).toBe(true)`<br>`expect(response.businessFlow).toBeDefined()`<br>`expect(response.mermaidCode).toBeDefined()`<br>`expect(typeof response.mermaidCode).toBe('string')` |
| **页面集成** | 【需页面集成】`src/services/api/modules/ddd.ts` 中 `generateBusinessFlow()` 已实现 |

#### F2.4 项目 CRUD 验证

| 字段 | 值 |
|------|-----|
| **ID** | F2.4 |
| **功能点** | Project API 端点验证 |
| **描述** | 确认 `POST /projects`、`GET /projects/:id`、`GET /projects` 等 Project API 端点正常工作。前端 `project.ts` 有完整实现，含 retry 和 cache。 |
| **验收标准** | `expect(POST /projects).resolves.statusCode(200)`<br>`expect(GET /projects/:id).resolves.toHaveProperty('id')`<br>`expect(createProject).resolves.toHaveProperty('name')`<br>`expect(projectApi.getProjects).resolves.not.toThrow()` |
| **页面集成** | ❌ Project API 前端已完整实现，后端需确保端点可用 |

---

### 3.3 Epic 3: Clarification 对话与澄清 API

#### F3.1 Clarification Chat 对话接口

| 字段 | 值 |
|------|-----|
| **ID** | F3.1 |
| **功能点** | `POST /api/clarify/chat` AI 对话澄清 |
| **描述** | 实现对话式需求澄清核心接口。接收 `message`、`history`（对话历史）、`context`，返回 `reply`、`quickReplies`、`completeness`、`suggestions`、`nextAction`。前端 `clarificationApi.ts` 已实现客户端。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('reply')`<br>`expect(response).toHaveProperty('completeness')`<br>`expect(typeof response.completeness).toBe('number')`<br>`expect(response).toHaveProperty('nextAction')`<br>`expect(clarificationApi.sendMessage(request)).resolves.not.toThrow()` |
| **页面集成** | 【需页面集成】`src/lib/api/clarificationApi.ts` 中 `sendMessage()` 已实现 |

#### F3.2 Clarification 记录查询

| 字段 | 值 |
|------|-----|
| **ID** | F3.2 |
| **功能点** | `GET /requirements/:requirementId/clarifications` 澄清记录查询 |
| **描述** | 查询某个需求的澄清问题列表。前端 `clarification.ts.getClarifications()` 调用此端点。返回 `Clarification[]`。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(Array.isArray(response)).toBe(true)`<br>`expect(response[0]).toHaveProperty('id')`<br>`expect(response[0]).toHaveProperty('question')`<br>`expect(clarificationApi.getClarifications(requirementId)).resolves.not.toThrow()` |
| **页面集成** | 【需页面集成】`src/services/api/modules/clarification.ts` 中 `getClarifications()` 已实现 |

#### F3.3 Clarification 回答/跳过

| 字段 | 值 |
|------|-----|
| **ID** | F3.3 |
| **功能点** | `PUT /clarifications/:clarificationId` 澄清回答/跳过 |
| **描述** | 回答或跳过某个澄清问题。前端 `clarification.ts.answerClarification()` 和 `skipClarification()` 调用此端点。PATCH 请求体包含 `answer` 或 `status: 'skipped'`。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('id')`<br>`expect(response).toHaveProperty('answer')`<br>`expect(clarificationApi.answerClarification(id, qid, 'answer')).resolves.not.toThrow()`<br>`expect(clarificationApi.skipClarification(id, qid)).resolves.not.toThrow()` |
| **页面集成** | 【需页面集成】`src/services/api/modules/clarification.ts` 中 `answerClarification()`/`skipClarification()` 已实现 |

---

### 3.4 Epic 4: Homepage API 修复与 ActionBar 辅助端点

#### F4.1 Homepage API 修复

| 字段 | 值 |
|------|-----|
| **ID** | F4.1 |
| **功能点** | `GET /api/v1/homepage` 修复 500 错误 |
| **描述** | 修复 `GET /api/v1/homepage` 端点，使其返回 200 而非 500。返回 `{ theme, userPreferences, configs, lastUpdated }`。前端 `homepageAPI.ts` 实现缓存（5min TTL）和主题优先级合并策略（localStorage > userPreferences > system > API default）。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('theme')`<br>`expect(response.theme).toMatch(/^light\|dark\|system$/)`<br>`expect(fetchHomepageData()).resolves.not.toBe(null)`<br>`expect(themeBindingTest).resolves.toPass()` |
| **页面集成** | 【需页面集成】`src/services/homepageAPI.ts` 已实现，含测试 `theme-binding.test.tsx` |

#### F4.2 草稿保存

| 字段 | 值 |
|------|-----|
| **ID** | F4.2 |
| **功能点** | `POST /api/v1/drafts` 保存草稿 |
| **描述** | 保存用户未完成的需求分析草稿。ActionBar 保存按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('id')`<br>`expect(response).toHaveProperty('createdAt')`<br>`expect(POST /api/v1/drafts).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 保存按钮需调用此端点 |

#### F4.3 草稿加载

| 字段 | 值 |
|------|-----|
| **ID** | F4.3 |
| **功能点** | `GET /api/v1/drafts` 加载草稿列表 |
| **描述** | 获取用户所有草稿列表。ActionBar 加载按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(Array.isArray(response)).toBe(true)`<br>`expect(response[0]).toHaveProperty('id')`<br>`expect(GET /api/v1/drafts).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 加载按钮需调用此端点 |

#### F4.4 历史记录

| 字段 | 值 |
|------|-----|
| **ID** | F4.4 |
| **功能点** | `GET /api/v1/history` 历史记录查询 |
| **描述** | 获取已完成的需求分析历史记录。ActionBar 历史按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(Array.isArray(response)).toBe(true)`<br>`expect(response[0]).toHaveProperty('id')`<br>`expect(response[0]).toHaveProperty('createdAt')`<br>`expect(GET /api/v1/history).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 历史按钮需调用此端点 |

#### F4.5 诊断功能

| 字段 | 值 |
|------|-----|
| **ID** | F4.5 |
| **功能点** | `POST /api/v1/analyze/diagnose` 需求诊断 |
| **描述** | 对已生成的结果进行诊断分析，发现潜在问题。ActionBar 诊断按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('issues')`<br>`expect(Array.isArray(response.issues)).toBe(true)`<br>`expect(POST /api/v1/analyze/diagnose).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 诊断按钮需调用此端点 |

#### F4.6 优化功能

| 字段 | 值 |
|------|-----|
| **ID** | F4.6 |
| **功能点** | `POST /api/v1/analyze/optimize` 结果优化 |
| **描述** | 对已生成的结果进行优化。ActionBar 优化按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('optimizedContent')`<br>`expect(POST /api/v1/analyze/optimize).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 优化按钮需调用此端点 |

#### F4.7 重新生成功能

| 字段 | 值 |
|------|-----|
| **ID** | F4.7 |
| **功能点** | `POST /api/v1/analyze/regenerate` 重新生成 |
| **描述** | 基于相同需求重新生成分析结果。ActionBar 重新生成按钮依赖此端点。 |
| **验收标准** | `expect(statusCode).toBe(200)`<br>`expect(response).toHaveProperty('regeneratedContent')`<br>`expect(POST /api/v1/analyze/regenerate).resolves.not.toBe(404)` |
| **页面集成** | 【需页面集成】ActionBar 重新生成按钮需调用此端点 |

---

## 四、验收标准汇总

### 4.1 P0 — 发布阻塞（必须完成）

| ID | 验收标准 | Epic |
|----|----------|------|
| V1 | `GET /api/v1/analyze/stream` SSE endpoint 存在，`curl -N` 不返回 404 | E1 |
| V2 | `POST /ddd/bounded-context` 返回 200 + `boundedContexts` JSON | E2 |
| V3 | `POST /ddd/domain-model` 返回 200 + `domainModels` JSON | E2 |
| V4 | `POST /ddd/business-flow` 返回 200 + `businessFlow` JSON | E2 |
| V5 | `GET /api/v1/homepage` 返回 200（非 500） | E4 |
| V6 | 前端 Step 1–3 各有一个 API 调用成功 | E1+E2 |
| V7 | `POST /api/clarify/chat` 返回 200 + `reply` 字段 | E3 |

### 4.2 P1 — 本迭代必做

| ID | 验收标准 | Epic |
|----|----------|------|
| V8 | `GET /requirements/:requirementId/clarifications` 返回 200 + Clarification 数组 | E3 |
| V9 | `PUT /clarifications/:clarificationId` 回答/跳过成功 | E3 |
| V10 | SSE 7 种事件类型均可正确推送（thinking, step_context, step_model, step_flow, step_components, done, error） | E1 |
| V11 | SSE `done` 事件包含 `projectId` | E1 |
| V12 | Project CRUD 端点（GET/POST /projects, GET /projects/:id）全部可用 | E2 |

### 4.3 P2 — 下一步迭代

| ID | 验收标准 | Epic |
|----|----------|------|
| V13 | `POST /api/v1/drafts` 保存草稿成功 | E4 |
| V14 | `GET /api/v1/drafts` 返回草稿列表 | E4 |
| V15 | `GET /api/v1/history` 返回历史记录 | E4 |
| V16 | `POST /api/v1/analyze/diagnose` 返回诊断结果 | E4 |
| V17 | `POST /api/v1/analyze/optimize` 返回优化结果 | E4 |
| V18 | `POST /api/v1/analyze/regenerate` 返回重新生成结果 | E4 |

---

## 五、非功能需求

### 5.1 性能

| 指标 | 要求 |
|------|------|
| API 响应时间 | P95 ≤ 10s（DDD 生成类 API 可延长至 30s） |
| SSE 延迟 | 首字节延迟 ≤ 500ms |
| Homepage API | 缓存有效时响应 ≤ 50ms |
| 并发支持 | 同时 50 个 SSE 连接不崩溃 |

### 5.2 可靠性

| 指标 | 要求 |
|------|------|
| SSE 重连 | 支持指数退避（1s → 2s → 4s），最多 3 次 |
| 网络容错 | 前端 axios retry 机制（3次重试，指数退避） |
| 熔断保护 | 关键 API 受 circuitBreakerManager 保护 |
| 降级策略 | SSE 不可用时降级为 REST POST + loading 状态 |

### 5.3 安全性

| 指标 | 要求 |
|------|------|
| 认证 | 所有 API 需认证（Bearer Token from sessionStorage/localStorage） |
| 输入校验 | 所有 POST 请求体必须校验 `requirementText` 非空 |
| 错误信息 | 不向客户端暴露内部错误堆栈 |

### 5.4 API 版本一致性

| 指标 | 要求 |
|------|------|
| 路径规范 | DDD API 使用 `/ddd/*`，其他使用 `/api/v1/*` |
| Content-Type | 统一 `application/json` |
| 错误格式 | `{ "error": "错误信息" }` |

### 5.5 可观测性

| 指标 | 要求 |
|------|------|
| 日志 | 关键路径打印 `[API]` 前缀日志 |
| SSE 状态 | 前端 `sseStatus` 状态机覆盖 idle/connecting/connected/reconnecting/error/failed |
| 错误追踪 | API 500 错误需有结构化日志便于排查 |

---

## 六、技术规格

### 6.1 API 端点总表

| # | 端点 | 方法 | 状态 | 优先级 | Epic |
|---|------|------|------|--------|------|
| 1 | `/api/v1/analyze/stream` | GET | ❌ 缺失 | P0 | E1 |
| 2 | `/ddd/bounded-context` | POST | ⚠️ 需验证 | P0 | E2 |
| 3 | `/ddd/domain-model` | POST | ⚠️ 需验证 | P0 | E2 |
| 4 | `/ddd/business-flow` | POST | ⚠️ 需验证 | P0 | E2 |
| 5 | `/api/v1/homepage` | GET | ⚠️ 返回500 | P0 | E4 |
| 6 | `/api/clarify/chat` | POST | ❌ 缺失 | P0 | E3 |
| 7 | `/requirements/:requirementId/clarifications` | GET | ⚠️ 需验证 | P1 | E3 |
| 8 | `/clarifications/:clarificationId` | PUT | ⚠️ 需验证 | P1 | E3 |
| 9 | `/projects` | GET/POST | ✅ 已有 | P1 | E2 |
| 10 | `/api/v1/drafts` | POST/GET | ❌ 缺失 | P2 | E4 |
| 11 | `/api/v1/history` | GET | ❌ 缺失 | P2 | E4 |
| 12 | `/api/v1/analyze/diagnose` | POST | ❌ 缺失 | P2 | E4 |
| 13 | `/api/v1/analyze/optimize` | POST | ❌ 缺失 | P2 | E4 |
| 14 | `/api/v1/analyze/regenerate` | POST | ❌ 缺失 | P2 | E4 |

### 6.2 前端 API 客户端位置

| 模块 | 文件路径 |
|------|---------|
| SSE Stream | `src/components/homepage/hooks/useSSEStream.ts` |
| Clarification Chat | `src/lib/api/clarificationApi.ts` |
| Clarification CRUD | `src/services/api/modules/clarification.ts` |
| DDD APIs | `src/services/api/modules/ddd.ts` |
| Project APIs | `src/services/api/modules/project.ts` |
| Homepage API | `src/services/homepageAPI.ts` |
| HTTP Client | `src/services/api/client.ts` (含 retry + circuitBreaker) |
| API Config | `src/lib/api-config.ts` (baseURL: `https://api.vibex.top/api`) |

---

## 七、MVP 六步流程与 API 映射

```
Step 1 需求输入 (SSE 分析)
  → F1.1 GET /api/v1/analyze/stream (SSE)
  → F1.2 SSE 事件格式规范

Step 2 限界上下文 (DDD)
  → F2.1 POST /ddd/bounded-context

Step 3 领域模型 (DDD)
  → F2.2 POST /ddd/domain-model

Step 4 需求澄清 (Clarification)
  → F3.1 POST /api/clarify/chat (AI 对话)
  → F3.2 GET /requirements/:id/clarifications (查询)
  → F3.3 PUT /clarifications/:id (回答/跳过)

Step 5 业务流程 (DDD)
  → F2.3 POST /ddd/business-flow

Step 6 项目创建 (Project)
  → F2.4 POST /projects

ActionBar (辅助功能)
  → F4.1 修复 GET /api/v1/homepage
  → F4.2 POST /api/v1/drafts (保存)
  → F4.3 GET /api/v1/drafts (加载)
  → F4.4 GET /api/v1/history (历史)
  → F4.5 POST /api/v1/analyze/diagnose (诊断)
  → F4.6 POST /api/v1/analyze/optimize (优化)
  → F4.7 POST /api/v1/analyze/regenerate (重新生成)
```

---

## 八、实施计划

### Phase 1: MVP 核心打通（1-2 周）

**目标**: 使 MVP 六步流程端到端可走通

| 优先级 | 任务 | 工时 |
|--------|------|------|
| P0 | 修复 `GET /api/v1/homepage` 返回 500 | 1h |
| P0 | 验证/实现 `POST /ddd/bounded-context` | 2h |
| P0 | 验证/实现 `POST /ddd/domain-model` | 2h |
| P0 | 验证/实现 `POST /ddd/business-flow` | 2h |
| P0 | 验证 Project CRUD 端点 | 0.5h |
| P0 | 实现 `POST /api/clarify/chat` | 3h |
| P0 | 实现 `GET /api/v1/analyze/stream` SSE endpoint | 4h |

**Phase 1 预计工时: 14.5h (~2 人天)**

### Phase 2: Clarification 功能完善（1 周）

| 优先级 | 任务 | 工时 |
|--------|------|------|
| P1 | 验证 `GET /requirements/:id/clarifications` | 1h |
| P1 | 验证 `PUT /clarifications/:id` | 1h |
| P1 | SSE 7 种事件类型完整实现 | 2h |

**Phase 2 预计工时: 4h**

### Phase 3: ActionBar 辅助功能（1 周）

| 优先级 | 任务 | 工时 |
|--------|------|------|
| P2 | 实现 `POST /api/v1/drafts` | 1h |
| P2 | 实现 `GET /api/v1/drafts` | 1h |
| P2 | 实现 `GET /api/v1/history` | 1h |
| P2 | 实现 `POST /api/v1/analyze/diagnose` | 2h |
| P2 | 实现 `POST /api/v1/analyze/optimize` | 2h |
| P2 | 实现 `POST /api/v1/analyze/regenerate` | 2h |

**Phase 3 预计工时: 9h**

---

## 九、风险与缓解

| 风险 | 等级 | 缓解方案 |
|------|------|---------|
| SSE 后端未实现导致 Step1 无反馈 | 🔴 高 | 降级为 REST POST + 前端 loading 状态 |
| `/clarify/chat` 缺失导致 Step4 不可用 | 🔴 高 | Phase 1 优先实现 AI 对话接口 |
| homepage API 返回 500 | 🟡 中 | 修复后端或前端增加 fallback 默认值 |
| DDD API 后端逻辑缺失 | 🟡 中 | 先用 mock 数据验证前端流程 |
| API 路径不一致（/ddd vs /api/v1） | 🟢 低 | 按 `api-config.ts` 统一 baseURL 配置 |
| SSE 与 REST 并存增加复杂度 | 🟢 低 | SSE 仅用于 Step 1 流式输出，其他用 REST |

---

## 十、成功指标

- [ ] MVP 六步流程完整走通率 ≥ 95%
- [ ] P0 API 端点成功率 ≥ 95%（curl 测试）
- [ ] SSE endpoint `curl -N` 响应时间 < 500ms
- [ ] DDD API 响应时间 P95 ≤ 10s
- [ ] Homepage API 修复后不再返回 500
- [ ] Clarification Chat 可正常对话并返回 reply

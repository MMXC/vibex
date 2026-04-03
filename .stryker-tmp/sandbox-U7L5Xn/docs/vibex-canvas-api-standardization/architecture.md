# VibeX Canvas API 标准化架构文档

**项目**: vibex-canvas-api-standardization  
**阶段**: Phase 1 — 架构设计  
**Agent**: architect  
**日期**: 2026-03-29  
**状态**: Approved

---

## 1. 架构概览

### 1.1 项目背景

VibeX Canvas 当前存在两套并行 API 路由体系：

| 层级 | 旧路由前缀 | 新路由前缀 | 状态 |
|------|------------|------------|------|
| 后端 API | `/api/canvas/*` | `/api/v1/canvas/*` | 并存，功能完全一致 |
| 前端封装 | `canvasApi.ts` | 统一封装 | 已有 v1 配置 |

**核心目标**: 废弃旧路由，统一为 `/api/v1/canvas/*`，消除重复维护负担。

### 1.2 技术选型

**采用方案**: 渐进式废弃（Progressive Deprecation）

- 理由：改动集中，风险可控，无需引入网关代理层
- 不采用网关代理（方案 B）：治标不治本，长期仍需维护两套代码

### 1.3 架构变更图

```
变更前:
┌─────────────────────────────────────────────────────────────┐
│  Frontend (vibex-fronted)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ canvasApi.ts │  │  dddApi.ts   │  │  api-config.ts  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                 │                    │            │
│         │  /api/canvas/*  │  /api/v1/canvas/*  │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 │                    ▼
┌──────────────────┐       │    ┌─────────────────────────────┐
│ /app/api/canvas/ │       │    │ /app/api/v1/canvas/*        │
│ (旧路由, 待删除)  │       │    │ (新路由, 保留)              │
└──────────────────┘       │    └─────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────────────┐
              │ /api/v1/analyze/stream (SSE)│
              └─────────────────────────────┘

变更后:
┌─────────────────────────────────────────────────────────────┐
│  Frontend (vibex-fronted)                                  │
│  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │  canvasApi.ts    │  │  canvasSseApi.ts (原 dddApi.ts)│ │
│  │ (统一 v1 路由)    │  │  (SSE 流式封装)                │ │
│  └────────┬─────────┘  └───────────────┬────────────────┘ │
│           │                              │                  │
│           │         /api/v1/canvas/*     │                  │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (vibex-backend)                                   │
│  /app/api/v1/canvas/* (唯一 API 路由层)                      │
│  - generate-contexts (Step0: 提取限界上下文)                 │
│  - generate-flows     (Step1: 生成业务流程)                 │
│  - generate-components(Step2: 生成组件树)                   │
│  - generate           (综合生成)                            │
│  - project            (项目创建)                            │
│  - status             (队列状态)                             │
│  - export             (导出)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 目录结构变更

### 2.1 后端 (vibex-backend)

```
vibex-backend/src/app/api/
├── canvas/                    # ← 待删除（确认无引用后）
│   ├── generate-contexts/
│   ├── generate-flows/
│   ├── generate-components/
│   ├── generate/
│   ├── project/
│   ├── status/
│   ├── export/
│   └── __tests__/
└── v1/
    └── canvas/                # ← 保留，唯一标准
        ├── generate-contexts/
        ├── generate-flows/
        ├── generate-components/
        ├── generate/
        ├── project/
        ├── status/
        ├── export/
        └── __tests__/
```

### 2.2 前端 (vibex-fronted)

```
vibex-fronted/src/lib/
├── api-config.ts              # ← 确认 canvas 端点均 /v1/ 开头（已满足）
└── canvas/
    └── api/
        ├── canvasApi.ts       # ← 审查清理，无硬编码 URL
        ├── canvasSseApi.ts   # ← 从 dddApi.ts 重命名迁移
        └── types.ts          # ← 共享类型定义
```

**注意**: `dddApi.ts` → `canvasSseApi.ts` 迁移后，原文件删除。

---

## 3. API 规范

### 3.1 Canvas API 端点矩阵

| 方法 | 端点 | 输入 | 输出 | SessionId |
|------|------|------|------|-----------|
| POST | `/api/v1/canvas/generate-contexts` | `{ requirementText, projectId? }` | `{ success, contexts[], sessionId, confidence }` | 生成 |
| POST | `/api/v1/canvas/generate-flows` | `{ requirementText, contexts[], sessionId }` | `{ success, flows[], sessionId }` | 传递 |
| POST | `/api/v1/canvas/generate-components` | `{ flows[], sessionId }` | `{ success, components[], sessionId }` | 传递 |
| POST | `/api/v1/canvas/generate` | `{ requirementText }` | `{ success, projectId, status }` | 内部 |
| POST | `/api/v1/canvas/project` | `{ contexts[], flows[], components[] }` | `{ success, projectId }` | - |
| GET | `/api/v1/canvas/status` | `?projectId=xxx` | `{ success, status, progress }` | - |
| POST | `/api/v1/canvas/export` | `{ projectId, format }` | `{ success, downloadUrl }` | - |

### 3.2 SSE 流式端点

| 方法 | 端点 | 用途 | 事件类型 |
|------|------|------|-----------|
| GET | `/api/v1/analyze/stream` | 实时分析流 | `thinking`, `step_context`, `done`, `error` |

封装迁移至 `canvasSseApi.ts`，函数命名前缀 `canvasSse*`。

### 3.3 统一响应格式

```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: { code: string, message: string } }
```

---

## 4. SessionId 链路设计

两步设计流程的 sessionId 全链路：

```
Step0: POST /api/v1/canvas/generate-contexts
       → 响应: { sessionId: "sess_abc123" }

Step1: POST /api/v1/canvas/generate-flows
       请求: { ..., sessionId: "sess_abc123" }
       → 响应: { sessionId: "sess_abc123" } (透传)

Step2: POST /api/v1/canvas/generate-components
       请求: { ..., sessionId: "sess_abc123" }
       → 响应: { sessionId: "sess_abc123" } (透传)
```

**存储策略**: sessionId 存储于 `localStorage` key `vibex_canvas_session`，确保页面刷新后仍可继续。

---

## 5. 关键技术决策 (ADRs)

### ADR-001: 统一 API 版本前缀

- **决定**: Canvas API 统一使用 `/api/v1/canvas/*`
- **理由**: 符合 RESTful 版本控制最佳实践，为未来 v2 预留扩展空间
- **状态**: 已确定

### ADR-002: 渐进式废弃旧路由

- **决定**: 直接删除旧路由目录，不保留网关代理
- **理由**: 
  - 两套实现代码完全相同（代码审查确认）
  - 前端已统一配置 v1 端点
  - 网关代理仅转移债务，不解决问题
- **前提**: 全库扫描确认无旧路由引用
- **状态**: 已确定

### ADR-003: SSE 端点统一命名空间

- **决定**: `dddApi.ts` → `canvasSseApi.ts`，纳入 `src/lib/canvas/api/` 模块
- **理由**: SSE 端点是 Canvas 功能子集，统一命名空间便于维护
- **函数命名**: `canvasSse*` 前缀（`canvasSseAnalyze`, `canvasSseStream` 等）
- **状态**: 已确定

### ADR-004: API 配置集中管理

- **决定**: 所有 Canvas API 调用必须通过 `api-config.ts` 配置，禁止硬编码 URL
- **理由**: 单一配置源，便于版本切换和环境差异化
- **状态**: 已确定

### ADR-005: SessionId 管理策略

- **决定**: sessionId 通过请求体传递，存储于 localStorage
- **理由**: 无状态服务端设计，会话数据由客户端维护
- **风险**: 页面刷新后 localStorage 持久化可能覆盖，需审查存储逻辑
- **状态**: 已确定

---

## 6. 模块职责

### 6.1 Backend (vibex-backend)

| 模块 | 职责 | 文件路径 |
|------|------|---------|
| Canvas Route Handlers | 处理 7 个 API 端点的请求 | `src/app/api/v1/canvas/*/route.ts` |
| Canvas SSE Handler | 处理流式分析请求 | `src/app/api/v1/analyze/stream/route.ts` |
| Canvas Tests | 各端点单元测试 | `src/app/api/v1/canvas/*/__tests__/` |

### 6.2 Frontend (vibex-fronted)

| 模块 | 职责 | 文件路径 |
|------|------|---------|
| API Config | 端点配置集中管理 | `src/lib/api-config.ts` |
| canvasApi | Canvas CRUD API 封装 | `src/lib/canvas/api/canvasApi.ts` |
| canvasSseApi | SSE 流式 API 封装 | `src/lib/canvas/api/canvasSseApi.ts` |
| canvasTypes | 共享类型定义 | `src/lib/canvas/api/types.ts` |

---

## 7. 依赖关系

```
变更前依赖:
canvasApi.ts ──→ /api/canvas/* (旧)
canvasApi.ts ──→ /api/v1/canvas/* (新)
dddApi.ts ──→ /api/v1/analyze/stream (SSE)

变更后依赖:
canvasApi.ts ──→ /api/v1/canvas/* (唯一)
canvasSseApi.ts ──→ /api/v1/analyze/stream (SSE, 迁移后路径不变)
api-config.ts ──→ 统一配置源
```

---

## 8. 测试策略

### 8.1 测试分层

| 层级 | 范围 | 工具 |
|------|------|------|
| 单元测试 | Route handler 逻辑 | Jest + @testing-library |
| 集成测试 | API 端点对端 | Playwright |
| E2E 测试 | Canvas 完整流程 UI | Playwright |

### 8.2 E2E 测试用例

```
Canvas E2E 流程:
1. 用户输入需求文本 → contexts 生成
2. contexts → flows 生成 (sessionId 传递验证)
3. flows → components 生成 (sessionId 传递验证)
4. components → project 保存
5. 页面加载无 404
```

---

## 9. 风险评估

| 风险 | 等级 | 缓解措施 | 验证方法 |
|------|------|----------|----------|
| 外部系统调用旧路由 | 中 | 全库 grep 扫描 + 部署前审查 | `grep -r "/api/canvas" --include="*.ts"` |
| 旧测试文件覆盖旧路由 | 中 | 迁移后删除旧测试或更新路径 | `find . -path "*/__tests__/*" \| xargs grep "/api/canvas"` |
| SSE 端点路径未全面更新 | 低 | 迁移后 grep 确认无 `dddApi.ts` 残留引用 | `grep -r "dddApi" --include="*.ts"` |
| sessionId 存储介质丢失 | 低 | 审查 localStorage 读写逻辑 | 代码审查 + E2E 验证 |
| `getApiUrl()` 未覆盖所有端点 | 低 | 代码审查 + 自动化检测 | ESLint 插件检测硬编码 URL |

---

## 10. 非功能性要求

| 维度 | 要求 |
|------|------|
| **兼容性** | 前端改动后，旧项目仍可正常加载（sessionId localStorage 兼容） |
| **性能** | API 调用路径变更不引入额外延迟 |
| **可维护性** | 所有 API 端点配置集中于 `api-config.ts`，零硬编码 |
| **可测试性** | E2E 测试覆盖完整流程，100% 通过方可发布 |
| **向后兼容** | 废弃旧路由前确保 v1 路由完全覆盖所有功能 |

---

## 11. 决策记录

| ADR | 决策 | 日期 | 状态 |
|-----|------|------|------|
| ADR-001 | 统一 API 版本前缀 `/api/v1/canvas/*` | 2026-03-29 | ✅ 批准 |
| ADR-002 | 渐进式废弃旧路由（直接删除） | 2026-03-29 | ✅ 批准 |
| ADR-003 | dddApi.ts → canvasSseApi.ts | 2026-03-29 | ✅ 批准 |
| ADR-004 | 集中配置，禁止硬编码 URL | 2026-03-29 | ✅ 批准 |
| ADR-005 | sessionId localStorage 传递策略 | 2026-03-29 | ✅ 批准 |

---

*架构设计人: architect | 审核: pm + analyst | 日期: 2026-03-29*

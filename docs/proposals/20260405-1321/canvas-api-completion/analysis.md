# Analysis: Canvas API Completion

**Project**: canvas-api-completion  
**Phase**: analyze-requirements  
**Analyst**: analyst  
**Date**: 2026-04-05  
**Status**: ✅ Research Complete → Analysis Complete

---

## 1. Problem Statement

VibeX Canvas 的前端 API 封装层（`vibex-fronted/src/lib/canvas/api/`）已完成 **13 个端点** 的定义和调用封装，但后端仅有 **9 个端点** 实际实现。其中：

- **5 个快照层端点**（snapshots CRUD）前端已封装但后端完全缺失 → 100% missing
- **9 个 CRUD 端点**（projects/contexts/flows/components 增删改查）完全未实现 → 100% missing
- AI 生成端点（generate-contexts/flows/components）已有，但部分关联操作缺失

**覆盖率**: 9/32 ≈ **28%** 实现，**72% missing**

> ⚠️ 此前端 API 封装是完整的（类型安全 + Zod 验证），但后端实现严重滞后，导致 Snapshot 功能（Epic E4）和完整项目管理完全不可用。

---

## 2. Research Findings

### 2.1 项目历史（Learnings）

最近的 Learnings 记录（`canvas-cors-preflight-500.md`）显示：
- Canvas API 刚完成 CORS 预检修复（2026-04-05 00:20）
- 根因：Hono options 路由在 gateway 层未匹配
- 修复涉及：`vibex-backend/src/routes/v1/gateway.ts` 和 `canvas/index.ts`

**关键经验教训**：
- 受保护的 API 路由 OPTIONS 必须在 gateway 层处理，不能落入 authMiddleware
- 新加受保护 API 必须确认 `v1.options('/*')` 存在

### 2.2 当前代码结构

```
vibex-backend/src/app/api/v1/canvas/
├── generate/              ✅ POST 旧版原型生成
├── generate-contexts/     ✅ POST 生成限界上下文
├── generate-flows/        ✅ POST 生成业务流程
├── generate-components/   ✅ POST 生成组件树
├── project/               ✅ POST 创建项目
├── status/                ✅ GET  轮询生成状态
├── export/                ✅ GET  导出 ZIP
├── stream/                ✅ GET  SSE 流式生成
├── health/                ✅ GET  健康检查
└── __tests__/             部分测试覆盖

vibex-fronted/src/lib/canvas/api/
├── canvasApi.ts           14 个端点封装（含快照 5 个）
├── dddApi.ts              兼容层（deprecated）
├── canvasSseApi.ts        SSE 客户端
├── canvasSseApi.test.ts    有限测试
└── __tests__/             Zod 验证测试
```

---

## 3. Current State: Endpoint Inventory

### 3.1 已实现端点（9个）✅

| # | Method | Path | 用途 |
|---|--------|------|------|
| 1 | POST | /api/v1/canvas/generate | 旧版原型生成（legacy） |
| 2 | POST | /api/v1/canvas/generate-contexts | AI 生成限界上下文树 |
| 3 | POST | /api/v1/canvas/generate-flows | AI 生成业务流程树 |
| 4 | POST | /api/v1/canvas/generate-components | AI 生成组件树 |
| 5 | GET | /api/v1/canvas/status | 轮询生成状态 |
| 6 | POST | /api/v1/canvas/project | 创建项目 |
| 7 | GET | /api/v1/canvas/export | 导出项目 ZIP |
| 8 | GET | /api/v1/canvas/stream | SSE 流式生成 |
| 9 | GET | /api/v1/canvas/health | 健康检查 |

### 3.2 前端已封装但后端缺失（14个）❌

| # | Method | Path | 用途 | 优先级 |
|---|--------|------|------|--------|
| 10 | POST | /api/v1/canvas/snapshots | 创建快照 | P0 |
| 11 | GET | /api/v1/canvas/snapshots | 列出快照 | P0 |
| 12 | GET | /api/v1/canvas/snapshots/:id | 获取单个快照 | P0 |
| 13 | DELETE | /api/v1/canvas/snapshots/:id | 删除快照 | P1 |
| 14 | POST | /api/v1/canvas/snapshots/:id/restore | 恢复到快照 | P0 |
| 15 | GET | /api/v1/canvas/snapshots/latest | 获取最新版本号（冲突检测） | P1 |
| 16 | GET | /api/v1/canvas/project/:id | 获取项目详情 | P1 |
| 17 | PATCH | /api/v1/canvas/project/:id | 更新项目 | P1 |
| 18 | DELETE | /api/v1/canvas/project/:id | 删除项目 | P1 |
| 19 | GET | /api/v1/canvas/project/:id/contexts | 获取上下文列表 | P2 |
| 20 | GET | /api/v1/canvas/project/:id/contexts/:ctxId | 获取单个上下文 | P2 |
| 21 | PATCH | /api/v1/canvas/contexts/:ctxId | 更新上下文节点 | P2 |
| 22 | DELETE | /api/v1/canvas/contexts/:ctxId | 删除上下文节点 | P2 |
| 23 | GET | /api/v1/canvas/project/:id/flows | 获取流程列表 | P2 |

### 3.3 推断缺失端点（基于功能完整性需求）⚡

| # | Method | Path | 用途 | 优先级 |
|---|--------|------|------|--------|
| 24 | GET | /api/v1/canvas/project/:id/flows/:flowId | 获取单个流程 | P2 |
| 25 | PATCH | /api/v1/canvas/flows/:flowId | 更新流程节点 | P2 |
| 26 | DELETE | /api/v1/canvas/flows/:flowId | 删除流程节点 | P2 |
| 27 | GET | /api/v1/canvas/project/:id/components | 获取组件列表 | P2 |
| 28 | GET | /api/v1/canvas/project/:id/components/:compId | 获取单个组件 | P2 |
| 29 | PATCH | /api/v1/canvas/components/:compId | 更新组件节点 | P2 |
| 30 | DELETE | /api/v1/canvas/components/:compId | 删除组件节点 | P2 |
| 31 | POST | /api/v1/canvas/snapshots/compare | 对比两个快照 | P2 |
| 32 | POST | /api/v1/canvas/snapshots/batch-delete | 批量删除快照 | P3 |

**覆盖率**: 9/32 ≈ **28% 实现，72% 缺失**

---

## 4. Solution Options

### Option A: 渐进式交付 — 优先 Snapshot + Project CRUD（推荐）

**策略**：分 2 阶段交付，先止血（P0），再补全（P1-P2）。

**Phase 1: Snapshot 层（P0-P1）** — 预计 2 人日
- 实现 `snapshots` 路由组（5 个端点）
- 复用现有 Prisma schema（CanvasSnapshot model）
- 实现 optimistic locking（version 字段）防止写冲突
- 单元测试覆盖

**Phase 2: Project CRUD（P1）** — 预计 2 人日
- 实现 project 的 GET/PATCH/DELETE
- 实现 contexts/flows/components 的 CRUD（8 个端点）
- 统一错误码（CanvasErrorCodes）扩展

**Phase 3: 完善测试 & 对比功能（P2）** — 预计 1 人日
- 快照对比 API
- 集成测试覆盖

| 阶段 | 端点 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | 5 | 2d | 快照功能可用 |
| Phase 2 | 8 | 2d | 项目 CRUD 可用 |
| Phase 3 | 3 | 1d | 完整 API 覆盖 |
| **合计** | **16** | **5d** | |

**优点**：快速止血，用户可用的功能逐阶段交付  
**缺点**：仍有 16 个端点（50%）需后续迭代

---

### Option B: 全量一次性实现

**策略**：一次性实现全部 32 个端点，配套完整测试和文档。

**工时估算**：10-12 人日

| 模块 | 端点数 | 工时 |
|------|--------|------|
| Snapshot 完整 CRUD | 7 | 2d |
| Project CRUD | 3 | 1d |
| Context CRUD | 4 | 1.5d |
| Flow CRUD | 4 | 1.5d |
| Component CRUD | 4 | 1.5d |
| 快照对比 | 1 | 0.5d |
| 测试 + 文档 | — | 3d |
| **合计** | **23** | **~11d** |

**优点**：一次性完整交付，无技术债  
**缺点**：周期长（~2周），中间无产出，风险集中

---

### Option C: 前后端解耦异步（API Contract First）

**策略**：前端先定义 OpenAPI 规范，后端按规范实现，两端并行开发。

**工时估算**：8 人日（前后端并行）

| 任务 | 工时 |
|------|------|
| 编写 OpenAPI 3.0 规范 | 0.5d |
| 前端 mock server + 类型生成 | 1d |
| 后端实现 + 测试 | 5d |
| 集成验证 | 1.5d |

**优点**：契约先行，减少返工；前端不阻塞开发  
**缺点**：需要额外编写和维护 OpenAPI 规范

---

## 5. Recommended Solution

### ✅ Option A — 渐进式交付（优先 Snapshot + Project CRUD）

**理由**：
1. **业务价值高**：Snapshot 功能（Epic E4）是 Canvas 协作冲突解决的核心，用户已在前端封装完毕，只等后端。优先交付可立即解决版本冲突痛点。
2. **风险低**：Snapshot 的 Prisma model 已存在，CRUD 模板可复用现有生成端点的模式。
3. **符合团队节奏**：团队目前正在修复 Canvas API 缺陷（CORS 刚修完），继续完善 Canvas API 栈是连贯的技术路线。
4. **可验证**：每个 Phase 交付后即可端到端测试，无需等待全量完成。

**实施顺序**：
```
Snapshot CRUD (Phase1) → Project CRUD (Phase2) → Tree Node CRUD (Phase3)
```

---

## 6. Acceptance Criteria

### Snapshot 层（Phase 1）— 可测试

- [ ] `POST /api/v1/canvas/snapshots` 返回 201，snapshot 数据正确存入 Prisma
- [ ] `GET /api/v1/canvas/snapshots?projectId=xxx` 返回按时间倒序的快照列表
- [ ] `GET /api/v1/canvas/snapshots/:id` 返回完整快照 JSON
- [ ] `POST /api/v1/canvas/snapshots/:id/restore` 正确恢复项目状态
- [ ] `GET /api/v1/canvas/snapshots/latest?projectId=xxx` 返回最新 version
- [ ] `DELETE /api/v1/canvas/snapshots/:id` 软删除或硬删除快照
- [ ] 并发写入 409 冲突响应正确（optimistic locking）
- [ ] CORS preflight OPTIONS 在 gateway 层正确响应

### Project CRUD（Phase 2）— 可测试

- [ ] `GET /api/v1/canvas/project/:id` 返回项目元数据 + 三树数据
- [ ] `PATCH /api/v1/canvas/project/:id` 可更新项目名称、描述、version（冲突检测）
- [ ] `DELETE /api/v1/canvas/project/:id` 软删除或级联删除
- [ ] Context/Flow/Component 的 GET/PATCH/DELETE 端到端可调用

### 全量验证

- [ ] 所有端点 CORS 预检不落入 authMiddleware（参考 learnings 修复）
- [ ] 所有端点返回统一错误格式 `{ success: false, error: string, code?: string }`
- [ ] 前端 `canvasApi.ts` 所有 14 个方法对应后端 100% 实现
- [ ] 集成测试覆盖所有新端点

---

## 7. Risk Assessment

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Snapshot Prisma schema 变更导致迁移 | 中 | 高 | 先读 schema，确认兼容性 |
| CORS 再次出现预检问题 | 低 | 高 | 参考 learnings 修复，在 gateway 层统一处理 |
| 冲突检测逻辑复杂（optimistic locking） | 中 | 中 | 复用现有 version 字段，参考 E4 Epic 设计 |
| 端点膨胀导致测试覆盖不足 | 高 | 中 | 每个 Phase 配套测试，不合入未测试代码 |
| 前后端类型不一致 | 中 | 中 | 后端实现后用 Zod schema 交叉验证 |

---

## 8. Scope Summary

| 分类 | 数量 | 工时 |
|------|------|------|
| 现有端点（已实现） | 9 | — |
| Snapshot 层（缺失） | 6 | 2d |
| Project CRUD（缺失） | 3 | 1d |
| Context CRUD（缺失） | 4 | 1.5d |
| Flow CRUD（缺失） | 4 | 1.5d |
| Component CRUD（缺失） | 4 | 1.5d |
| 对比/批量操作（缺失） | 2 | 0.5d |
| **合计新增** | **23** | **~7d** |

---

## 附录：前端 API 索引（参考实现）

前端 `canvasApi.ts` 已封装的端点方法（后端需逐一对接）：

```
canvasApi.createProject()       → POST /canvas/project        ✅
canvasApi.generate()           → POST /canvas/generate        ✅
canvasApi.getStatus()          → GET  /canvas/status           ✅
canvasApi.exportZip()          → GET  /canvas/export           ✅
canvasApi.generateContexts()   → POST /canvas/generate-contexts ✅
canvasApi.generateFlows()      → POST /canvas/generate-flows   ✅
canvasApi.generateComponents()  → POST /canvas/generate-components ✅
canvasApi.fetchComponentTree() → POST /canvas/generate-components ✅
canvasApi.createSnapshot()     → POST /canvas/snapshots        ❌
canvasApi.listSnapshots()      → GET  /canvas/snapshots        ❌
canvasApi.getSnapshot()         → GET  /canvas/snapshots/:id    ❌
canvasApi.restoreSnapshot()     → POST /canvas/snapshots/:id/restore ❌
canvasApi.getLatestVersion()   → GET  /canvas/snapshots/latest  ❌
canvasApi.deleteSnapshot()     → DELETE /canvas/snapshots/:id   ❌
```

**后端实现映射**：后端路由文件应放置于 `vibex-backend/src/app/api/v1/canvas/` 下，与现有端点同目录结构。

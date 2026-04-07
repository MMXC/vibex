# Canvas API 标准化分析文档

**项目**: vibex-canvas-api-standardization  
**阶段**: Phase 1 — 需求分析  
**Agent**: analyst  
**日期**: 2026-03-29

---

## 1. 业务场景分析

### 1.1 背景

VibeX 是一个 AI 驱动的应用原型生成平台，Canvas 是其核心设计界面。当前 Canvas 功能存在两套并行的 API 路由体系：

| 路由集 | 前缀 | 状态 | 用途 |
|--------|------|------|------|
| 旧路由 | `/api/canvas/*` | 活跃，存在 | 早期实现，未完全废弃 |
| 新路由 | `/api/v1/canvas/*` | 活跃，新增 | 标准化版本 |

两套路由功能高度重叠但不一致，造成维护负担和潜在行为差异。

### 1.2 核心问题

**问题 P1**: 重复路由集维护
- 7 个端点同时存在于两套路径下（`generate-contexts`, `generate-flows`, `generate-components`, `generate`, `project`, `status`, `export`）
- 两套实现代码独立，维护成本翻倍

**问题 P2**: 两步设计范式未标准化
- Step1（业务流程）→ Step2（组件树）的设计顺序需要在 API 层面体现
- 当前 `generate-flows` 和 `generate-components` 已有，但缺乏统一的会话管理（sessionId 链路）

**问题 P3**: 前端 API 调用入口分散
- `canvasApi.ts` 和 `dddApi.ts` 分别封装，存在职责重叠
- SSE 流式端点 `/api/v1/analyze/stream` 未纳入统一管理

### 1.3 目标用户

- **使用 Canvas 的设计师/产品经理**：通过自然语言需求描述，生成应用原型
- **前端开发者**：通过标准化的 Canvas API 集成画布功能

### 1.4 核心 Jobs-To-Be-Done (JTBD)

| # | JTBD | 描述 |
|---|------|------|
| JTBD-1 | **统一调用入口** | 前端只需了解 `/api/v1/canvas/*` 前缀即可调用所有 Canvas 功能 |
| JTBD-2 | **两步设计流程** | Step1 生成业务流程 → Step2 生成组件树，API 链路可追溯 |
| JTBD-3 | **行为一致性** | 废弃旧路由后，新路由提供等效功能，无功能降级 |
| JTBD-4 | **向后兼容** | 旧路由废弃后，有明确的重定向/响应告知机制 |

---

## 2. 技术方案选项

### 方案 A: 渐进式废弃（推荐）

**核心思路**：保留新路由，废弃旧路由，通过代码审查确保前端只用新路由。

```
步骤：
1. 前端：修改 api-config.ts，只保留 /v1/canvas/* 端点配置
2. 前端：审查 canvasApi.ts，移除所有调用旧路由的代码路径
3. 后端：删除 /app/api/canvas/* 旧路由目录（如果确认无引用）
4. 验证：E2E 测试覆盖 Canvas 完整流程（上下文→流程→组件）
```

**优点**：
- 改动集中，风险可控
- 不破坏现有功能，只做路径迁移

**缺点**：
- 需要逐一确认旧路由无外部依赖
- 测试覆盖必须到位

**估算工时**: 1-2 人天

### 方案 B: API 网关统一代理

**核心思路**：在 Next.js 中间件层做路径重写，将所有 `/api/canvas/*` 请求代理到 `/api/v1/canvas/*`。

```
实现：
middleware.ts:
  /api/canvas/* → /api/v1/canvas/*
  /api/canvas   → /api/v1/canvas
```

**优点**：
- 零前端改动，透明兼容
- 外部调用方（如第三方）无需修改

**缺点**：
- 增加网络跳转开销（微小）
- 隐藏了标准化事实，技术债务转移而非消除
- 长期维护两套代码的问题依然存在

**估算工时**: 0.5 人天（但治标不治本）

---

## 3. 可行性评估

### 3.1 前端分析

| 文件 | 当前端点 | 标准化后 |
|------|----------|----------|
| `src/lib/api-config.ts` | `endpoints.canvas` 使用 `/v1/canvas/*` ✅ | 无需改动 |
| `src/lib/canvas/api/canvasApi.ts` | 调用 `/v1/canvas/*` ✅ | 审查清理 |
| `src/lib/canvas/api/dddApi.ts` | 调用 `/v1/analyze/stream` (SSE) | 建议移入 canvasApi 命名空间 |

**可行性**: ✅ 高 — 前端已配置 v1 端点，主只需清理确认。

### 3.2 后端分析

| 旧路由目录 | 对应新路由 | 行为差异 |
|------------|------------|----------|
| `/api/canvas/generate-contexts` | `/api/v1/canvas/generate-contexts` | 完全相同，v1 版本注释未更新 |
| `/api/canvas/generate-flows` | `/api/v1/canvas/generate-flows` | 完全相同 |
| `/api/canvas/generate-components` | `/api/v1/canvas/generate-components` | 完全相同 |
| `/api/canvas/generate` | `/api/v1/canvas/generate` | 完全相同 |
| `/api/canvas/project` | `/api/v1/canvas/project` | 完全相同 |
| `/api/canvas/status` | `/api/v1/canvas/status` | 完全相同 |
| `/api/canvas/export` | `/api/v1/canvas/export` | 完全相同 |

**可行性**: ✅ 高 — 两套实现代码完全相同，废弃旧路由无功能风险。

### 3.3 两步设计范式 API 链路验证

```
用户输入需求文本
       ↓
POST /api/v1/canvas/generate-contexts  ← Step 0: 提取限界上下文
       ↓ (返回 contexts[])
POST /api/v1/canvas/generate-flows     ← Step 1: 生成业务流程
       ↓ (返回 flows[])
POST /api/v1/canvas/generate-components ← Step 2: 生成组件树
       ↓ (返回 components[])
```

当前 API 链路完整，sessionId 在各步骤间传递（需确认存储介质）。

---

## 4. 初步风险识别

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| **外部系统调用旧路由** | 中 | 部署前全库搜索 `/api/canvas/`（不含 v1），确认无引用 |
| **旧路由被测试覆盖** | 中 | 迁移后更新/删除相关测试文件 |
| **SSE 流式端点未纳入统一管理** | 低 | dddApi.ts 重命名为 canvasSseApi.ts，纳入 canvas 模块 |
| **两步设计 sessionId 丢失** | 低 | 审查 sessionId 存储逻辑（localStorage / 内存） |

---

## 5. 验收标准

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| AC-1 | 前端 `api-config.ts` 中所有 Canvas 端点均以 `/v1/` 开头 | 代码审查 |
| AC-2 | 旧路由目录 `/app/api/canvas/` 已删除或仅保留空占位 | `find` 检查 |
| AC-3 | `dddApi.ts` 已移入 `src/lib/canvas/api/` 并重命名为 `canvasSseApi.ts` | 文件存在性检查 |
| AC-4 | Canvas 完整流程 E2E 测试通过（contexts → flows → components） | `npm run e2e` |
| AC-5 | VibeX 主页加载正常，无 404 资源 | Playwright 截图验证 |
| AC-6 | API 响应格式一致（所有端点返回 `{success, data, error?}` 结构） | 抽样检查各端点响应 |
| AC-7 | `canvasApi.ts` 中所有 `fetch` 调用均指向 `getApiUrl()`，无硬编码 URL | 代码审查 |

---

## 6. 实施计划（初步）

### Phase 1: 清理前端（0.5d）
- 审查 `api-config.ts` 确认 v1 端点
- 将 `dddApi.ts` 移入 `src/lib/canvas/api/`
- 清理 `canvasApi.ts` 中的冗余注释和死代码

### Phase 2: 废弃后端旧路由（0.5d）
- 删除 `/app/api/canvas/` 目录（确认无外部依赖后）
- 验证 v1 路由功能正常

### Phase 3: 测试验证（0.5d）
- 运行 E2E 测试覆盖 Canvas 流程
- 检查 VibeX 主页加载

### Phase 4: 文档更新（0.25d）
- 更新 API 文档（若有）
- 更新 AGENTS.md 中 Canvas 相关约定

---

## 7. 下一步

本分析文档完成后，建议 PM 阶段进一步确认：
1. 废弃旧路由是否需要保留过渡期（方案 B 的网关代理）
2. 两步设计流程是否需要新增 `sessionId` 管理 API
3. 测试范围是否扩展到 SSE 流式端点

---

*分析人: analyst | 生成时间: 2026-03-29*

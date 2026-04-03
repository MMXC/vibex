# PRD: VibeX 三树画布后端对接

**文档**: `vibex-backend-integration-20260325/prd.md`
**版本**: v1.0
**日期**: 2026-03-25
**PM**: PM Agent
**状态**: ✅ 完成

---

## 1. 执行摘要

### 1.1 背景

VibeX 三树画布（上下文树 / 流程树 / 组件树）的前端界面和后端基础框架已就绪，但核心 AI 生成 API 缺失，导致用户点击"启动画布"后画布为空，无法完成 DDD 驱动的完整工作流。

### 1.2 目标

暴露 3 个后端 API 端点（生成上下文树、生成流程树、生成组件树），并完成前端集成，实现从"用户输入需求"到"三树自动生成"的完整闭环。

### 1.3 成功指标

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| M1: 画布启动成功率 | ≥ 95% | E2E 测试自动化验证 |
| M2: 三树生成时间（P95） | ≤ 15s | API 响应时间监控 |
| M3: 错误提示友好度 | 100% 有 toast | 手动测试清单 |
| M4: 现有功能回归 | 0 回归 | 回归测试套件 |

### 1.4 推荐方案

**方案 A（最小化 MVP）**：新增 3 个独立 API 端点，前端在关键节点调用。
- 符合 Checkpoint 机制（逐级确认）
- 增量改动，风险低
- 复用现有 DDD 服务层

---

## 2. 功能需求

### F1: 生成上下文树 API

**功能描述**: 用户输入需求文本并点击"启动画布"后，调用后端 API 解析需求，生成限界上下文（Bounded Context）节点树。

**API 规范**:
```
POST /api/canvas/generate-contexts
Content-Type: application/json

Request:
{
  "requirementText": string,    // 用户输入的需求描述
  "projectId"?: string          // 可选，项目 ID 用于关联
}

Response (200):
{
  "success": true,
  "contexts": [
    {
      "id": string,
      "name": string,           // 如 "患者管理上下文"
      "description": string,    // 上下文描述
      "ubiquitousLanguage": string[], // 通用语言词汇表
      "confidence": number      // 置信度 0-1
    }
  ],
  "generationId": string        // 本次生成 ID，用于追踪
}

Response (4xx/5xx):
{
  "success": false,
  "error": {
    "code": string,
    "message": string
  }
}
```

**验收标准**:
- [ ] `AC-F1-01`: 给定有效 `requirementText`（≥10 字符），API 返回 `contexts.length >= 1`
- [ ] `AC-F1-02`: 每个返回的 context 包含 `name`、`description`、`confidence` 字段
- [ ] `AC-F1-03`: `requirementText` 为空时返回 400 错误，包含 `INVALID_INPUT` code
- [ ] `AC-F1-04`: MiniMax API 超时时（>10s），返回空 contexts + `TIMEOUT` error code，HTTP 200
- [ ] `AC-F1-05`: `generate-contexts` API 响应时间 P95 ≤ 8s

**页面集成**:
- `CanvasPage.tsx` — 用户点击"启动画布"按钮后调用此 API
- Loading 状态：按钮 disabled + spinner
- 错误处理：toast 提示错误内容，不清空已输入文本

---

### F2: 生成流程树 API

**功能描述**: 用户确认所有上下文节点后，自动触发生成业务流程树，每个上下文对应一个流程。

**API 规范**:
```
POST /api/canvas/generate-flows
Content-Type: application/json

Request:
{
  "contexts": BoundedContext[],   // 已确认的上下文列表（来自 F1）
  "projectId"?: string
}

Response (200):
{
  "success": true,
  "flows": [
    {
      "id": string,
      "contextId": string,         // 关联的上下文 ID
      "name": string,              // 如 "挂号业务流程"
      "steps": [
        {
          "id": string,
          "name": string,          // 如 "患者发起预约"
          "actor": string,         // 如 "患者" | "系统" | "医生"
          "order": number
        }
      ],
      "confidence": number
    }
  ],
  "generationId": string
}

Response (4xx/5xx):
{
  "success": false,
  "error": { "code": string, "message": string }
}
```

**验收标准**:
- [ ] `AC-F2-01`: 给定 ≥ 1 个 confirmed context，API 返回对应数量的 flows
- [ ] `AC-F2-02`: 每个 flow 的 `contextId` 精确匹配输入的 context id
- [ ] `AC-F2-03`: 每个 flow 至少包含 2 个 step
- [ ] `AC-F2-04`: `contexts` 为空数组时返回 400 + `INVALID_INPUT`
- [ ] `AC-F2-05`: `generate-flows` API 响应时间 P95 ≤ 10s

**页面集成**:
- `canvasStore.ts` — `confirmContextNode()` 末尾调用此 API
- 自动生成 flowNodes，无需用户手动触发
- Loading 状态：FlowPanel header 显示 spinner

---

### F3: 生成组件树 API

**功能描述**: 用户确认所有流程节点后，自动生成组件节点（type: page/form/list/detail/modal）。

**API 规范**:
```
POST /api/canvas/generate-components
Content-Type: application/json

Request:
{
  "contexts": BoundedContext[],
  "flows": BusinessFlow[],
  "projectId"?: string
}

Response (200):
{
  "success": true,
  "components": [
    {
      "id": string,
      "name": string,              // 如 "PatientListPage"
      "type": "page" | "form" | "list" | "detail" | "modal",
      "contextId": string,
      "flowId": string,
      "apis": [
        {
          "method": "GET" | "POST" | "PUT" | "DELETE",
          "path": string,
          "description": string
        }
      ],
      "confidence": number
    }
  ],
  "generationId": string,
  "totalCount": number            // 总组件数
}

Response (4xx/5xx):
{
  "success": false,
  "error": { "code": string, "message": string }
}
```

**验收标准**:
- [ ] `AC-F3-01`: 给定 contexts + flows，API 返回 `components.length >= 1`
- [ ] `AC-F3-02`: 每个 component 包含 `name`、`type`、`contextId`、`apis`
- [ ] `AC-F3-03`: component `type` 必须是枚举值之一（page/form/list/detail/modal）
- [ ] `AC-F3-04`: 单次返回最多 20 个 component，超过时截断并返回 `truncated: true`
- [ ] `AC-F3-05`: `generate-components` API 响应时间 P95 ≤ 12s

**页面集成**:
- `canvasStore.ts` — `confirmFlowNode()` 末尾调用此 API
- Loading 状态：ComponentPanel header 显示 spinner

---

### F4: 前端状态管理与错误处理

**功能描述**: 三树 API 的前端集成、loading 状态、错误处理、store 联动。

**验收标准**:
- [ ] `AC-F4-01`: 点击"启动画布"后，按钮 disabled 直到 API 返回或超时
- [ ] `AC-F4-02`: API 失败时显示 toast 错误提示，内容为 `error.message`
- [ ] `AC-F4-03`: API 失败时**不更新** store，保留当前画布状态
- [ ] `AC-F4-04`: Loading 状态下，TreePanel 显示 skeleton loading 效果
- [ ] `AC-F4-05`: 连续快速点击不触发多次 API 调用（有 debounce 300ms）

**store 改动**:
```ts
// canvasStore.ts 新增方法
generateContexts: async (requirementText: string) => Promise<void>
generateFlows: async (contexts: BoundedContext[]) => Promise<void>
generateComponents: async (contexts: BoundedContext[], flows: BusinessFlow[]) => Promise<void>
```

---

### F5: 回归保护

**功能描述**: 确保三树 API 对接不影响现有功能。

**验收标准**:
- [ ] `AC-F5-01`: `canvasApi.createProject` 仍然正常工作（API 集成不破坏现有 client）
- [ ] `AC-F5-02`: `canvasApi.generate` 仍然正常工作（ProjectBar 不受影响）
- [ ] `AC-F5-03`: `canvasApi.getStatus` 轮询功能正常
- [ ] `AC-F5-04`: `canvasApi.exportProject` 导出功能正常
- [ ] `AC-F5-05`: 三树加载时，CascadeUpdateManager 的 batch update 逻辑不受影响

---

## 3. Epic 拆分

### Epic 1: 后端 API 实现（P0）

**目标**: 实现 3 个 DDD 生成 API 端点

| Story ID | 描述 | 优先级 | 验收标准 |
|----------|------|--------|----------|
| ST-E1-01 | 实现 `/api/canvas/generate-contexts` 端点 | P0 | AC-F1-01 ~ AC-F1-05 |
| ST-E1-02 | 实现 `/api/canvas/generate-flows` 端点 | P0 | AC-F2-01 ~ AC-F2-05 |
| ST-E1-03 | 实现 `/api/canvas/generate-components` 端点 | P0 | AC-F3-01 ~ AC-F3-05 |
| ST-E1-04 | 统一 API 错误处理中间件（错误码标准化） | P1 | 4xx/5xx 统一 `{success, error: {code, message}}` |
| ST-E1-05 | API 超时与重试配置（超时 10s，最多 1 次重试） | P1 | MiniMax API 超时不直接暴露给用户 |

---

### Epic 2: 前端集成（P0）

**目标**: 前端调用链串联 + 状态管理 + 错误处理

| Story ID | 描述 | 优先级 | 验收标准 |
|----------|------|--------|----------|
| ST-E2-01 | `canvasStore` 新增三树生成方法 | P0 | 三个 generate 方法可调用 + loading 状态正确 |
| ST-E2-02 | CanvasPage "启动画布" 按钮调用 generate-contexts | P0 | AC-F4-01, AC-F4-02, AC-F4-05 |
| ST-E2-03 | `confirmContextNode` 自动触发 generate-flows | P0 | AC-F4-01, AC-F4-03 |
| ST-E2-04 | `confirmFlowNode` 自动触发 generate-components | P0 | AC-F4-01, AC-F4-03 |
| ST-E2-05 | Loading skeleton UI（三个 TreePanel） | P1 | AC-F4-04 |
| ST-E2-06 | Toast 错误提示集成 | P1 | AC-F4-02 |

---

### Epic 3: 测试与回归（P0）

**目标**: E2E 测试覆盖 + 回归保护

| Story ID | 描述 | 优先级 | 验收标准 |
|----------|------|--------|----------|
| ST-E3-01 | 单元测试：3 个 API 端点（Vitest） | P0 | 每个端点至少 3 个测试用例 |
| ST-E3-02 | API 集成测试：完整三树生成链路 | P0 | 从 requirementText → contexts → flows → components |
| ST-E3-03 | 回归测试套件（现有 4 个 API） | P0 | AC-F5-01 ~ AC-F5-05 |
| ST-E3-04 | E2E 测试：用户完整三树画布流程 | P1 | Playwright 覆盖关键路径 |

---

## 4. 优先级矩阵

| ID | Story | P0 | P1 | P2 | 工时 |
|----|-------|----|----|----|------|
| ST-E1-01 | generate-contexts 端点 | 🔴 | | | 1.5d |
| ST-E1-02 | generate-flows 端点 | 🔴 | | | 1.5d |
| ST-E1-03 | generate-components 端点 | 🔴 | | | 1.5d |
| ST-E1-04 | 错误处理中间件 | | 🟡 | | 0.5d |
| ST-E1-05 | 超时重试配置 | | 🟡 | | 0.5d |
| ST-E2-01 | store 新增方法 | 🔴 | | | 0.5d |
| ST-E2-02 | CanvasPage 集成 | 🔴 | | | 0.5d |
| ST-E2-03 | confirmContextNode 联动 | 🔴 | | | 0.5d |
| ST-E2-04 | confirmFlowNode 联动 | 🔴 | | | 0.5d |
| ST-E2-05 | Loading skeleton | | 🟡 | | 0.5d |
| ST-E2-06 | Toast 错误提示 | | 🟡 | | 0.5d |
| ST-E3-01 | 单元测试（Vitest） | 🔴 | | | 1d |
| ST-E3-02 | API 集成测试 | 🔴 | | | 1d |
| ST-E3-03 | 回归测试套件 | 🔴 | | | 0.5d |
| ST-E3-04 | E2E 测试（Playwright） | | 🟡 | | 1d |

**P0 总工时**: 10d（Dev 7d + Test 3d）
**P1 总工时**: 3.5d
**总工期**: ~10-13d

---

## 5. 验收标准总览

| 验收类型 | 覆盖数量 |
|----------|----------|
| 功能验收（AC-F1~F5） | 22 条 |
| Story 验收 | 14 个 |
| 回归验收 | 5 条 |

---

## 6. DoD（完成定义）

### API 端点 DoD
- [ ] 单元测试覆盖 ≥ 80%（Vitest，Windows/macOS/Linux）
- [ ] API 文档（输入/输出 Schema）已更新
- [ ] 错误码已注册到错误码表
- [ ] 超时配置已验证

### 前端集成 DoD
- [ ] 对应 Story 的所有 AC 验收通过
- [ ] Loading/Error 状态 UI 符合设计稿
- [ ] `npm run build` 无 error
- [ ] Store 状态更新逻辑正确（CascadeUpdateManager 兼容）

### 集成 DoD
- [ ] E2E 测试通过（Playwright，关键路径 100%）
- [ ] 回归测试套件 100% 通过
- [ ] 部署到 staging 环境，手动验收通过

---

## 7. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | API P95 响应时间：contexts ≤ 8s，flows ≤ 10s，components ≤ 12s |
| **可靠性** | API 超时 10s，自动重试 1 次；降级时返回空数组 + 友好错误 |
| **可观测性** | API 日志记录 generationId、耗时、输入长度 |
| **安全** | API key 不暴露在前端；后端输入校验（requirementText ≥ 10 字符） |
| **兼容性** | 现有 4 个 API 零回归；旧项目数据兼容 |

---

## 8. 页面集成总览

```
CanvasPage.tsx
├── RequirementInputArea (textarea)
│   └── "启动画布" 按钮 → generateContexts()
├── ContextPanel
│   └── confirmContextNode() → generateFlows()
├── FlowPanel
│   └── confirmFlowNode() → generateComponents()
└── ComponentPanel
    └── ProjectBar.handleCreateProject() [已有 ✅]
```

---

## 9. Open Questions（待澄清）

| # | 问题 | 决策 | 状态 |
|---|------|------|------|
| OQ-1 | AI 模型选择（MiniMax / 其他）？API key 配置在哪？ | 待确认 | ⏳ |
| OQ-2 | 单次生成 contexts 数量上限？是否需要分页？ | 暂定 max=20 | ⏳ |
| OQ-3 | 生成失败时的降级策略（手动输入 vs 错误提示）？ | 错误提示 + 保留当前状态 | ⏳ |
| OQ-4 | 三树生成结果是否持久化到 Prisma CanvasProject？ | 暂不定，此版本仅内存 | ⏳ |

---

## 10. 文件依赖

| 文件 | 操作 | 负责人 |
|------|------|--------|
| `api/canvas/generate-contexts/route.ts` | 新建 | Dev |
| `api/canvas/generate-flows/route.ts` | 新建 | Dev |
| `api/canvas/generate-components/route.ts` | 新建 | Dev |
| `lib/canvas/canvasApi.ts` | 新增方法 | Dev |
| `lib/canvas/canvasStore.ts` | 新增 generate 方法 | Dev |
| `components/canvas/CanvasPage.tsx` | 调用链集成 | Dev |
| `components/canvas/TreePanel.tsx` | loading skeleton | Dev |
| `prisma/schema.prisma` | 确认 schema 无需改动 | Dev |
| `services/context/index.ts` | 复用 DDD 服务层 | Dev |
| `docs/api/canvas-api-spec.md` | API 文档 | Dev |

---

*PRD 产出物由 PM Agent 生成 | 等待 Architect 评审与接口设计*

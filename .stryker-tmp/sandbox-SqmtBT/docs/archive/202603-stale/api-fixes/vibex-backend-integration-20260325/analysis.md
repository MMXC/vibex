# Analysis: vibex-backend-integration-20260325

**任务**: vibex-backend-integration-20260325/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-25 20:36 (UTC+8)
**状态**: 🔄 进行中

---

## 1. 执行摘要

**一句话结论**: VibeX 三树画布后端对接的核心缺口是**4个 AI 生成 API 不存在**（生成三树 + 生成流程 + 生成组件），导致用户点击"启动画布"后画布为空，无法完成 DDD 驱动的完整流程。

**关键数据**:
- 已有后端 API: 4/4（project/create、generate、status、export）✅
- 已有前端 API client: 4/4 ✅
- **缺失后端 API**: 3个（生成上下文树、生成流程树、生成组件树）❌
- **缺失前端集成**: 画布页面未调用 DDD API ❌

---

## 2. 现状分析

### 2.1 已实现部分（完整）

| 模块 | 文件 | 状态 |
|------|------|------|
| 后端 project/create | `api/canvas/project/route.ts` | ✅ Prisma CanvasProject 模型存在 |
| 后端 generate | `api/canvas/generate/route.ts` | ✅ 触发生成队列，调用 MiniMax API |
| 后端 status | `api/canvas/status/route.ts` | ✅ 轮询页面状态 |
| 后端 export | `api/canvas/export/route.ts` | ✅ tar.gz 导出 |
| 前端 API client | `lib/canvas/api/canvasApi.ts` | ✅ 4个方法完整 |
| 前端 Zustand store | `lib/canvas/canvasStore.ts` | ✅ 三树数据模型完整，含 CascadeUpdateManager |
| 前端 ProjectBar | `components/canvas/ProjectBar.tsx` | ✅ 已调用 canvasApi.createProject + generate |
| 前端 CanvasPage | `components/canvas/CanvasPage.tsx` | ✅ 三列布局、阶段进度条完整 |
| Prisma schema | `prisma/schema.prisma` | ✅ CanvasProject + CanvasPage 模型 |
| DDD 服务层 | `services/context/` | ✅ StructuredContext 含 boundedContexts + businessFlow |

### 2.2 关键缺口分析

#### 🔴 Gap 1: 画布启动无 API 调用

**前端** (`CanvasPage.tsx` 第 200-210 行):
```tsx
<button onClick={() => setPhase('context')}>
  启动画布 →
</button>
```

用户输入需求文本 → 点击"启动画布" → **直接跳到 context 阶段，不调用任何 API** → `contextNodes` 为空数组。

**根因**: 没有 `/api/canvas/generate-contexts` 端点，前端也无法调用。

#### 🔴 Gap 2: 流程树生成是纯本地 mock

**前端** (`canvasStore.ts` 第 295-320 行):
```ts
autoGenerateFlows: (contexts) => {
  const flows: BusinessFlowNode[] = contexts.map((ctx) => ({
    name: `${ctx.name}业务流程`,
    steps: [
      { name: '需求收集', actor: '用户' },
      { name: '数据处理', actor: '系统' },
      { name: '结果输出', actor: '系统' },
    ],
  }));
  set({ flowNodes: flows });
}
```

**问题**: 所有流程树都生成相同的三个步骤（需求收集/数据处理/结果输出），与用户实际输入完全无关。无法根据具体业务场景定制流程。

#### 🔴 Gap 3: 组件树生成完全缺失

`canvasStore.ts` 中没有 `autoGenerateComponents` 方法，组件树需要手动添加，无 API 来源。

#### 🔴 Gap 4: DDD 服务层未暴露为 API

`services/context/index.ts` 已有 `StructuredContext` 类型定义和 `boundedContexts`/`businessFlow` 字段，但这些服务未通过 API 暴露给前端。

---

## 3. 技术方案选项

### 方案 A: 最小化 MVP — 3个新 API + 前端集成（推荐）

**思路**: 基于现有 DDD 服务层，暴露 3 个 API 端点，前端在关键节点调用。

**新增 API 端点**:

| # | 端点 | 方法 | 输入 | 输出 | 调用时机 |
|---|------|------|------|------|----------|
| 1 | `/api/canvas/generate-contexts` | POST | `{ requirementText }` | `{ contexts: BoundedContext[] }` | 用户点击"启动画布" |
| 2 | `/api/canvas/generate-flows` | POST | `{ contexts: BoundedContext[] }` | `{ flows: BusinessFlow[] }` | 全部 context 确认后 |
| 3 | `/api/canvas/generate-components` | POST | `{ contexts, flows }` | `{ components: Component[] }` | 全部 flow 确认后 |

**前端集成**:

```
用户输入需求文本
    ↓ 点击"启动画布"
setPhase('context')
    + 调用 POST /api/canvas/generate-contexts
    + setContextNodes(response.contexts)  ← 新增
    ↓ 用户确认所有上下文
confirmContextNode()
    + 调用 POST /api/canvas/generate-flows
    + setFlowNodes(response.flows)  ← 新增
    ↓ 用户确认所有流程
confirmFlowNode()
    + 调用 POST /api/canvas/generate-components
    + setComponentNodes(response.components)  ← 新增
    ↓ 用户确认所有组件
ProjectBar.handleCreateProject()  ← 已有 ✅
```

**工作量**: ~6h（Dev）+ 2h（Test）

**优点**:
- 与现有 DDD 服务层对齐
- API 分层清晰，职责单一
- 增量改动，风险低
- 前端只需在现有事件中插入 API 调用

**缺点**:
- 每次确认都触发一次 API 调用（有网络延迟）
- 需要处理 loading 状态

---

### 方案 B: 单次调用 — 一步生成全部三树

**思路**: 用户点击"启动画布"后，一次性调用 `/api/canvas/generate-trees`，后端同时生成三树，前端仅负责确认交互。

**新增 API 端点**:

| 端点 | 输入 | 输出 |
|------|------|------|
| `/api/canvas/generate-trees` | `{ requirementText }` | `{ contexts, flows, components }` |

**前端改动**: 点击"启动画布"后调用一次 API，直接设置全部三树数据，移除各阶段的确认触发逻辑。

**工作量**: ~4h（Dev）+ 1h（Test）

**优点**:
- 一次网络请求，用户体验更流畅
- 后端可做跨树联合优化

**缺点**:
- 改动范围大（前端确认逻辑 + store 逻辑需重构）
- 三树同时生成，失败时无细粒度错误处理
- 违反 Checkpoint 机制（设计要求逐级确认）

---

### 方案 C: 前端纯本地生成（不推荐）

**思路**: 不新增 API，所有生成逻辑在前端使用本地 LLM 或模板规则。

**工作量**: ~2h（看起来快，但效果差）

**缺点**:
- API key 暴露在前端
- 业务逻辑无法复用后端 DDD 服务层
- 违反安全最佳实践

---

## 4. 推荐方案

**推荐**: 方案 A（最小化 MVP）

**理由**:
1. **符合 Checkpoint 机制** — 设计要求每步确认后再生成下一步，符合 DDD 迭代式工作流
2. **与现有架构对齐** — 复用 `services/context/` 的 DDD 服务层
3. **风险可控** — 增量改动，每个 API 独立可测
4. **错误隔离** — 某一步失败不影响其他步骤

---

## 5. 实现路径

### 阶段 1: 上下文树生成 API

**后端** `/api/canvas/generate-contexts/route.ts`:
- 复用 `services/context/index.ts` 的 DDD 逻辑
- 调用 MiniMax API 解析需求文本
- 输出符合 `BoundedContext` 接口的节点数组
- 错误处理: 请求超时 / AI 解析失败 / 空结果

**前端** `CanvasPage.tsx`:
- textarea 输入绑定到 state
- "启动画布" 按钮改为异步，调用 API
- loading 状态（禁用按钮 + spinner）
- 错误处理（toast 提示）

### 阶段 2: 流程树生成 API

**后端** `/api/canvas/generate-flows/route.ts`:
- 输入 confirmed contexts
- 输出 business flows
- 每个 context 对应一个 flow

### 阶段 3: 组件树生成 API

**后端** `/api/canvas/generate-components/route.ts`:
- 输入 confirmed contexts + flows
- 输出 component 节点（type: page/form/list/detail/modal）
- 包含 API mock 信息

### 阶段 4: 前端集成

- 在 `confirmContextNode()` 末尾插入 `generateFlows()` 调用
- 在 `confirmFlowNode()` 末尾插入 `generateComponents()` 调用
- 添加 loading 状态到对应 TreePanel

---

## 6. 初步风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| MiniMax API 超时导致画布空白 | 🟡 中 | 添加重试逻辑（最多 3 次）+ fallback 返回空树 + toast 提示 |
| DDD 服务层生成质量不稳定 | 🟡 中 | 添加置信度阈值，质量低于阈值时返回多条建议 |
| 前端网络错误导致状态不一致 | 🟡 中 | API 失败时不更新 store，保留当前状态 |
| AI 生成的节点名与用户意图不符 | 🟡 中 | 设计要求用户"确认"，用户可编辑/删除后重新生成 |
| 并发确认多个节点导致多次 API 调用 | 🟢 低 | debounce 300ms，或仅在全量确认后调用一次 |
| 组件树生成结果过大 | 🟢 低 | 分页或限制最大节点数（如 20 个） |

---

## 7. 验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|---------|
| V1 | 用户输入需求文本后点击"启动画布"，API 调用成功，限界上下文树非空 | 手动测试: 输入"我想做一个在线预约医生系统"，验证返回 ≥ 1 个上下文节点 |
| V2 | 所有上下文节点确认后，流程树自动生成且与上下文相关 | 手动测试: 确认上下文后验证流程名称包含上下文关键词 |
| V3 | 所有流程节点确认后，组件树自动生成 | 手动测试: 确认流程后验证组件树非空 |
| V4 | 创建项目按钮点击后，ProjectBar 流程不变 | 回归测试: 现有 ProjectBar.createProject 流程仍然正常 |
| V5 | API 失败时有友好的错误提示，画布不崩溃 | 手动测试: 断网情况下点击"启动画布"，验证 toast 错误提示 |
| V6 | loading 状态下按钮禁用，不可重复点击 | 手动测试: 点击"启动画布"后验证按钮 disabled |
| V7 | 导出功能不受影响 | 回归测试: 创建项目 → 生成 → 导出，验证 zip 文件正常 |

---

## 8. Open Questions（需要用户澄清）

1. **AI 模型选择**: 使用 MiniMax 还是其他模型？是否有现成的 API key 配置？
2. **节点数量上限**: 单次生成最多返回多少个节点？是否需要分页？
3. **生成失败策略**: AI 生成失败时，是降级为手动输入还是显示错误？
4. **是否需要持久化中间状态**: 三树生成结果是否保存到 Prisma CanvasProject？

---

## 9. 后续步骤

1. **PM**: 确认 Open Questions，产出 PRD
2. **Architect**: 评审 API 接口设计，确定 DTO 结构
3. **Dev**: 实现 3 个新 API 端点 + 前端集成
4. **Tester**: 编写 E2E 测试覆盖 4 个关键路径
5. **Reviewer**: 代码审查 + 验收测试

---

*分析产出物已保存至: `/root/.openclaw/vibex/docs/vibex-backend-integration-20260325/analysis.md`*

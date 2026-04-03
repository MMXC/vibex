# Analysis: vibex-canvas-api-fix-20260326

**任务**: vibex-canvas-api-fix-20260326/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-26 00:12 (UTC+8)
**状态**: 🔄 进行中

---

## 1. 执行摘要

**一句话结论**: 画布"启动画布"按钮只改 phase，不调 API，三棵树全空（0/0）。后端 SSE 端点已验证可用，缺口在前端未调用。

**gstack 截图证据**:
- 图1: `/tmp/canvas-empty-state.png` — 输入阶段，三树 0/0
- 图2: `/tmp/canvas-after-start.png` — 点击"启动画布"后，仍三树 0/0

---

## 2. gstack 验证截图

### 2.1 截图 1: 画布初始状态（输入阶段）

![Canvas Input Phase](/tmp/canvas-empty-state.png)

**观察**:
- 限界上下文树 0/0 ✅
- 业务流程树 0/0 ✅
- 组件树 0/0 ✅
- 有"需求描述"输入框和"启动画布 →"按钮

### 2.2 截图 2: 点击"启动画布"后（三树仍为空）

![Canvas After Start](/tmp/canvas-after-start.png)

**观察**:
- Phase 切换到 context（ProjectBar 出现）
- **三树仍为 0/0** ❌ — 证明没有调用 API
- "创建项目"按钮 disabled（因为树为空）

---

## 3. 后端 SSE 端点验证

### 3.1 bounded-context/stream

```bash
curl -X POST https://api.vibex.top/api/ddd/bounded-context/stream \
  -H "Content-Type: application/json" \
  -d '{"requirementText":"我想做一个在线预约医生系统"}'
```

**结果**: ✅ 返回 SSE 事件流
```
event: thinking
data: {"step":"analyzing","message":"正在分析需求..."}

event: thinking
data: {"step":"identifying-core","message":"识别核心领域..."}
```

### 3.2 business-flow/stream

```bash
curl -X POST https://api.vibex.top/api/ddd/business-flow/stream \
  -H "Content-Type: application/json" \
  -d '{"contexts":[...]}'
```

**结果**: ✅ 返回 SSE 事件流

### 3.3 端点可用性总结

| 端点 | 方法 | 状态 | 验证 |
|------|------|------|------|
| `/api/ddd/bounded-context/stream` | POST | ✅ 可用 | curl 返回 SSE |
| `/api/ddd/business-flow/stream` | POST | ✅ 可用 | curl 返回 SSE |
| `/api/ddd/domain-model/stream` | POST | ✅ 存在 | 代码审查确认 |
| `/api/canvas/project` | POST | ✅ 已存在 | 代码审查确认 |
| `/api/canvas/generate` | POST | ✅ 已存在 | 代码审查确认 |

---

## 4. 技术根因分析

### 🔴 根因 1: CanvasPage 启动按钮无 API 调用

**文件**: `src/components/canvas/CanvasPage.tsx` 第 200-210 行

```tsx
<button
  type="button"
  onClick={() => setPhase('context')}
>
  启动画布 →
</button>
```

**问题**: `onClick` 只调用 `setPhase('context')`，不调用任何 API。

### 🔴 根因 2: canvasStore 的 autoGenerateFlows 是纯本地 mock

**文件**: `src/lib/canvas/canvasStore.ts` 第 295-320 行

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

**问题**: 所有流程树都生成相同的 3 步，与实际业务无关。且只在 `confirmContextNode()` 全量确认后才调用。

### 🔴 根因 3: 前端无 DDD API 客户端

**文件**: `src/lib/canvas/api/`

检查结果: 无 `dddApi.ts` 或任何 DDD API 引用。

### 🟡 根因 4: 前端 localStorage 有残留数据

gstack 第一次访问时显示"业务流程树 0/2"，说明有残留数据。但刷新后归零。

---

## 5. 技术方案选项

### 方案 A: SSE 调用集成（推荐）

**思路**: 前端在点击"启动画布"后，调用 `/api/ddd/bounded-context/stream` SSE 端点，逐步消费事件并更新 store。

**前端改动**:

1. 新建 `src/lib/canvas/api/dddApi.ts` — SSE 客户端封装
2. `CanvasPage.tsx` — 启动按钮改为异步调用
3. `canvasStore.ts` — 添加 `generateContextsFromRequirement()` action

**SSE 事件流**:
```
启动画布
  ↓
POST /api/ddd/bounded-context/stream
  ↓
event: thinking → 更新 loading 提示
event: context → setContextNodes([...])
event: done → setPhase('context')
```

**工作量**: ~3h（Dev）+ 1h（Test）

**优点**:
- 实时反馈，用户看到 AI 分析过程
- 复用已有后端端点
- 流式响应，用户体验好

**缺点**:
- SSE 前端处理较复杂（EventSource API）
- 需要错误重试逻辑

---

### 方案 B: 普通 POST 调用

**思路**: 不使用 SSE，直接 POST 调用已有的 `/api/ddd/bounded-context` REST 端点，一次性返回结果。

**前端改动**:
1. 新建 `src/lib/canvas/api/dddApi.ts` — 普通 fetch 封装
2. `CanvasPage.tsx` — 启动按钮改为异步调用 + loading 状态
3. `canvasStore.ts` — 添加 `generateContextsFromRequirement()` action

**工作量**: ~2h（Dev）+ 1h（Test）

**优点**:
- 实现简单，前端处理容易
- 错误处理简单（try/catch）

**缺点**:
- 无实时反馈，用户等待时无进度提示
- 需要后端新增 REST 端点（或确认已有）

---

## 6. 推荐方案

**推荐**: 方案 A（SSE 调用集成）

**理由**:
1. 后端 SSE 端点已验证可用 ✅
2. 用户体验更好（实时看到 AI 分析步骤）
3. 与 VibeX "AI 驱动" 理念一致
4. 工作量可控（~3h）

---

## 7. 验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|---------|
| V1 | 输入需求文本后点击"启动画布"，AI 分析过程可见（三条 thinking 消息） | gstack 截图验证 |
| V2 | bounded-context 节点生成完成，三树第一棵非空 | gstack 截图验证 "限界上下文树 N/N" |
| V3 | "业务流程树"和"组件树"仍为 0/0（需下一步确认后生成） | gstack 截图验证 |
| V4 | loading 状态下"启动画布"按钮 disabled，不可重复点击 | gstack 交互测试 |
| V5 | API 失败时有 toast 错误提示，画布不崩溃 | 断网测试 |
| V6 | 刷新页面后三树数据不丢失（已持久化到 localStorage） | 刷新 + gstack 验证 |

---

## 8. 实现步骤

### Step 1: 新建 `src/lib/canvas/api/dddApi.ts`

```ts
export const dddApi = {
  generateContexts: (requirementText: string) => {
    // 返回 EventSource 或 fetch 流
  }
}
```

### Step 2: `canvasStore.ts` 新增 action

```ts
generateContextsFromRequirement: async (text: string) => {
  // 调用 dddApi.generateContexts
  // SSE 事件处理
}
```

### Step 3: `CanvasPage.tsx` 修改启动按钮

```tsx
const handleStartCanvas = async () => {
  if (!requirementText) return;
  setLoading(true);
  try {
    await generateContextsFromRequirement(requirementText);
  } finally {
    setLoading(false);
  }
}
```

### Step 4: 添加 loading 状态 UI

- 按钮变为 "分析中..." + spinner
- 树面板显示 "AI 分析中..."

---

## 9. Open Questions

1. **SSE vs REST**: 是否优先使用 SSE（方案 A）？还是用普通 POST（方案 B）？
2. **后续流程**: 确认上下文后，是否也要调用 `/api/ddd/business-flow/stream` 生成流程树？
3. **组件树**: 是否需要新增 `/api/ddd/component/stream` 端点？

---

*分析产出物已保存至: `/root/.openclaw/vibex/docs/vibex-canvas-api-fix-20260326/analysis.md`*
*截图证据: `/tmp/canvas-empty-state.png`, `/tmp/canvas-after-start.png`*

# Epic 2: SSE 流式生成 — 规格说明

**Epic ID**: epic-2-sse-streaming  
**优先级**: P0  
**工时估算**: ~2-3 days  
**依赖**: OQ-2（SSE 后端可用性验证）  
**代码基准**: `79ebe010`

---

## 目标

将 Canvas AI 生成从同步阻塞（等待数秒白屏）改为 SSE 流式实时反馈，用户感知到 Thinking 消息、三树节点逐步填充，最终收到完成/错误通知。

---

## 现状分析

### 已就绪基础设施

- `vibex-fronted/src/lib/canvas/api/canvasSseApi.ts` 已完整实现 SSE 客户端
- 支持事件类型：`thinking` / `step_context` / `step_model` / `step_flow` / `step_components` / `done` / `error`
- `useAIController.ts` 当前使用同步 `canvasApi.generateContexts`

### 待完成工作

1. 在 `useAIController.ts` 中替换同步 API 为 SSE 调用
2. 实现 SSE 事件到三树状态的映射逻辑
3. 实现 Thinking 消息的 UI 显示（AI thinking 面板）
4. 处理 `done` / `error` 状态的 UI 反馈
5. SSE 错误时的降级策略（graceful degradation）

---

## 用户故事

### 作为用户，我希望 AI 生成过程有实时流式反馈

**场景**：
1. 用户在 Canvas 输入需求文本，点击"开始生成"
2. 系统立即显示 AI Thinking 消息（实时打字效果）
3. 30-60s 内，三树节点逐步填充（Context → Flow → Components）
4. 生成完成后，显示完成提示
5. 如果出错，显示错误提示，并提供重试按钮

**Happy Path**：
```
用户点击"开始生成"
  → 显示 Thinking 面板（AI 正在思考...）
  → SSE 连接建立
  → 收到 thinking 事件 → 显示 AI 思考内容
  → 收到 step_context 事件 → 填充 Context 树节点
  → 收到 step_model 事件 → 填充 Model 树节点
  → 收到 step_flow 事件 → 填充 Flow 树节点
  → 收到 step_components 事件 → 填充 Components 树节点
  → 收到 done 事件 → 显示"生成完成"，隐藏 Thinking 面板
  → 导出按钮变为 enabled
```

**Error Path**：
```
用户点击"开始生成"
  → SSE 连接失败（网络错误 / 后端不可用）
  → 检测到 SSE 不可用
  → 自动降级到同步 API（canvasApi.generateContexts）
  → 显示降级提示："正在使用同步模式..."
  → 同步完成后正常显示结果
```

---

## 技术方案

### 组件改造

#### 1. useAIController.ts 改造

```tsx
// 替换同步调用
const handleGenerate = async (requirement: string) => {
  setGeneratingState('streaming')
  
  try {
    await canvasSseApi.streamGenerate({
      requirement,
      onThinking: (message) => setAiThinking(message),
      onStepContext: (nodes) => updateContextTree(nodes),
      onStepModel: (nodes) => updateModelTree(nodes),
      onStepFlow: (nodes) => updateFlowTree(nodes),
      onStepComponents: (nodes) => updateComponentsTree(nodes),
      onDone: () => {
        setGeneratingState('done')
        setAiThinking(null)
      },
      onError: (err) => {
        setGeneratingState('error')
        // 降级：自动切同步 API
        return fallbackToSyncGenerate(requirement)
      }
    })
  } catch (err) {
    // SSE 降级
    await fallbackToSyncGenerate(requirement)
  }
}
```

#### 2. UI 状态定义

```tsx
type GeneratingState = 'idle' | 'streaming' | 'thinking' | 'done' | 'error' | 'fallback'

// Thinking 面板可见条件
const showThinkingPanel = generatingState === 'streaming' || generatingState === 'thinking'
```

#### 3. Thinking 面板组件

```tsx
// 新增或复用现有 AiThinkingPanel
<div data-testid="ai-thinking" className={showThinkingPanel ? 'visible' : 'hidden'}>
  <span className="thinking-indicator">💭</span>
  <span className="thinking-text">{aiThinking}</span>
</div>
```

### SSE 事件映射

| SSE Event | 目标 Store | Action |
|-----------|-----------|--------|
| `thinking` | `uiStore` | `setAiThinking(message)` |
| `step_context` | `contextStore` | `addContextNodes(nodes)` |
| `step_model` | `contextStore` | `addModelNodes(nodes)` |
| `step_flow` | `flowStore` | `addFlowNodes(nodes)` |
| `step_components` | `flowStore` | `addComponentNodes(nodes)` |
| `done` | `uiStore` | `setGeneratingState('done')`, `setAiThinking(null)` |
| `error` | `uiStore` | `setGeneratingState('error')`, `showErrorToast()` |

### 降级策略（OQ-3 决策点）

| 策略 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| **自动降级**（推荐） | SSE 失败自动切同步 API | 用户无感知 | 可能增加后端负载 |
| **报错提示** | SSE 失败弹窗提示用户选择 | 用户知情 | 增加交互步骤 |

---

## 验收标准

### 功能性

```ts
// 用户点击"开始生成"后，Thinking 面板可见
await userEvent.click(screen.getByRole('button', { name: /开始生成/ }))
expect(screen.getByTestId('ai-thinking')).toBeVisible()

// Thinking 消息实时更新
await waitFor(() => {
  const text = screen.getByTestId('ai-thinking').textContent
  expect(text.length).toBeGreaterThan(0)
})

// 三树节点流式填充（context → flow → components）
const contextItems = await screen.findAllByRole('treeitem', { name: /context/i })
const flowItems = await screen.findAllByRole('treeitem', { name: /flow/i })
expect(contextItems.length).toBeGreaterThan(0)
expect(flowItems.length).toBeGreaterThan(0)

// 生成完成状态反馈
await waitFor(() => {
  expect(screen.getByText(/生成完成|done/i)).toBeVisible()
}, { timeout: 60000 })

// 生成错误状态反馈
expect(screen.getByText(/生成失败|error/i)).toBeVisible()
```

### 降级回退

```ts
// SSE 连接失败时，自动降级到同步 API
await simulateSseFailure()
await userEvent.click(screen.getByRole('button', { name: /开始生成/ }))
expect(screen.getByText(/同步模式/i)).toBeVisible()
expect(screen.getByRole('button', { name: /开始生成/ })).toBeEnabled()
```

### UI 状态正确

```ts
// 生成中按钮状态
expect(screen.getByRole('button', { name: /开始生成/ })).toBeDisabled()
expect(screen.getByRole('button', { name: /导出/ })).toBeDisabled()

// 生成完成后按钮恢复
await waitFor(() => {
  expect(screen.getByRole('button', { name: /开始生成/ })).toBeEnabled()
  expect(screen.getByRole('button', { name: /导出/ })).toBeEnabled()
})
```

### 类型安全

```ts
expect(tsc --noEmit).toHaveExitCode(0)
```

---

## 依赖事项

| # | 事项 | 负责人 | 截止时间 |
|---|------|--------|----------|
| D-1 | Dev 验证 SSE 后端 `/api/v1/canvas/stream` 可用性 | Dev | Epic 启动前 |
| D-2 | PM 确认降级策略（OQ-3） | PM | Epic 启动前 |
| D-3 | SSE 事件类型与后端字段映射文档 | Architect | Epic 第 0.5 天 |

---

## DoD Checklist

- [ ] SSE 后端可用性验证通过
- [ ] Thinking 消息实时显示（打字效果）
- [ ] 三树节点按 SSE 事件逐步填充
- [ ] `done` / `error` 状态 UI 明确反馈
- [ ] SSE 错误时降级策略正常工作
- [ ] gstack 自动化测试覆盖 happy path
- [ ] `tsc --noEmit` 零错误
- [ ] 降级策略已 PM 确认（OQ-3）

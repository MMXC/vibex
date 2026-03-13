# PRD: 领域模型 API 思考过程流式展示

**项目**: vibex-api-domain-model-fix  
**版本**: 1.0  
**日期**: 2026-03-13  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 限界上下文 API 已实现流式响应，但领域模型 API 缺少思考过程展示，用户体验不一致。

**目标**: 对标限界上下文 API，实现领域模型的思考过程流式展示。

---

## 2. 功能需求矩阵

### F1: 流式响应后端

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | SSE 流式端点 | `expect(endpoint('/api/ddd/domain-model')).toSupportSSE()` | P0 |
| F1.2 | 思考过程数据块 | `expect(chunk.type).toBe('thinking')` | P0 |
| F1.3 | 最终结果数据块 | `expect(chunk.type).toBe('result')` | P0 |
| F1.4 | 错误数据块 | `expect(chunk.type).toBe('error')` | P0 |
| F1.5 | 流式响应格式 | `expect(format).toMatch(/^data: .+\n\n/)` | P0 |

---

### F2: 前端流式接收

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | EventSource 连接 | `expect(eventSource).toConnect()` | P0 |
| F2.2 | 消息接收处理 | `expect(onMessage).toReceive(chunk)` | P0 |
| F2.3 | 思考过程累积 | `expect(thinkingBuffer).toAppend(chunk)` | P0 |
| F2.4 | 结果渲染触发 | `expect(onResult).toRender()` | P0 |
| F2.5 | 连接错误处理 | `expect(onError).toHandle()` | P0 |

---

### F3: 思考过程展示组件

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 思考过程显示区域 | `expect(thinkingArea.isVisible()).toBe(true)` | P0 |
| F3.2 | 思考内容流式打字机效果 | `expect(typewriter.effect).toWork()` | P0 |
| F3.3 | 思考状态指示器 | `expect(indicator).toShow('思考中...')` | P0 |
| F3.4 | 最终结果展示 | `expect(resultDisplay).toRender()` | P0 |
| F3.5 | 思考/结果切换动画 | `expect(transition).toAnimate()` | P1 |

---

### F4: 与限界上下文 API 对标

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 响应格式一致 | `expect(domainModelFormat).toEqual(contextFormat)` | P0 |
| F4.2 | 组件复用 | `expect(ThinkingDisplay).toBeReused()` | P0 |
| F4.3 | 状态管理一致 | `expect(useStreamStore).toMatchPattern()` | P0 |

---

## 3. 流式响应格式定义

### 数据块格式

```typescript
// 思考过程块
{
  "type": "thinking",
  "step": 1,
  "stepName": "分析领域实体",
  "content": "正在识别核心实体...",
  "timestamp": "2026-03-13T23:36:00Z"
}

// 最终结果块
{
  "type": "result",
  "domainModels": [...],
  "mermaidCode": "...",
  "timestamp": "2026-03-13T23:36:05Z"
}

// 错误块
{
  "type": "error",
  "message": "...",
  "code": "ERROR_CODE"
}
```

---

## 4. Epic 拆分

### Epic 1: 后端流式支持

| Story | 验收 |
|-------|------|
| S1.1 SSE 端点 | `expect(route).toStream()` |
| S1.2 思考块发送 | `expect(sendThinking).toWork()` |
| S1.3 结果块发送 | `expect(sendResult).toWork()` |

**DoD**: POST /api/ddd/domain-model 返回 SSE 流

---

### Epic 2: 前端流接收

| Story | 验收 |
|-------|------|
| S2.1 EventSource | `expect(connect).toWork()` |
| S2.2 消息处理 | `expect(handleMessage).toParse()` |
| S2.3 缓冲累积 | `expect(buffer).toAccumulate()` |

**DoD**: 前端能接收并处理流数据

---

### Epic 3: 展示组件

| Story | 验收 |
|-------|------|
| S3.1 思考区域 | `expect(area).toShow()` |
| S3.2 打字机效果 | `expect(typewriter).toAnimate()` |
| S3.3 结果展示 | `expect(result).toRender()` |

**DoD**: 思考过程可见，结果正确展示

---

### Epic 4: 对标统一

| Story | 验收 |
|-------|------|
| S4.1 格式一致 | `expect(format).toMatch(context)` |
| S4.2 组件复用 | `expect(reuse).toWork()` |

**DoD**: 与限界上下文 API 体验一致

---

## 5. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | SSE 端点可用 | `expect(sseEndpoint).toWork()` |
| AC2 | 思考块类型 | `expect(chunk.type).toBe('thinking')` |
| AC3 | 结果块类型 | `expect(chunk.type).toBe('result')` |
| AC4 | 前端接收 | `expect(onMessage).toReceive()` |
| AC5 | 思考过程显示 | `expect(thinkingDisplay).toBeVisible()` |
| AC6 | 打字机效果 | `expect(typewriter).toAnimate()` |
| AC7 | 与限界上下文一致 | `expect(format).toEqual()` |

---

## 6. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 后端 SSE 端点 | 1.5h |
| 2 | 前端流接收 | 1h |
| 3 | 展示组件 | 1.5h |
| 4 | 对标测试 | 1h |

**总计**: 5h

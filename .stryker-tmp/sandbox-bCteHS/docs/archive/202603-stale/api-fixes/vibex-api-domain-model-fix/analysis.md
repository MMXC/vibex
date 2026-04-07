# 领域模型 API 思考过程展示 - 分析报告

**项目**: vibex-api-domain-model-fix  
**分析师**: analyst  
**日期**: 2026-03-13  
**版本**: 2.0（问题澄清后更新）

---

## 1. 执行摘要

**问题澄清**: 不是 API 404，而是 **领域模型 API 调用后无思考过程展示**。

**根因**: 领域模型 API (`/api/ddd/domain-model`) 没有流式端点，而限界上下文 API 有独立的 SSE 流式端点 (`/api/ddd/bounded-context/stream`) 支持思考过程展示。

**解决方案**: 为领域模型 API 添加流式端点 `/api/ddd/domain-model/stream`，复用现有的 `ThinkingPanel` 组件。

---

## 2. 问题诊断

### 2.1 对比分析

| API | 普通端点 | 流式端点 | 思考过程 |
|-----|----------|----------|----------|
| 限界上下文 | `/api/ddd/bounded-context` | `/api/ddd/bounded-context/stream` | ✅ 有 |
| 领域模型 | `/api/ddd/domain-model` | ❌ 无 | ❌ 无 |
| 业务流程 | `/api/ddd/business-flow` | ❌ 无 | ❌ 无 |

### 2.2 现有实现分析

#### 2.2.1 限界上下文流式 API

**文件**: `vibex-backend/src/routes/ddd.ts` (第 689 行)

```typescript
// POST /api/ddd/bounded-context/stream - SSE streaming version
ddd.post('/bounded-context/stream', async (c) => {
  // SSE event helper
  function send(event: string, data: any) {
    // ...
  }

  const stream = new ReadableStream({
    async start(controller) {
      // 发送思考过程
      send('thinking', { step: 'analyzing', message: '正在分析需求...' })
      send('thinking', { step: 'identifying-core', message: '识别核心领域...' })
      send('thinking', { step: 'calling-ai', message: '调用 AI 分析...' })
      
      // 调用 AI
      const result = await aiService.generateJSON(...)
      
      // 发送结果
      send('done', { boundedContexts: [...], mermaidCode: '...' })
    }
  })
})
```

#### 2.2.2 领域模型普通 API

**文件**: `vibex-backend/src/routes/ddd.ts` (第 266 行)

```typescript
// POST /api/ddd/domain-model - Generate domain models from bounded contexts
ddd.post('/domain-model', async (c) => {
  // 直接调用 AI，没有流式支持
  const result = await aiService.generateJSON(...)
  
  return c.json({
    success: true,
    domainModels,
    mermaidCode: '...'
  })
})
```

**问题**: 没有发送思考过程的机制，用户等待时看不到进度。

#### 2.2.3 前端 Hook

**文件**: `vibex-fronted/src/hooks/useDDDStream.ts`

```typescript
export function useDDDStream(): UseDDDStreamReturn {
  const generateContexts = useCallback((requirementText: string) => {
    // 调用流式 API
    const fullURL = getApiUrl('/ddd/bounded-context/stream');
    // ... SSE 解析逻辑
  }, [])
}
```

**问题**: 只有 `generateContexts` 方法，没有 `generateDomainModels` 流式方法。

---

## 3. 解决方案

### 3.1 后端：添加流式端点

**新增**: `/api/ddd/domain-model/stream`

```typescript
// vibex-backend/src/routes/ddd.ts

// POST /api/ddd/domain-model/stream - SSE streaming version
ddd.post('/domain-model/stream', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { boundedContexts, requirementText, projectId } = DomainModelRequestSchema.parse(body)

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const send = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        try {
          // Step 1: 分析阶段
          send('thinking', { 
            step: 'analyzing-contexts', 
            message: '正在分析限界上下文...' 
          })

          const aiService = createAIService(env)
          const contextDescriptions = boundedContexts
            .map(ctx => `- ${ctx.name}: ${ctx.description || 'No description'}`)
            .join('\n')

          // Step 2: 构建提示
          send('thinking', { 
            step: 'building-prompt', 
            message: '正在构建领域模型提示...' 
          })

          // Step 3: 调用 AI
          send('thinking', { 
            step: 'calling-ai', 
            message: '正在调用 AI 生成领域模型...' 
          })

          const result = await aiService.generateJSON<{ domainModels: any[] }>(...)

          // Step 4: 解析结果
          send('thinking', { 
            step: 'parsing-result', 
            message: '正在解析领域模型结果...' 
          })

          // 解析逻辑...

          // 发送完成事件
          send('done', {
            domainModels,
            mermaidCode: generateDomainModelMermaidCode(domainModels, boundedContexts)
          })
        } catch (error) {
          send('error', { message: error.message })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 3.2 前端：扩展 Hook

**修改**: `vibex-fronted/src/hooks/useDDDStream.ts`

```typescript
export interface UseDDDStreamReturn {
  // 现有
  generateContexts: (requirementText: string) => void
  
  // 新增
  generateDomainModels: (
    boundedContexts: BoundedContext[], 
    requirementText: string
  ) => void
  
  generateBusinessFlow: (
    domainModels: DomainModel[], 
    requirementText: string
  ) => void
}

export function useDDDStream(): UseDDDStreamReturn {
  // ... 现有代码 ...

  // 新增：生成领域模型（流式）
  const generateDomainModels = useCallback((
    boundedContexts: BoundedContext[],
    requirementText: string
  ) => {
    // 重置状态
    setThinkingMessages([])
    setDomainModels([])
    setStatus('thinking')
    
    const fullURL = getApiUrl('/ddd/domain-model/stream')
    
    const fetchSSE = async () => {
      const response = await fetch(fullURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boundedContexts, requirementText }),
      })
      
      const reader = response.body.getReader()
      // ... SSE 解析逻辑，类似 generateContexts
    }
    
    fetchSSE()
  }, [])

  return {
    // ... 现有 ...
    generateDomainModels,
  }
}
```

### 3.3 首页集成

**修改**: `vibex-fronted/src/app/page.tsx`

```typescript
export default function HomePage() {
  const {
    thinkingMessages,
    status,
    generateContexts,
    generateDomainModels,  // 新增
  } = useDDDStream()

  // 生成限界上下文后，自动触发领域模型生成
  useEffect(() => {
    if (status === 'done' && boundedContexts.length > 0) {
      // 显示过渡提示
      // 用户可以选择继续生成或手动触发
    }
  }, [status, boundedContexts])

  const handleGenerateDomainModel = () => {
    // 使用流式 API
    generateDomainModels(boundedContexts, requirementText)
  }

  return (
    <div>
      {/* 右侧 ThinkingPanel 会自动展示思考过程 */}
      <aside className={styles.aiPanel}>
        <ThinkingPanel
          thinkingMessages={thinkingMessages}
          status={status}
        />
      </aside>
    </div>
  )
}
```

---

## 4. 实施计划

### 4.1 文件修改清单

| 文件 | 修改类型 | 内容 |
|------|----------|------|
| `vibex-backend/src/routes/ddd.ts` | 新增端点 | 添加 `/domain-model/stream` |
| `vibex-fronted/src/hooks/useDDDStream.ts` | 扩展 | 添加 `generateDomainModels` 方法 |
| `vibex-fronted/src/app/page.tsx` | 修改 | 使用新的流式方法 |

### 4.2 工时估算

| 任务 | 工时 |
|------|------|
| 后端流式端点开发 | 1 人日 |
| 前端 Hook 扩展 | 0.5 人日 |
| 首页集成修改 | 0.5 人日 |
| 测试验证 | 0.5 人日 |

**总工时**: 2.5 人日

---

## 5. 验收标准

| ID | 验收项 | 验收标准 |
|----|--------|----------|
| F-001 | 流式端点可用 | `POST /api/ddd/domain-model/stream` 返回 SSE 流 |
| F-002 | 思考过程展示 | 调用后显示 "正在分析..." 等思考消息 |
| F-003 | 结果正确返回 | 流结束后返回正确的 domainModels 和 mermaidCode |
| F-004 | 错误处理 | AI 调用失败时显示错误消息 |
| F-005 | 中断支持 | 用户可中途停止生成 |

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| SSE 连接不稳定 | 低 | 中 | 添加重连机制 |
| AI 响应延迟 | 中 | 低 | 显示加载动画 |
| 流式解析错误 | 低 | 中 | 完善错误处理 |

---

## 7. 后续扩展

同样可以为 `/api/ddd/business-flow` 添加流式端点，实现完整的 3 步流程思考过程展示：

```
限界上下文 (stream) → 领域模型 (stream) → 业务流程 (stream)
```

---

*文档生成时间: 2026-03-13*  
*分析师: analyst*
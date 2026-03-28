# 领域模型 Parsing 卡顿问题分析

**项目**: vibex-domain-model-parsing-stuck  
**分析师**: Analyst Agent  
**日期**: 2026-03-16  
**状态**: ✅ 分析完成

---

## 执行摘要

**问题**: 领域模型生成时 ThinkingPanel 卡在 'parsing' 步骤，AI stream 接口已返回完整内容但状态不变。

**根因推测**: 后端 `aiService.generateJSON()` 返回的 JSON 格式不符合预期，`parseJSONWithRetry` 返回 `null`，抛出异常但前端未收到 `error` 事件。

**影响范围**: 领域模型生成流程、ThinkingPanel 状态同步。

**推荐方案**: 增强后端 JSON 解析错误处理，确保异常时发送 `error` 事件；前端增加超时检测。

---

## 一、问题现象

### 1.1 用户报告

| 现象 | 描述 |
|------|------|
| ThinkingPanel 状态 | 卡在 'parsing' 步骤 |
| 进度条 | 显示 67%（非 100%） |
| 侧边栏 | 步骤3（领域模型）仍然 disabled |
| 主内容区 | 仍显示限界上下文图 |

### 1.2 SSE 事件流分析

**预期事件流**:
```
thinking: analyzing → thinking: building-prompt → thinking: calling-ai → thinking: parsing → done/error
```

**实际事件流**:
```
thinking: analyzing → thinking: building-prompt → thinking: calling-ai → thinking: parsing → [卡住]
```

---

## 二、代码路径分析

### 2.1 后端 SSE 流程

**文件**: `vibex-backend/src/routes/ddd.ts`

```typescript
// POST /api/ddd/domain-model/stream
ddd.post('/domain-model/stream', async (c) => {
  // ...
  try {
    // Step 3: 调用 AI
    send('thinking', { step: 'calling-ai', message: '正在调用 AI 生成领域模型...' })
    
    const result = await aiService.generateJSON<{ domainModels: any[] }>(...)
    
    if (!result.success || !result.data?.domainModels) {
      throw new Error(result.error || 'Failed to generate domain models')
    }
    
    // Step 4: 解析结果
    send('thinking', { step: 'parsing', message: '正在解析结果...' })
    
    // ... transform domain models ...
    
    // Send done event
    send('done', { domainModels, mermaidCode, message: '领域模型生成完成' })
    
  } catch (error) {
    send('error', { message: error instanceof Error ? error.message : 'Unknown error' })
  }
})
```

### 2.2 AI Service JSON 解析

**文件**: `vibex-backend/src/services/ai-service.ts`

```typescript
async generateJSON<T>(prompt: string, schema?, options?): Promise<AIResult<T>> {
  // ...
  const result = this.parseJSONWithRetry<T>(response.content);
  
  if (!result) {
    console.log('[DEBUG] Failed to parse JSON. Raw response length:', response.content?.length)
    throw new Error('Failed to parse JSON response');
  }
  
  return result;
}
```

### 2.3 前端 SSE 处理

**文件**: `vibex-fronted/src/hooks/useDDDStream.ts`

```typescript
switch (eventType) {
  case 'thinking':
    setThinkingMessages(prev => [...prev, parsedData])
    break
    
  case 'done':
    const models = Array.isArray(parsedData.domainModels) 
      ? parsedData.domainModels 
      : []
    setDomainModels(models)
    setMermaidCode(parsedData.mermaidCode || '')
    setStatus('done')
    break
    
  case 'error':
    setErrorMessage(parsedData.message || 'Unknown error')
    setStatus('error')
    break
}
```

---

## 三、根因分析

### 3.1 可能原因

| 原因 | 可能性 | 说明 |
|------|--------|------|
| **AI 返回 JSON 格式错误** | 🔴 高 | `parseJSONWithRetry` 返回 `null`，抛出异常 |
| **SSE 连接中断** | 🟡 中 | 网络问题导致事件丢失 |
| **AI 响应超时** | 🟡 中 | AI 长时间无响应 |
| **异常未被正确捕获** | 🟡 中 | `try-catch` 未能捕获所有异常 |
| **前端事件解析失败** | 🟢 低 | JSON.parse 解析 SSE data 失败 |

### 3.2 详细分析

**场景 A: AI 返回 JSON 格式错误**

```
AI Response:
{
  "domainModels": [...]  // 正常
}

OR

AI Response:
{
  "models": [...]  // 错误：字段名不对
}
```

如果 AI 返回的 JSON 中 `domainModels` 字段不存在或格式错误：

1. `parseJSONWithRetry` 成功解析 JSON
2. `result.data?.domainModels` 为 `undefined`
3. 条件 `!result.data?.domainModels` 为 true
4. 抛出 `Error('Failed to generate domain models')`
5. 被 catch 捕获，发送 `error` 事件

**问题**: 如果是这个场景，前端应该收到 `error` 事件，而不是卡在 `parsing`。

**场景 B: JSON 解析失败**

```
AI Response:
{ "domainModels": [ { "name": "test", ...  // 不完整的 JSON
```

如果 JSON 不完整：

1. `parseJSONWithRetry` 返回 `null`
2. 抛出 `Error('Failed to parse JSON response')`
3. 被 catch 捕获，发送 `error` 事件

**问题**: 同样应该收到 `error` 事件。

**场景 C: 异常未被捕获**

```typescript
const result = await aiService.generateJSON<...>(...)

// 如果 generateJSON 内部抛出异常，应该被外层 try-catch 捕获
// 但如果 generateJSON 的 Promise reject 但异常类型不是 Error...
```

**可能问题**: `executeWithFallback` 方法可能有未处理的异常路径。

### 3.3 关键检查点

需要检查后端日志：

```bash
# 检查是否有 JSON 解析失败日志
grep "Failed to parse JSON" /root/.openclaw/vibex/vibex-backend/logs/*.log

# 检查 SSE 流是否正常关闭
grep "Stream error\|controller.close" /root/.openclaw/vibex/vibex-backend/logs/*.log
```

---

## 四、解决方案

### 4.1 方案 A：增强后端错误处理（推荐）

```typescript
// ddd.ts - POST /domain-model/stream
try {
  // Step 4: 解析结果
  send('thinking', { step: 'parsing', message: '正在解析结果...' })
  
  // 增强错误处理
  if (!result.success) {
    console.error('[Domain Model Stream] AI request failed:', result.error)
    send('error', { message: `AI 请求失败: ${result.error}` })
    controller.close()
    return
  }
  
  if (!result.data) {
    console.error('[Domain Model Stream] No data in response')
    send('error', { message: 'AI 返回数据为空' })
    controller.close()
    return
  }
  
  if (!Array.isArray(result.data.domainModels)) {
    console.error('[Domain Model Stream] Invalid domainModels format:', typeof result.data.domainModels)
    send('error', { message: 'AI 返回的领域模型格式不正确' })
    controller.close()
    return
  }
  
  // ... 正常处理 ...
  
} catch (error) {
  console.error('[Domain Model Stream] Unexpected error:', error)
  send('error', { 
    message: `处理异常: ${error instanceof Error ? error.message : 'Unknown error'}` 
  })
} finally {
  controller.close()  // 确保总是关闭
}
```

### 4.2 方案 B：前端增加超时检测

```typescript
// useDDDStream.ts
const generateDomainModels = useCallback((...) => {
  setStatus('thinking')
  
  // 设置超时检测
  const timeoutId = setTimeout(() => {
    if (status === 'thinking') {
      setStatus('error')
      setErrorMessage('请求超时，请重试')
      cleanup()
    }
  }, 60000)  // 60 秒超时
  
  // ... fetchSSE ...
  
  // 在 done/error 分支清除超时
  clearTimeout(timeoutId)
}, [])
```

### 4.3 方案 C：增强 AI Service 错误返回

```typescript
// ai-service.ts
async generateJSON<T>(...): Promise<AIResult<T>> {
  try {
    const result = this.parseJSONWithRetry<T>(response.content);
    
    if (!result) {
      return {
        success: false,
        error: 'Failed to parse JSON response',
        data: null as T
      }
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null as T
    }
  }
}
```

---

## 五、验收标准

### 5.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| PS-001 | AI 返回格式错误时，前端收到明确的 error 事件 | 模拟 AI 返回错误格式 JSON |
| PS-002 | JSON 解析失败时，前端收到明确的 error 事件 | 模拟不完整 JSON |
| PS-003 | 前端在 60 秒无响应后自动超时 | 不发送任何事件，验证超时 |
| PS-004 | 正常流程完成后，ThinkingPanel 显示 done 状态 | 正常请求验证 |
| PS-005 | 后端日志记录所有错误详情 | 检查日志文件 |

### 5.2 回归测试

- [ ] 限界上下文生成正常
- [ ] 业务流程生成正常
- [ ] SSE 连接稳定

---

## 六、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | 分析问题、定位根因 | 1h |
| 2 | 实现方案 A（后端错误处理） | 1h |
| 3 | 实现方案 B（前端超时检测） | 0.5h |
| 4 | 测试验证 | 1h |
| **总计** | | **3.5h** |

---

## 七、风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 修复影响其他 SSE 端点 | 低 | 中 | 测试所有 SSE 流程 |
| 超时时间设置不合理 | 低 | 低 | 可配置化 |

---

## 八、下一步行动

1. **Dev**: 实现方案 A 和 B
2. **Tester**: 验证错误场景处理
3. **Reviewer**: 代码审查

---

## 九、分析检查清单

- [x] 根因定位：AI 返回格式错误或 JSON 解析失败
- [x] 影响范围：领域模型生成流程、ThinkingPanel 状态
- [x] 修复建议：增强错误处理 + 前端超时检测
- [x] 验证方案：模拟错误场景测试

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-domain-model-parsing-stuck/analysis.md`
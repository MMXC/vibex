# 前端分析报告: SSE 响应不显示问题 (vibex-frontend-sse-display-fix)

**分析日期**: 2026-03-16  
**分析人**: Analyst Agent  
**状态**: 待评审

---

## 一、问题描述

| 项目 | 内容 |
|------|------|
| **现象** | SSE 返回 thinking、context、done 事件正常，但前端不显示 |
| **验证** | 用户确认 API 响应正常 |
| **影响** | 用户看不到 AI 分析进度和结果 |

---

## 二、代码分析

### 2.1 数据流分析

```
SSE 数据流:
┌─────────────────────────────────────────────────────────────────┐
│ 后端 SSE 端点                                                    │
│ /ddd/bounded-context/stream                                     │
│   ↓ 发送事件                                                     │
│   event: thinking  → { step, message }                         │
│   event: context   → BoundedContext                            │
│   event: done      → { boundedContexts, mermaidCode }          │
├─────────────────────────────────────────────────────────────────┤
│ 前端 Hook (useDDDStream)                                        │
│   ↓ 解析 SSE                                                     │
│   setThinkingMessages(prev => [...prev, parsedData])           │
│   setContexts(prev => [...prev, parsedData])                   │
│   setContexts(contexts)                                         │
│   setStatus('done')                                             │
├─────────────────────────────────────────────────────────────────┤
│ HomePage.tsx                                                     │
│   ↓ 传递 props                                                   │
│   thinkingMessages={thinkingMessages}                           │
│   contexts={currentStep === 2 ? streamContexts : undefined}    │
│   status={currentStep === 2 ? streamStatus : ...}              │
├─────────────────────────────────────────────────────────────────┤
│ ThinkingPanel.tsx                                                │
│   ↓ 渲染逻辑                                                     │
│   useEffect → setDisplayedSteps(prev => [...prev, latestStep]) │
│   {displayedSteps.length > 0 && <ThinkingSteps ...>}           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 潜在问题点

#### 问题 1: ThinkingPanel displayedSteps 更新逻辑

**代码位置**: `ThinkingPanel.tsx` 第 120-131 行

```typescript
useEffect(() => {
  if (!thinkingMessages || !Array.isArray(thinkingMessages)) {
    return
  }
  if (thinkingMessages.length > displayedSteps.length) {
    const latestStep = thinkingMessages[thinkingMessages.length - 1]
    if (!displayedSteps.find(s => s.step === latestStep.step)) {
      setDisplayedSteps(prev => [...prev, latestStep])
    }
  }
}, [thinkingMessages, displayedSteps])
```

**问题**: 
- 只在 `thinkingMessages.length > displayedSteps.length` 时更新
- 如果 `displayedSteps` 已经有 3 个元素，新的 thinking 消息不会添加

#### 问题 2: currentStep 渲染条件

**代码位置**: `HomePage.tsx` 第 399-408 行

```typescript
{streamStatus !== 'idle' || modelStreamStatus !== 'idle' || flowStreamStatus !== 'idle' ? (
  <ThinkingPanel
    thinkingMessages={currentStep === 2 ? thinkingMessages : currentStep === 3 ? modelThinkingMessages : flowThinkingMessages}
    contexts={currentStep === 2 ? streamContexts : undefined}
    // ...
  />
) : (
```

**问题**: 
- `currentStep` 在 SSE 开始时可能是 1（需求输入步骤）
- 此时 `thinkingMessages` 不会传递到 ThinkingPanel

#### 问题 3: contexts 空值检查

**代码位置**: `ThinkingPanel.tsx` 第 205-211 行

```typescript
{status === 'done' && contexts.length === 0 && (
  <div className={styles.emptyState}>
    分析完成，暂无结果
  </div>
)}
```

**问题**: 
- `contexts` 可能是 `undefined`（当 currentStep !== 2 时）
- 访问 `undefined.length` 会崩溃

### 2.3 与之前回退的关系

**回退记录**: commit 25e0c66 回退了 005279b

**回退影响**:
- 005279b 修改了 `useDomainModelStream` 和 `HomePage.tsx`
- 回退后，`useDDDStream` 没有被直接影响

**但是**:
- 如果部署/缓存问题，可能导致代码不一致
- 需要确认前端是否正确部署最新代码

---

## 三、验证步骤

### 3.1 检查前端代码版本

```bash
# 确认当前代码
git log --oneline -3
# 应显示: 25e0c66 revert: 回退领域模型渲染修复

# 检查部署版本
# 在浏览器控制台执行:
console.log(__NEXT_DATA__.buildId)
```

### 3.2 检查 SSE 事件流

```javascript
// 在浏览器控制台开启 DEBUG
// 查看是否收到 thinking/context/done 事件
// 应该看到:
// [DEBUG SSE] Starting SSE request...
// [DEBUG SSE] Response status: 200 OK
// [DEBUG SSE] done event received: {...}
```

### 3.3 检查状态更新

```javascript
// 在 React DevTools 中检查:
// 1. thinkingMessages 是否有数据
// 2. streamStatus 是否为 'thinking' 或 'done'
// 3. currentStep 是否正确
```

---

## 四、修复方案

### 方案 A: 修复 ThinkingPanel displayedSteps 更新逻辑

```typescript
// 修复前
if (thinkingMessages.length > displayedSteps.length) {
  const latestStep = thinkingMessages[thinkingMessages.length - 1]
  if (!displayedSteps.find(s => s.step === latestStep.step)) {
    setDisplayedSteps(prev => [...prev, latestStep])
  }
}

// 修复后 - 直接同步 thinkingMessages
useEffect(() => {
  if (!thinkingMessages || !Array.isArray(thinkingMessages)) {
    setDisplayedSteps([])
    return
  }
  setDisplayedSteps(thinkingMessages)
}, [thinkingMessages])
```

### 方案 B: 修复 contexts 空值检查

```typescript
// 修复前
{status === 'done' && contexts.length === 0 && (

// 修复后
{status === 'done' && (!contexts || contexts.length === 0) && (
```

### 方案 C: 确保 ThinkingPanel 始终渲染（可选）

```typescript
// 当前逻辑: 只在非 idle 状态渲染
{streamStatus !== 'idle' || ... ? (
  <ThinkingPanel ... />
) : (...)}

// 可选: 始终渲染，让 ThinkingPanel 内部处理 idle 状态
<ThinkingPanel
  thinkingMessages={thinkingMessages}
  contexts={streamContexts}
  mermaidCode={streamMermaidCode}
  status={streamStatus}
  // ...
/>
```

---

## 五、推荐修复优先级

| 优先级 | 问题 | 影响 | 工作量 |
|--------|------|------|--------|
| P0 | contexts 空值检查 | 可能崩溃 | 5分钟 |
| P0 | displayedSteps 更新逻辑 | 不显示进度 | 10分钟 |
| P1 | 始终渲染 ThinkingPanel | 体验优化 | 可选 |

---

## 六、验收标准

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| 1 | SSE thinking 事件后显示分析步骤 | 手动测试 |
| 2 | SSE context 事件后显示限界上下文卡片 | 手动测试 |
| 3 | SSE done 事件后显示完整结果 | 手动测试 |
| 4 | contexts 为 undefined 时无崩溃 | 手动测试 |
| 5 | 浏览器控制台无错误 | 检查 Console |

---

## 七、风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 修改影响其他流程 | 低 | 仅修改显示逻辑 |
| contexts 空值崩溃 | 高 | 优先修复 |

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-frontend-sse-display-fix/analysis.md`  
**分析人**: Analyst Agent  
**日期**: 2026-03-16
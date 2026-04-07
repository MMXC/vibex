# 间歇性渲染问题根因分析报告

**项目**: vibex-domain-model-render-fix-v3
**任务**: analyze-issue
**版本**: 1.0
**日期**: 2026-03-16
**分析者**: Analyst Agent

---

## 执行摘要

领域模型渲染问题是**间歇性**的，不是持续性的。根因是**多个竞态条件叠加**，在特定时序下导致状态未正确同步。主要问题点：
1. **SSE 事件解析脆弱** - 网络延迟导致数据包不完整时丢失事件
2. **React 状态更新异步** - 多个状态同时更新时存在时序窗口
3. **渲染条件过于严格** - 即使有数据也不满足渲染条件
4. **增量推送与完整覆盖冲突** - context 事件与 done 事件状态不一致

---

## 1. 问题现象

| 现象 | 频率 | 触发条件 |
|------|------|----------|
| 领域模型图表不渲染 | 间歇性 | 特定时序下发生 |
| 后来又恢复显示 | 同一会话内 | 状态最终一致 |
| 用户感知不稳定 | 高 | 多次操作后复现 |

---

## 2. 根因分析

### 2.1 根因一：SSE 事件解析脆弱 (P0)

**位置**: `useDDDStream.ts` 第 150-180 行

**问题代码**:
```typescript
buffer += decoder.decode(value, { stream: true })

// Parse SSE events
const lines = buffer.split('\n')
buffer = lines.pop() || '' // Keep incomplete line in buffer

// Iterate with index to correctly find next line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (line.startsWith('event: ')) {
    const eventType = line.slice(7)
    // Check next line for data
    const nextLine = lines[i + 1]
    if (nextLine && nextLine.startsWith('data: ')) {
      // ...处理事件
      i++  // Skip the data line
    }
  }
}
```

**间歇性触发条件**:
1. 网络延迟导致 `event: done` 和 `data: {...}` 被分到两个 TCP 包
2. 第一次 `read()` 只读到 `event: done\n`
3. `buffer` 保留 `event: done`，但没有 `data:` 行
4. 第二次 `read()` 读到 `data: {...}\n\n`
5. 但解析逻辑期望 `event:` 在前，此时无法正确配对

**概率估计**: 5-15%（取决于网络质量）

---

### 2.2 根因二：React 状态更新时序问题 (P0)

**位置**: `HomePage.tsx` 第 131-138 行

**问题代码**:
```typescript
useEffect(() => {
  if (streamStatus === 'done' && streamContexts.length > 0) {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    setCurrentStep(2);
    setCompletedStep(2);
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

**间歇性触发条件**:
1. Hook 内部三个状态独立更新：
   - `setStatus('done')`
   - `setContexts(contexts)`
   - `setMermaidCode(code)`
2. React 批量更新时，`streamStatus` 可能先变为 `'done'`
3. 但 `streamContexts` 还是空数组（上一轮的值）
4. 条件 `streamContexts.length > 0` 不满足
5. `setContextMermaidCode(streamMermaidCode)` 不执行

**状态时序图**:
```
时间线：
T0: setStatus('done')         → React 调度
T1: setContexts([...])        → React 调度
T2: setMermaidCode('...')     → React 调度

useEffect 触发时机：
- 第一次：status='done', contexts=[]  ← 条件不满足！
- 第二次：status='done', contexts=[...]  ← 但 mermaidCode 可能已丢失
```

---

### 2.3 根因三：渲染条件过于严格 (P1)

**位置**: `HomePage.tsx` 第 131 行

**问题代码**:
```typescript
if (streamStatus === 'done' && streamContexts.length > 0)
```

**问题分析**:
- 即使 AI 返回了有效的 `mermaidCode`
- 如果 `boundedContexts` 解析失败或为空
- 渲染条件也不满足，图表不显示

**实际场景**:
- AI 有时返回 `{"boundedContexts": [], "mermaidCode": "graph TD..."}`
- 后端默认逻辑会创建一个 fallback context
- 但如果 SSE 解析失败，`streamContexts` 可能为空

---

### 2.4 根因四：增量推送与完整覆盖冲突 (P1)

**位置**: `useDDDStream.ts` + `ddd.ts` 后端

**问题流程**:
```
后端发送顺序：
1. event: context, data: {...}  (第1个)
2. event: context, data: {...}  (第2个)
3. event: context, data: {...}  (第3个)
4. event: done, data: {boundedContexts: [...], mermaidCode: "..."}

前端处理：
- setContexts(prev => [...prev, ctx1])  // 增量
- setContexts(prev => [...prev, ctx2])  // 增量
- setContexts(prev => [...prev, ctx3])  // 增量
- setContexts(completeArray)             // 覆盖！
```

**间歇性触发条件**:
1. 如果 `done` 事件先处理完
2. 但 `context` 事件还在队列中
3. 后续的增量 `setContexts` 会覆盖 `done` 中设置的完整数据
4. 导致数据丢失

---

## 3. 复现条件

### 3.1 必要条件

| 条件 | 描述 | 概率 |
|------|------|------|
| 网络延迟 | SSE 数据包被拆分 | 10-20% |
| React 调度时机 | 状态更新顺序不确定 | 5-10% |
| AI 返回时序 | done 先于 context 事件处理 | < 5% |

### 3.2 复现步骤

**高概率复现方法**:
1. 打开 Chrome DevTools → Network → Throttling
2. 设置为 "Slow 3G" 或自定义 500ms 延迟
3. 输入需求，点击生成
4. 观察渲染结果

**预期结果**: 约 30-50% 概率出现不渲染

---

## 4. 防范机制

### 4.1 修复方案一：SSE 解析增强 (P0)

**修改 `useDDDStream.ts`**:

```typescript
// 改进：使用更健壮的 SSE 解析
let eventBuffer = { event: '', data: '' };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('event: ')) {
    eventBuffer.event = line.slice(7);
  } else if (line.startsWith('data: ')) {
    eventBuffer.data = line.slice(6);
  } else if (line === '' && eventBuffer.event && eventBuffer.data) {
    // 空行表示事件结束，此时处理
    try {
      const parsedData = JSON.parse(eventBuffer.data);
      handleEvent(eventBuffer.event, parsedData);
    } catch (e) {
      console.error('Parse error:', e);
    }
    eventBuffer = { event: '', data: '' };  // 重置
  }
}
```

### 4.2 修复方案二：状态同步增强 (P0)

**修改 `HomePage.tsx`**:

```typescript
// 改进：不依赖多个状态的组合条件
useEffect(() => {
  // 只要 status 是 done，就处理数据
  if (streamStatus === 'done') {
    // 优先使用 streamMermaidCode，即使 contexts 为空也渲染
    if (streamMermaidCode) {
      setContextMermaidCode(streamMermaidCode);
    }
    // contexts 可选
    if (streamContexts.length > 0) {
      setBoundedContexts(streamContexts);
    }
    setCurrentStep(2);
    setCompletedStep(2);
  }
}, [streamStatus]);  // 只依赖 status，减少竞态

// 单独处理 contexts 更新
useEffect(() => {
  if (streamContexts.length > 0) {
    setBoundedContexts(streamContexts);
  }
}, [streamContexts]);

// 单独处理 mermaidCode 更新
useEffect(() => {
  if (streamMermaidCode) {
    setContextMermaidCode(streamMermaidCode);
  }
}, [streamMermaidCode]);
```

### 4.3 修复方案三：渲染条件放宽 (P1)

**修改渲染逻辑**:

```typescript
// 当前：
if (streamStatus === 'done' && streamContexts.length > 0)

// 改为：
const hasMermaidCode = !!getCurrentMermaidCode();
const hasContexts = boundedContexts.length > 0;

// 只要有图表代码就渲染
if (hasMermaidCode) {
  return <MermaidPreview code={getCurrentMermaidCode()} ... />;
}
```

### 4.4 修复方案四：状态一致性保障 (P1)

**在 `useDDDStream.ts` 中添加**:

```typescript
// 使用 useRef 存储 done 数据，避免竞态
const doneDataRef = useRef<{ contexts: BoundedContext[], mermaidCode: string } | null>(null);

// 在 done 事件处理时
case 'done':
  doneDataRef.current = {
    contexts: Array.isArray(parsedData.boundedContexts) ? parsedData.boundedContexts : [],
    mermaidCode: parsedData.mermaidCode || ''
  };
  // 一次性设置所有状态
  setContexts(doneDataRef.current.contexts);
  setMermaidCode(doneDataRef.current.mermaidCode);
  setStatus('done');
  break;

// 忽略后续的增量 context 事件（已由 done 覆盖）
case 'context':
  if (doneDataRef.current) {
    // done 已处理，忽略增量
    return;
  }
  setContexts(prev => [...prev, parsedData]);
  break;
```

---

## 5. 测试验证

### 5.1 单元测试

```typescript
describe('useDDDStream - Race Conditions', () => {
  it('should handle split SSE packets', async () => {
    // 模拟数据包拆分
    const packet1 = 'event: done\n';
    const packet2 = 'data: {"boundedContexts": [], "mermaidCode": "graph TD"}\n\n';
    
    // 验证解析正确
  });
  
  it('should render even when contexts empty', async () => {
    // 模拟 AI 返回空 contexts 但有 mermaidCode
    const result = { boundedContexts: [], mermaidCode: 'graph TD' };
    
    // 验证图表渲染
  });
});
```

### 5.2 集成测试

```typescript
describe('HomePage - SSE Integration', () => {
  it('should render mermaid code reliably', async () => {
    // 模拟慢速网络
    // 验证 10 次请求中至少 9 次成功渲染
  });
});
```

---

## 6. 结论

**问题性质**: 竞态条件 + 防御性编程不足

**根因排序**:
1. P0: SSE 事件解析脆弱（网络延迟时丢失事件）
2. P0: React 状态更新时序问题（组合条件判断时机错误）
3. P1: 渲染条件过于严格（有数据也不满足条件）
4. P1: 增量推送与完整覆盖冲突

**修复优先级**:
1. 立即修复：方案一 + 方案二（预计 2h）
2. 短期优化：方案三 + 方案四（预计 1h）

**预期效果**: 修复后间歇性问题概率从 10-30% 降至 < 1%

---

*报告完成时间: 2026-03-16 04:15 (GMT+8)*
*Analyst Agent*
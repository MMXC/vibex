# 根因分析报告: 领域模型 Mermaid 渲染问题 (vibex-domain-model-mermaid-fix)

**分析日期**: 2026-03-16  
**分析人**: Analyst Agent  
**状态**: 待评审

---

## 一、执行摘要

**问题**: 领域模型生成后图表不渲染，原修复引入新问题，回退后限界上下文也不显示。

**根因**:
1. **领域模型无渲染**: 后端 `/ddd/domain-model/stream` SSE 端点的 done 事件未返回 `mermaidCode`
2. **原修复破坏进度条**: 根因待确认（理论上不应影响限界上下文）
3. **回退后限界上下文不显示**: 根因待确认（可能与部署/缓存有关）

**推荐方案**: 在 `useDomainModelStream` 中添加 `mermaidCode` 支持，后端 `domain-model/stream` 添加 `mermaidCode` 生成。

---

## 二、问题时间线

```
时间线:
┌─────────────────────────────────────────────────────────────────┐
│ T0: 初始问题                                                    │
│     用户反馈：限界上下文生成后点击"生成领域模型"，图表不渲染    │
├─────────────────────────────────────────────────────────────────┤
│ T1: 原修复 (005279b)                                           │
│     后端：domain-model/stream done 添加 mermaidCode            │
│     前端：useDomainModelStream 添加 mermaidCode 状态            │
│     前端：HomePage.tsx 使用 streamModelMermaidCode              │
├─────────────────────────────────────────────────────────────────┤
│ T2: 用户反馈新问题                                              │
│     "原修复破坏了限界上下文生成的进度条"                        │
├─────────────────────────────────────────────────────────────────┤
│ T3: 回退 (25e0c66)                                             │
│     回退 005279b，恢复到 6b08d28 状态                           │
├─────────────────────────────────────────────────────────────────┤
│ T4: 用户反馈                                                    │
│     "回退后限界上下文也不显示了"                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、代码分析

### 3.1 当前状态（回退后 25e0c66）

**后端 domain-model/stream 端点** (第 567-573 行):
```typescript
// Send done event
send('done', { 
  domainModels,
  message: '领域模型生成完成'
})
```
**问题**: ❌ 没有返回 `mermaidCode`

**前端 useDomainModelStream**:
```typescript
case 'done':
  const models = Array.isArray(parsedData.domainModels) 
    ? parsedData.domainModels 
    : []
  setDomainModels(models)
  setStatus('done')
  break
```
**问题**: ❌ 没有提取 `mermaidCode`

**前端 HomePage.tsx** (第 142-149 行):
```typescript
useEffect(() => {
  if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
    setDomainModels(streamDomainModels as DomainModel[]);
    setModelMermaidCode(''); // TODO: Generate mermaid code  <-- 永远为空！
    setCurrentStep(3);
    setCompletedStep(3);
  }
}, [modelStreamStatus, streamDomainModels]);
```
**问题**: ❌ `setModelMermaidCode('')` 永远为空字符串

### 3.2 对比: bounded-context/stream（正常工作）

**后端 bounded-context/stream 端点** (第 1186-1189 行):
```typescript
send('done', {
  boundedContexts,
  mermaidCode: generateMermaidCode(boundedContexts)
})
```
**状态**: ✅ 正确返回 `mermaidCode`

**前端 useDDDStream** (第 186-190 行):
```typescript
case 'done':
  const contexts = Array.isArray(parsedData.boundedContexts) 
    ? parsedData.boundedContexts 
    : []
  setContexts(contexts)
  setMermaidCode(parsedData.mermaidCode || '')
  setStatus('done')
  break
```
**状态**: ✅ 正确提取 `mermaidCode`

---

## 四、根因分析

### 4.1 领域模型无渲染的根因

**确认**: 后端 `/ddd/domain-model/stream` 端点的 done 事件未返回 `mermaidCode`。

**证据**:
1. 后端代码第 567-573 行确认只返回 `domainModels` 和 `message`
2. 前端 `useDomainModelStream` 没有提取 `mermaidCode`
3. `HomePage.tsx` 第 147 行硬编码为空字符串

### 4.2 原修复为何破坏限界上下文进度条？

**分析**: 原修复 (005279b) 只修改了领域模型相关代码，理论上不应影响限界上下文生成。

**原修复改动范围**:
| 文件 | 改动 | 影响范围 |
|------|------|----------|
| `ddd.ts` | 第 567-577 行 | 仅 domain-model/stream |
| `useDDDStream.ts` | useDomainModelStream 函数 | 仅领域模型流 |
| `HomePage.tsx` | 第 112-149 行 | 仅领域模型状态同步 |

**可能原因**:
1. **编译/部署问题**: 前端代码可能没有正确编译部署
2. **React 状态问题**: `useDomainModelStream` 的状态变更可能影响了其他 Hook 的渲染
3. **浏览器缓存**: 用户浏览器可能缓存了旧代码

**结论**: 需要进一步调试确认，但代码层面没有直接冲突。

### 4.3 回退后限界上下文不显示的根因

**分析**: 回退后的代码应该恢复到正常状态，限界上下文应该正常显示。

**可能原因**:
1. **部署问题**: 回退后代码可能没有正确部署
2. **浏览器缓存**: 用户浏览器可能缓存了中间状态的代码
3. **服务重启**: 后端服务可能没有正确重启

**验证方法**:
```bash
# 1. 确认当前代码状态
git log --oneline -3

# 2. 检查后端服务状态
curl -X POST http://localhost:3000/api/ddd/bounded-context/stream \
  -H "Content-Type: application/json" \
  -d '{"requirementText": "测试"}'

# 3. 清除浏览器缓存并刷新
```

---

## 五、正确修复方案

### 5.1 后端修改

**文件**: `vibex-backend/src/routes/ddd.ts`

**位置**: 第 567-573 行

```typescript
// 修复前
send('done', { 
  domainModels,
  message: '领域模型生成完成'
})

// 修复后
send('done', { 
  domainModels,
  mermaidCode: generateDomainModelMermaidCode(domainModels, (boundedContexts || []).map(c => ({
    ...c,
    relationships: [],
    description: c.description || ''
  }))),
  message: '领域模型生成完成'
})
```

### 5.2 前端 Hook 修改

**文件**: `vibex-fronted/src/hooks/useDDDStream.ts`

**1. 添加 mermaidCode 状态**:
```typescript
// 在 useDomainModelStream 中添加
const [mermaidCode, setMermaidCode] = useState('')
```

**2. 在 reset/abort 中清空**:
```typescript
setMermaidCode('')
```

**3. 在 done 事件中提取**:
```typescript
case 'done':
  const models = Array.isArray(parsedData.domainModels) 
    ? parsedData.domainModels 
    : []
  setDomainModels(models)
  setMermaidCode(parsedData.mermaidCode || '')  // 添加此行
  setStatus('done')
  break
```

**4. 在返回对象中添加**:
```typescript
return {
  thinkingMessages,
  domainModels,
  mermaidCode,  // 添加此行
  status,
  errorMessage,
  generateDomainModels,
  abort,
  reset,
}
```

**5. 更新类型定义**:
```typescript
export interface UseDomainModelStreamReturn {
  thinkingMessages: ThinkingStep[]
  domainModels: DomainModel[]
  mermaidCode: string  // 添加此行
  status: DomainModelStreamStatus
  errorMessage: string | null
  generateDomainModels: (requirementText: string, boundedContexts?: BoundedContext[]) => void
  abort: () => void
  reset: () => void
}
```

### 5.3 前端 HomePage.tsx 修改

**文件**: `vibex-fronted/src/components/homepage/HomePage.tsx`

```typescript
// 修复前
const {
  thinkingMessages: modelThinkingMessages, domainModels: streamDomainModels,
  status: modelStreamStatus, errorMessage: modelStreamError, generateDomainModels, abort: abortModels,
} = useDomainModelStream();

// 修复后
const {
  thinkingMessages: modelThinkingMessages, domainModels: streamDomainModels,
  mermaidCode: streamModelMermaidCode,  // 添加此行
  status: modelStreamStatus, errorMessage: modelStreamError, generateDomainModels, abort: abortModels,
} = useDomainModelStream();
```

```typescript
// 修复前
useEffect(() => {
  if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
    setDomainModels(streamDomainModels as DomainModel[]);
    setModelMermaidCode(''); // TODO: Generate mermaid code
    setCurrentStep(3);
    setCompletedStep(3);
  }
}, [modelStreamStatus, streamDomainModels]);

// 修复后
useEffect(() => {
  if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
    setDomainModels(streamDomainModels as DomainModel[]);
    setModelMermaidCode(streamModelMermaidCode);  // 使用 hook 返回的 mermaidCode
    setCurrentStep(3);
    setCompletedStep(3);
  }
}, [modelStreamStatus, streamDomainModels, streamModelMermaidCode]);  // 添加依赖
```

---

## 六、验收标准

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| 1 | 限界上下文生成后显示 Mermaid 图表 | 手动测试 |
| 2 | 限界上下文生成过程中显示进度条 | 手动测试 |
| 3 | 领域模型生成后显示 Mermaid 图表 | 手动测试 |
| 4 | 领域模型生成过程中显示进度条 | 手动测试 |
| 5 | 修复不影响现有功能 | 回归测试 |

---

## 七、风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 修复再次破坏限界上下文 | 中 | 分步测试，每次修改后验证 |
| mermaidCode 生成错误 | 低 | 添加 fallback 空字符串 |
| 后端 boundedContexts 为空 | 低 | 使用空数组作为默认值 |

---

## 八、建议执行顺序

1. **先修复前端 Hook** - 添加 `mermaidCode` 支持（无后端依赖）
2. **测试限界上下文功能** - 确认没有被影响
3. **修复后端** - 在 domain-model/stream 端点添加 mermaidCode
4. **修复前端 HomePage.tsx** - 使用 streamModelMermaidCode
5. **端到端测试** - 验证完整流程

---

## 九、知识库记录

**问题编号**: ISSUE-003
**问题名称**: 领域模型生成后 Mermaid 图表不渲染
**根因**: 后端 SSE 端点未返回 mermaidCode，前端未提取
**解决方案**: 添加 mermaidCode 生成和提取逻辑
**关联问题**: 与 bounded-context/stream 的实现模式一致

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-domain-model-mermaid-fix/analysis.md`  
**分析人**: Analyst Agent  
**日期**: 2026-03-16
# 需求分析: 限界上下文渲染和进度条问题

**项目**: vibex-bounded-context-rendering-issues
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 问题概述

| ID | 问题 | 优先级 | 根因 |
|----|------|--------|------|
| P0-1 | 限界上下文请求完成后图没有渲染 | P0 | 状态同步问题 |
| P0-2 | 流程分析按钮无变化 | P0 | 回调未区分步骤 |
| P0-3 | AI思考过程不是渐进式出结果 | P0 | thinkingMessages 未传递 |

---

## 2. 问题分析

### 2.1 P0-1: 限界上下文渲染问题

**现象**: 限界上下文请求完成后，图表没有渲染。

**代码定位**:

`src/components/homepage/hooks/useHomePage.ts` (Lines 112-120):
```typescript
// Sync SSE results - Contexts
useEffect(() => {
  if (streamStatus === 'done') {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    if (streamContexts.length > 0 || streamMermaidCode) {
      setCurrentStep(2);
      setCompletedStep(2);
    }
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

**根因分析**:
- ✅ 状态同步逻辑存在
- ⚠️ 可能是 mermaidCode 为空或渲染失败
- ⚠️ 可能是 SSE 流完成但数据未正确返回

**修复方向**:
- 检查 `streamMermaidCode` 是否正确返回
- 添加调试日志确认数据流

---

### 2.2 P0-2: 流程分析按钮无变化

**现象**: 流程分析按钮没有根据步骤变化。

**代码定位**:

`src/components/homepage/HomePage.tsx` (Lines 60-63):
```typescript
const handleRequirementSubmit = useCallback(() => {
  if (requirementText.trim()) {
    generateContexts(requirementText);  // ⚠️ 始终调用 generateContexts
  }
}, [requirementText, generateContexts]);
```

**根因分析**:
- `handleRequirementSubmit` 始终调用 `generateContexts`
- 未根据 `currentStep` 区分不同的生成操作

**修复方案**:
```typescript
const handleGenerate = useCallback(() => {
  switch (currentStep) {
    case 1:
      generateContexts(requirementText);
      break;
    case 2:
      generateDomainModels(requirementText, boundedContexts);
      break;
    case 3:
      generateBusinessFlow(domainModels);
      break;
    default:
      break;
  }
}, [currentStep, boundedContexts, domainModels, ...]);
```

---

### 2.3 P0-3: AI思考过程不是渐进式

**现象**: 点击上下文分析后，AI思考过程不是渐进式出结果（进度条等请求完成才加载）。

**代码定位**:

1. **useHomePage.ts** (Lines 114-134):
```typescript
const {
  thinkingMessages: _ctxMessages,  // ⚠️ 被丢弃
  contexts: streamContexts,
  mermaidCode: streamMermaidCode,
  status: streamStatus,
  ...
} = useDDDStream();
```

2. **HomePage.tsx** (Line 144):
```typescript
<ThinkingPanel
  thinkingMessages={[]}  // ⚠️ 传递空数组
  status={isGenerating ? 'thinking' : 'idle'}
/>
```

**根因分析**:
- `thinkingMessages` 被解构为 `_ctxMessages`（下划线前缀表示未使用）
- HomePage 传递空的 `thinkingMessages={[]}` 给 ThinkingPanel
- ThinkingPanel 无法显示渐进式思考过程

**修复方案**:
```typescript
// 1. 在 useHomePage 中收集 thinkingMessages
const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);

// 2. 在 SSE 回调中更新
useEffect(() => {
  if (_ctxMessages) {
    setThinkingMessages(_ctxMessages);
  }
}, [_ctxMessages]);

// 3. 传递给组件
<ThinkingPanel
  thinkingMessages={thinkingMessages}
  status={streamStatus === 'thinking' ? 'thinking' : 'idle'}
/>
```

---

## 3. 代码审查发现

### 3.1 状态管理问题

| 位置 | 问题 | 影响 |
|------|------|------|
| useHomePage | thinkingMessages 被丢弃 | 无法显示思考过程 |
| useHomePage | 返回值未包含 thinkingMessages | 上层无法获取 |
| HomePage | 传递空数组给 ThinkingPanel | UI 无法渲染 |

### 3.2 需要传递的 Props

```typescript
// useHomePage 返回值需要包含:
- thinkingMessages: ThinkingStep[]
- currentThinkingStep: number

// HomePage 需要传递给 ThinkingPanel:
<ThinkingPanel
  thinkingMessages={thinkingMessages}  // 当前思考消息
  contexts={boundedContexts}          // 限界上下文
  mermaidCode={currentMermaidCode}  // 当前图表
  status={streamStatus}              // 流状态
  errorMessage={streamError}         // 错误信息
/>
```

---

## 4. 验收标准

### P0-1: 限界上下文渲染

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | 限界上下文生成完成后，图表正确显示 | 功能测试 |
| AC1.2 | 预览区域显示 Mermaid 图表 | 视觉检查 |

### P0-2: 流程按钮

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC2.1 | 步骤1点击"开始生成"调用 generateContexts | 网络请求 |
| AC2.2 | 步骤2点击"继续"调用 generateDomainModels | 网络请求 |
| AC2.3 | 按钮文字/状态根据步骤变化 | 视觉检查 |

### P0-3: 渐进式思考

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC3.1 | 请求过程中显示思考步骤 | 功能测试 |
| AC3.2 | 思考步骤渐进式显示 | 视觉检查 |
| AC3.3 | 完成后思考过程保留 | 视觉检查 |

---

## 5. 预估工时

| 任务 | 工时 |
|------|------|
| 修复 thinkingMessages 传递 | 1h |
| 修复按钮回调区分步骤 | 0.5h |
| 验证渲染和进度条 | 1h |
| **总计** | **2.5h** |

---

## 附录

### A. 相关文件

**需要修改**:
- `src/components/homepage/hooks/useHomePage.ts` - 返回 thinkingMessages
- `src/components/homepage/HomePage.tsx` - 传递正确的 props

### B. ThinkingPanel Props

```typescript
interface ThinkingPanelProps {
  thinkingMessages: ThinkingStep[]  // 需要从 useHomePage 传递
  contexts: BoundedContext[]          // 已有 boundedContexts
  mermaidCode: string                // 已有 currentMermaidCode
  status: DDDStreamStatus            // 需要从 useHomePage 传递
  errorMessage: string | null        // 需要从 useHomePage 传递
}
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-bounded-context-rendering-issues/analysis.md`
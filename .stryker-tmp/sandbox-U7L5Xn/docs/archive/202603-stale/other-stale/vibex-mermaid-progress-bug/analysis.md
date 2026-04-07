# 分析报告：首页 AI 思考过程进度条 67% 与 Mermaid 未渲染问题

**项目**: vibex-mermaid-progress-bug
**分析日期**: 2026-03-16
**分析师**: Analyst Agent
**状态**: 完成

---

## 一、执行摘要

**问题现象**：
1. 首页生成限界上下文后，AI 思考过程进度条停留在 67%
2. Mermaid 图表未渲染

**根因分析**：

| 问题 | 根因 | 影响 |
|------|------|------|
| 进度条 67% | `ThinkingPanel` 的 `totalSteps` 硬编码为 3，但后端可能只发送 2 个 thinking 事件 | 用户误以为生成未完成 |
| Mermaid 未渲染 | 需要进一步确认：可能是 SSE 数据同步时序问题或空值检查问题 | 用户看不到图表 |

---

## 二、问题详细分析

### 2.1 进度条 67% 问题

**代码位置**: `ThinkingPanel.tsx`

```tsx
// Progress calculation
const totalSteps = 3 // analyzing, identifying-core, calling-ai
const currentStepIndex = displayedSteps.length > 0 
  ? Math.min(displayedSteps.length - 1, totalSteps - 1) 
  : -1
const progressPercent = currentStepIndex >= 0 
  ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) 
  : 0

// 渲染时
style={{ width: status === 'done' ? '100%' : `${progressPercent}%` }}
```

**问题分析**：
- 当 `status === 'done'` 时，进度条确实会显示 100%
- 但在 SSE 完成瞬间，如果 `displayedSteps.length = 2`，则 `progressPercent = 67%`
- 如果后端只发送 2 个 thinking 事件（而非 3 个），则进度永远到不了 100%

**后端发送的 thinking 事件**（`ddd.ts` Line ~690-710）:
```typescript
send('thinking', { step: 'analyzing', message: '正在分析需求...' })
send('thinking', { step: 'using-plan', message: '基于 Plan 分析结果生成上下文...' })
// 或
send('thinking', { step: 'identifying-core', message: '识别核心领域...' })
send('thinking', { step: 'calling-ai', message: '调用 AI 分析...' })
```

**实际发送的 thinking 事件数量**：2 或 3 个，取决于代码路径

### 2.2 Mermaid 未渲染问题

**可能原因**：

#### 原因 A: 空值检查过严

`HomePage.tsx` 同步 useEffect:
```tsx
useEffect(() => {
  if (streamStatus === 'done' && streamContexts.length > 0) {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    // ...
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

**问题**：如果 `streamContexts.length === 0`（AI 返回空结果），则 `contextMermaidCode` 不会被设置。

#### 原因 B: 预览区域使用空值

```tsx
const previewMermaidCode = activeStream?.mermaidCode || getCurrentMermaidCode();

return previewMermaidCode ? (
  <MermaidPreview code={previewMermaidCode} ... />
) : (
  <div className={styles.previewEmpty}>...</div>
);
```

如果 `mermaidCode` 为空字符串，`previewMermaidCode` 为 falsy，显示空状态。

#### 原因 C: useDomainModelStream 未返回 mermaidCode

之前的分析发现 `useDomainModelStream` hook 的 `done` 事件处理没有设置 `mermaidCode`：

```tsx
// useDDDStream.ts - useDomainModelStream
case 'done':
  const models = Array.isArray(parsedData.domainModels) 
    ? parsedData.domainModels 
    : []
  setDomainModels(models)
  setStatus('done')
  // ❌ 没有设置 mermaidCode！
```

**但这个问题应该在之前的 `vibex-domain-model-not-rendering` 项目中已修复。**

---

## 三、解决方案

### 3.1 进度条修复（推荐）

**方案 A**: 动态计算 `totalSteps`

```tsx
// 修复前
const totalSteps = 3;

// 修复后
const totalSteps = Math.max(displayedSteps.length, 3);
// 或者更准确：基于实际步骤数计算
```

**方案 B**: 依赖 status 而非 steps 数量

```tsx
// 进度计算
const getProgressPercent = () => {
  if (status === 'done') return 100;
  if (status === 'error') return 0;
  if (displayedSteps.length === 0) return 0;
  return Math.min((displayedSteps.length / 3) * 100, 99); // 最多 99%，完成时才 100%
};
```

### 3.2 Mermaid 未渲染修复

**修复点 1**: 放宽空值检查

```tsx
// 修复前
if (streamStatus === 'done' && streamContexts.length > 0) {

// 修复后
if (streamStatus === 'done') {  // 移除 streamContexts.length > 0 条件
```

**修复点 2**: 确保 hook 返回 mermaidCode

检查 `useDDDStream.ts` 中所有 hook 的 `done` 事件处理，确保都设置了 `mermaidCode`：

```tsx
case 'done':
  setDomainModels(models);
  setMermaidCode(parsedData.mermaidCode || '');  // ✅ 确保设置
  setStatus('done');
  break;
```

---

## 四、验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| AC1 | 生成完成后进度条显示 100% | 手动测试 |
| AC2 | 生成完成后 Mermaid 图表正确渲染 | 手动测试 |
| AC3 | 空结果时显示友好提示 | 模拟空结果测试 |
| AC4 | 错误时进度条重置 | 模拟错误测试 |

---

## 五、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 修复影响其他页面 | 低 | 中 | 完整回归测试 |
| 空值检查过松导致其他问题 | 低 | 中 | 添加日志验证 |

---

## 六、相关文件

**需要修改的文件**：
1. `vibex-fronted/src/components/ui/ThinkingPanel.tsx` - 进度计算
2. `vibex-fronted/src/hooks/useDDDStream.ts` - 确保所有 hook 返回 mermaidCode
3. `vibex-fronted/src/components/homepage/HomePage.tsx` - 同步条件检查

---

## 七、后续建议

1. **统一进度计算逻辑**：考虑将进度计算提取为独立 hook
2. **添加调试日志**：在 SSE 事件处理中添加日志，便于排查
3. **E2E 测试**：添加首页生成流程的端到端测试

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-mermaid-progress-bug/analysis.md`
**分析师**: Analyst Agent
**日期**: 2026-03-16
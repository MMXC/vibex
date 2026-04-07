# 领域模型 Mermaid 实时渲染切换问题分析

**项目**: vibex-domain-model-mermaid-render  
**分析师**: Analyst Agent  
**日期**: 2026-03-16  
**状态**: ✅ 分析完成

---

## 执行摘要

**问题**: 领域模型生成时，预览区 Mermaid 图表未从限界上下文图表切换到领域模型图表。

**根因**: 预览区 `MermaidPreview` 使用 `getCurrentMermaidCode()` 函数，该函数基于 `currentStep` 返回静态状态，而非 SSE 流式数据。

**影响范围**: 领域模型生成阶段、业务流程生成阶段的实时预览。

**推荐方案**: 预览区使用与 ThinkingPanel 相同的 `getActiveStreamData()` 逻辑获取 mermaidCode。

---

## 一、问题定位

### 1.1 问题现象

| 阶段 | SSE 状态 | currentStep | 预期显示 | 实际显示 | 状态 |
|------|----------|-------------|----------|----------|------|
| 限界上下文生成中 | `streamStatus='thinking'` | 1 | 限界上下文图 | 空（等待完成） | ⚠️ 非实时 |
| 限界上下文完成 | `streamStatus='done'` | 2 | 限界上下文图 | 限界上下文图 | ✅ |
| 领域模型生成中 | `modelStreamStatus='thinking'` | 2 | 领域模型图 | 限界上下文图 | ❌ 未切换 |
| 领域模型完成 | `modelStreamStatus='done'` | 3 | 领域模型图 | 领域模型图 | ✅ |
| 业务流程生成中 | `flowStreamStatus='thinking'` | 3 | 业务流程图 | 领域模型图 | ❌ 未切换 |

### 1.2 代码分析

**文件**: `src/components/homepage/HomePage.tsx`

#### 预览区渲染（问题代码）

```typescript
// 第 361 行 - 预览区 MermaidPreview
<MermaidPreview 
  code={getCurrentMermaidCode()}  // ❌ 使用静态状态
  diagramType="flowchart" 
  layout="TB" 
  height="60%" 
/>
```

```typescript
// 第 304-312 行 - getCurrentMermaidCode 函数
const getCurrentMermaidCode = () => {
  switch (currentStep) {
    case 1: return mermaidCode;           // 空（需求输入阶段无图）
    case 2: return contextMermaidCode;    // 限界上下文图
    case 3: return modelMermaidCode;      // 领域模型图
    case 4: return flowMermaidCode;       // 业务流程图
    default: return '';
  }
};
```

#### ThinkingPanel 渲染（正确实现）

```typescript
// 第 468-479 行 - ThinkingPanel 使用 activeStream
const activeStream = getActiveStreamData(
  { messages: thinkingMessages, contexts: streamContexts, mermaid: streamMermaidCode, status: streamStatus, ... },
  { messages: modelThinkingMessages, mermaid: streamModelMermaidCode, status: modelStreamStatus, ... },
  { messages: flowThinkingMessages, mermaid: streamFlowMermaidCode, status: flowStreamStatus, ... }
);

if (activeStream) {
  return (
    <ThinkingPanel
      mermaidCode={activeStream.mermaidCode}  // ✅ 使用 SSE 流式数据
      ...
    />
  );
}
```

### 1.3 问题根源

**双重渲染逻辑**：

| 组件 | 数据来源 | 状态 |
|------|----------|------|
| MermaidPreview（预览区） | `getCurrentMermaidCode()` → 静态状态 | ❌ 问题 |
| ThinkingPanel（右侧面板） | `getActiveStreamData()` → SSE 流式数据 | ✅ 正确 |

预览区没有使用 SSE 流式数据，导致：
1. SSE 生成过程中，预览区显示的是上一步完成的图表
2. 只有当 SSE 完成后，`setCurrentStep(N)` 触发，`getCurrentMermaidCode()` 才返回新图表

---

## 二、解决方案

### 2.1 方案 A：统一使用 activeStream（推荐）

**修改思路**：预览区也使用 `getActiveStreamData()` 获取 mermaidCode。

```typescript
// 修改预览区渲染逻辑
{(() => {
  const activeStream = getActiveStreamData(
    { messages: thinkingMessages, contexts: streamContexts, mermaid: streamMermaidCode, status: streamStatus, ... },
    { messages: modelThinkingMessages, mermaid: streamModelMermaidCode, status: modelStreamStatus, ... },
    { messages: flowThinkingMessages, mermaid: streamFlowMermaidCode, status: flowStreamStatus, ... }
  );
  
  const displayMermaidCode = activeStream?.mermaidCode || getCurrentMermaidCode();
  
  return displayMermaidCode ? (
    <MermaidPreview code={displayMermaidCode} ... />
  ) : (
    <div className={styles.previewEmpty}>...</div>
  );
})()}
```

### 2.2 方案 B：抽取共享函数

```typescript
// 新增函数
const getDisplayMermaidCode = useCallback(() => {
  // 优先使用 SSE 流式数据
  if (streamStatus !== 'idle') return streamMermaidCode;
  if (modelStreamStatus !== 'idle') return streamModelMermaidCode;
  if (flowStreamStatus !== 'idle') return streamFlowMermaidCode;
  
  // SSE 完成后使用静态状态
  return getCurrentMermaidCode();
}, [streamStatus, streamMermaidCode, modelStreamStatus, streamModelMermaidCode, 
    flowStreamStatus, streamFlowMermaidCode, currentStep]);
```

### 2.3 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A: 统一 activeStream | 与 ThinkingPanel 逻辑一致 | 需要重构渲染逻辑 | ⭐⭐⭐⭐⭐ |
| B: 新增函数 | 改动最小 | 需要同步两处逻辑 | ⭐⭐⭐⭐ |

**推荐方案 A**，逻辑统一，易于维护。

---

## 三、影响范围

### 3.1 直接影响

| 功能 | 影响程度 | 说明 |
|------|----------|------|
| 领域模型实时预览 | 🔴 高 | SSE 过程中不切换 |
| 业务流程实时预览 | 🔴 高 | SSE 过程中不切换 |
| 限界上下文实时预览 | 🟡 中 | SSE 过程中显示空状态 |
| ThinkingPanel | ✅ 无影响 | 已使用正确逻辑 |

### 3.2 关联组件

| 组件 | 文件 | 是否受影响 |
|------|------|------------|
| ThinkingPanel | HomePage.tsx | ❌ 不受影响 |
| /confirm 页面 | confirm/page.tsx | ❌ 不受影响 |
| PreviewCanvas | PreviewCanvas.tsx | ⚠️ 可能需要检查 |

---

## 四、验收标准

### 4.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| DM-001 | 领域模型生成时，预览区从限界上下文图切换到领域模型图 | 手动测试：生成限界上下文 → 点击"生成领域模型" → 验证预览切换 |
| DM-002 | SSE 流式返回时，预览区实时更新 | 手动测试：观察 SSE 过程中的渲染 |
| DM-003 | 业务流程生成时，预览区从领域模型图切换到业务流程图 | 手动测试：生成领域模型 → 点击"生成业务流程" → 验证预览切换 |
| DM-004 | SSE 完成后，图表正确显示 | 手动测试：等待完成 → 验证最终图表 |
| DM-005 | ThinkingPanel 不受影响 | 手动测试：验证右侧面板显示正常 |

---

## 五、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | 分析问题、定位根因 | 0.5h |
| 2 | 实现方案 A（统一 activeStream 逻辑） | 1h |
| 3 | 测试验证（三个 SSE 场景） | 1h |
| **总计** | | **2.5h** |

---

## 六、风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 预览闪烁 | 低 | 低 | 添加过渡动画 |
| 状态竞争 | 低 | 中 | 确保状态更新顺序正确 |
| 回归问题 | 低 | 中 | 完整测试三个 SSE 场景 |

---

## 七、下一步行动

1. **Dev**: 修改预览区渲染逻辑，使用 `getActiveStreamData()` 
2. **Tester**: 验证三个 SSE 场景的实时预览切换
3. **Reviewer**: 代码审查

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-domain-model-mermaid-render/analysis.md`
# 首页 ThinkingPanel 修复需求分析

**项目**: vibex-homepage-thinking-panel-fix  
**分析师**: Analyst Agent  
**日期**: 2026-03-16  
**状态**: ✅ 分析完成

---

## 执行摘要

**问题定位**：首页 `ThinkingPanel` 组件在 AI 思考过程显示时存在逻辑错误，导致限界上下文和领域模型生成过程中的思考消息无法正确显示。

**根因**：`thinkingMessages` 的显示条件基于 `currentStep` 而非实际的 SSE 状态，导致在生成过程中显示错误的思考消息。

**推荐方案**：修改 `ThinkingPanel` 的 props 计算逻辑，基于 SSE 状态而非 `currentStep` 来选择正确的思考消息。

---

## 一、问题诊断

### 1.1 当前实现分析

**位置**：`src/components/homepage/HomePage.tsx`

```typescript
// 当前实现 (有问题)
<ThinkingPanel
  thinkingMessages={currentStep === 2 ? thinkingMessages : currentStep === 3 ? modelThinkingMessages : flowThinkingMessages}
  status={currentStep === 2 ? streamStatus : currentStep === 3 ? modelStreamStatus : flowStreamStatus}
  ...
/>
```

**显示条件**：
```typescript
{streamStatus !== 'idle' || modelStreamStatus !== 'idle' || flowStreamStatus !== 'idle' ? (
  <ThinkingPanel ... />
) : (
  <div className={styles.aiHeader}>AI 设计助手</div>
)}
```

### 1.2 问题场景

| 场景 | currentStep | SSE 状态 | 预期显示 | 实际显示 | 问题 |
|------|-------------|----------|----------|----------|------|
| 点击"开始生成" | 1 | `streamStatus='thinking'` | `thinkingMessages` | `flowThinkingMessages` (空) | ❌ 错误 |
| 限界上下文生成中 | 1 → 2 | `streamStatus='thinking'` | `thinkingMessages` | `flowThinkingMessages` (空) | ❌ 错误 |
| 限界上下文完成 | 2 | `streamStatus='done'` | 正确的 `contexts` | 正确 | ✅ |
| 点击"生成领域模型" | 2 | `modelStreamStatus='thinking'` | `modelThinkingMessages` | `modelThinkingMessages` | ✅ |
| 领域模型生成中 | 2 → 3 | `modelStreamStatus='thinking'` | `modelThinkingMessages` | `modelThinkingMessages` | ✅ |
| 点击"生成业务流程" | 3 | `flowStreamStatus='thinking'` | `flowThinkingMessages` | `flowThinkingMessages` | ✅ |

### 1.3 根因分析

**问题根源**：
```typescript
thinkingMessages={currentStep === 2 ? thinkingMessages : currentStep === 3 ? modelThinkingMessages : flowThinkingMessages}
```

这个条件表达式基于 `currentStep` 而非实际的 SSE 状态：

1. **当 `currentStep === 1` 且 `streamStatus === 'thinking'`**：
   - 预期：显示 `thinkingMessages`（限界上下文思考过程）
   - 实际：条件 `currentStep === 2` 为 false，`currentStep === 3` 为 false，返回 `flowThinkingMessages`（空数组）

2. **当 `currentStep === 2` 且 `streamStatus === 'thinking'`**：
   - 预期：显示 `thinkingMessages`
   - 实际：正确显示

---

## 二、解决方案

### 2.1 方案 A：基于 SSE 状态选择（推荐）

**修改思路**：根据哪个 SSE 正在运行来选择对应的思考消息，而非基于 `currentStep`。

```typescript
// 计算当前活动的思考消息
const getActiveThinkingProps = () => {
  // 优先级：限界上下文 > 领域模型 > 业务流程
  if (streamStatus !== 'idle') {
    return {
      thinkingMessages: thinkingMessages,
      contexts: streamContexts,
      mermaidCode: streamMermaidCode,
      status: streamStatus,
      errorMessage: streamError,
      onAbort: abortContexts,
      onRetry: handleGenerate,
    };
  }
  
  if (modelStreamStatus !== 'idle') {
    return {
      thinkingMessages: modelThinkingMessages,
      contexts: undefined,
      mermaidCode: modelMermaidCode,
      status: modelStreamStatus,
      errorMessage: modelStreamError,
      onAbort: abortModels,
      onRetry: handleGenerateDomainModel,
    };
  }
  
  if (flowStreamStatus !== 'idle') {
    return {
      thinkingMessages: flowThinkingMessages,
      contexts: undefined,
      mermaidCode: flowMermaidCode,
      status: flowStreamStatus,
      errorMessage: flowStreamError,
      onAbort: abortFlow,
      onRetry: handleGenerateBusinessFlow,
    };
  }
  
  return null;
};

// 使用
const activeProps = getActiveThinkingProps();
{activeProps ? (
  <ThinkingPanel {...activeProps} onUseDefault={handleGenerate} />
) : (
  <div className={styles.aiHeader}>...</div>
)}
```

### 2.2 方案 B：修改条件顺序

保持原有结构，但调整条件逻辑：

```typescript
<ThinkingPanel
  thinkingMessages={
    streamStatus !== 'idle' ? thinkingMessages :
    modelStreamStatus !== 'idle' ? modelThinkingMessages :
    flowThinkingMessages
  }
  status={
    streamStatus !== 'idle' ? streamStatus :
    modelStreamStatus !== 'idle' ? modelStreamStatus :
    flowStreamStatus
  }
  // ... 其他 props 类似
/>
```

### 2.3 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A: 基于 SSE 状态 | 逻辑清晰、易维护、可扩展 | 需要提取函数 | ⭐⭐⭐⭐⭐ |
| B: 修改条件顺序 | 改动最小 | 条件重复、可读性差 | ⭐⭐⭐ |

**推荐方案 A**。

---

## 三、关于 /confirm 页面

### 3.1 当前状态

`/confirm` 页面存在以下功能：
- ThinkingPanel 集成
- ConfirmationSteps 组件
- 模板选择器
- 传统 API 回退逻辑

### 3.2 与首页的关系

| 功能 | 首页 | /confirm |
|------|------|----------|
| 需求输入 | ✅ | ✅ |
| ThinkingPanel | ✅ | ✅ |
| 五步流程 | ✅ (内联状态) | ✅ (跨页面) |
| SSE 流式生成 | ✅ | ✅ |
| 状态管理 | 组件内部 | Zustand Store |

### 3.3 建议

**不建议删除 `/confirm` 页面**，原因：

1. **历史兼容**：可能有用户收藏或外部链接指向 `/confirm`
2. **功能差异**：`/confirm` 使用 `confirmationStore` 全局状态，支持跨页面流程
3. **回退方案**：可作为 SSE 失败时的传统 API 入口

**建议**：
- 保留 `/confirm` 页面
- 在首页添加导航提示，引导用户使用首页单页流程
- 监控两个页面的使用量，后续决定是否下线

---

## 四、验收标准

### 4.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| TP-001 | 点击"开始生成"后，ThinkingPanel 正确显示限界上下文思考过程 | 手动测试：输入需求 → 点击生成 → 验证右侧面板 |
| TP-002 | 限界上下文生成完成后，ThinkingPanel 显示正确的上下文列表 | 手动测试：等待完成 → 验证 contexts 显示 |
| TP-003 | 点击"生成领域模型"后，ThinkingPanel 正确显示领域模型思考过程 | 手动测试：点击下一步按钮 → 验证思考消息 |
| TP-004 | 点击"生成业务流程"后，ThinkingPanel 正确显示业务流程思考过程 | 手动测试：点击下一步按钮 → 验证思考消息 |
| TP-005 | 中止功能正常工作 | 手动测试：生成中点击中止 → 验证停止 |

### 4.2 单元测试

```typescript
describe('HomePage ThinkingPanel', () => {
  it('限界上下文生成时显示正确的思考消息', () => {
    // 模拟 streamStatus = 'thinking'
    // 验证 thinkingMessages 显示
  });

  it('领域模型生成时显示正确的思考消息', () => {
    // 模拟 modelStreamStatus = 'thinking'
    // 验证 modelThinkingMessages 显示
  });

  it('业务流程生成时显示正确的思考消息', () => {
    // 模拟 flowStreamStatus = 'thinking'
    // 验证 flowThinkingMessages 显示
  });
});
```

---

## 五、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | 分析问题、定位根因 | 0.5h |
| 2 | 实现方案 A（提取 getActiveThinkingProps） | 1h |
| 3 | 测试验证 | 0.5h |
| **总计** | | **2h** |

---

## 六、风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 修改影响其他步骤 | 低 | 中 | 充分测试三个步骤 |
| SSE 状态竞争 | 低 | 低 | 确保只有一个 SSE 同时运行 |
| 样式问题 | 低 | 低 | 验证响应式布局 |

---

## 七、下一步行动

1. **Dev**: 实现 `getActiveThinkingProps` 函数
2. **Tester**: 验证三个步骤的思考过程显示
3. **Reviewer**: 代码审查

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-thinking-panel-fix/analysis.md`
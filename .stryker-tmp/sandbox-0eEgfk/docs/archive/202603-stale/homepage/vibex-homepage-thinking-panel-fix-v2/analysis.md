# 分析报告：首页 AI 思考过程显示问题

**项目**: vibex-homepage-thinking-panel-fix-v2
**分析日期**: 2026-03-16
**分析师**: Analyst Agent
**状态**: 完成

---

## 一、执行摘要

**问题根因**：ThinkingPanel 的消息选择逻辑基于 `currentStep` 而非实际 SSE 状态，导致 Step 1 生成限界上下文时显示错误的消息。

| 问题点 | 当前实现 | 正确实现 |
|--------|----------|----------|
| 消息选择 | 基于 `currentStep` | 基于活跃的 SSE Hook |
| 显示条件 | 混合 currentStep 和 SSE 状态 | 仅基于 SSE 状态 |
| 行为 | Step 1 → 显示 flowThinkingMessages | Step 1 → 显示 thinkingMessages |

**影响范围**：
- 用户在 Step 1 点击"开始生成"后，AI 思考面板显示错误的步骤信息
- 严重破坏用户体验，导致用户困惑

---

## 二、问题定义

### 2.1 用户场景

```
用户操作流程：
1. 进入首页 (currentStep = 1)
2. 输入需求描述
3. 点击"🚀 开始生成"按钮
4. 期望：右侧 AI 面板显示"正在分析需求..."等限界上下文生成过程
5. 实际：显示业务流程的消息或不显示任何内容
```

### 2.2 问题边界

| 维度 | 说明 |
|------|------|
| 涉及页面 | 首页 (HomePage.tsx) |
| 涉及组件 | ThinkingPanel, useDDDStream hooks |
| 触发条件 | 在 Step 1 点击"开始生成" |
| 影响用户 | 所有使用首页生成功能的用户 |

### 2.3 严重程度

**P0** - 阻塞核心流程，用户无法看到 AI 分析过程

---

## 三、代码分析

### 3.1 问题代码定位

**文件**: `HomePage.tsx` (Line 378-386)

```tsx
<ThinkingPanel
  thinkingMessages={currentStep === 2 ? thinkingMessages : currentStep === 3 ? modelThinkingMessages : flowThinkingMessages}
  contexts={currentStep === 2 ? streamContexts : undefined}
  mermaidCode={currentStep === 2 ? streamMermaidCode : currentStep === 3 ? modelMermaidCode : flowMermaidCode}
  status={currentStep === 2 ? streamStatus : currentStep === 3 ? modelStreamStatus : flowStreamStatus}
  errorMessage={currentStep === 2 ? streamError : currentStep === 3 ? modelStreamError : flowStreamError}
  onAbort={currentStep === 2 ? abortContexts : currentStep === 3 ? abortModels : abortFlow}
  onRetry={...}
/>
```

### 3.2 逻辑错误分析

#### 当前逻辑映射表

| currentStep | thinkingMessages 来源 | status 来源 | 实际生成内容 |
|-------------|----------------------|-------------|--------------|
| 1 | `flowThinkingMessages` ❌ | `flowStreamStatus` ❌ | 限界上下文 |
| 2 | `thinkingMessages` ✅ | `streamStatus` ✅ | 领域模型 |
| 3 | `modelThinkingMessages` ✅ | `modelStreamStatus` ✅ | 业务流程 |
| 4+ | `flowThinkingMessages` | `flowStreamStatus` | 无 |

**核心问题**：
- Step 1 时生成的是限界上下文（使用 `useDDDStream` hook）
- 但 ThinkingPanel 显示的是 `flowThinkingMessages` 和 `flowStreamStatus`（业务流程的数据）
- 导致消息和状态完全不匹配

### 3.3 SSE Hook 与 Step 的对应关系

| Hook | 功能 | 触发按钮位置 | 应显示的 Step |
|------|------|-------------|---------------|
| `useDDDStream` | 限界上下文生成 | Step 1 "开始生成" | Step 1 → Step 2 |
| `useDomainModelStream` | 领域模型生成 | Step 2 "生成领域模型" | Step 2 → Step 3 |
| `useBusinessFlowStream` | 业务流程生成 | Step 3 "生成业务流程" | Step 3 → Step 4 |

### 3.4 根因总结

```
问题根源：消息选择逻辑与 SSE 状态解耦

正确逻辑应该是：
- 哪个 SSE Hook 处于活跃状态 (status === 'thinking')，就显示哪个 Hook 的消息
- 而不是根据 currentStep 来选择消息

当前逻辑：
thinkingMessages = currentStep === 2 ? thinkingMessages : ...
                              ↑
                          这个条件是错误的！

正确逻辑：
thinkingMessages = streamStatus === 'thinking' ? thinkingMessages : 
                   modelStreamStatus === 'thinking' ? modelThinkingMessages : 
                   flowStreamStatus === 'thinking' ? flowThinkingMessages : []
```

---

## 四、解决方案

### 4.1 方案 A：基于 SSE 状态选择消息（推荐）

**核心改动**：将消息选择逻辑从 `currentStep` 改为基于实际的 SSE 状态。

```tsx
// 修复后的代码
function getActiveStreamData() {
  // 优先级：限界上下文 > 领域模型 > 业务流程
  if (streamStatus !== 'idle') {
    return {
      thinkingMessages,
      contexts: streamContexts,
      mermaidCode: streamMermaidCode,
      status: streamStatus,
      errorMessage: streamError,
      onAbort: abortContexts,
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
    };
  }
  return null;
}

const activeStream = getActiveStreamData();

// 在 JSX 中
{activeStream ? (
  <ThinkingPanel
    thinkingMessages={activeStream.thinkingMessages}
    contexts={activeStream.contexts}
    mermaidCode={activeStream.mermaidCode}
    status={activeStream.status}
    errorMessage={activeStream.errorMessage}
    onAbort={activeStream.onAbort}
    onRetry={...}
  />
) : (
  <div className={styles.aiHeader}>...</div>
)}
```

**优点**：
- 逻辑清晰，消息与实际状态一致
- 易于维护和扩展
- 解决根本问题

**工作量**：1-2 小时

### 4.2 方案 B：调整 currentStep 映射

**核心改动**：调整条件判断，使 Step 1 也使用限界上下文的消息。

```tsx
thinkingMessages={
  currentStep === 1 || currentStep === 2 ? thinkingMessages : 
  currentStep === 3 ? modelThinkingMessages : 
  flowThinkingMessages
}
```

**优点**：改动最小
**缺点**：治标不治本，未来可能有其他边界情况

---

## 五、推荐方案

**推荐方案 A**，理由：

1. **根治问题**：基于实际 SSE 状态而非 UI 状态选择消息
2. **可扩展**：未来添加新的生成步骤时不会出现类似问题
3. **可维护**：逻辑集中，易于理解

---

## 六、验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| AC1 | Step 1 点击"开始生成"后显示正确的限界上下文分析消息 | 手动测试 |
| AC2 | Step 2 点击"生成领域模型"后显示正确的领域模型消息 | 手动测试 |
| AC3 | Step 3 点击"生成业务流程"后显示正确的业务流程消息 | 手动测试 |
| AC4 | SSE 完成后状态正确切换 | E2E 测试 |
| AC5 | 错误状态正确显示 | 手动测试（模拟 API 失败） |

---

## 七、测试用例

### 7.1 手动测试步骤

```gherkin
Scenario: Step 1 生成限界上下文显示正确消息
  Given 用户在首页 Step 1
  When 用户输入需求并点击"开始生成"
  Then 右侧 AI 面板应显示"正在分析需求..."
  And 显示的步骤应该是"分析需求"、"识别核心领域"等
  When SSE 完成
  Then 状态应变为"已完成"
  And currentStep 应切换到 2

Scenario: Step 2 生成领域模型显示正确消息
  Given 用户在首页 Step 2，已有限界上下文
  When 用户点击"生成领域模型"
  Then 右侧 AI 面板应显示领域模型生成的消息
  When SSE 完成
  Then currentStep 应切换到 3
```

### 7.2 E2E 测试代码

```typescript
// e2e/thinking-panel.spec.ts
test('Step 1 生成限界上下文时应显示正确的消息', async ({ page }) => {
  await page.goto('/');
  
  // 输入需求
  await page.fill('[data-testid="requirement-input"]', '开发一个电商系统');
  
  // 点击生成
  await page.click('button:has-text("开始生成")');
  
  // 验证 AI 面板显示
  await expect(page.locator('.thinkingPanel')).toBeVisible();
  await expect(page.locator('text=正在分析需求')).toBeVisible();
  
  // 等待完成
  await expect(page.locator('.doneBadge')).toBeVisible({ timeout: 30000 });
});
```

---

## 八、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 修改影响其他步骤显示 | 低 | 中 | 完整回归测试 |
| 多个 SSE 同时活跃 | 低 | 中 | 添加互斥逻辑 |

---

## 九、相关文件

**需要修改的文件**：
1. `vibex-fronted/src/components/homepage/HomePage.tsx` - 消息选择逻辑

**不需要修改**：
- `ThinkingPanel.tsx` - 组件本身无问题
- `useDDDStream.ts` 等 hooks - 数据源无问题

---

## 十、下一步行动

1. **立即修复**：采用方案 A 重构消息选择逻辑
2. **测试验证**：执行手动测试和 E2E 测试
3. **代码审查**：确保修改符合代码规范

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-thinking-panel-fix-v2/analysis.md`
**分析师**: Analyst Agent
**日期**: 2026-03-16
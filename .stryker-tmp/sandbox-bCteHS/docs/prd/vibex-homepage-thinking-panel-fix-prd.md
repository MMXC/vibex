# Product Requirements Document: 首页 ThinkingPanel 修复

**项目**: vibex-homepage-thinking-panel-fix  
**版本**: 1.0  
**PM**: PM Agent  
**日期**: 2026-03-16  
**状态**: Draft

---

## 1. Problem Statement

首页 `ThinkingPanel` 组件在 AI 思考过程显示时存在逻辑错误。当前实现基于 `currentStep` 而非实际的 SSE 状态来选择思考消息，导致以下问题：

- 点击"开始生成"后，界上下文思考过程无法正确显示
- 限界上下文生成中的思考消息显示为空
- 用户无法看到 AI 正在思考的实时反馈

---

## 2. Success Metrics

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 思考过程显示正确率 | 100% | 三个步骤测试通过 |
| 回归问题 | 0 个 | 现有功能不受影响 |
| 实现工时 | ≤ 2h | 实际开发时间 |

---

## 3. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1 | 用户 | 点击"开始生成"后看到 AI 思考限界上下文的过程 | 我能了解 AI 正在分析我的需求 |
| US2 | 用户 | 点击"生成领域模型"后看到 AI 思考领域模型的过程 | 我能了解 AI 正在构建领域模型 |
| US3 | 用户 | 点击"生成业务流程"后看到 AI 思考业务流程的过程 | 我能了解 AI 正在设计业务流程 |
| US4 | 用户 | 在生成过程中能随时中止 | 我可以取消不满意的生成任务 |
| US5 | 用户 | 生成失败时能看到错误信息 | 我知道发生了什么问题并可以重试 |

---

## 4. Epics Breakdown

### Epic 1: ThinkingPanel 状态选择逻辑重构

**目标**: 提取 `getActiveThinkingProps` 函数，基于 SSE 状态而非 `currentStep` 选择思考消息

** Stories**:
- US1, US2, US3, US4, US5

**验收标准**:
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | `streamStatus !== 'idle'` | 任何时刻 | ThinkingPanel 显示 `thinkingMessages` 和相关状态 |
| AC1.2 | `modelStreamStatus !== 'idle'` | 任何时刻 | ThinkingPanel 显示 `modelThinkingMessages` 和相关状态 |
| AC1.3 | `flowStreamStatus !== 'idle'` | 任何时刻 | ThinkingPanel 显示 `flowThinkingMessages` 和相关状态 |
| AC1.4 | 所有 SSE 状态为 `idle` | 任何时刻 | 显示 "AI 设计助手" 而非 ThinkingPanel |

---

### Epic 2: 限界上下文思考过程显示

**目标**: 修复点击"开始生成"后限界上下文思考过程的显示

** Stories**:
- US1, US4, US5

**验收标准**:
| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | 用户输入需求后点击"开始生成" | `streamStatus === 'thinking'` | ThinkingPanel 正确显示 `thinkingMessages` |
| AC2.2 | 限界上下文生成完成 | `streamStatus === 'done'` | 显示正确的 contexts 列表 |
| AC2.3 | 用户点击中止 | 生成中点击中止按钮 | SSE 请求中止，状态更新 |
| AC2.4 | 生成失败 | `streamStatus === 'error'` | 显示错误信息和重试按钮 |

---

### Epic 3: 领域模型思考过程显示

**目标**: 修复点击"生成领域模型"后领域模型思考过程的显示

** Stories**:
- US2, US4, US5

**验收标准**:
| ID | Given | When | Then |
|----|-------|------|------|
| AC3.1 | 限界上下文完成后点击"生成领域模型" | `modelStreamStatus === 'thinking'` | ThinkingPanel 正确显示 `modelThinkingMessages` |
| AC3.2 | 领域模型生成完成 | `modelStreamStatus === 'done'` | 显示正确的 mermaid 代码 |
| AC3.3 | 用户点击中止 | 生成中点击中止按钮 | SSE 请求中止，状态更新 |
| AC3.4 | 生成失败 | `modelStreamStatus === 'error'` | 显示错误信息和重试按钮 |

---

### Epic 4: 业务流程思考过程显示

**目标**: 修复点击"生成业务流程"后业务流程思考过程的显示

** Stories**:
- US3, US4, US5

**验收标准**:
| ID | Given | When | Then |
|----|-------|------|------|
| AC4.1 | 领域模型完成后点击"生成业务流程" | `flowStreamStatus === 'thinking'` | ThinkingPanel 正确显示 `flowThinkingMessages` |
| AC4.2 | 业务流程生成完成 | `flowStreamStatus === 'done'` | 显示正确的 mermaid 代码 |
| AC4.3 | 用户点击中止 | 生成中点击中止按钮 | SSE 请求中止，状态更新 |
| AC4.4 | 生成失败 | `flowStreamStatus === 'error'` | 显示错误信息和重试按钮 |

---

### Epic 5: 测试验证

**目标**: 确保修改不影响现有功能，完成回归测试

** Stories**:
- US1, US2, US3, US4, US5

**验收标准**:
| ID | Given | When | Then |
|----|-------|------|------|
| AC5.1 | 限界上下文生成 | 手动测试 | TP-001, TP-002 通过 |
| AC5.2 | 领域模型生成 | 手动测试 | TP-003 通过 |
| AC5.3 | 业务流程生成 | 手动测试 | TP-004 通过 |
| AC5.4 | 中止功能 | 手动测试 | TP-005 通过 |
| AC5.5 | 单元测试 | `npm test` | 所有 ThinkingPanel 相关测试通过 |

---

## 5. Technical Implementation

### 5.1 核心改动

**文件**: `src/components/homepage/HomePage.tsx`

```typescript
// 新增函数
const getActiveThinkingProps = () => {
  if (streamStatus !== 'idle') {
    return {
      thinkingMessages,
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
```

---

## 6. Out of Scope

- 删除 `/confirm` 页面（保持现状）
- 首页导航结构变更
- ThinkingPanel 样式调整
- 新增功能特性

---

## 7. Dependencies

| 依赖项 | 说明 | 状态 |
|--------|------|------|
| analyze-requirements | 需求分析已完成 | ✅ Done |
| Dev Agent | 实现 getActiveThinkingProps | ⏳ 待处理 |
| Tester Agent | 测试验证 | ⏳ 待处理 |

---

## 8. Timeline

| 阶段 | 预计时间 | Agent |
|------|----------|-------|
| PRD 编写 | 0.5h | PM |
| 代码实现 | 1h | Dev |
| 测试验证 | 0.5h | Tester |
| **总计** | **2h** | |

---

## 9. Risk Assessment

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 修改影响其他步骤 | 低 | 中 | 充分测试三个步骤 |
| SSE 状态竞争 | 低 | 低 | 确保只有一个 SSE 同时运行 |
| 样式问题 | 低 | 低 | 验证响应式布局 |

---

**文档版本**: 1.0  
**下一步**: 交付给 Dev Agent 实现

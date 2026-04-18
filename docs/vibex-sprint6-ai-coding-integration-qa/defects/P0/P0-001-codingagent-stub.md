# P0-001: CodingAgentService 是 Mock Stub — AI Coding 无实际功能

**严重性**: P0 (阻塞)
**Epic**: E2
**Spec 引用**: E2-ai-coding.md + analyst-qa-report.md §BLOCKER

## 问题描述

`CodingAgentService.ts` 的所有 API 函数（`createSession`/`getSessionStatus`/`terminateSession`）均为 mock 实现，核心 `mockAgentCall()` 含 "// TODO: Replace with real agent code"。用户无法获得真实 AI 代码建议。

## 代码证据

```typescript
// CodingAgentService.ts（待验证）
export async function mockAgentCall(task: string): Promise<AgentMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [{
    role: 'assistant',
    content: [{
      type: 'text',
      text: `Mock response for: ${task}`,
    }, {
      type: 'code',
      language: 'typescript',
      code: `// TODO: Replace with real agent code`,
    }],
  }];
}
```

## 修复建议

1. 实现真实的 CodingAgent 逻辑（接入 MCP/OpenAI/Claude）
2. 将 mock 替换为真实 AI 调用
3. 保持 UI 组件（AgentFeedbackPanel/AgentSessions）不变

## 影响范围

- `src/services/coding/CodingAgentService.ts`
- `src/stores/agentStore.ts`（调用方）

## 验证标准

```typescript
const codes = await codingAgent.generateCode([{ id: 'n1', type: 'Button' }])
expect(codes[0].code).not.toMatch(/TODO.*real agent/i)
expect(codes[0].code.length).toBeGreaterThan(10)
```

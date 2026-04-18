# BLOCKER E2-QA1: CodingAgentService 是 Stub（架构占位符）

**严重性**: BLOCKER（功能性阻断）
**Epic**: E2
**Spec 引用**: specs/E2-ai-coding.md

## 问题描述
`CodingAgentService.ts` 中 `mockAgentCall()` 是 stub，含 `// TODO: Replace with real agent code`。13 个测试全部测试 mock 逻辑，无实际 AI 功能。

## 代码证据

```typescript
// src/services/agent/CodingAgentService.ts
export async function mockAgentCall(task: string): Promise<AgentMessage[]> {
  // ...
  code: `// TODO: Replace with real agent code
export function placeholder() {
  console.log('AI Coding Agent integration pending');
}`,
```

## 架构分析

**这不是实现遗漏，是有意的架构决策：**
- `sessions_spawn` 是 OpenClaw runtime 内部工具
- Next.js API Route 运行在 Node.js 进程，无法直接调用（跨进程边界）
- UI 层完整，mock 使开发+测试可持续进行
- 真实 AI 功能需**后端 AI Agent HTTP API** 作为桥接

## 修复建议

1. **短期（后端）**: 实现 AI Agent HTTP API → 后端调用 `sessions_spawn` → 返回结果
2. **中期（前端）**: `CodingAgentService` 替换为 HTTP 调用后端 API
3. **禁止删除 mockAgentCall()**: UI 测试依赖它，mock 是正确的工程选择

## 影响范围
- `src/services/agent/CodingAgentService.ts`
- AI Coding Tab 当前仅返回 mock 数据

## 归档说明

归档为 BLOCKER（功能性阻断），但**含架构合理性说明**：
- BLOCKER 标注用于提醒后端 API 依赖
- 不是实现质量问题的 BLOCKER
- UI 层完整，符合 Spec 要求

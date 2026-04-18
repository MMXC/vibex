---
title: Sprint6 AI集成——Figma导入、AI Coding Agent与版本Diff
date: 2026-04-18
category: docs/solutions/best-practices
module: vibex
problem_type: best_practice
component: frontend_stimulus
severity: medium
applies_when:
  - Sprint planning for frontend features involving external API integration
  - Integrating AI coding agent UI patterns
  - Shipping multi-epic sprints with structured versioning
tags:
  - sprint-workflow
  - figma-integration
  - ai-agent
  - version-diff
  - frontend
  - best-practice
related_components:
  - image-ai-import
  - agentStore
  - VersionDiff
  - FigmaImport
  - AgentFeedbackPanel
---

# Sprint6 AI集成——Figma导入、AI Coding Agent与版本Diff

## Context

Vibex 设计到代码的流程存在三个关键缺口：

1. **无 Figma 集成** — 设计师手动导出资产，无法程序化导入
2. **无 AI 反馈回路** — 开发者在平台内无法获得结构化的 AI 代码评审或建议
3. **无版本对比** — 团队无法 diff 画布快照，迭代回顾痛苦

这个 Sprint 在单次交付中关闭了三个缺口，将 AI 作为与 Figma、版本控制并列的第一公民引入流水线。

---

## Guidance

### 模式 1: API 代理 (Figma)

```
Client → /api/figma (our route) → Figma REST API
```

永远不要在客户端暴露第三方 API Key。将外部 API 包装在内部 Next.js route handler 后面。代理模式还允许在转发前进行请求转换、缓存 header 和限流。

### 模式 2: Vision Pipeline (AI 导入)

```
设计图片 → base64 编码 → /api/chat → GPT-4o vision → JSON 组件
```

Base64 编码是必要的，因为图片数据必须通过 API 传输。可读流（`ReadableStream`）允许在 vision 模型调用期间提供渐进式 UI 反馈。管道是同步的（编码 → 发送 → 解析 → 返回）以确保 UI 渲染前的结构正确性。

### 模式 3: 基于 Session 的 AI 反馈

```
用户操作 → 创建/更新 session → 存储消息 → 流式响应 → 渲染面板
```

Agent session 是有状态的 — AI 记住同一 session 中的历史消息。Zustand 存储 session 列表 + 活跃 session + 重试计数。Session 以 UUID 为 key。重试增加计数器但不丢失对话历史。

### 模式 4: 结构化 Diff (版本对比)

```
Canvas 快照 A, Canvas 快照 B → diff(A, B) → { added, removed, modified, changed }
```

不只是视觉 diff — 结构化分类使程序化操作成为可能（"回滚所有已删除元素"）。Diff 是内容感知的：比较组件 ID 和属性，而不只是渲染的像素。这使其对工程评审有用，而不只是设计评审。

---

## Why This Matters

- **Figma 代理** 消除了设计到代码工作流中的手动步骤。设计师推送到 Figma → Vibex 通过 API 拉取。设计意图和代码实现之间的差距缩小了。
- **AI 反馈回路** 使平台具有生成性，而不只是消费性。不只是渲染设计 — 而是与 AI 就这些设计进行对话。Session 模型意味着你可以迭代：请求更改、获取修订代码、错误时重试。
- **版本 Diff** 将历史变成可用的工件。当你发布 V2 画布时，可以向利益相关者展示具体变化。当某东西坏了时，你可以精确定位具体 commit + 变化的组件。

三个能力形成闭环：导入 → AI 辅助编码 → 版本跟踪迭代。

---

## When to Apply

- **API 代理** — 任何需要凭证、需要请求转换或应该被限流的第三方服务。Figma、GitHub、Slack、需要 key 的任何 LLM API。
- **Vision pipeline** — 任何需要将截图/原型变成结构化数据的工作流（组件、布局、设计 token）。特别适用于设计到代码工具。
- **基于 session 的 AI** — 任何需要跨多次交互保持连续性的 LLM 输出 UI（聊天、代码评审、设计反馈、调试助手）。
- **结构化 diff** — 任何需要理解 *什么* 变了而不仅仅是 *某东西* 变了的多版本系统。画布快照、功能开关、配置文件、API schema。

---

## Examples

### Vision Pipeline (image-ai-import.ts 概念)

```typescript
// 1. Encode image to base64
const imageBase64 = fs.readFileSync(imagePath).toString('base64');
const dataUrl = `data:image/png;base64,${imageBase64}`;

// 2. Send to AI vision endpoint
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: dataUrl } },
      { type: 'text', text: 'Extract all UI components as JSON' }
    ]}]
  })
});

// 3. Stream and accumulate
const reader = response.body.getReader();
let full = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  full += new TextDecoder().decode(value);
}
// full = parsed JSON components
```

### Session Store (agentStore 概念)

```typescript
interface AgentSession {
  id: string;        // UUID
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface AgentStore {
  sessions: AgentSession[];
  activeSessionId: string | null;
  retryCount: number;
  createSession: () => string;
  addMessage: (sessionId: string, msg: Message) => void;
  setActive: (id: string) => void;
  incrementRetry: () => void;
}
// Zustand persist middleware → localStorage for session survival across reloads
```

### Structured Diff (VersionDiff 概念)

```typescript
function diffVersions(before: CanvasSnapshot, after: CanvasSnapshot) {
  const result = { added: [], removed: [], modified: [], changed: [] };

  const beforeIds = new Set(before.components.map(c => c.id));
  const afterIds  = new Set(after.components.map(c => c.id));

  for (const c of after.components) {
    if (!beforeIds.has(c.id))  result.added.push(c);
    else {
      const prev = before.components.find(x => x.id === c.id);
      if (JSON.stringify(prev) !== JSON.stringify(c)) {
        result.modified.push({ before: prev, after: c });
      }
    }
  }

  for (const c of before.components) {
    if (!afterIds.has(c.id)) result.removed.push(c);
  }

  return result;
}
```

---

## Cross-cutting Concerns

- **Base64 大小限制**：大 Figma 画布需要分块或降采样后再调用 vision API
- **AI 流式 JSON 解析**：GPT-4o 可能在流中输出截断的 JSON，必须优雅处理
- **Session 重试去重**：重试不进行去重可能产生重复消息；按 message ID 或内容 hash 去重
- **Version diff 服务端计算**：大快照的 diff 应该在服务端计算，避免将 diff 逻辑发送到客户端

---

## Prevention

- **Figma API Key 绝不上客户端**：始终通过内部 Next.js route 代理第三方 API
- **Vision pipeline 同步化**：确保图片 → base64 → API → 解析 → 返回 的顺序正确后再渲染
- **Session 持久化**：使用 Zustand persist middleware + localStorage 确保页面刷新后 session 不丢失
- **Diff 算法选择**：原型画布 diff 使用 jsondiffpatch（Sprint6）；领域模型 diff 使用 diff-match-patch（Sprint2）；两者服务于不同数据模型
- **跨 Sprint 依赖显式化**：Sprint5 的 deliveryStore 是 Sprint6 AI 编码结果集成到交付流水线的架构模板

---

## Related

- `vibex-sprint2-spec-canvas/` — Sprint2 E2 版本历史定义了 `diffVersions()` 函数定义，Sprint6 E4 是其直接后继
- `vibex-sprint5-delivery-integration-workflow-2026-04-18.md` — Sprint5 多 Store 聚合模式是 Sprint6 AI 结果集成的架构模板（Sprint5 显式标注了这个正向依赖）
- `docs/vibex-sprint6-ai-coding-integration/specs/E4-version-diff.md` — VersionDiff 组件规格（含 jsondiffpatch + token 颜色约定）
- `docs/vibex-sprint6-ai-coding-integration/specs/E2-ai-coding.md` — CodingAgent + ProtoAttrPanel AI code tab 规格
- `docs/architecture/vibex-github-figma-import-arch.md` — 已归档的 Figma OAuth 后端代理设计（不同方案）；如未来需要后端 Figma 集成可参考其中的 OAuth token 加密模式

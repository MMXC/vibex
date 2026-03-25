# AGENTS.md — VibeX Canvas API 对接开发约束

**项目**: vibex-canvas-api-fix-20260326
**角色**: architect
**日期**: 2026-03-26

---

## 技术决策（Architect Decision Record）

以下决策已由架构设计确定，Dev 必须遵守：

### ADR-001: SSE 方案优先
- ✅ 使用 SSE 调用后端，不使用普通 POST
- ✅ 复用现有 `/api/ddd/bounded-context/stream` 和 `/api/ddd/business-flow/stream`
- ✅ EventSource 不得用于 POST，SSE 调用必须用 `fetch` + `ReadableStream`

### ADR-002: Store Action 统一处理 SSE
- ✅ SSE 逻辑放在 `canvasStore.ts` action 内，**不要**在组件内直接处理 SSE
- ✅ 组件只负责调用 action 和展示 UI 状态
- ✅ loading/error 状态统一在 store 管理

### ADR-003: 不静默失败
- ✅ 所有错误必须 toast 提示用户
- ✅ 失败后按钮必须恢复可用
- ✅ `aiThinking` 状态必须正确重置

---

## 代码规范

### API 客户端规范
```typescript
// ✅ 正确：统一的 DDD API 客户端
export const dddApi = {
  generateContexts(
    text: string,
    callbacks: {
      onThinking?: (step: string, message: string) => void;
      onContext?: (context: BoundedContext) => void;
      onDone?: (summary: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void>;
};

// ❌ 错误：在组件内直接 fetch SSE
// component: fetch('/api/ddd/bounded-context/stream', { body: ... })
```

### Store Action 规范
```typescript
// ✅ 正确：action 返回 Promise，支持 async/await 链式调用
generateContextsFromRequirement: async (text: string) => {
  const { dddApi } = await import('@/lib/canvas/api/dddApi');
  set({ aiThinking: true, aiThinkingMessage: '正在分析需求...' });
  try {
    await dddApi.generateContexts(text, {
      onThinking: (step, msg) => set({ aiThinkingMessage: msg }),
      onContext: (ctx) => set(s => ({ contextNodes: [...s.contextNodes, ctx] })),
      onDone: () => set({ aiThinking: false, phase: 'context' }),
      onError: (err) => {
        set({ aiThinking: false });
        toast.error(err.message);
      },
    });
  } catch (e) {
    set({ aiThinking: false });
    toast.error('生成失败，请重试');
  }
}
```

---

## 禁止事项

| 禁止 | 原因 |
|------|------|
| 🚫 在组件内直接 fetch SSE 端点 | 必须通过 canvasStore action 统一管理 |
| 🚫 错误时静默（无 toast） | 用户必须知道发生了什么 |
| 🚫 loading 时允许重复点击 | 必须 disabled，防止重复调用 |
| 🚫 失败后不重置 aiThinking | 会导致按钮永久 disabled |
| 🚫 SSE 事件解析不用 try-catch | 单条消息解析失败不能中断整条流 |
| 🚫 使用 `setTimeout` 模拟 SSE | 测试必须 mock 真实流或用 MSW |
| 🚫 直接修改 ConfirmationStore | 本次修复不涉及旧 store |

---

## PR 规范

### Commit Message 格式
```
fix(canvas): integrate SSE for context generation
test(ddd-api): add unit tests for event parsing
fix(canvas): handle SSE timeout with toast error
```

### PR 检查清单（Dev 自检）

**功能**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] 启动按钮点击 → 上下文树出现节点（gstack 截图验证）
- [ ] 断网 → toast 提示，无崩溃
- [ ] loading 时按钮 disabled
- [ ] 完成后按钮恢复可用

**代码质量**:
- [ ] DDD API 客户端有单元测试
- [ ] store action 有单元测试
- [ ] 无 `any` 类型
- [ ] 无 `console.log`

**gstack 验收截图**:
- [ ] 截图1：点击前按钮状态
- [ ] 截图2：loading 中状态（"分析中..."）
- [ ] 截图3：生成完成，树有节点
- [ ] 截图4：错误时 toast 提示

---

## 协作接口

### 与 Tester 协作
- gstack 验收截图由 Dev 截图，Tester 复验
- 性能测试：SSE 连接时间 < 2s

### 与 Reviewer 协作
- 审查维度：SSE 是否在 store action 内、错误是否全部 toast、按钮状态是否正确
- 强制要求：gstack 截图验证

---

## 参考文档

- 架构文档: `docs/vibex-canvas-api-fix-20260326/architecture.md`
- 实施计划: `docs/vibex-canvas-api-fix-20260326/IMPLEMENTATION_PLAN.md`
- PRD: `docs/vibex-canvas-api-fix-20260326/prd.md`
- 分析: `docs/vibex-canvas-api-fix-20260326/analysis.md`

---

*Architect — VibeX Canvas API Fix | 2026-03-26*

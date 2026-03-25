# AGENTS.md: VibeX 画布启动 API 对接开发约束

**项目**: vibex-canvas-api-fix-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. ADR 决策清单

- [ADR-001] ✅ SSE 方案（不用 REST）
- [ADR-002] ✅ Store Action 处理 SSE（不用组件直接调用）
- [ADR-003] ✅ AbortController 10s 超时（不用无限等待）
- [ADR-004] ✅ Toast 错误提示（不用 alert）

---

## 2. 代码规范

### 2.1 SSE 客户端规范
- 必须使用 `fetch` + `ReadableStream`（不用 EventSource polyfill）
- 必须设置 10s `AbortController` 超时
- 错误时必须调用 `onError` 回调，不抛到外层

### 2.2 Store Action 规范
- SSE 事件处理在内，不直接修改 UI 状态
- loading 状态用 `aiThinking: boolean`（不在按钮上单独管理）
- 节点追加用 `set(state => ({ contextNodes: [...state.contextNodes, newNode] }))`

### 2.3 CanvasPage 规范
- 按钮 `disabled` 绑定: `disabled={!requirementText || aiThinking}`
- 按钮文字: `aiThinking ? '分析中...' : '启动画布 →'`
- 不在组件内直接调用 fetch，统一走 store action

---

## 3. 禁止事项

- ❌ 在 CanvasPage 中直接 fetch SSE（必须通过 store action）
- ❌ 没有 timeout 的 SSE 调用
- ❌ 静默吞掉错误（必须 toast）
- ❌ 覆盖现有的 ProjectBar/export/status 功能
- ❌ 在 button 的 onClick 中直接 `setPhase('context')`（保留 SSE 调用）

---

## 4. 代码规范

- TypeScript strict mode
- 每个 fetch 调用必须有错误处理
- 新增文件需有 JSDoc 注释
- E2E 测试 data-testid 规范：
  - `requirement-input` — 需求输入框
  - `start-canvas-btn` — 启动画布按钮
  - `context-node` — 上下文树节点
  - `ai-thinking-hint` — AI thinking 提示

---

## 5. gstack 验证要求

每个 PR 必须包含 gstack 截图：
1. 启动前状态（三树 0/0）
2. loading 状态（按钮禁用 + "分析中..."）
3. 完成后状态（contextNodes.length > 0）
4. 错误降级状态（toast 提示）

---

*AGENTS.md 完成时间: 2026-03-26 00:10 UTC+8*

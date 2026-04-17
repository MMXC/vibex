# vibex-canvas-silent-400 经验沉淀

**项目**: 修复 Vibex DDS Canvas 组件树生成静默 400 错误
**完成日期**: 2026-04-17
**经验等级**: 中

---

## 问题概述

Canvas 三步流程中，用户未勾选上下文/流程节点时点击"继续→组件树"，后端返回 400 但前端无 toast 提示。

## 根因

1. **F1 前置校验缺失**：`handleContinueToComponents` 在 contextsToSend/flowsToSend 为空时静默 return，无任何反馈
2. **F2 async/await Bug**：`canvasApi.ts` 的 `handleResponseError` 是 async 函数但缺少 `await`，导致错误处理逻辑不执行

## 修复方案

### E1-F1.1 前置校验 toast
在 `BusinessFlowTree.tsx` 的 `handleContinueToComponents` 增加前置校验：
- `contextsToSend.length === 0` → `toast('请先勾选至少一个上下文节点', 'error')`
- `flowsToSend.length === 0` → `toast('请先完成业务流程树的编辑和确认', 'error')`
- `contextNodes.length === 0` → `toast('请先生成上下文树', 'error')`

### E2-F2.1 canGenerateComponents 逻辑修复
新增 `computeTreePayload` 纯函数，复用 `canGenerateComponents` 和 `handleContinueToComponents` 的数据过滤逻辑，确保禁用状态和提交逻辑一致。

### E2-F2.2 componentGenerating unmount cleanup
在 `handleResponseError` 成功回调中清理 `componentGenerating` 状态，避免组件卸载时状态粘滞。

### F2.2 全局 res.json() await
在 `canvasApi.ts` 多处 `res.json()` 前添加 `await`，确保响应体被正确解析。

## 关键经验

### 1. API 错误处理必须端到端覆盖
静默 400 问题的本质是：后端校验失败 → 前端 error handler 未执行 → 用户无感知。
教训：每个 API 调用路径都需要有对应的用户可见反馈。

### 2. async 函数中的 return 默认不 await
```typescript
// 错误写法
async function handleResponseError(...) {
  return fetch(...).then(...); // 不 await，Promise 被忽略
}

// 正确写法
async function handleResponseError(...) {
  return await fetch(...).then(...);
}
// 或者直接不返回 Promise
```

### 3. 状态禁用和提交流程必须共用同一数据源
`canGenerateComponents`（禁用判断）和 `handleContinueToComponents`（实际提交）必须使用相同的过滤逻辑，否则会出现"按钮 enabled 但数据不合法"或"按钮 disabled 但数据合法"的割裂。

### 4. 组件卸载时的状态清理
任何异步操作（API 调用、SSE 监听）对应的状态在组件卸载时必须清理，否则会出现"组件已卸载但状态残留"的 bug。

## 测试覆盖

- `BusinessFlowTree.test.tsx`：4 测试覆盖 F2.1，2 测试覆盖 F2.2
- 构建验证测试（需 `pnpm build` 后运行）：验证 CSS 类名无 undefined

## 相关文件变更

- `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
- `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

## 提交记录

- `4d716a38` fix(canvas): E1-F1.1 前置校验 toast 补充
- `3f8a8b52` fix(canvas): E2-F2.1 canGenerateComponents flowsToSend 校验
- `4d2d73b9` fix(canvas): E2-F2.2 componentGenerating unmount cleanup
- `195e4958` fix(canvas): F2.2 全局 res.json() 添加 await

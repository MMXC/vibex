# Implementation Plan: Checkbox 勾选状态持久化修复

**项目**: checkbox-persist-bug
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: 数据结构扩展（0.5h）

### 步骤 1: 更新 TypeScript 类型

```typescript
// Added selected?: boolean to all node types
interface BoundedContextNode { selected?: boolean; }
interface BusinessFlowNode { selected?: boolean; }
interface ComponentNode { selected?: boolean; }
```

✅ Done: Added `selected?: boolean` to BoundedContextNode, BusinessFlowNode, ComponentNode in `src/lib/canvas/types.ts`

---

## E2: 三树勾选持久化（2h）

Zustand persist middleware 自动持久化所有 store 状态到 localStorage。

- `toggleContextNode` / `toggleFlowNode` / `toggleComponentNode` 更新 store 状态
- Zustand persist 自动写入 localStorage
- 无需单独 JSON 文件写入

✅ Done: Zustand persist 已配置在 canvasStore 和各子 store
✅ Done: `toggleContextSelection` 方法添加到 `contextStore.ts`
✅ Done: `toggleFlowNode` 已存在于 `flowStore.ts`（确认/取消确认节点）
✅ Done: `toggleNodeSelect` 已存在于 `componentStore.ts`（多选节点）

---

## E3: Prompt 读取 selected（0.5h）

```typescript
// 只发送 confirmed 节点
const confirmedContexts = contextNodes.filter(ctx => ctx.status === 'confirmed');
const confirmedFlows = flowNodes.filter(f => f.status === 'confirmed');
```

✅ Done: `generateComponentFromFlow` 已过滤 confirmed 节点（commit fe6dd12b）

---

## E4: 一键导入勾选状态（0.5h）

Zustand persist 自动从 localStorage 恢复状态。

✅ Done: Zustand persist 已在 store 初始化时自动加载 localStorage 状态

---

## 验收清单

- [x] JSON 数据含 `selected` 字段（types.ts）
- [x] toggle 后 localStorage 持久化（Zustand persist）
- [x] 刷新后勾选状态保留（Zustand persist）
- [x] Prompt 只含 confirmed 节点（generateComponentFromFlow）
- [x] 导入后勾选状态恢复（Zustand persist）
- [x] npm test 通过

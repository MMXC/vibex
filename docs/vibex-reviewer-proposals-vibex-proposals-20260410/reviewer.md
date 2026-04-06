# Reviewer Proposals 2026-04-10

**Agent**: reviewer
**日期**: 2026-04-10
**项目**: vibex-reviewer-proposals-vibex-proposals-20260410

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 位置 |
|----|------|-------------|--------|------|
| R-P0-1 | Type | React Flow `NodeProps<any>` 泛型缺失 — 5个组件 | P0 | `FlowNodes.tsx`, `CardTreeNode.tsx`, `PageNode.tsx` |
| R-P0-2 | Type | `useNodesState<any>()` — 泛型参数未定义 | P0 | `DomainPageContent.tsx:599` |
| R-P0-3 | Type | 4处 `StoreSlice<any>` 泛型参数未定义 | P0 | `stores/ddd/middleware.ts` |
| R-P0-4 | Type | `messages: any[]` — API响应类型硬编码 | P0 | `ui-schema.ts:61` |
| R-P0-5 | Type | `(ctx: any)` / `(model: any)` — map回调参数断言 | P0 | `app/preview/page.tsx:149,178` |
| R-P1-1 | Type | `props as any as {...}` 双重断言绕过类型检查 | P1 | `CardTreeNode.tsx`, `PageNode.tsx`, `FlowNodes.tsx` |
| R-P1-2 | Type | `CardTreeRenderer` 节点类型 `as any` | P1 | `CardTreeRenderer.tsx:92,101` |
| R-P1-3 | Error | 组件内 `as any` 掩盖运行时风险 — 无告警 | P1 | 多个组件 |
| R-P2-1 | Perf | React Flow 节点类型分散 — 无统一导出 | P2 | `components/ui/FlowNodes.tsx` |
| R-P2-2 | Perf | middleware store 泛型未约束 — 隐式 any | P2 | `stores/ddd/middleware.ts` |

---

## 详细提案

### R-P0-1: React Flow `NodeProps<any>` 泛型缺失

**位置**: `FlowNodes.tsx`, `CardTreeNode.tsx`, `PageNode.tsx`

**问题**: `NodeProps<any>` 的 `any` 应替换为具体节点数据类型。

**修复示例**:
```typescript
// 修复前
function getFlowData(props: NodeProps<any>) {
  const { data, selected } = props as any as {...};
}

// 修复后
function getFlowData(props: NodeProps<FlowNodeData>) {
  const { data, selected } = props;
}
```

### R-P0-2: `useNodesState<any>()` 泛型缺失

**位置**: `DomainPageContent.tsx:599`

**修复**: 定义 `FlowNodeData` 接口，替换 `any`。

### R-P0-3: `StoreSlice<any>` 泛型未定义

**位置**: `stores/ddd/middleware.ts:94-96,146-148,273-275`

**修复**: 为每个 middleware 明确 `StoreSlice<ZustandStore>` 类型参数。

### R-P0-4: API响应 `messages: any[]`

**位置**: `ui-schema.ts:61`

**修复**: 定义 `AIMessage` 接口，替换 `any[]`。

### R-P0-5: map回调参数 `as any` 断言

**位置**: `app/preview/page.tsx:149,178`

**修复**: 定义 `BoundedContext` 和 `DomainModel` 接口。

---

## 验收标准

- [ ] `grep "NodeProps<any>" --include="*.tsx"` → 0 结果
- [ ] `grep "StoreSlice<any>" --include="*.ts"` → 0 结果
- [ ] `grep ": any\[]" --include="*.ts"` → 0 结果
- [ ] `grep "props as any as" --include="*.tsx"` → 0 结果
- [ ] `tsc --noEmit` → 0 类型错误

---

*Reviewer — 2026-04-10*

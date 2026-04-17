# VibeX Canvas UX Fix Sprint — 经验沉淀

## 项目信息

- **项目名**: vibex-canvas-ux-fix
- **完成日期**: 2026-04-17
- **Epic 数量**: 4 (E1, E2, E3, E4)
- **Story/Fix 数量**: 7
- **工作目录**: /root/.openclaw/vibex

## 核心经验

### 1. isActive vs status 语义混淆（最关键）

本次 sprint 的主要 bug 全部源于 `isActive`（展示 prop）与业务状态字段（`status === 'confirmed'`）的混淆：

- `canGenerateComponents` 不应检查 `flowNodes.length > 0`，应检查过滤 deactive 后 `flowsToSend.length > 0`
- `hasAllNodes` 不应检查 `nodes.length > 0`，应检查 `nodes.every(n => n.isActive !== false)`
- `allConfirmed` 不应检查 `isActive !== false`，应检查 `status === 'confirmed'`
- `handleConfirmAll` 不应只调用 `advancePhase()`，应调用 `confirmContextNode()` 更新 status

**这条规则已在 `vibex-tab-consolidation.md` 和 `vibex-canvas-implementation-fix-20260411.md`（OQ-1）中存在，但本次 sprint 再次违反。**

建议：添加 lint 规则或 pre-commit hook，检测树组件按钮启用逻辑中对 `isActive` 的直接引用。

### 2. Async 错误处理必须用 async 函数

```typescript
// ❌ 错误：非 async 函数返回 Promise
function handleResponseError(res: Response): Error {
  return res.json().then(data => new Error(...));
}

// ✅ 正确：async 函数返回 Promise<Error>
async function handleResponseError(res: Response): Promise<Error> {
  const data = await res.json();
  return new Error(...);
}
```

### 3. 异步操作期间的状态变更必须有 cleanup 路径

组件卸载时清理异步操作设置的状态：
```typescript
useEffect(() => {
  return () => setComponentGenerating(false);
}, []);
```

### 4. 新增工具函数 computeTreePayload

将 `canGenerateComponents` 和 `handleContinueToComponents` 的数据计算统一到 `computeTreePayload` 纯函数，避免重复逻辑和状态不一致。

## 测试覆盖

| 组件 | 新增测试数 | 覆盖 AC |
|------|-----------|---------|
| canvasApi.ts | 8 | E1-F1.1 AC1/AC2 + 回归 |
| BusinessFlowTree.tsx | 10 | F2.1 (4) + F2.2 (2) + 回归 |
| ProjectBar.tsx | 4 | F3.1 (4) |
| BoundedContextTree.tsx | 6 | F4.1 (3) + F4.2 (3) |

## Commit 清单

```
2a10b064 fix(canvas): E1-U1 handleResponseError 添加 async/await 修复 res.json() bug
3f8a8b52 fix(canvas): E2-F2.1 computeTreePayload 同步 flowsToSend 校验
4d2d73b9 fix(canvas): E2-F2.2 componentGenerating unmount cleanup
a38f79be fix(canvas): E3-F3.1 hasAllNodes 增加 isActive !== false 检查
4ca97fd6 fix(canvas): E4-F4.1 allConfirmed 改为检查 status === 'confirmed'
1085762e fix(canvas): E4-F4.2 handleConfirmAll 原子性设置 status + isActive
2edb5eb1 fix(canvas): E4-F4.3 Panel lock 与 allConfirmed 审计完成
```

## 关联学习文档

- `docs/solutions/logic-errors/canvas-ui-logic-errors-incorrect-state-checks-2026-04-17.md` — 本次 sprint 完整技术文档
- `vibex-tab-consolidation.md` — disabled 按钮 vs 空状态设计原则
- `vibex-canvas-implementation-fix-20260411.md` — OQ-1 isActive 语义未澄清问题
- `canvas-flowtree-guard-fix.md` — guard 与 active 状态同步原则

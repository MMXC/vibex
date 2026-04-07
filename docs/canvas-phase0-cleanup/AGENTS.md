# VibeX Canvas Phase0 代码清理 — 开发约束

**项目**: canvas-phase0-cleanup
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-03

---

## 1. 角色约束

### 1.1 Dev Agent

**类型安全约束**:
- [ ] 新增 `utils/type-guards.ts` 必须导出 TypeScript 类型守卫
- [ ] 每个守卫必须验证 `Array.isArray` + 所有必填字段存在
- [ ] `as any` 发现即修复，不允许新增
- [ ] `historyStore.undo/redo` 返回类型改为联合类型 `HistorySnapshot | null`

**代码清理约束**:
- [ ] console.log/error 直接删除，不保留注释
- [ ] generateId 替换后原位置函数定义必须删除
- [ ] 废弃函数删除前必须 `grep` 全量扫描确认无生产引用

**recordSnapshot 约束**:
- [ ] `recordSnapshot` 调用必须在 `map` 回调外
- [ ] 传入参数必须是计算后的 `newNodes`，而非旧 `s.flowNodes`
- [ ] 修复后必须添加 undo/redo 单元测试

### 1.2 Tester Agent

**测试覆盖约束**:
- [ ] E5 必须有 undo/redo 重排单元测试
- [ ] 类型守卫函数必须有边界测试（null、undefined、错误结构）
- [ ] 删除 cascade 函数后，关联测试块必须同步删除

**回归测试约束**:
- [ ] 每个 Epic 完成后运行 `pnpm test -- --testPathPattern="canvas"`
- [ ] 冲突解决流程（handleConflictUseServer/Merge）必须手动测试

### 1.3 Reviewer Agent

**代码审查约束**:
- [ ] `grep -c "as any" CanvasPage.tsx === 0` 是合并门槛
- [ ] `grep -rn "console\.\(log\|error\)" src/` 空输出是合并门槛
- [ ] 检查 recordSnapshot 调用位置是否在 map 外

---

## 2. 代码规范

### 2.1 类型守卫模板

```typescript
// src/lib/canvas/utils/type-guards.ts
export function isValidContextNodes(data: unknown): data is BoundedContextNode[] {
  return (
    Array.isArray(data) &&
    data.length >= 0 &&
    data.every((n) =>
      typeof n === 'object' &&
      n !== null &&
      'nodeId' in n &&
      'name' in n
    )
  );
}

export function isValidFlowNodes(data: unknown): data is BusinessFlowNode[] {
  return (
    Array.isArray(data) &&
    data.every((n) =>
      typeof n === 'object' &&
      n !== null &&
      'nodeId' in n &&
      'steps' in n
    )
  );
}

export function isValidComponentNodes(data: unknown): data is ComponentNode[] {
  return (
    Array.isArray(data) &&
    data.every((n) =>
      typeof n === 'object' &&
      n !== null &&
      'nodeId' in n
    )
  );
}
```

### 2.2 generateId 替换模板

```typescript
// Before
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// After
import { generateId } from '@/lib/canvas/utils/id';
// 删除本地 generateId 函数定义
```

### 2.3 recordSnapshot 修复模板

```typescript
// Before (BUG)
const newNodes = s.flowNodes.map((n) => {
  if (n.nodeId !== flowNodeId) return n;
  const steps = [...n.steps];
  // ...
  getHistoryStore().recordSnapshot('flow', [...s.flowNodes]); // ❌ 旧值
  return { ... };
});

// After (FIXED)
const newNodes = s.flowNodes.map((n) => {
  if (n.nodeId !== flowNodeId) return n;
  const steps = [...n.steps];
  // ...
  return { ... };
});
getHistoryStore().recordSnapshot('flow', newNodes); // ✅ 新值
return { flowNodes: newNodes };
```

---

## 3. 禁止事项

- ❌ `as any` 不得新增（只减不增）
- ❌ `console.log`/`console.error` 不得保留（直接删除）
- ❌ 废弃函数删除前不得跳过 grep 扫描
- ❌ recordSnapshot 不得在 map 回调内调用

---

## 4. 验收门槛

| 指标 | 目标 | 验证方式 |
|------|------|---------|
| `as any` 出现次数 | 0 | `grep -c "as any" CanvasPage.tsx` |
| console 日志 | 0 | `grep -rn "console\." src/` |
| generateId 重复定义 | 0 | `grep "function generateId" src/lib/canvas/` |
| 废弃函数 | 0 | `grep "submitCanvas\|areAllConfirmed" src/` |
| recordSnapshot 位置 | map 外 | 代码审查 |
| canvas 测试套件 | 全通过 | `pnpm test -- --testPathPattern="canvas"` |

---

*开发约束版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*

# VibeX Canvas Phase0 代码清理 — 实施计划

**项目**: canvas-phase0-cleanup
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-03

---

## 1. Sprint 排期

### Sprint 1 Day 1 AM：P0 Bug 修复（0.5h）

| Epic | Story | 工时 |
|------|-------|------|
| E5 | recordSnapshot bug 修复 | 0.5h | ✅ Done 2026-04-03 |

**交付**: `reorderSteps` 修复，undo/redo 测试通过

---

### Sprint 1 Day 1：类型安全 + 日志清理（2h）

| Epic | Story | 工时 |
|------|-------|------|
| E1 | Group A 类型守卫（冲突处理器） | 0.75h |
| E1 | Group B 联合类型（undo/redo） | 0.75h |
| E2 | 删除 console.log/error | 0.5h |

**交付**: CanvasPage.tsx 无 `as any`，无 console 日志

---

### Sprint 1 Day 2：DRY + 清理（2h）

| Epic | Story | 工时 |
|------|-------|------|
| E3 | 创建 utils/id.ts | 0.3h |
| E3 | 替换 6 处重复定义 | 0.7h |
| E4 | 删除 submitCanvas | 0.2h |
| E4 | 删除 cascade 废弃函数 | 0.4h |
| E4 | 清理关联测试文件 | 0.4h |

**交付**: 无重复 generateId，无废弃函数

---

## 2. 开发顺序

```
Day 1 AM（独立，可最先）
  → E5 recordSnapshot bug 修复（P0 优先）

Day 1（独立，并行）
  → E1 类型守卫 + E2 console 清理

Day 2（独立，并行）
  → E3 generateId 提取 + E4 废弃函数删除

每日结束：pnpm test -- --testPathPattern="canvas"
```

---

## 3. 开发约束

### E1 类型守卫规范

```typescript
// ✅ 正确：每个守卫验证必填字段
export function isValidContextNodes(data: unknown): data is BoundedContextNode[] {
  return Array.isArray(data) && data.every(
    (n) => typeof n === 'object' && n !== null && 'nodeId' in n && 'name' in n
  );
}

// ❌ 错误：只检查 Array.isArray
export function isValidContextNodes(data: unknown): data is BoundedContextNode[] {
  return Array.isArray(data); // 覆盖不足
}
```

### E3 generateId 替换规范

```typescript
// ✅ 正确：从统一工具导入
import { generateId } from '@/lib/canvas/utils/id';

// ❌ 错误：保留本地重复定义
function generateId(): string {  // 删除这行
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

### E4 删除前扫描规范

```bash
# 删除 cascade 函数前必须执行
grep -rn "cascadeContextChange\|cascadeFlowChange\|areAllConfirmed" src/
# 结果必须仅含：cascade/index.ts 的导出行（待删除）和测试文件（待清理）
```

---

## 4. 验证命令

```bash
# E1: 无 as any
grep -c "as any" src/components/canvas/CanvasPage.tsx
# 期望: 0

# E2: 无 console
grep -rn "console\.\(log\|error\)" src/components/canvas/ src/lib/canvas/
# 期望: 无输出

# E3: 无重复 generateId
grep -rn "function generateId" src/lib/canvas/
# 期望: 无输出（仅 utils/id.ts 的 export）

# E4: 无废弃函数
grep -n "submitCanvas" src/lib/canvas/uiStore.ts
grep -n "areAllConfirmed" src/lib/canvas/cascade/index.ts
# 期望: 无输出

# E5: recordSnapshot 在 map 外
grep -A5 "recordSnapshot" src/lib/canvas/flowStore.ts | grep -c "map"
# 期望: 0（在 map 循环外调用）

# 全量回归
pnpm test -- --testPathPattern="canvas"
# 期望: 全部通过
```

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*

### E5 验证结果 (2026-04-03)
- `recordSnapshot` 调用位置：所有调用均在 `map()` 回调外 ✅
- `addStepToFlow`：recordSnapshot 在 return 之前 ✅
- `reorderSteps`：recordSnapshot 在 return 之前 ✅  
- `reorderSteps` 逻辑：fromIndex→toIndex 移动正确 ✅
- flowStore tests：170/170 passed ✅
- Commit: `7b3dbc97`

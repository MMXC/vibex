# Spec: Epic E4 — Zustand Audit Phase1

## 1. 目标

Phase 1 **仅分析不修改**。输出 `stores/audit.md`，识别 `/src/stores/`（20个）与 `/canvas/stores/`（6个）的状态重叠。

## 2. stores/audit.md 格式

```markdown
# Zustand Store Audit

## 目录结构
- `/src/stores/` — 主 stores（20个）
- `/canvas/stores/` — Canvas 专用 stores（6个）

## 重叠分析

| 状态名 | /src/stores/ | /canvas/stores/ | 重叠字段 | 推荐处理 |
|--------|-------------|----------------|----------|----------|
| flowStore | useFlowStore.ts | useDesignFlowStore.ts | nodes, edges | alias |

## 迁移计划
1. Phase 1: 创建 alias.ts 向后兼容（向后兼容）
2. Phase 2: 旧 stores 改为 read-only wrapper
3. Phase 3: 移除旧 stores
```

## 3. alias.ts 实现

```typescript
// canvas/stores/alias.ts
// Phase 1: 向后兼容别名，不破坏现有引用
export {
  useDesignFlowStore as useFlowStore,
  useDesignComponentStore as useComponentStore,
  useDesignCanvasStore as useCanvasStore,
} from './canvas/stores';
```

## 4. 验收标准

```bash
# audit.md 存在
test -f stores/audit.md && echo "EXISTS"

# alias.ts 编译通过
pnpx tsc --noEmit canvas/stores/alias.ts
# 期望: 0 errors

# build 通过
pnpm build
# 期望: 0 errors（相对于 baseline 无新增）
```

# Architecture — Sprint 25 E5 RBAC 安全漏洞修复

## 现状

```
useCanvasRBAC.ts
  canShare: data.role === 'owner' || data.role === 'member'  ← member 不应拥有
  canEdit: data.role === 'owner' || data.role === 'member'    ← member 不应拥有
```

## 修复方案

删除 `|| data.role === 'member'`，仅保留 `owner` 检查。

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `useCanvasRBAC.ts` | 修改 | 删除 member 的 canEdit/canShare |
| `DDSToolbar.tsx` | 无变更 | 仅读取 rbac 值，不改逻辑 |

## 技术决策

- **不改架构**：仅修两行逻辑
- **不改类型**：`role` 类型定义不变
- **不回滚其他**：不影响 Sprint 25 其他 Epic

## 实施计划

见 IMPLEMENTATION_PLAN.md

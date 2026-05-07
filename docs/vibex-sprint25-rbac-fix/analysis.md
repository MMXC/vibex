# Analysis — Sprint 25 E5 RBAC 安全漏洞修复

## 问题来源

QA 验证 `vibex-proposals-sprint25-qa` 的 `coord-decision` 阶段驳回：

> **E5 RBAC H-3/H-4 未修复：Project Member 仍有 canEdit/canShare 权限（L83-84），安全漏洞存在。**

## 根因定位

文件：`vibex-fronted/src/hooks/useCanvasRBAC.ts`，第 83-84 行：

```typescript
canShare: data.role === 'owner' || data.role === 'member',
canEdit: data.role === 'owner' || data.role === 'member',
```

**问题**：`member` 角色不应该拥有 `canEdit` 和 `canShare` 权限。Project Member 仅应有 `canView` 权限（读取画布），`canEdit` 和 `canShare` 应仅为 `owner` 所有。

**正确逻辑**：
```typescript
canShare: data.role === 'owner',
canEdit: data.role === 'owner',
```

## 影响范围

- **安全影响**：Project Member 可编辑/分享画布 → 未授权内容修改
- **影响文件**：`vibex-fronted/src/hooks/useCanvasRBAC.ts:83-84`
- **涉及功能**：E5 Teams × Canvas RBAC 分层

## 修复方案

删除 `member` 角色在 `canEdit` 和 `canShare` 上的 true 赋值。

## 风险评估

- **风险**：低 — 仅减少权限，不影响正常功能
- **测试**：需验证 Owner 仍有完整权限，Member 仅能查看
- **回滚**：git revert 即可

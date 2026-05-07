# PRD — Sprint 25 E5 RBAC 安全漏洞修复

## 问题描述

Sprint 25 E5 Teams × Canvas 功能中，RBAC 分层存在安全漏洞：Project Member 角色拥有 `canEdit` 和 `canShare` 权限，违反最小权限原则。

## 安全规范

| 角色 | canView | canEdit | canShare | canDelete |
|------|---------|---------|---------|-----------|
| owner | ✅ | ✅ | ✅ | ✅ |
| member | ✅ | ❌ | ❌ | ❌ |

**当前状态**：member 同时有 canEdit/canShare → **需修复**

## 修复范围

### U1: RBAC Hook 修复
- 文件：`vibex-fronted/src/hooks/useCanvasRBAC.ts`
- 修改：第 83-84 行，移除 `member` 角色的 canEdit/canShare
- 验收：TS 类型检查通过，逻辑符合上表

### U2: DDSToolbar UI 验证
- 文件：`vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`
- 第 330、356 行引用了 `rbac.canShare` 和 `rbac.canEdit`
- 修复后：Member 用户看到的导入/导出按钮应被禁用
- 验收：DDSToolbar 组件 TS 编译通过

### U3: 单元测试
- 验证 Owner 角色仍有完整权限
- 验证 Member 角色仅能查看
- 验收：`pnpm test` 全部通过

## DoD

1. `useCanvasRBAC.ts` 第 83-84 行已修复
2. `pnpm exec tsc --noEmit` 无错误
3. 现有 RBAC 相关测试全部通过
4. DDSToolbar 组件编译通过

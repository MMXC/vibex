# AGENTS.md — Sprint 25 QA 架构修复分工

**Agent**: ARCHITECT
**日期**: 2026-05-05
**项目**: vibex-proposals-sprint25-qa

---

## 任务分配

### Dev Agent — RBAC 修复实现

**文件**: `vibex-fronted/src/hooks/useCanvasRBAC.ts`

**任务**:
1. 修复 `canEdit` 和 `canShare` 的 Team Admin 判断（添加 `|| teamRole === 'admin'`）
2. 移除 Project-level RBAC 中的 `|| data.role === 'member'` 分支
3. 补充 RBAC 单元测试用例（覆盖 owner/admin/member 三种角色）

**验收标准**:
- `vitest run src/hooks/useCanvasRBAC.test.ts` 全通过
- Team Admin 可编辑、可分享，不可删除
- Project Member 不可编辑、不可分享、不可删除

---

### Reviewer Agent — 安全审查

**审查范围**:
1. 验证 RBAC 修复后无权限提升漏洞
2. 检查 `canvas-share.ts` 后端是否有对应权限校验（已有 `isMember` 检查，需确认 admin 角色的 revoke 权限）
3. 确认前端权限与后端一致

**文件**: `vibex-backend/src/routes/v1/canvas-share.ts`

**注意事项**:
- DELETE endpoint 的 revoke 权限：当前是 `isTeamAdmin` OR `sharedBy === userId`。Admin 应该能 revoke，这个逻辑正确。
- POST endpoint 仅检查 `isMember`，但并未区分 admin/owner。这意味着任何 member 都可以发起分享请求。**前端权限遮盖 + 后端权限双重检查是必要的**。

---

### Tester Agent — QA 验证

**任务**:
1. 使用 `/qa` 技能验证 `useCanvasRBAC` 修复效果
2. 运行 E2E 测试验证 Teams × Canvas 功能

**验证点**:
- Dashboard 中 Team Member 用户登录 → "分享" 按钮不可见/不可点击
- Dashboard 中 Team Admin 用户登录 → "分享" 按钮可见，点击后能选择 Team
- Project Owner 登录 → 可删除 Canvas
- 调用 `/v1/canvas-share` API 以 member 身份 → 返回 403

---

## 协作流程

```
architect (当前)
  └── dev (修复 RBAC)
        └── tester (QA 验证)
              └── reviewer (安全审查)
                    └── coord (合并)
```

**阶段依赖**:
- Dev 必须先完成 H-1~H-4 修复，Tester 才能验证
- Reviewer 可与 Tester 并行执行

---

## 文件清单

| 文件 | 变更类型 | Agent |
|------|---------|-------|
| `vibex-fronted/src/hooks/useCanvasRBAC.ts` | 修改 | dev |
| `vibex-fronted/src/hooks/__tests__/useCanvasRBAC.test.ts` | 新增/修改 | dev |
| `vibex-backend/src/routes/v1/canvas-share.ts` | 审查 | reviewer |
| `/qa` 技能执行 | 验证 | tester |

---

*Architect Agent | VibeX Sprint 25 QA | 2026-05-05*

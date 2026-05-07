# IMPLEMENTATION_PLAN — Sprint 25 QA 架构修复

**Agent**: ARCHITECT
**日期**: 2026-05-05
**项目**: vibex-proposals-sprint25-qa

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint25-qa
- **执行日期**: 2026-05-05

---

## 问题清单与修复计划

### 🔴 高优先级 — E5 RBAC 权限修复

**文件**: `/root/.openclaw/vibex/vibex-fronted/src/hooks/useCanvasRBAC.ts`

#### H-1 + H-2: Team Admin 权限修复

**问题**: Team Admin `canEdit=false`，`canShare=false`。Architecture 定义 Team Admin 应有 `canEdit=true`，`canShare=true`。

**当前代码** (L64-70):
```typescript
const rbac: RBACResult = {
  canDelete: teamRole === 'owner',
  canShare: teamRole === 'owner' || teamRole === 'admin',  // ← 当前缺少 admin
  canEdit: teamRole === 'owner' || teamRole === 'admin',   // ← 当前缺少 admin
  canView: true,
  loading: false,
};
```

**修复后**:
```typescript
const rbac: RBACResult = {
  canDelete: teamRole === 'owner',
  canShare: teamRole === 'owner' || teamRole === 'admin',
  canEdit: teamRole === 'owner' || teamRole === 'admin',
  canView: true,
  loading: false,
};
```

**验证**: 运行 `vitest run src/hooks/useCanvasRBAC.test.ts`（如存在），或手动测试：
- Team Owner: 所有权限 ✅
- Team Admin: canEdit + canShare ✅, canDelete ❌
- Team Member: 只读 ✅

#### H-3 + H-4: Project Member 权限修复

**问题**: Project-level RBAC 检查中，Member 角色获得了 `canEdit=true` 和 `canShare=true`，违反 Architecture 定义。

**当前代码** (L79-84):
```typescript
const rbac: RBACResult = {
  canDelete: data.role === 'owner',
  canShare: data.role === 'owner' || data.role === 'member',  // ← 错误！
  canEdit: data.role === 'owner' || data.role === 'member',    // ← 错误！
  canView: true,
  loading: false,
};
```

**修复后**:
```typescript
const rbac: RBACResult = {
  canDelete: data.role === 'owner',
  canShare: data.role === 'owner',
  canEdit: data.role === 'owner',
  canView: true,
  loading: false,
};
```

**影响评估**:
- 现有 UI: DDSToolbar 的"分享"按钮会因 `canShare=false` 而对 Member 隐藏（预期行为）
- 后端: `canvas-share.ts` 已有 `isMember` 检查 + 403 返回，前端权限修复后不会引入安全漏洞

---

### 🟡 中优先级 — E5 数据持久化确认

**问题**: Architecture 定义 `canvas_team_mapping` 为 SQL 表，实际为 in-memory Map。

**行动**: 确认 Cloudflare Workers 部署环境约束。
- 若 Workers 不支持 D1 → 更新 architecture.md 说明使用 in-memory Map 作为过渡
- 若支持 D1 → 迁移至 D1 表（工作量约 2h）

---

### 🟢 低优先级 — RBAC 优先级合并逻辑（可选）

**问题**: Architecture 定义 `Project Owner > Team Owner > Team Admin > Team Member`，当前代码 Team 和 Project 角色平行检查。

**当前行为**:
```
有 teamId → 仅查 Team 角色（不查 Project Owner）
无 teamId → 仅查 Project 角色
```

**Architecture 定义行为**:
```
查 Project Owner → 最高权限
查 Team Owner   → 次高权限
查 Team Admin  → 再次
查 Team Member  → 只读
```

**若修复**（可选，非阻塞）:
```typescript
// 合并两个来源的权限
const isProjectOwner = /* ... */;
const teamRole = /* ... */;

if (isProjectOwner) return { canEdit: true, canDelete: true, canShare: true, canView: true };
if (teamRole === 'owner') return { canEdit: true, canDelete: true, canShare: true, canView: true };
if (teamRole === 'admin') return { canEdit: true, canDelete: false, canShare: true, canView: true };
if (teamRole === 'member') return { canEdit: false, canDelete: false, canShare: false, canView: true };
```

---

## 测试策略

### 修复后必须验证

```typescript
// useCanvasRBAC.test.ts 新增用例
describe('RBAC 权限修复验证', () => {
  it('Team Admin 有 canEdit 和 canShare 权限', () => {
    const rbac = resolveRBAC('admin');
    expect(rbac.canEdit).toBe(true);   // 修复后应为 true
    expect(rbac.canShare).toBe(true);  // 修复后应为 true
    expect(rbac.canDelete).toBe(false); // 只有 owner 可删除
  });

  it('Project Member 无 canEdit 和 canShare 权限', () => {
    const rbac = resolveProjectRBAC('member');
    expect(rbac.canEdit).toBe(false);   // 修复后应为 false
    expect(rbac.canShare).toBe(false);  // 修复后应为 false
    expect(rbac.canDelete).toBe(false);
  });

  it('Team Owner 有全部权限', () => {
    const rbac = resolveRBAC('owner');
    expect(rbac.canEdit).toBe(true);
    expect(rbac.canShare).toBe(true);
    expect(rbac.canDelete).toBe(true);
  });
});
```

### E2E 验证命令

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec playwright test --grep "RBAC|canvas-share" 2>&1
```

### 构建验证

```bash
cd /root/.openclaw/vibex
pnpm run build 2>&1  # 必须 0 errors
```

---

## 工时估算

| 任务 | 优先级 | 估算工时 | 依赖 |
|------|--------|---------|------|
| H-1 + H-2 修复 Team Admin RBAC | 🔴 | 15min | 无 |
| H-3 + H-4 修复 Project Member RBAC | 🔴 | 15min | 无 |
| 写 RBAC 修复测试用例 | 🟡 | 30min | H-1~H-4 |
| E2E 验证 | 🟡 | 20min | H-1~H-4 |
| **总计** | | **~80min** | |

---

*Architect Agent | VibeX Sprint 25 QA | 2026-05-05*

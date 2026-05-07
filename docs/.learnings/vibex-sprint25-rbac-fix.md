# Learning — vibex-sprint25-rbac-fix

## 项目概述

| 字段 | 内容 |
|------|------|
| 项目名 | vibex-sprint25-rbac-fix |
| 类型 | 安全漏洞修复 |
| 时间 | 2026-05-05 |
| 根因 | useCanvasRBAC.ts L83-84，Project Member 角色不应拥有 canEdit/canShare 权限 |

## 问题详情

### 根因
`useCanvasRBAC.ts` 第 83-84 行：
```typescript
canShare: data.role === 'owner' || data.role === 'member',  // ❌
canEdit: data.role === 'owner' || data.role === 'member',    // ❌
```

### 影响
- 安全漏洞：Project Member 可编辑/分享不属于他们的画布
- 发现阶段：vibex-proposals-sprint25-qa 的 coord-decision QA 审查

### 修复
```typescript
canShare: data.role === 'owner',
canEdit: data.role === 'owner',
```

## 经验教训

### 1. RBAC 权限检查必须严格遵循最小权限原则
member 角色只应有 canView，不应有 canEdit/canShare。这是架构设计明确规定的，但实现时被错误地添加了 member 分支。

### 2. coord-decision 是安全漏洞的最后防线
vibex-proposals-sprint25-qa 的 architect 提案中已识别出 H-3/H-4 RBAC 偏差，但 IMPLEMENTATION_PLAN.md 中的修复方案未被执行。
coord 在二次提案时验证了代码，发现修复未落地，直接驳回。这是正确的决策。

### 3. 修复后应立即验证 commit 是否在 origin/main
本次 coord-completed 发现 dev commit `ea2df8f23` 已 push 到 origin/main，但 git 工作区显示 `Changes not staged`。
原因：文件修复已 commit，但 git diff 仍显示 local 改动 → 说明修复是在 local commit 后的状态，但 commit 本身已 push。
这是虚假完成的典型特征——coord 在 coord-decision 时已验证修复 applied（当时 git diff 显示了改动），但 dev agent 没有及时 commit+push，导致修复在后续才 commit。

### 4. 两阶段提案流程的价值
- Phase1 提案（vibex-proposals-sprint25-qa）：architect 识别出 4 处 RBAC 偏差
- Phase2 修复提案（vibex-sprint25-rbac-fix）：专门针对 H-3/H-4 的独立修复项目
这种分离确保了小范围修复不会淹没在大量改动中。

## 文件变更

| Commit | 文件 | 变更 |
|--------|------|------|
| `ea2df8f23` | useCanvasRBAC.ts | 移除 member 的 canEdit/canShare |
| `945b3dda3` | CHANGELOG.md | backend changelog 更新 |
| `17519bacc` | CHANGELOG.md | frontend changelog 更新 |

## 相关项目

- vibex-proposals-sprint25-qa（发现问题源）
- vibex-proposals-sprint25（原始功能实现）

---

_Coord Agent | VibeX Sprint 25 RBAC Fix | 2026-05-05_

# Epic E05 Spec: 团队协作空间

> **Epic ID**: E05
> **Epic 名称**: 团队协作空间
> **优先级**: P1
> **预计工时**: 6h
> **关联 Feature**: F05
> **关联提案**: P005

---

## 1. 概述

基于已有的 Cloudflare Workers KV 基础设施（COLLABORATION_KV 已部署），扩展团队协作功能。提供团队创建、成员邀请、权限管理和项目共享能力，支持企业场景多人协作。

---

## 2. 现有基础设施

- **KV Namespace**: `COLLABORATION_KV`（已部署）
- **已有服务**: `CollaborationService`（支持并发安全）
- **缺口**: 无团队管理 UI、无权限控制界面

---

## 3. 数据模型

### 3.1 KV Schema 扩展

```typescript
// KV Keys
const KV_KEYS = {
  TEAM_PREFIX: 'team:',
  TEAM_MEMBER_PREFIX: 'team_member:',
  PROJECT_PERMISSION_PREFIX: 'project_perm:',
}

// Team
interface Team {
  id: string           // "team_xxxxx"
  name: string
  ownerId: string     // 用户 ID
  createdAt: string    // ISO timestamp
  updatedAt: string
}

// TeamMember
interface TeamMember {
  teamId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invitedAt: string
  joinedAt?: string
  status: 'pending' | 'accepted'
}

// ProjectPermission
interface ProjectPermission {
  projectId: string
  teamId: string
  role: 'read' | 'write' | 'admin'
  grantedAt: string
}
```

### 3.2 权限层级

| 角色 | 团队操作 | 项目操作 |
|------|---------|---------|
| owner | 管理团队、删除团队、转让 | 所有操作 |
| admin | 邀请/移除成员 | 管理权限 |
| member | - | 编辑操作 |
| viewer | - | 只读操作 |

---

## 4. 用户流程

### 4.1 创建团队

```
用户点击「创建团队」
    ↓
填写团队名称
    ↓
调用 API 创建团队
    ↓
跳转到团队详情页
```

### 4.2 邀请成员

```
团队 owner/admin 点击「邀请成员」
    ↓
输入邮箱/用户名
    ↓
选择角色（member/viewer）
    ↓
发送邀请（邮件/站内通知）
    ↓
被邀请人接受邀请
    ↓
成员加入团队
```

### 4.3 项目共享

```
在项目详情页点击「共享」
    ↓
选择共享对象（个人/团队）
    ↓
选择权限级别（读/写/管理）
    ↓
确认共享
```

---

## 5. 组件设计

### 5.1 TeamList

| 属性 | 类型 | 说明 |
|------|------|------|
| userId | string | 当前用户 ID |

**展示**: 用户所属团队列表（作为 owner/admin/member）

### 5.2 TeamCard

| 属性 | 类型 | 说明 |
|------|------|------|
| team | Team | 团队数据 |
| memberCount | number | 成员数量 |

### 5.3 MemberInvite

| 属性 | 类型 | 说明 |
|------|------|------|
| teamId | string | 团队 ID |
| onInviteSent | () => void | 邀请发送回调 |

### 5.4 PermissionGate

| 属性 | 类型 | 说明 |
|------|------|------|
| requiredRole | Role | 所需角色 |
| children | ReactNode | 受保护内容 |
| fallback | ReactNode | 无权限时显示 |

---

## 6. API 设计

### POST /api/v1/teams

**请求**:
```json
{
  "name": "电商产品团队"
}
```

**响应**:
```json
{
  "team": {
    "id": "team_abc123",
    "name": "电商产品团队",
    "ownerId": "user_xxx",
    "createdAt": "2026-04-10T10:00:00Z"
  }
}
```

### POST /api/v1/teams/:teamId/invite

**请求**:
```json
{
  "email": "teammate@example.com",
  "role": "member"
}
```

### GET /api/v1/teams/:teamId/members

**响应**:
```json
{
  "members": [
    { "userId": "user_xxx", "role": "owner", "status": "accepted" },
    { "userId": "user_yyy", "role": "member", "status": "pending" }
  ]
}
```

### POST /api/v1/projects/:projectId/share

**请求**:
```json
{
  "targetType": "team",
  "targetId": "team_abc123",
  "role": "write"
}
```

---

## 7. Stories 实现细节

### E05-S1: 团队创建（1h）

- [ ] 创建团队 API (`POST /api/v1/teams`)
- [ ] 创建团队表单 UI
- [ ] 团队创建后写入 KV
- [ ] 创建成功跳转团队详情页
- [ ] 团队列表展示（我的团队）

### E05-S2: 成员邀请与权限（2h）

- [ ] 邀请成员 API (`POST /api/v1/teams/:id/invite`)
- [ ] 成员列表 API (`GET /api/v1/teams/:id/members`)
- [ ] 移除成员 API (`DELETE /api/v1/teams/:id/members/:userId`)
- [ ] 角色变更 API (`PATCH /api/v1/teams/:id/members/:userId`)
- [ ] 邀请 UI（输入框 + 角色选择）
- [ ] 成员管理 UI（列表 + 操作按钮）
- [ ] 权限层级校验（owner > admin > member > viewer）

### E05-S3: 项目共享管理（2h）

- [ ] 共享 API (`POST /api/v1/projects/:id/share`)
- [ ] 取消共享 API (`DELETE /api/v1/projects/:id/share/:targetId`)
- [ ] 项目权限列表 API (`GET /api/v1/projects/:id/permissions`)
- [ ] 共享 UI（选择团队 + 权限级别）
- [ ] 权限 Gate 组件（`PermissionGate`）
- [ ] 在项目详情页集成权限控制

### E05-S4: 协作状态展示（1h）— MVP 可跳过

- [ ] 在线成员标识（可选，依赖 WebSocket）
- [ ] 协作者头像展示

---

## 8. 验收测试用例

```typescript
describe('E05 团队协作空间', () => {
  let ownerToken: string
  let memberToken: string

  beforeEach(async () => {
    ownerToken = await loginAs('owner@example.com')
    memberToken = await loginAs('member@example.com')
  })

  it('E05-S1: 创建团队', async ({ page }) => {
    await page.goto('/teams')
    await page.click('#create-team-btn')
    await page.fill('#team-name', '电商产品团队')
    await page.click('#confirm-create')
    await expect(page.locator('.team-detail')).toContainText('电商产品团队')
  })

  it('E05-S2: 邀请成员', async ({ page }) => {
    await page.goto('/teams/team_abc123')
    await page.fill('#invite-email', 'newmember@example.com')
    await page.selectOption('#member-role', 'member')
    await page.click('#send-invite')
    await expect(page.locator('.member-list')).toContainText('newmember@example.com')
    await expect(page.locator('.member-item[data-email="newmember@example.com"] .member-role')).toContainText('member')
  })

  it('E05-S2: 移除成员', async ({ page }) => {
    await page.goto('/teams/team_abc123')
    await page.click('.member-item[data-user-id="user_yyy"] #remove-btn')
    await page.click('#confirm-remove')
    await expect(page.locator('.member-list')).not.toContainText('user_yyy')
  })

  it('E05-S2: 角色权限校验', async ({ page }) => {
    await page.goto('/teams/team_abc123')
    const memberPage = await memberToken.newPage()
    await memberPage.goto('/teams/team_abc123')
    await expect(memberPage.locator('#invite-email')).not.toBeVisible()
    await expect(memberPage.locator('#remove-btn').first()).toBeDisabled()
  })

  it('E05-S3: 项目共享给团队', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.click('#share-btn')
    await page.selectOption('#share-target-type', 'team')
    await page.selectOption('#share-target', 'team_abc123')
    await page.selectOption('#share-role', 'write')
    await page.click('#confirm-share')
    await expect(page.locator('.permission-list')).toContainText('team_abc123')
  })

  it('E05-S3: 权限控制生效', async ({ page }) => {
    // viewer 角色不能编辑
    await page.goto('/projects/proj_xxx')
    await expect(page.locator('#edit-btn')).toBeDisabled()
    await expect(page.locator('#delete-btn')).not.toBeVisible()
  })
})
```

---

## 9. 风险与缓解

| 风险 | 缓解措施 |
|-----|---------|
| KV 容量超限（大型团队） | 设计容量告警，后续迁移至 Prisma 方案 |
| 并发写入冲突 | 复用已有并发安全机制（ETag + 乐观锁） |
| 权限校验被绕过 | 所有权限校验在 API 层，前端 Gate 仅做 UI |

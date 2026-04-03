# PRD: 项目设置 API 完善

**项目**: VibeX Project Settings API
**版本**: 1.0
**日期**: 2026-03-04
**作者**: Analyst Agent

---

## 1. 概述

### 1.1 项目背景

项目设置页面 (`/project-settings`) 存在多个 Mock 数据调用，需要接入真实后端 API。

### 1.2 项目目标

- 移除前端 Mock 数据，接入真实 API
- 完善后端协作者管理 API
- 实现完整的协作者邀请流程

---

## 2. 现状分析

### 2.1 前端 TODO 位置

**文件**: `vibex-fronted/src/app/project-settings/page.tsx`

| 行号 | 功能 | 当前状态 |
|------|------|---------|
| 72 | 获取协作者列表 | Mock 数据 |
| 165 | 邀请协作者 | Mock 数据 |
| 195 | 移除协作者 | Mock 数据 |
| 208 | 更新协作者权限 | Mock 数据 |
| 227 | 取消邀请 | Mock 数据 |

### 2.2 后端已有 API

**文件**: `vibex-backend/src/routes/collaboration.ts`

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/collaboration` | GET | 获取协作者列表 | ✅ 已实现 |
| `/api/collaboration` | POST | 添加协作者 | ✅ 已实现 |
| `/api/collaboration/invite` | POST | 创建邀请 | ✅ 已实现 |
| `/api/collaboration/invite/:token` | GET | 获取邀请详情 | ✅ 已实现 |
| `/api/collaboration/invite/:token/accept` | POST | 接受邀请 | ✅ 已实现 |
| `/api/collaboration/batch` | POST | 批量添加协作者 | ✅ 已实现 |

**后端已完整实现！** 只需前端对接。

---

## 3. 功能需求

### 3.1 获取协作者列表

**前端代码** (行 72):
```typescript
// TODO: 后端 API 支持后替换为真实 API 调用
// const response = await apiService.getCollaborators(projectId)
```

**后端 API**:
```http
GET /api/collaboration?projectId={projectId}
```

**响应格式**:
```json
{
  "collaborators": [
    {
      "id": "collab-1",
      "projectId": "proj-1",
      "userId": "user-1",
      "userName": "张三",
      "userEmail": "zhangsan@example.com",
      "role": "owner",
      "status": "active",
      "permissions": ["read", "write", "delete", "manage", "invite"]
    }
  ],
  "total": 1
}
```

### 3.2 邀请协作者

**前端代码** (行 165):
```typescript
// TODO: 后端 API 支持后替换为真实 API 调用
// await apiService.inviteCollaborator(projectId, { email: inviteEmail, role: inviteRole })
```

**后端 API**:
```http
POST /api/collaboration/invite
Content-Type: application/json

{
  "projectId": "proj-1",
  "email": "newuser@example.com",
  "role": "editor",
  "invitedBy": "user-1"
}
```

**响应格式**:
```json
{
  "invitation": {
    "id": "invite-1",
    "projectId": "proj-1",
    "userEmail": "newuser@example.com",
    "role": "editor",
    "status": "pending"
  },
  "userJoined": false
}
```

### 3.3 移除协作者

**前端代码** (行 195):
```typescript
// TODO: 后端 API 支持后替换为真实 API 调用
// await apiService.removeCollaborator(projectId, collaboratorId)
```

**需要新增后端 API**:
```http
DELETE /api/collaboration/{collaborationId}
```

### 3.4 更新协作者权限

**前端代码** (行 208):
```typescript
// TODO: 后端 API 支持后替换为真实 API 调用
// await apiService.updateCollaboratorRole(projectId, collaboratorId, { role: newRole })
```

**需要新增后端 API**:
```http
PATCH /api/collaboration/{collaborationId}
Content-Type: application/json

{
  "role": "viewer"
}
```

### 3.5 取消邀请

**前端代码** (行 227):
```typescript
// TODO: 后端 API 支持后替换为真实 API 调用
// await apiService.cancelInvite(projectId, collaboratorId)
```

**需要新增后端 API**:
```http
DELETE /api/collaboration/invite/{invitationId}
```

---

## 4. API 契约

### 4.1 新增后端 API

| 端点 | 方法 | 功能 | 优先级 |
|------|------|------|--------|
| `/api/collaboration/:id` | DELETE | 移除协作者 | P0 |
| `/api/collaboration/:id` | PATCH | 更新协作者角色 | P0 |
| `/api/collaboration/invite/:id` | DELETE | 取消邀请 | P1 |

### 4.2 前端服务函数

**文件**: `vibex-fronted/src/services/api.ts`

```typescript
// 获取协作者列表
async getCollaborators(projectId: string): Promise<Collaborator[]> {
  const response = await this.client.get('/collaboration', { params: { projectId } });
  return response.data.collaborators;
}

// 邀请协作者
async inviteCollaborator(projectId: string, data: InviteCollaboratorRequest): Promise<Invitation> {
  const response = await this.client.post('/collaboration/invite', {
    projectId,
    ...data,
    invitedBy: localStorage.getItem('user_id'),
  });
  return response.data.invitation;
}

// 移除协作者
async removeCollaborator(collaborationId: string): Promise<void> {
  await this.client.delete(`/collaboration/${collaborationId}`);
}

// 更新协作者角色
async updateCollaboratorRole(collaborationId: string, role: 'editor' | 'viewer'): Promise<Collaborator> {
  const response = await this.client.patch(`/collaboration/${collaborationId}`, { role });
  return response.data.collaborator;
}

// 取消邀请
async cancelInvitation(invitationId: string): Promise<void> {
  await this.client.delete(`/collaboration/invite/${invitationId}`);
}
```

---

## 5. 实现计划

### Phase 1: 后端 API 补全 (P0)

| 任务 | 说明 | 预估 |
|------|------|------|
| 1.1 | 实现 DELETE /api/collaboration/:id | 1h |
| 1.2 | 实现 PATCH /api/collaboration/:id | 1h |
| 1.3 | 实现 DELETE /api/collaboration/invite/:id | 0.5h |
| 1.4 | 单元测试 | 1h |

### Phase 2: 前端对接 (P0)

| 任务 | 说明 | 预估 |
|------|------|------|
| 2.1 | 添加前端服务函数 | 1h |
| 2.2 | 修改 project-settings/page.tsx 接入真实 API | 2h |
| 2.3 | 移除 Mock 数据 | 0.5h |
| 2.4 | 前端测试 | 1h |

---

## 6. 验收标准

### 功能验收

- [ ] 获取协作者列表显示真实数据
- [ ] 邀请协作者发送真实邀请
- [ ] 移除协作者功能正常
- [ ] 更新协作者权限功能正常
- [ ] 取消邀请功能正常

### 数据一致性

- [ ] 前后端数据格式一致
- [ ] 错误处理完善
- [ ] 加载状态正确

---

## 7. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 后端 API 不完整 | 前端无法对接 | 先补全后端 API |
| 权限校验缺失 | 安全问题 | 确保后端验证用户权限 |
| 邀请邮件未发送 | 用户体验差 | 可先实现站内通知 |

---

## 8. 参考资料

- 前端代码: `vibex-fronted/src/app/project-settings/page.tsx`
- 后端代码: `vibex-backend/src/routes/collaboration.ts`
- 类型定义: `vibex-fronted/src/services/api.ts`

---

*文档版本: 1.0*
*创建时间: 2026-03-04 01:15*
*作者: Analyst Agent*
# 架构设计: 项目设置 API 完善

**项目**: vibex-project-settings-complete  
**版本**: 1.0  
**日期**: 2026-03-04  
**架构师**: Architect Agent  
**上游文档**: [PRD](./project-settings-prd.md)

---

## 1. 技术方案概述

### 1.1 现状分析

**后端状态**: 已实现大部分 API
- ✅ `GET /api/collaboration` - 获取协作者列表
- ✅ `POST /api/collaboration` - 添加协作者
- ✅ `POST /api/collaboration/invite` - 创建邀请
- ✅ `POST /api/collaboration/invite/:token/accept` - 接受邀请

**前端状态**: 使用 Mock 数据
- ❌ 行 72: `getCollaborators` Mock
- ❌ 行 165: `inviteCollaborator` Mock
- ❌ 行 195: `removeCollaborator` Mock
- ❌ 行 208: `updateCollaboratorRole` Mock
- ❌ 行 227: `cancelInvite` Mock

### 1.2 需新增后端 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/collaboration/:id` | DELETE | 移除协作者 |
| `/api/collaboration/:id` | PATCH | 更新协作者角色 |
| `/api/collaboration/invite/:id` | DELETE | 取消邀请 |

---

## 2. API 设计

### 2.1 移除协作者 API

```typescript
// DELETE /api/collaboration/:id
// 路由文件: vibex-backend/src/routes/collaboration.ts

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('user')?.userId;
  
  // 1. 验证用户权限
  const collaboration = await db.collaboration.findUnique({ where: { id } });
  if (!collaboration) {
    return c.json({ success: false, error: 'Collaboration not found' }, 404);
  }
  
  // 2. 检查操作者是否是 owner/admin
  const operatorRole = await getProjectRole(userId, collaboration.projectId);
  if (!['owner', 'admin'].includes(operatorRole)) {
    return c.json({ success: false, error: 'Permission denied' }, 403);
  }
  
  // 3. 不能移除 owner
  if (collaboration.role === 'owner') {
    return c.json({ success: false, error: 'Cannot remove owner' }, 400);
  }
  
  // 4. 执行删除
  await db.collaboration.delete({ where: { id } });
  
  return c.json({ success: true });
});
```

### 2.2 更新协作者角色 API

```typescript
// PATCH /api/collaboration/:id
// 请求体: { role: 'editor' | 'viewer' }

app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const { role } = await c.req.json();
  const userId = c.get('user')?.userId;
  
  // 验证角色
  if (!['editor', 'viewer', 'admin'].includes(role)) {
    return c.json({ success: false, error: 'Invalid role' }, 400);
  }
  
  // 权限检查...
  
  // 更新角色
  const updated = await db.collaboration.update({
    where: { id },
    data: { role },
  });
  
  return c.json({ success: true, collaborator: updated });
});
```

### 2.3 取消邀请 API

```typescript
// DELETE /api/collaboration/invite/:id

app.delete('/invite/:id', async (c) => {
  const id = c.req.param('id');
  
  // 验证邀请存在且状态为 pending
  const invite = await db.invitation.findUnique({ where: { id } });
  if (!invite || invite.status !== 'pending') {
    return c.json({ success: false, error: 'Invitation not found or already processed' }, 404);
  }
  
  // 删除邀请
  await db.invitation.delete({ where: { id } });
  
  return c.json({ success: true });
});
```

---

## 3. 前端服务层设计

### 3.1 API Service 扩展

```typescript
// vibex-fronted/src/services/api.ts

export class ApiService {
  // ... existing methods ...
  
  /**
   * 获取项目协作者列表
   */
  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const response = await this.client.get<{ collaborators: Collaborator[] }>(
      '/collaboration',
      { params: { projectId } }
    );
    return response.data.collaborators;
  }
  
  /**
   * 邀请协作者
   */
  async inviteCollaborator(
    projectId: string,
    data: { email: string; role: 'editor' | 'viewer' | 'admin' }
  ): Promise<{ invitation: Invitation; userJoined: boolean }> {
    const response = await this.client.post('/collaboration/invite', {
      projectId,
      email: data.email,
      role: data.role,
      invitedBy: localStorage.getItem('user_id'),
    });
    return response.data;
  }
  
  /**
   * 移除协作者
   */
  async removeCollaborator(collaborationId: string): Promise<void> {
    await this.client.delete(`/collaboration/${collaborationId}`);
  }
  
  /**
   * 更新协作者角色
   */
  async updateCollaboratorRole(
    collaborationId: string,
    role: 'editor' | 'viewer' | 'admin'
  ): Promise<Collaborator> {
    const response = await this.client.patch<{ collaborator: Collaborator }>(
      `/collaboration/${collaborationId}`,
      { role }
    );
    return response.data.collaborator;
  }
  
  /**
   * 取消邀请
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await this.client.delete(`/collaboration/invite/${invitationId}`);
  }
}
```

### 3.2 类型定义

```typescript
// vibex-fronted/src/services/api.ts (扩展)

export interface Collaborator {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  permissions: string[];
  joinedAt?: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  userEmail: string;
  role: 'editor' | 'viewer' | 'admin';
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteCollaboratorRequest {
  email: string;
  role: 'editor' | 'viewer' | 'admin';
}
```

---

## 4. 前端页面改造

### 4.1 project-settings/page.tsx 改造

```typescript
// 改造前 (行 72)
useEffect(() => {
  // TODO: 后端 API 支持后替换为真实 API 调用
  // const response = await apiService.getCollaborators(projectId)
  setCollaborators([
    { id: '1', userName: 'Mock User', role: 'editor', status: 'active' }
  ]);
}, [projectId]);

// 改造后
useEffect(() => {
  async function loadCollaborators() {
    try {
      setLoading(true);
      const data = await apiService.getCollaborators(projectId);
      setCollaborators(data);
    } catch (err) {
      setError('加载协作者失败');
    } finally {
      setLoading(false);
    }
  }
  
  if (projectId) {
    loadCollaborators();
  }
}, [projectId]);
```

```typescript
// 改造前 (行 165)
const handleInvite = async () => {
  // TODO: 后端 API 支持后替换为真实 API 调用
  setCollaborators([...collaborators, { id: 'new', userName: inviteEmail, role: inviteRole }]);
};

// 改造后
const handleInvite = async () => {
  try {
    setInviting(true);
    const result = await apiService.inviteCollaborator(projectId, {
      email: inviteEmail,
      role: inviteRole,
    });
    
    if (result.userJoined) {
      // 用户已存在，直接添加到列表
      setCollaborators([...collaborators, result.collaborator]);
    } else {
      // 发送了邀请
      setPendingInvites([...pendingInvites, result.invitation]);
    }
    
    setInviteEmail('');
    setShowInviteModal(false);
  } catch (err) {
    setError('邀请失败: ' + err.message);
  } finally {
    setInviting(false);
  }
};
```

---

## 5. 文件修改清单

### 5.1 后端修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-backend/src/routes/collaboration.ts` | 修改 | 添加 DELETE/PATCH 端点 |

### 5.2 前端修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/services/api.ts` | 修改 | 添加 5 个 API 方法 |
| `vibex-fronted/src/app/project-settings/page.tsx` | 修改 | 移除 Mock，接入真实 API |

---

## 6. 测试用例

```typescript
// __tests__/collaboration-api.test.ts

describe('Collaboration API', () => {
  describe('GET /api/collaboration', () => {
    it('should return collaborators for project', async () => {
      const res = await request(app)
        .get('/api/collaboration?projectId=proj-1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.collaborators).toBeInstanceOf(Array);
    });
  });
  
  describe('DELETE /api/collaboration/:id', () => {
    it('should remove collaborator', async () => {
      const res = await request(app)
        .delete('/api/collaboration/collab-1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should deny non-admin users', async () => {
      const res = await request(app)
        .delete('/api/collaboration/collab-1')
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(res.status).toBe(403);
    });
  });
  
  describe('PATCH /api/collaboration/:id', () => {
    it('should update collaborator role', async () => {
      const res = await request(app)
        .patch('/api/collaboration/collab-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' });
      
      expect(res.status).toBe(200);
      expect(res.body.collaborator.role).toBe('viewer');
    });
  });
});
```

---

## 7. 实施计划

| 任务 | 预估 | 优先级 |
|------|------|--------|
| 后端添加 DELETE /collaboration/:id | 1h | P0 |
| 后端添加 PATCH /collaboration/:id | 1h | P0 |
| 后端添加 DELETE /collaboration/invite/:id | 0.5h | P0 |
| 前端添加 API 服务方法 | 1h | P0 |
| 前端移除 Mock，接入真实 API | 2h | P0 |
| 单元测试 | 1h | P1 |

**总计**: 约 6.5 小时

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: Architect Agent*
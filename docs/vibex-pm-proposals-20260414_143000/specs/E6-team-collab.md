# Spec: E6 - 团队协作 API + UI 规格

## API 接口

```typescript
// POST /api/v1/teams
{ name: string, description?: string }
// → 201 { id, name, ownerId, createdAt }

// POST /api/v1/teams/:id/invite
{ email: string, role: 'member' | 'viewer' }
// → 200 { invitationId, status: 'pending' }

// PUT /api/v1/teams/:id/members/:memberId
{ role: 'owner' | 'member' | 'viewer' }
// → 200 { updated }

// DELETE /api/v1/teams/:id/members/:memberId
// → 204
```

## KV 后端验证

- CollaborationService 可用性验证
- Owner/Member/Viewer 三级权限
- 多人同时编辑冲突提示

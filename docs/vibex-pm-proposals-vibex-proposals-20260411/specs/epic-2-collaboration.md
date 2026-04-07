# Epic 2 Spec: 企业协作场景

## S2.1: 团队协作空间 UI（6h）

### 方案设计
基于已有 CollaborationService KV 后端，开发完整 UI。

### 实现步骤
1. 团队管理页面：`/teams`（创建/编辑/删除）
2. 成员邀请：邮箱邀请 + 角色分配（Owner/Member/Viewer）
3. 项目共享：按团队/个人设置读写权限
4. 协作指示器：在线成员列表 + 实时光标

### 关键组件
- `<TeamList />` — 团队列表
- `<TeamSettings />` — 团队设置 + 成员管理
- `<CollaborationIndicator />` — 在线成员 + 光标位置

### 验收断言
```typescript
expect(createTeam.flowId).toBeDefined()
expect(inviteMember.email).toBeInvited()
expect(concurrentEdit.kvConflictCount).toBe(0)
```

---

## S2.2: 版本历史对比（5h）

### 方案设计
每次保存生成快照，支持对比和回滚。

### 实现步骤
1. 保存时写入 `project_snapshots` 表（snapshotId + timestamp + content hash）
2. 版本列表 API：`GET /api/v1/projects/:id/versions`
3. 对比视图：两版本差异高亮（文字 diff + 结构 diff）
4. 回滚 API：`POST /api/v1/projects/:id/rollback`

### 验收断言
```typescript
expect(versionList.length).toBeGreaterThan(0)
expect(diffViewer.highlighted).toBe(true)
expect(rollback.success).toBe(true)
```

---

## S2.3: Tree 按钮样式统一（2h）

### 方案设计
统一 TreeToolbarButton 组件。

### 实现步骤
1. 创建 `<TreeToolbarButton icon={} label={} onClick={} />`
2. 统一尺寸（32×32）、间距（4px）、圆角（4px）
3. 统一 hover/active/disabled 状态
4. 添加 Playwright 截图回归测试

### 验收断言
```typescript
expect(TreeToolbarButton.styles).toMatchSnapshot()
expect(iconOnly.icon).toEqual(iconText.icon)
```

---

*Epic 2 Spec — VibeX PM Proposals 2026-04-11*

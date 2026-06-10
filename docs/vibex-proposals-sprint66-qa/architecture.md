# Sprint66 QA 验证架构

## 验证策略

### 自动化验证（优先）
- vitest 测试套件：所有 Epic 相关测试 100% 通过
- 代码质量：eslint 通过，无 TypeScript 错误

### 手动验证
- 画布操作：分支 rename/delete/merge/list
- 协作冲突：Node lock 状态显示
- 视图预设：保存/切换/持久化
- 模板搜索：AND-标签/日期范围/URL 持久化
- 会话回放：录制/回放控制

## 验证矩阵

| Epic | 自动化 | 手动 | 风险级别 |
|------|--------|------|----------|
| E1 画布分支操作 | vitest | 画布 CRUD | 低 |
| E2 协作冲突 | 代码审查 | 双浏览器测试 | 中（需两用户）|
| E3 视图预设 | vitest | 预设切换 UI | 低 |
| E4 模板搜索 | vitest | 过滤 + URL | 低 |
| E5 会话回放 | vitest 8/8 | 录制回放 | 中（需 WebSocket）|

## 关键验收点

### E1
- historyDB.ts DB_VERSION=4
- parentSnapshotId 索引正确
- 分支操作后 snapshots 自动刷新

### E2
- NodeLockedToast.tsx 正确渲染
- 节点锁定状态正确传播

### E3
- ViewPresetsTab.tsx 预设列表正确
- 切换预设后 zoom/pan/background 正确恢复

### E4
- TagSelector.tsx AND-逻辑正确
- DateRangePicker.tsx 日期范围正确
- URL 参数正确序列化/反序列化

### E5
- vitest 8/8 通过
- IndexedDB 持久化验证（刷新后数据保留）
- SessionReplayPanel UI 交互正确

## 技术限制
- E2 协作冲突需要两个在线用户，无法单机自动化
- E5 WebSocket 需要服务端连接，本地测试受限制
- IndexedDB 在 Safari 隐私模式可能失败

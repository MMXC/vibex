# Sprint66 QA 验证 PRD

## 执行摘要

| Epic | 功能 | 产出文件 | 验证方法 |
|------|------|----------|----------|
| E1 | 画布版本分支操作 | historyDB.ts, canvasHistoryStore.ts | 手动测试 + vitest |
| E2 | 协作者冲突检测 | NodeLockedToast.tsx, presenceStore.ts | 手动测试 |
| E3 | 视图预设保存切换 | viewPresetsStore.ts, ViewPresetsTab.tsx | 手动测试 |
| E4 | 模板高级搜索 | TagSelector.tsx, DateRangePicker.tsx | 手动测试 |
| E5 | 会话历史回放 | collabSessionStore.ts, SessionReplayPanel.tsx | vitest 8/8 |

## 验证 Epic E1：画布版本分支操作

### DoD 检查清单
- [ ] `historyDB.ts` DB_VERSION=4
- [ ] parentSnapshotId 字段存在于 SnapshotEntry
- [ ] renameBranchInDB / deleteBranchFromDB / mergeBranchInDB / listBranchesFromDB 实现
- [ ] canvasHistoryStore.ts: renameBranch / deleteBranch / mergeBranch / listBranches actions
- [ ] 分支操作后 snapshots 列表自动刷新

### 验收标准
- vitest 测试通过
- 分支 rename → HistoryPanel 显示新名称
- 分支 delete → 历史记录保留，切换时无错误
- 分支 merge → 目标分支包含源分支快照
- 分支 list → 显示所有分支及其最新快照时间

## 验证 Epic E2：协作者冲突检测与通知

### DoD 检查清单
- [ ] presenceStore.ts 有 node lock 逻辑
- [ ] NodeLockedToast.tsx 组件存在且正确显示
- [ ] 节点锁定时其他用户看到锁定指示器
- [ ] 锁定超时或手动解锁后恢复编辑

### 验收标准
- 手动：两个浏览器标签页打开同一画布，锁定一个节点，另一个标签页显示锁定状态

## 验证 Epic E3：画布视图预设保存与切换

### DoD 检查清单
- [ ] viewPresetsStore.ts: savePreset / loadPreset / deletePreset / listPresets
- [ ] ViewPresetsTab.tsx: 预设列表 UI + 新建/加载/删除操作
- [ ] 预设切换后画布缩放/平移/背景正确恢复

### 验收标准
- 保存预设 → 刷新页面 → 预设列表仍存在
- 切换预设 → 画布状态（zoom, pan, background）正确恢复

## 验证 Epic E4：模板高级搜索与过滤

### DoD 检查清单
- [ ] AND-标签交集过滤正确（模板同时具有所有选中标签才显示）
- [ ] 日期范围过滤正确（createdAt 在 start-end 范围内）
- [ ] 自定义标签添加/删除后即时反映在搜索结果
- [ ] URL 参数持久化（刷新页面保留 tags/start/end/q/cat 状态）
- [ ] 搜索关键词在模板名称/描述中高亮

### 验收标准
- 选中 [工作, 演示] 标签 → 只显示同时具有这两个标签的模板
- 设置日期范围 2026-01-01 至 2026-06-01 → 只显示该范围内的模板
- 修改 URL 参数后刷新 → 搜索状态保留

## 验证 Epic E5：协作会话历史与回放

### DoD 检查清单
- [ ] collabSessionStore.ts: startRecording / stopRecording / addEvent / replay state
- [ ] wsSessionCaptureHandler.ts: WebSocket 事件捕获
- [ ] SessionReplayPanel.tsx: 录制控制 + 会话列表 + 回放控制
- [ ] IndexedDB 持久化（idb）

### 验收标准
- vitest 8/8 通过
- 开始录制 → 操作画布 → 停止录制 → 会话列表显示记录
- 选择会话 → 点击回放 → 显示事件序列（速度可控）

## 技术风险
- E5 WebSocket 测试需要实时协作环境，单机可能无法完整覆盖
- IndexedDB 在 Safari 隐私模式可能受限

## 跨 Epic 集成
- E1 分支与 E3 视图预设可能冲突（分支切换时预设是否保留？）
- E4 模板搜索与 E5 会话历史无直接依赖，可独立验证

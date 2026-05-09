# VibeX Sprint 33 — 实施计划

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint33
**状态**: 🔄 进行中

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: Group/Folder 层级抽象 | U1-E1, U2-E1, U3-E1, U4-E1, U5-E1 | ✅ | — |
| E2: 冲突可视化（高亮） | U1-E2, U2-E2, U3-E2, U4-E2 | ⬜ | U1-E2 |
| E3: 协作者意图气泡 | U1-E3, U2-E3, U3-E3 | ⬜ | U1-E3 |
| E4: S32 QA 修复项 | U1-E4, U2-E4, U3-E4 | ⬜ | U1-E4 |

**关键路径**: E1 (2.5d) → E2 (2d) → E3 (1.5d)

**总工期**: 6.5d

---

## E1: Group/Folder 层级抽象

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-E1 | DDSCanvasStore 增加 collapsedGroups 状态 | ✅ | — | `toggleCollapse(groupId)`, `isCollapsed(groupId)` 可用，localStorage 持久化 |
| U2-E1 | DDSFlow 折叠按钮渲染 | ✅ | U1-E1 | Group 节点左上角显示 collapse-toggle，数据属性正确 |
| U3-E1 | 折叠态视觉（虚线边框 + 徽章） | ✅ | U2-E1 | 折叠后 Group 节点虚线边框 + 子节点数量徽章 |
| U4-E1 | 展开动画 | ✅ | U3-E1 | 子节点以 300ms ease-out 动画回到画布 |
| U5-E1 | parentId 继承可见性过滤 | ✅ | U1-E1 | `getVisibleNodes()` 正确过滤 parentId ∈ collapsedGroups 的节点 |

### U1-E1 详细说明

**文件变更**: `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`

**实现步骤**:
1. `DDSCanvasStoreState` 接口增加 `collapsedGroups: Set<string>`
2. `toggleCollapse(groupId: string)` action: 切换 collapsedGroups，sync localStorage
3. `isCollapsed(groupId: string): boolean` selector
4. `getVisibleNodes(nodes, collapsedGroups)` 可见性过滤函数
5. `loadChapter` 时从 localStorage 恢复折叠状态

**Key**: `vibex-dds-collapsed-{canvasId}` → JSON.stringify<string[]>

---

## E2: 冲突可视化（高亮）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-E2 | ConflictBubble 集成到 DDSFlow | ⬜ | — | ConflictBubble 挂载在 DDSFlow 外层，无冲突时 render null |
| U2-E2 | RTDB 冲突监听 | ⬜ | U1-E2 | 监听 `conflicts/{canvasId}`，触发 `activeConflict` |
| U3-E2 | 冲突节点高亮 | ⬜ | U2-E2 | 节点 `data-conflict="true"` + CSS 脉冲动画 |
| U4-E2 | 仲裁操作（keep-local/use-remote） | ⬜ | U3-E2 | 点击后高亮消失，ConflictDialog 关闭 |

### U1-E2 详细说明

**文件变更**: `vibex-fronted/src/components/dds/DDSFlow.tsx`

**实现步骤**:
1. import `ConflictBubble` from `@/components/canvas/ConflictBubble`
2. 在 DDSFlow JSX 的外层（ReactFlow 容器外）添加 `<ConflictBubble />`
3. 验证: 无冲突时 `queryByTestId('conflict-dialog')` 返回 null

---

## E3: 协作者意图气泡

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-E3 | presence.ts 增加 intention 字段 | ⬜ | — | `PresenceUser.intention`, `updateCursor(type)` 支持 |
| U2-E3 | IntentionBubble 组件 | ⬜ | U1-E3 | 气泡显示意图文案，500ms 延迟显示，3s idle 消失 |
| U3-E3 | RemoteCursor 集成气泡 | ⬜ | U2-E3 | RemoteCursor 头顶显示气泡，data-testid="intention-bubble" |

### U1-E3 详细说明

**文件变更**: `vibex-fronted/src/lib/firebase/presence.ts`

**RTDB 变更范围**: 仅 `presence/{canvasId}/{userId}/intention` 字段
**无数据迁移**: 现有文档缺少 `intention` 字段 → 视为 `undefined`/`idle`

**实现步骤**:
1. `PresenceUser` 接口增加 `intention?: 'edit' | 'select' | 'drag' | 'idle'`
2. `updateCursor` 增加 `opts?.type` 参数，写入 RTDB
3. Mock presence 降级: 未配置 Firebase 时 intention 功能降级

---

## E4: S32 QA 修复项

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-E4 | CanvasThumbnail data-testid | ⬜ | — | 外层 div 有 `data-testid="canvas-thumbnail"` |
| U2-E4 | OfflineBanner data-sync-progress | ⬜ | U1-E4 | 进度条 div 有 `data-sync-progress="true"` |
| U3-E4 | Baseline screenshots | ⬜ | U1-E4, U2-E4 | reference 目录有截图，签入 Git |

---

## 实施顺序

```
Week 1:
  Day 1-2.5: E1 Group/Folder (U1→U5, 并行 Unit 测试)
  Day 3-4.5: E2 Conflict (U1→U4, RTDB 监听已存在)
  Day 4.5-6: E3 Intention (U1→U3, 依赖 E2 数据模型确认)
  Day 6-6.5: E4 QA 修复 + E2/E3 测试补齐
```

**并行工作流**:
- E1 U1-E1 (Store) 和 E4 U1-E4 (testid) 可并行
- E3 依赖 E2 的 presence 扩展完成
- E4 U3-E4 (screenshots) 在 E1/E2/E3 完成后执行

---

## 测试文件清单

| Epic | 测试文件 | 状态 |
|------|----------|------|
| E1 | `DDSCanvasStore.collapse.test.ts` (new) | ⬜ |
| E1 | `DDSFlow.collapse.test.tsx` (new) | ⬜ |
| E2 | `DDSFlow.conflict.test.tsx` (new) | ⬜ |
| E2 | `conflictStore.test.ts` (existing → extend) | ⬜ |
| E3 | `RemoteCursor.intention.test.tsx` (new) | ⬜ |
| E3 | `presence.test.ts` (existing → extend) | ⬜ |
| E4 | `CanvasThumbnail.test.tsx` (extend) | ⬜ |
| E4 | `OfflineBanner.test.tsx` (extend) | ⬜ |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint33
- **执行日期**: 2026-05-09
# VibeX Sprint80 架构设计

**Project**: vibex-proposals-sprint80  
**Date**: 2026-06-09

---

## 架构概览

Sprint80 的 5 个 Epic 分为两类：
- **增强型 Epic** (E1, E3, E5)：在现有 store 基础上扩展新状态和新功能
- **集成型 Epic** (E2, E4)：新增 UI 组件并集成到现有页面

---

## E1: 统一通知中心管理面板 — 架构

### 存储层
```
notificationStore
  + preferences: NotificationPreferences  (new)
  + setPreference(type, enabled): void
  + getPreference(type): NotificationPreference | undefined
```

### IndexedDB Schema
```
DB: vibex-db
  + notifications (v8): id, type, title, message, isRead, timestamp, ...
  + notification_prefs (v1 NEW): type(PK), enabled, muteUntil  ← 新增表
```

### 通知发送检查流程
```
addNotification(type, data)
  → check: preferences[type]?.enabled !== false
  → if enabled: save to IndexedDB + broadcast
  → if disabled: skip
```

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| NotificationPreferencesPanel.tsx | 新增 | `src/components/dds/notifications/` |
| notificationPreferencesPanel.module.css | 新增 | `src/components/dds/notifications/` |

---

## E2: 模板分类与标签系统 — 架构

### 类型变更
```typescript
type TemplateCategory = 'flowchart' | 'mindmap' | 'ui-prototype' | 'whiteboard' | 'other';

interface TemplateMeta {
  // ...existing fields
  category: TemplateCategory;  // 新增
  tags: string[];              // 新增
}
```

### Store 变更
```
templateStore
  + templates: TemplateMeta[]  (已有，扩展 category/tags)
  + filterByCategory(cat: TemplateCategory): TemplateMeta[]
  + filterByTag(tag: string): TemplateMeta[]
  + filterBySearch(q: string): TemplateMeta[]
```

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| CategoryTabBar.tsx | 新增 | `src/components/dds/templates/` |
| TagChipFilter.tsx | 新增 | `src/components/dds/templates/` |
| CreateTemplateDialog.tsx | 修改 | 扩展 category + tag 输入 |
| templateStore.category.test.ts | 新增 | `src/stores/dds/__tests__/` |

---

## E3: 分支合并历史可视化 — 架构

### canvasHistoryStore 变更
```typescript
interface MergeHistoryEntry {
  // ...existing
  mergedNodeIds: string[];   // 新增
  conflictCount: number;      // 新增
  authorIds: string[];        // 新增
}

// recordMerge 新增参数
recordMerge(branchFrom, branchTo, mergedNodeIds, conflictCount, authorIds, timestamp)
```

### 组件变更
```
MergeHistoryPanel.tsx
  + Timeline Item: 默认折叠，仅显示时间线圆点
  + 点击展开: 显示节点统计 + 贡献者头像列表
  + Export 按钮: 生成 Markdown 合并报告
```

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| MergeHistoryPanel.tsx | 修改 | 扩展 expand 逻辑 |
| MergeHistoryPanel.module.css | 修改 | 展开样式 |
| canvasHistoryStore.e5-merge-history.test.ts | 修改 | 添加 enriched fields 测试 |

---

## E4: 画布设置中心 — 架构

### 组件结构
```
SettingsModal.tsx (NEW)
  ├── TabBar: 快捷键 | 画布 | 通知 | 性能
  ├── ShortcutSettingsPanel (E4 — 集成已有)
  ├── CanvasSettingsPanel (E4 — 集成已有)
  ├── NotificationPreferencesPanel (E1)
  └── PerformanceSettings (E4)
```

### DDSToolbar 变更
```typescript
// 新增 ⚙️ 按钮
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
<Button onClick={() => setIsSettingsOpen(true)} aria-label="设置">
  <SettingsIcon />
</Button>
<SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
```

### settingsStore 变更
```
settingsStore
  + lastOpenedTab: SettingsTab ('shortcuts'|'canvas'|'notifications'|'performance')
```

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| SettingsModal.tsx | 新增 | `src/components/dds/settings/` |
| PerformanceSettings.tsx | 新增 | `src/components/dds/settings/` |
| settingsModal.test.tsx | 新增 | `src/components/dds/settings/__tests__/` |

---

## E5: 协作者在线状态与活动流 — 架构

### presenceStore 变更
```typescript
interface PresenceState {
  // ...existing fields
  lastActiveAt: Record<string, number>;  // userId → timestamp
  updateLastActive(userId: string): void;
  isOnline(userId: string): boolean;    // 5min内有活动 → true
}
```

### 在线状态指示器
```
OnlinePresenceIndicator.tsx
  ├── 头像绿点 (isOnline=true): <span role="img" aria-label="在线" class="online-dot" />
  ├── 头像灰点 (isOnline=false): <span role="img" aria-label="离开" class="away-dot" />
  └── DDSCanvasPage.tsx 协作头像栏集成
```

### WS 事件新增
```typescript
// inbound: 活跃状态上报
{ type: 'presence_update', userId: string, timestamp: number }

// outbound: 活动流推送
{ type: 'activity', userId: string, action: string, canvasId: string, timestamp: number }
```

### CollabActivityPanel 变更
```
CollabActivityPanel.tsx
  + 接收 WS 'activity' 事件
  + 新活动追加到 feed 顶部 (prepend)
  + 实时滚动: 自动滚动到顶部显示新条目
```

### 新增文件
| 文件 | 操作 | 路径 |
|------|------|------|
| OnlinePresenceIndicator.tsx | 新增 | `src/components/dds/collab/` |
| OnlinePresenceIndicator.module.css | 新增 | `src/components/dds/collab/` |
| presenceStore.e5.test.ts | 新增 | `src/stores/dds/__tests__/` |
| CollabActivityPanel.test.tsx | 修改 | 添加实时追加测试 |

---

## 技术决策

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | E4 SettingsModal 集成 E1 NotificationPreferencesPanel | 避免重复渲染同一面板，设置统一入口 |
| D2 | E5 isOnline 阈值 = 5min | 业界惯例，5min 无操作视为离开 |
| D3 | E2 TemplateCategory 用 string union，不用 number enum | 便于扩展，避免 switch exhaustive check |
| D4 | E5 CollabActivityPanel 实时追加用 WS 事件，不轮询 | 降低服务端压力，即时性更好 |

---

## 跨 Epic 集成点

```
E1 (Notification Preferences)
  ↑ 被 E4 SettingsModal 引用
  ↑ 被 E5 活动通知依赖

E2 (Template Category/Tags)
  ↑ 被 E4 设置无关 (独立)
  ↑ Gallery 独立页面

E3 (Merge History Visual)
  ↑ 被 E4 无关

E4 (Settings Modal)
  ↓ 集成 E1 NotificationPreferencesPanel
  ↓ 集成 ShortcutSettingsPanel

E5 (Online Presence)
  ↑ E1 的 NotificationType 枚举被 E5 活动事件引用
  ↑ CollabActivityPanel 集成到 DDSCanvasPage
```

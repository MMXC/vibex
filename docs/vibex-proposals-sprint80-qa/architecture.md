# S80 QA Architecture — Sprint80 产出物架构分析

## 项目类型
**QA 验证项目** — Sprint80 代码已全部在 `origin/main`，本项目负责验证产出物完整性，不做代码实现。

---

## 架构概览

```
origin/main (SHA 878427ea6)
├── S80-E1: 通知偏好设置管理面板
│   ├── IndexedDB: notification_prefs (DB v11)
│   ├── notificationStore (setPreference/getPreference/resetPreferences)
│   └── NotificationPreferencesPanel (绝对定位抽屉)
├── S80-E2: 模板分类/标签过滤测试
│   ├── templateStore.category.test.ts (19 tests)
│   └── CategoryFilter component tests
├── S80-E3: Merge History Enrichment
│   ├── canvasHistoryStore (enriched MergeHistoryEntry)
│   └── MergeHistoryPanel (Timeline 展开详情)
├── S80-E4: 画布设置中心
│   ├── SettingsModal.tsx (4 tabs)
│   └── DDSToolbar ⚙️ 集成
└── S80-E5: 协作者在线状态指示器
    ├── presenceStore (lastActiveAt/isOnline/updateLastActive)
    ├── OnlinePresenceIndicator.tsx
    └── useCollaboration.ts (PresenceUpdateMessage handling)
```

---

## E1 架构分析

### 新增文件
| 文件 | 作用 |
|------|------|
| `vibex-fronted/src/lib/db/notification_prefs.ts` | notification_prefs IndexedDB store |
| `vibex-fronted/src/components/dds/notifications/NotificationPreferencesPanel.tsx` | 设置面板 UI |
| `vibex-fronted/src/stores/dds/notificationStore.ts` | 偏好状态管理（已有，扩展） |

### 关键集成点
- `DDSToolbar.tsx`: 铃铛按钮 → NotificationPanel → NotificationPreferencesPanel
- `NotificationPanel.tsx`: 新增偏好设置入口

---

## E2 架构分析

### 测试文件
| 文件 | 覆盖范围 |
|------|---------|
| `vibex-fronted/src/stores/dds/__tests__/templateStore.category.test.ts` | 19 tests |

### 关键逻辑
- `templateStore.filterByCategory(categories: string[])` — AND 交集
- `templateStore.filterByTags(tags: string[])` — AND 交集
- `templateStore.searchTemplates(query, {category, tags})` — 多维度组合

---

## E3 架构分析

### 扩展的文件
| 文件 | 变更 |
|------|------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | MergeHistoryEntry 新增 3 字段 + recordMerge 扩展 |
| `vibex-fronted/src/components/dds/canvas-dashboard/MergeHistoryPanel.tsx` | Timeline 展开 + 贡献者渲染 |
| `vibex-fronted/src/lib/canvas/historyDB.ts` | 新增 3 个 IndexedDB 函数 |

### 测试文件
| 文件 | 覆盖范围 |
|------|---------|
| `vibex-fronted/src/stores/dds/__tests__/canvasHistoryStore.e3-merge-history.test.ts` | 4 tests |

---

## E4 架构分析

### 新增/修改文件
| 文件 | 作用 |
|------|------|
| `vibex-fronted/src/components/dds/settings/SettingsModal.tsx` | 4-tab 设置中心 |
| `vibex-fronted/src/stores/dds/settingsStore.ts` | lastOpenedTab 持久化（已有，扩展） |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | ⚙️ 设置按钮集成 |

### Tab 结构
```
SettingsModal
├── Tab 1: ShortcutSettingsPanel (快捷键) — 来自 S52-E5
├── Tab 2: CanvasSettingsPanel (画布) — 新增
├── Tab 3: NotificationSettingsPanel (通知) — 来自 E1
└── Tab 4: PerformanceSettingsPanel (性能) — 新增
```

---

## E5 架构分析

### 扩展的文件
| 文件 | 变更 |
|------|------|
| `vibex-fronted/src/stores/dds/presenceStore.ts` | lastActiveAt/isOnline/updateLastActive |
| `vibex-fronted/src/components/dds/collab/OnlinePresenceIndicator.tsx` | 在线状态圆点组件 |
| `vibex-fronted/src/lib/collaboration/useCollaboration.ts` | PresenceUpdateMessage 处理 |
| `vibex-fronted/src/components/dds/DDSFlow.tsx` | handleNodeMouseMove → updateLastActive |
| `vibex-fronted/src/pages/dds/DDSCanvasPage.tsx` | OnlinePresenceIndicator 集成 |

### WebSocket 消息类型
```ts
interface PresenceUpdateMessage {
  type: 'presence_update';
  userId: string;
  timestamp: number; // 更新时间戳
}
```

### 在线状态阈值
```ts
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟
isOnline(userId): boolean = (now - lastActiveAt[userId]) < OFFLINE_THRESHOLD_MS
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|---------|------|
| DDSToolbar | E1 + E4 | E1 铃铛按钮 + E4 ⚙️ 按钮共存 |
| NotificationPanel | E1 | E1 偏好设置入口 |
| DDSCanvasPage | E4 + E5 | E4 SettingsModal + E5 OnlinePresenceIndicator |

---

## 技术约束

1. **E5 `onlineUsers` 类型**: 必须是 `string[]`，使用 `.includes()` 而非 `.has()`
2. **E5 `OFFLINE_THRESHOLD_MS`**: 不导出，在 mock 的 `isOnline` 函数中硬编码 5 分钟
3. **E4 Tab 隔离**: 每个 Tab 状态独立存储，`setActiveTab` 不影响其他 Tab
4. **E3 Markdown 导出**: 使用 `marked` 或模板字符串，格式需包含 enriched fields

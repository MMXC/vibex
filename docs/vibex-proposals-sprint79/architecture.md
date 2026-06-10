# Sprint79 架构设计文档

**项目**: vibex-proposals-sprint79
**日期**: 2026-06-08
**架构师**: Hermes Coord

---

## 架构决策

### E1: 定时导出执行引擎

**现状分析**:
- `canvasListStore.ts` 已实现 `ScheduledExport` interface + CRUD actions（S78-E4）
- `parseCronNextRun()` 已存在于 `canvasListStore.ts`（S78-E4）
- `ZipExporter.exportWithWebhook()` 已实现（S78-E4）
- 缺失：执行引擎 — 定时轮询 + 触发

**架构决策**:
- 使用 `ScheduledExportRunner` 单例类，页面加载时在 React root 组件 `useEffect` 启动
- `setInterval` 60s 轮询 `canvasListStore.getState().scheduledExports`，避免高精度定时器开销
- 引擎本身无状态，结果写入 `canvasListStore`（统一状态管理）
- Webhook 执行使用 `try/catch` + 失败重试记录（`lastError` 字段）

**现有资产映射**:
| 文件 | 状态 | 改动 |
|------|------|------|
| `src/stores/dds/canvasListStore.ts` | ✅ 存在 | 新增 `markExportRun` action + `lastRunAt` 字段 |
| `src/services/export/ZipExporter.ts` | ✅ 存在 | 无改动（复用） |
| `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 存在 | 新增 `ScheduledExportPanel` 按钮入口 |
| `src/components/dds/settings/ScheduledExportPanel.tsx` | ✅ 存在（S78-E4） | 无改动 |

**新增文件**:
- `src/services/export/ScheduledExportRunner.ts`

**测试文件**:
- `src/stores/dds/__tests__/ScheduledExportRunner.test.ts`

---

### E2: 模板更新通知面板

**现状分析**:
- `notificationStore.ts` 已实现 `'template_update'` NotificationType（S78-E2）
- `DDSToolbar.tsx` 应已有通知铃铛（S68-E2 扩展），需验证
- `NotificationPanel.tsx` 存在（S68-E2）

**架构决策**:
- 复用现有 `NotificationPanel` 的 Tab 机制，新增「模板更新」Tab
- 模板更新通知的跳转目标为 `TemplateMarketplacePanel`
- `getUnreadCount()` 已支持所有 NotificationType，自动包含 template_update

**现有资产映射**:
| 文件 | 状态 | 改动 |
|------|------|------|
| `src/stores/dds/notificationStore.ts` | ✅ 存在（S68-E2） | 新增 `'comment_reply'`/`'mention'` 类型（E3 共享） |
| `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 存在 | 验证铃铛按钮存在（复用 S68-E2 扩展） |
| `src/components/dds/notifications/NotificationPanel.tsx` | ✅ 存在（S68-E2） | 新增 template_update Tab |
| `src/components/dds/template/TemplateMarketplacePanel.tsx` | ✅ 存在（S78-E2） | 接收跳转锚点参数 |

**新增文件**:
- `src/components/dds/notifications/__tests__/NotificationPanel.template-update.test.tsx`

---

### E3: 评论/提及通知系统

**现状分析**:
- `collabSessionStore.ts` 的 `addComment(parentId?)` 已有结构（S78-E3）
- `mentionStore.ts` 存在于 `src/stores/dds/mentionsStore.ts`（S51）
- `notificationStore.ts` 需要新增 `'comment_reply'`/`'mention'` 类型

**架构决策**:
- 评论通知：`collabSessionStore.addComment` 检测 `parentId` → 查父评论 authorId → `notificationStore.addNotification`
- 提及通知：`mentionStore` 在 `@` 输入完成提交时触发 `notificationStore.addNotification`
- 两类通知共用 `NotificationPanel` 的不同 Tab

**现有资产映射**:
| 文件 | 状态 | 改动 |
|------|------|------|
| `src/lib/collaboration/collabSessionStore.ts` | ✅ 存在（S78-E3） | 扩展 addComment reply 逻辑 |
| `src/stores/dds/mentionsStore.ts` | ✅ 存在（S51） | 扩展提及提交通知 |
| `src/stores/dds/notificationStore.ts` | ✅ 存在 | 新增 `'comment_reply'`/`'mention'` NotificationType |

**新增文件**:
- `src/stores/dds/__tests__/collabSessionStore.comments-notification.test.ts`（扩展现有）
- `src/stores/dds/__tests__/mentionStore.mention-notification.test.ts`

---

### E4: 画布关联网络可视化

**现状分析**:
- `canvasListStore.getCanvasRelations(canvasId)` 已实现（S78-E5）
- `CanvasRelationsPanel.tsx` 存在（S78-E5），仅列表视图

**架构决策**:
- `CanvasRelationGraph.tsx` 使用纯 CSS Grid/Flexbox 实现，无需引入图论库
- 中心节点在上方，父节点在左上，子节点在下方，关联节点在右侧
- 点击节点通过 `useRouter` 跳转

**现有资产映射**:
| 文件 | 状态 | 改动 |
|------|------|------|
| `src/components/dds/canvas/CanvasRelationsPanel.tsx` | ✅ 存在（S78-E5） | 新增 Tab 切换 |
| `src/stores/dds/canvasListStore.ts` | ✅ 存在 | `getCanvasRelations` 支持 `maxDepth` |

**新增文件**:
- `src/components/dds/canvas/CanvasRelationGraph.tsx`
- `src/components/dds/canvas/__tests__/CanvasRelationGraph.test.tsx`

---

### E5: 合并历史与差异查看器

**现状分析**:
- `canvasHistoryStore.ts` 的 `mergeBranch` / `autoMergeBranch` 已实现（S78-E1）
- `BranchManager.tsx` 存在（S78-E1），管理分支 UI

**架构决策**:
- `MergeHistoryEntry` 存入 `canvasHistoryStore.mergeHistory[]`，IndexedDB 持久化
- `recordMerge` 在 `autoMergeBranch` 成功后内部调用
- 合并历史面板用 Timeline 组件展示

**现有资产映射**:
| 文件 | 状态 | 改动 |
|------|------|------|
| `src/stores/dds/canvasHistoryStore.ts` | ✅ 存在（S78-E1） | 新增 mergeHistory state + actions |
| `src/components/dds/canvas-history/BranchManager.tsx` | ✅ 存在（S78-E1） | 新增 MergeHistoryPanel 入口 |

**新增文件**:
- `src/components/dds/canvas-history/MergeHistoryPanel.tsx`
- `src/stores/dds/__tests__/canvasHistoryStore.merge-history.test.ts`

---

## 跨 Epic 集成矩阵

| 组件 | E1 依赖 | E2 依赖 | E3 依赖 | E4 依赖 | E5 依赖 |
|------|---------|---------|---------|---------|---------|
| DDSToolbar | 定时导出按钮 | 铃铛按钮 | - | - | - |
| NotificationPanel | - | 模板更新Tab | 评论/提及Tab | - | - |
| canvasListStore | markExportRun | - | - | maxDepth | - |
| canvasHistoryStore | - | - | - | - | recordMerge |
| collabSessionStore | - | - | addComment reply | - | - |
| mentionStore | - | - | 提及通知 | - | - |
| notificationStore | template_update | template_update | comment_reply, mention | - | - |

---

## 技术风险

1. **E1 执行引擎持久性**：页面刷新后 `ScheduledExportRunner` 实例销毁。考虑将下次执行时间存入 localStorage，页面加载时计算是否需要立即执行遗漏任务。
2. **E4 图布局算法**：纯 CSS Grid 可能在关系数量 >5 时布局混乱。风险低，暂不加图论库。
3. **E5 历史记录完整性**：`recordMerge` 必须与 `autoMergeBranch` 同步调用，需确保每次合并后都有记录。

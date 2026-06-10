# S74 Architecture — VibeX Sprint74 架构设计

**Sprint**: vibex-proposals-sprint74  
**日期**: 2026-06-07

---

## 架构决策

### E1: 搜索历史记录 — 架构决策

**决策1: Zustand persist vs localStorage**
- 使用 Zustand `persist` middleware，key = `canvas-search-history`
- 优势：与现有 `canvasSearchStore` 共存，无额外依赖

**决策2: 历史渲染位置**
- 在 `CanvasSearchPanel` (S73-E1，``canvas/`子目录) 输入框上方渲染 chips
- 不新增独立组件，保持改动最小化

**决策3: 去重策略**
- 新搜索追加到头部，扫描并移除已存在的相同词条后再 unshift
- 保证顺序为最近优先

---

### E2: 模板标签与分类筛选 — 架构决策

**决策1: TemplateSnapshot.tags 类型**
```typescript
// 扩展现有接口（向后兼容）
interface TemplateSnapshot {
  // ... 现有字段
  tags?: string[]; // E4 新增，可选
}
```

**决策2: 标签来源**
- 新建模板时用户提供 tags
- 导入模板默认 tag = 'Imported'
- 历史模板批量补充默认 Design/Analysis/Collab

**决策3: 筛选实现**
- `filterTemplatesByTag(tag: string | null)` 作为 getter 返回派生数据
- 不改变 store 状态，只做视图层过滤

**决策4: 现有文件映射**

| 文件 | 路径 | 状态 | E4 改动 |
|------|------|------|---------|
| Zustand store | `vibex-fronted/src/stores/templateStore.ts` | ✅ 存在 | 扩展 interface + getter |
| Gallery 组件 | `vibex-fronted/src/components/dds/templates/TemplateGallery.tsx` | ✅ 存在 | 新增标签栏 |
| Preview 组件 | `vibex-fronted/src/components/dds/templates/TemplatePreviewPanel.tsx` | ✅ 存在 | 无改动 |

---

### E3: 画布分支对比视图 — 架构决策

**决策1: BranchDiff 计算范围**
- 对比两个分支的节点列表（不含边）
- 通过 `listSnapshots(branchId)` 获取快照，对比节点内容

**决策2: BranchDiffResult 结构**
```typescript
interface BranchDiffResult {
  sourceBranchId: string;
  targetBranchId: string;
  added: CanvasNode[];
  removed: CanvasNode[];
  modified: CanvasNode[]; // ID 相同但内容不同
  timestamp: number;
}
```

**决策3: HistoryPanel 选中模式**
- Ctrl+Click 多选（类比文件管理器习惯）
- 选中状态存于组件内部 state（`selectedBranches: string[]`）
- "对比"按钮在选中 2 个分支时激活

**决策4: BranchDiffDialog 实现**
- 新建 `BranchDiffDialog.tsx`（`history/` 子目录）
- 三栏布局：Added(绿) / Removed(红) / Modified(黄)
- 节点点击展开详情

**决策5: 现有文件映射**

| 文件 | 路径 | 状态 | E3 改动 |
|------|------|------|---------|
| History store | `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | ✅ 存在 | 新增 compareBranches |
| History panel | `vibex-fronted/src/components/dds/history/HistoryPanel.tsx` | ✅ 存在 | 选中模式 + 对比按钮 |
| historyDB | `vibex-fronted/src/lib/canvas/historyDB.ts` | ✅ 存在 (via S73-E4) | 无改动 |

---

### E4: @mention 通知推送闭环 — 架构决策

**决策1: mention 解析时机**
- 在 `activityStore.addEntry` 内部执行 `@username` 解析
- 使用正则 `/@([\w-]+)/g` 匹配

**决策2: 重复通知去重**
- 以 `(sessionId, fromUserId, targetUserId, messageId)` 为 key 缓存
- 已发送则跳过，避免重复

**决策3: mention 类型集成**
- `notificationStore.addNotification` 的 `type: 'mention'` 字段
- `preferences.typeEnabled.mention` 独立开关（已有结构支持）
- `NotificationPanel` 中 mention section 独立渲染

**决策4: 通知跳转**
- mention 通知的 payload 包含 `messageId` + `canvasId`
- 点击通知 → `ddnStore.focusMessage(messageId)`

**决策5: 现有文件映射**

| 文件 | 路径 | 状态 | E4 改动 |
|------|------|------|---------|
| Activity store | `vibex-fronted/src/lib/collaboration/activityStore.ts` | ✅ 存在 | 解析 @ + 调用 notify |
| Mentions store | `vibex-fronted/src/stores/dds/mentionsStore.ts` | ✅ 存在 | 无改动（仅 UI 状态） |
| Notification store | `vibex-fronted/src/stores/notificationStore.ts` | ✅ 存在 | mention type 处理 |
| Notification panel | `vibex-fronted/src/components/dds/notifications/NotificationPanel.tsx` | ✅ 存在 | mention section |

---

### E5: 键盘导航增强 — 架构决策

**决策1: 焦点管理策略**
- 面板打开：`containerRef.current?.focus()`
- 关闭还原：`document.getElementById(triggerId)?.focus()`
- 触发元素通过 `data-trigger-focus` 属性标记

**决策2: aria-activedescendant**
- 列表类组件使用 `aria-activedescendant` 指向当前选中项 ID
- 避免将 DOM 焦点移到每项，而是维持在容器

**决策3: 实现顺序**
- E5 作为跨切任务，在 E1–E4 面板实现后统一补充键盘导航
- 验收标准统一测试

---

## 跨 Epic 集成点

| 集成点 | 源 Epic | 目标 Epic | 接口 |
|--------|---------|-----------|------|
| canvasSearchStore | E1 | E5 | 键盘导航需感知搜索结果列表 |
| templateStore | E2 | E5 | 键盘导航需感知模板卡片 |
| canvasHistoryStore | E3 | E5 | HistoryPanel 键盘导航 |
| notificationStore | E4 | E5 | NotificationPanel 键盘导航 |
| activityStore | E4 | E1 | 无直接依赖，但 E1 搜索历史可能影响 E4 通知跳转 |

---

## 技术风险与缓解

| 风险 | 缓解 |
|------|------|
| BranchDiff 计算慢 | async + AbortController，支持大画布取消 |
| 通知重复 | 缓存去重 key（sessionId + from + to + msgId） |
| 模板标签数据迁移 | 增量脚本 + 默认 tag 保底 |

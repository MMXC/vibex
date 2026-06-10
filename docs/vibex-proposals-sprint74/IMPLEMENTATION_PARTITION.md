# S74 IMPLEMENTATION_PARTITION — VibeX Sprint74 实施分片

**Sprint**: vibex-proposals-sprint74  
**日期**: 2026-06-07  
**Epic 数**: 5

---

## E1: 搜索历史记录与最近搜索

### DoD Checklist
- [ ] `canvasSearchStore` 新增 `recentSearches: string[]` 状态（persist，max 20 条）
- [ ] `canvasSearchStore` 新增 `addRecentSearch(query)` action
- [ ] `CanvasSearchPanel.tsx`（``canvas/`）输入框上方渲染最近搜索 chips
- [ ] 搜索提交时调用 `addRecentSearch`
- [ ] 提供"清除历史"按钮（× 图标）
- [ ] `canvasSearchStore.test.ts` 新增 recentSearch 测试（≥4 用例）
- [ ] `CanvasSearchPanel.test.tsx` 新增历史渲染测试（≥3 用例）

### 新增/扩展文件

| 文件 | 路径 | 操作 | 说明 |
|------|------|------|------|
| canvasSearchStore | `vibex-fronted/src/stores/canvasSearchStore.ts` | 扩展 | + recentSearches + addRecentSearch |
| canvasSearchStore.test | `vibex-fronted/src/stores/__tests__/canvasSearchStore.test.ts` | 扩展 | + 4 recentSearch tests |
| CanvasSearchPanel | `vibex-fronted/src/components/dds/canvas/CanvasSearchPanel.tsx` | 扩展 | + history chips + clear btn |
| CanvasSearchPanel.test | `vibex-fronted/src/components/dds/canvas/__tests__/CanvasSearchPanel.test.tsx` | 扩展 | + 3 keyboard/history tests |

### expect() 断言示例
```typescript
expect(getState().recentSearches.length).toBeLessThanOrEqual(20);
expect(getState().recentSearches[0]).toBe('最新搜索词');
addRecentSearch('test'); addRecentSearch('test');
expect(getState().recentSearches.filter(s => s === 'test').length).toBe(1);
```

---

## E2: 模板标签与分类筛选

### DoD Checklist
- [ ] `TemplateSnapshot` 接口新增 `tags?: string[]` 字段
- [ ] `templateStore` 新增 `filterTemplatesByTag(tag: string | null)` getter
- [ ] `TemplateGallery.tsx` 顶部新增标签筛选栏（chips：All + 预设标签）
- [ ] 多标签 AND 筛选逻辑
- [ ] 历史模板补充默认 tags（Design/Analysis/Collab）
- [ ] 标签筛选状态在面板内保留（component state）
- [ ] `templateStore.test.ts` 新增 filterTemplatesByTag 测试（≥4 用例）
- [ ] `TemplateGallery.test.tsx` 新增标签筛选测试（≥4 用例）

### 新增/扩展文件

| 文件 | 路径 | 操作 | 说明 |
|------|------|------|------|
| templateStore | `vibex-fronted/src/stores/templateStore.ts` | 扩展 | + tags interface + filterTemplatesByTag |
| templateStore.test | `vibex-fronted/src/stores/__tests__/templateStore.test.ts` | 扩展 | + 4 filter tests |
| TemplateGallery | `vibex-fronted/src/components/dds/templates/TemplateGallery.tsx` | 扩展 | + tag filter bar |
| TemplateGallery.test | `vibex-fronted/src/components/dds/templates/__tests__/TemplateGallery.test.tsx` | 新建 | + 4 tag filter tests |

---

## E3: 画布分支对比视图

### DoD Checklist
- [ ] `canvasHistoryStore` 新增 `compareBranches(sourceId, targetId)` action
- [ ] `BranchDiffResult` 类型定义
- [ ] `HistoryPanel.tsx` 分支列表 Ctrl+Click 多选模式
- [ ] "对比"按钮：选中 2 个分支后激活
- [ ] `BranchDiffDialog.tsx` 新建（三栏：added/removed/modified）
- [ ] `BranchDiffDialog.module.css` 新建
- [ ] "对比到主分支"快捷操作
- [ ] `canvasHistoryStore.test.ts` 新增 compareBranches 测试（≥6 用例）
- [ ] `BranchDiffDialog.test.tsx` 新建（≥5 用例）

### 新增/扩展文件

| 文件 | 路径 | 操作 | 说明 |
|------|------|------|------|
| canvasHistoryStore | `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | 扩展 | + compareBranches |
| canvasHistoryStore test | `vibex-fronted/src/stores/dds/__tests__/canvasHistoryStore.test.ts` | 扩展 | + 6 compare tests |
| HistoryPanel | `vibex-fronted/src/components/dds/history/HistoryPanel.tsx` | 扩展 | + multi-select + compare btn |
| BranchDiffDialog | `vibex-fronted/src/components/dds/history/BranchDiffDialog.tsx` | 新建 | diff modal |
| BranchDiffDialog CSS | `vibex-fronted/src/components/dds/history/BranchDiffDialog.module.css` | 新建 | modal styles |
| BranchDiffDialog test | `vibex-fronted/src/components/dds/history/__tests__/BranchDiffDialog.test.tsx` | 新建 | + 5 tests |

### expect() 断言示例
```typescript
const diff = compareBranches('branch-A', 'main');
expect(diff.added.length).toBeGreaterThanOrEqual(0);
expect(diff.added.every(n => n.branchId === 'main')).toBe(true);
expect(diff.removed.every(n => n.branchId === 'branch-A')).toBe(true);
```

---

## E4: @mention 通知推送闭环

### DoD Checklist
- [ ] `activityStore.addEntry` 解析消息 `@username` 正则
- [ ] 解析结果调用 `notificationStore.addNotification({ type: 'mention', ... })`
- [ ] mention 类型支持 `isTypeEnabled` 过滤（preferences.typeEnabled.mention）
- [ ] `NotificationPanel` 独立 mention section
- [ ] mention 通知点击跳转至消息（canvasId + messageId）
- [ ] 重复 @ 同一用户不重复通知
- [ ] `notificationStore.test.ts` 新增 mention 测试（≥5 用例）

### 新增/扩展文件

| 文件 | 路径 | 操作 | 说明 |
|------|------|------|------|
| activityStore | `vibex-fronted/src/lib/collaboration/activityStore.ts` | 扩展 | + @解析 + notify 调用 |
| activityStore test | `vibex-fronted/src/lib/collaboration/__tests__/activityStore.test.ts` | 扩展 | + 5 mention tests |
| notificationStore | `vibex-fronted/src/stores/notificationStore.ts` | 扩展 | mention type 处理 |
| notificationStore test | `vibex-fronted/src/stores/__tests__/notificationStore.test.ts` | 扩展 | + 5 mention tests |
| NotificationPanel | `vibex-fronted/src/components/dds/notifications/NotificationPanel.tsx` | 扩展 | + mention section |

### expect() 断言示例
```typescript
activityStore.addEntry({ message: 'Hello @alice how are you?', sessionId: 's1', fromUserId: 'bob' });
const mentions = getState().notifications.filter(n => n.type === 'mention');
expect(mentions.some(n => n.targetUserId === 'alice')).toBe(true);
```

---

## E5: 键盘导航增强

### DoD Checklist
- [ ] `CanvasSearchPanel`：↑↓ 导航，Enter 选中，Esc 关闭，`aria-activedescendant`
- [ ] `TemplateGallery`：Tab 导航卡片，Enter 打开，`role="grid"`
- [ ] `TemplatePreviewPanel`：Esc 关闭，Tab 导航详情
- [ ] `NotificationPanel`：Tab 导航，Enter 已读/跳转，`role="list"`
- [ ] `BranchDiffDialog`：Tab 导航三栏，Esc 关闭（E3 已建）
- [ ] 面板打开 focus 移入，关闭焦点还原
- [ ] 各面板 vitest 键盘交互测试（每面板 ≥3 用例）

### 扩展文件

| 文件 | 路径 | 操作 | E5 改动 |
|------|------|------|---------|
| CanvasSearchPanel | `vibex-fronted/src/components/dds/canvas/CanvasSearchPanel.tsx` | 扩展 | + keyboard nav |
| CanvasSearchPanel.test | `vibex-fronted/src/components/dds/canvas/__tests__/CanvasSearchPanel.test.tsx` | 扩展 | + 3 keyboard tests |
| TemplateGallery | `vibex-fronted/src/components/dds/templates/TemplateGallery.tsx` | 扩展 | + Tab nav + role |
| TemplateGallery.test | `vibex-fronted/src/components/dds/templates/__tests__/TemplateGallery.test.tsx` | 扩展 | + 3 keyboard tests |
| TemplatePreviewPanel | `vibex-fronted/src/components/dds/templates/TemplatePreviewPanel.tsx` | 扩展 | + Esc + Tab |
| NotificationPanel | `vibex-fronted/src/components/dds/notifications/NotificationPanel.tsx` | 扩展 | + keyboard nav |
| NotificationPanel.test | `vibex-fronted/src/components/dds/notifications/__tests__/NotificationPanel.test.tsx` | 新建 | + 3 keyboard tests |

---

## 测试命令

```bash
cd vibex-fronted

# E1 搜索历史
npx vitest run canvasSearchStore.test.ts --reporter=verbose
npx vitest run CanvasSearchPanel.test.tsx --reporter=verbose

# E2 模板标签
npx vitest run templateStore.test.ts --reporter=verbose
npx vitest run TemplateGallery.test.tsx --reporter=verbose

# E3 分支对比
npx vitest run canvasHistoryStore.test.ts --reporter=verbose
npx vitest run BranchDiffDialog.test.tsx --reporter=verbose

# E4 @mention 通知
npx vitest run activityStore.test.ts --reporter=verbose
npx vitest run notificationStore.test.ts --reporter=verbose

# E5 键盘导航
npx vitest run CanvasSearchPanel.test.tsx --reporter=verbose
npx vitest run TemplateGallery.test.tsx --reporter=verbose
npx vitest run NotificationPanel.test.tsx --reporter=verbose
```

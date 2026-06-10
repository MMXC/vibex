# VibeX Sprint67 架构设计文档

**Sprint**: vibex-proposals-sprint67  
**版本**: 1.0  
**日期**: 2026-06-06  
**架构师**: architect (phantom ghost — coord self-impl)  
**上游**: vibex-proposals-sprint67/prd.md

---

## 架构决策摘要

S67 在现有 S66 架构基础上扩展 5 个 Epic，新增 2 个 Store（`activityStreamStore` 扩展 `presenceStore`）、3 个新组件、2 个导出服务。所有扩展均遵循现有 Zustand + IndexedDB 架构模式。

---

## E1: 画布分支快照视觉对比 — 架构决策

### AD-E1.1: compareBranches 算法
在 `canvasHistoryStore` 中新增 `compareBranches(branchA, branchB)` action，基于 IndexedDB 中的快照数据做集合比较。

**算法**:
1. 分别从 `historyDB` 加载分支 A 和分支 B 的所有快照
2. 取每个分支的**最新快照**作为对比基准
3. 比较两分支的节点集合：新增（A 有 B 无）/ 删除（B 有 A 无）/ 修改（ID 相同但内容不同）

```typescript
// canvasHistoryStore.ts 新增
compareBranches(branchA: string, branchB: string): BranchDiff[] {
  const snapA = getLatestSnapshot(branchA);
  const snapB = getLatestSnapshot(branchB);
  // 节点集合比较，返回 diff 数组
}
```

### AD-E1.2: BranchDiffPanel 组件结构
- 位置: `vibex-fronted/src/components/dds/canvas-history/BranchDiffPanel.tsx`
- Props: `{ branchA: string; branchB: string; onClose: () => void; }`
- 内部状态: `diff[]` from `canvasHistoryStore.compareBranches()`

### AD-E1.3: HistoryPanel 集成
- 新增"对比分支"按钮 → 弹出分支选择器 Modal → 渲染 BranchDiffPanel
- 分支选择器: `select` 下拉，显示所有分支名（来自 `listBranches()`）

### AD-E1.4: Existing Asset 映射
| IMP Path | 现状 | 决策 |
|----------|------|------|
| `canvasHistoryStore.ts` | ✅ 已存在（E1 分支 CRUD） | 扩展 compareBranches action |
| `historyDB.ts` | ✅ 已存在（E1 分支 CRUD） | 扩展 getLatestSnapshot |
| `HistoryPanel.tsx` | ✅ 已存在（E1 分支 UI） | 新增对比按钮 |
| `BranchDiffPanel.tsx` | ❌ 新建 | 新增组件 |

---

## E2: 实时协作活动流面板 — 架构决策

### AD-E2.1: presenceStore 扩展
在现有 `presenceStore.ts` 中扩展：
- 新增 `recentActivity[]` 状态（Zustand state）
- 新增 `addActivity()` action — 添加活动并截断至 20 条
- 新增 `clearActivity()` action — 清空活动历史

### AD-E2.2: WebSocket 消息扩展
扩展 `CollabWebSocket` 消息处理：
- 新增 `user:activity` 消息类型: `{ type: 'activity', userId, userName, activity: ActivityType, nodeId?, timestamp }`
- 节流广播: 使用 `throttle` (lodash) 将同一用户的活动节流至 1 msg/sec

```typescript
// wsActivityHandler.ts
const throttleActivity = throttle((activity: ActivityEvent) => {
  broadcast({ type: 'activity', ...activity });
}, 1000);
```

### AD-E2.3: CollabActivityPanel 组件结构
- 位置: `vibex-fronted/src/components/dds/collab/CollabActivityPanel.tsx`
- Props: `{ isOpen: boolean; onClose: () => void; }`
- 两个区块: 在线用户列表 + 活动时间线
- 活动类型图标映射表:
  - join → `👤+`, leave → `👤-`, focus → `👁`, edit → `✏️`, lock → `🔒`, unlock → `🔓`

### AD-E2.4: DDSFlow 集成
在 `DDSFlow.tsx` 的节点操作回调中发布 activity 事件:
- `onNodeFocus` → activity type: 'focus'
- `onNodeDrag` → activity type: 'edit'
- `onNodeClick` (当节点被其他用户锁定) → activity type: 'lock-attempt'

### AD-E2.5: Existing Asset 映射
| IMP Path | 现状 | 决策 |
|----------|------|------|
| `presenceStore.ts` | ✅ 已存在（E2 节点锁定） | 扩展 recentActivity + addActivity |
| `DDSFlow.tsx` | ✅ 已存在（E2 锁定检测） | 新增 activity 发布 |
| `wsNodeFocusHandler.ts` | ✅ 已存在（E2 WS 消息） | 扩展 user:activity 消息 |
| `CollabActivityPanel.tsx` | ❌ 新建 | 新增组件 |
| `wsActivityHandler.ts` | ❌ 新建 | 新增 WS 消息处理器 |

---

## E3: 模板画廊使用分析 + AI 推荐 — 架构决策

### AD-E3.1: templateStore 扩展
在 `templateStore.ts` 中新增 selectors:

```typescript
// templateStore.ts selectors
topTemplates(n: number): Template[] {
  return Object.values(templates)
    .sort((a, b) => b.stats.usageCount - a.stats.usageCount)
    .slice(0, n);
}

getCategoryStats(): Record<string, number> {
  // 统计每个分类的使用量
}

calcRecommendScore(template: Template): number {
  const usageScore = template.stats.usageCount / maxUsage;
  const tagMatchScore = calculateTagMatch(template, recentSearches);
  const recencyScore = calculateRecency(template.lastUsedAt);
  return usageScore * 0.5 + tagMatchScore * 0.3 + recencyScore * 0.2;
}
```

### AD-E3.2: TemplateAnalytics 组件结构
- 位置: `vibex-fronted/src/components/dds/templates/TemplateAnalytics.tsx`
- Props: `{ isOpen: boolean; onClose: () => void; }`
- 三个区块: 排行榜（Top 10）/ 分类柱状图 / 使用趋势

### AD-E3.3: TemplateGallery 扩展
- 新增"为你推荐" Tab (第4个 Tab)
- 推荐逻辑: `calcRecommendScore` 对所有模板评分，取 Top-N

### AD-E3.4: Existing Asset 映射
| IMP Path | 现状 | 决策 |
|----------|------|------|
| `templateStore.ts` | ✅ 已存在（S65-E5 频率统计） | 扩展 selectors |
| `TemplateGallery.tsx` | ✅ 已存在（S66-E4） | 新增推荐 Tab |
| `TemplateAnalytics.tsx` | ❌ 新建 | 新增分析面板 |

---

## E4: 画布快捷键可配置化 — 架构决策

### AD-E4.1: shortcutStore 扩展
在 `shortcutStore.ts` 中扩展:
- 新增 `customBindings[]` 状态
- 新增 actions: `addBinding / removeBinding / updateBinding / importBindings / exportBindings`
- 冲突检测: `hasConflict(key)` 查询

```typescript
// shortcutStore.ts
interface CustomBinding {
  id: string;
  key: string;
  action: string;
  description?: string;
}
```

### AD-E4.2: ShortcutEditor 组件
- 位置: `vibex-fronted/src/components/dds/shortcuts/ShortcutEditor.tsx`
- Key Recorder: `useKeyRecorder()` hook，监听 `keydown` 事件捕获按键

### AD-E4.3: ShortcutSettingsPanel 扩展
- 新增"自定义绑定"区块（Expandable Section）
- 每个绑定行: `[快捷键] [操作名] [删除]` + 添加按钮
- 底部: `[导入 JSON]` `[导出 JSON]`

### AD-E4.4: Existing Asset 映射
| IMP Path | 现状 | 决策 |
|----------|------|------|
| `shortcutStore.ts` | ✅ 已存在（S52-E5） | 扩展 customBindings CRUD |
| `ShortcutSettingsPanel.tsx` | ✅ 已存在（S52-E5） | 新增自定义区块 |
| `ShortcutEditor.tsx` | ❌ 新建 | 新增编辑器组件 |

---

## E5: 画布导出增强：PDF/SVG — 架构决策

### AD-E5.1: PdfExporter 服务
- 位置: `vibex-fronted/src/services/export/PdfExporter.ts`
- 依赖: `jspdf` + `html2canvas`
- API:
  ```typescript
  exportPdf(nodes: Node[], options: PdfOptions): Promise<Blob>
  interface PdfOptions { paper: 'A4' | 'Letter'; pages: 'single' | 'multi'; margin: number; }
  ```

### AD-E5.2: SvgExporter 服务
- 位置: `vibex-fronted/src/services/export/SvgExporter.ts`
- 纯前端 SVG 生成，无外部依赖
- API:
  ```typescript
  exportSvg(nodes: Node[]): Promise<string>  // 返回 SVG 字符串
  ```

### AD-E5.3: ExportMenu 扩展
- 新增 ExportPDFModal: 纸张选择 + 预览
- 新增 ExportSVGButton: 直接触发 SVG 下载

### AD-E5.4: ExportProgress 扩展
- 新增 `PdfExportProgress` variant
- 支持取消操作

### AD-E5.5: Existing Asset 映射
| IMP Path | 现状 | 决策 |
|----------|------|------|
| `ZipExporter.ts` | ✅ 已存在（S54-E4） | 参考模式 |
| `ExportMenu.tsx` | ✅ 已存在（S54-E4） | 新增 PDF/SVG 选项 |
| `ExportProgress.tsx` | ✅ 已存在（S54-E4） | 扩展进度组件 |
| `PdfExporter.ts` | ❌ 新建 | 新增服务 |
| `SvgExporter.ts` | ❌ 新建 | 新增服务 |

---

## 跨 Epic 集成点

| 集成 | 源 | 目标 | 接口 |
|------|----|----|------|
| BranchDiffPanel → HistoryPanel | E1 | E1 (S66) | `compareBranches()` |
| CollabActivityPanel → presenceStore | E2 | E2 (S66) | `recentActivity[]` |
| CollabActivityPanel → DDSFlow | E2 | E2 (S66) | WS `user:activity` |
| TemplateAnalytics → TemplateGallery | E3 | E4 (S66) | `topTemplates()` selectors |
| ShortcutEditor → ShortcutSettingsPanel | E4 | E4 (S52) | `customBindings[]` |
| PdfExporter/SvgExporter → ExportMenu | E5 | E5 (S54) | `exportPdf/exportSvg()` |

---

## Package 依赖变更

| 依赖 | 用途 | 影响范围 |
|------|------|----------|
| `jspdf` (新增) | PDF 生成 | E5 |
| `html2canvas` (新增 if not present) | PDF 截图 | E5 |
| `lodash.throttle` (或自实现) | 活动流节流 | E2 |

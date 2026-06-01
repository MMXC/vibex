# VibeX Sprint 49 架构设计

> **Agent**: coord (heartbeat self-impl — architect phantom ghost, running_agents=null)
> **日期**: 2026-06-01
> **输入**: prd.md + analysis.md

---

## 架构决策总览

| Epic | 架构模式 | 改动范围 | 现有依赖 |
|------|---------|---------|---------|
| E1 | Hook 扩展 + Context | useStreamingAgent.ts | Sprint43 SSE, Sprint45 P001-E1 retry |
| E2 | Store 扩展 + 组件 | templateStore.ts + 2 components | Sprint42 TemplateGallery |
| E3 | 视口层注入 | viewportBoundsStore.ts | React Flow 内置 |
| E4 | Store 扩展 + 组件 | canvasHistoryStore.ts + 2 components | Sprint15 SnapshotSelector |
| E5 | 新 Store + 组件 | commentStore.ts (new) + 2 components | IndexedDB (已有) |

**所有 Epic 均为前端改动，无后端依赖。**

---

## E1 — AI 断线重连 + 流式可靠性增强

### 现有状态
`useStreamingAgent` (Sprint43 E2, Sprint45 P001-E1) 已实现：
- `maxRetries` 参数（当前默认值 0）
- `retrying` 状态 (number)
- `lastError` 状态
- `AbortController` 管理
- `streamingChunkDB` IndexedDB 持久化（Sprint45）

### 需新增 / 修改
**文件**: `src/hooks/useStreamingAgent.ts`

```typescript
// 新增参数
interface UseStreamingAgentOptions {
  // ... existing ...
  retryBaseDelay?: number;  // 默认 1000ms
  retryMaxDelay?: number;   // 默认 8000ms
  requestTimeout?: number;  // 默认 60000ms (60s)
}

// 新增状态
const [retryCount, setRetryCount] = useState(0);       // 当前重试次数
const [retryStatus, setRetryStatus] = useState<'idle'|'retrying'|'timeout'|'success'>('idle');
```

### 指数退避重试实现
```typescript
// 在 fetchWithRetry 中替换简单 retry loop
function getBackoffDelay(attempt: number, base: number, max: number): number {
  const delay = Math.min(base * Math.pow(2, attempt - 1), max);
  // jitter: ±20%
  return delay * (0.8 + Math.random() * 0.4);
}
```

### 超时保护
- `AbortController.timeout` 通过 `setTimeout(signal.abort, 60000)` 实现
- 超时时设置 `retryStatus = 'timeout'`，UI 显示 "请求超时，请重试"

### UI 重连 Badge
- 复用现有 `ConnectionStatus` 组件
- 新增 `RetryBadge`: 显示 "正在重连 (N/3)" 或 "请求超时" 或 "重连成功"
- 挂载点: `ConnectionStatus` 内部或 AI Panel 顶部

### 架构决策
1. **不修改 SSE 端点**：所有重试在客户端实现，/api/ai/generate 保持幂等
2. **重试状态独立于 messages**：重试不影响已累积的 messages
3. **streamingChunkDB 复用**：断线后从 IndexedDB 恢复 chunk，避免重复生成

---

## E2 — 画布模板管理完善

### 现有状态
`templateStore.ts` 已实现：
- `templates`, `filteredTemplates`, `selectedTemplate`
- `selectedCategory`, `searchQuery`
- `toggleFavorite`, `inferCategory`, `isFavorite`, `getFavorites` (Sprint48 E2 partial)
- `saveTemplateVersion`, `getTemplateHistory`, `getTemplateVersion` (Sprint48 E4 partial)

### 需新增 / 修改
**文件**: `src/stores/templateStore.ts`

```typescript
// 新增状态
interface TemplateState {
  // ... existing ...
  thumbnailCache: Record<string, string>;  // templateId -> SVG string (IndexedDB key)
  thumbnailLoading: Record<string, boolean>;
  
  // 新增操作
  generateThumbnail: (templateId: string) => Promise<string>;  // SVG → IndexedDB
  searchTemplates: (query: string) => RequirementTemplate[];
  filterByCategory: (category: TemplateCategory | 'all') => void;
  renameTemplate: (templateId: string, newName: string) => void;
}
```

### 组件
1. **TemplateSearchBar** (`src/components/dds/templates/TemplateSearchBar.tsx`)
   - 模糊搜索 input（`name.includes(query)`）
   - 实时过滤 `filteredTemplates`
   
2. **CategoryFilter** (`src/components/dds/templates/CategoryFilter.tsx`)
   - 按钮组: all / blank / flowchart / mindmap / swot
   - 点击切换 `selectedCategory`

3. **TemplateThumbnail** (`src/components/dds/templates/TemplateThumbnail.tsx`)
   - 首次打开模板时生成 SVG snapshot
   - 存入 `thumbnailCache` (Zustand persist → IndexedDB)

4. **TemplateSaveDialog** 改造
   - 新增 `name` 可编辑字段（原来只保存内容）
   - 保存时调用 `renameTemplate(id, name)`

### 缩略图生成
```typescript
// SVG snapshot via html-to-image or React Flow 的 MiniMap snapshot
async function generateTemplateThumbnail(canvasContent: CanvasData): Promise<string> {
  // 使用 MiniMap 或手动构建 SVG 预览
  // 返回 SVG string，存入 IndexedDB
}
```

### 架构决策
1. **不修改 TemplateGallery 整体结构**：只扩展现有 store
2. **搜索用 includes 匹配**：简单实现，fuzzy search 后续迭代
3. **缩略图用 SVG string**：无需 blob URL，避免 URL.createObjectURL 清理问题

---

## E3 — 大型画布性能优化 v2

### 现有状态
`viewportBoundsStore.ts` 管理视口边界。
React Flow 的 `nodeExtent` 和 `onlyRenderVisibleElements` 均为内置配置项。

### 需新增 / 修改
**文件**: `src/lib/canvas/stores/viewportBoundsStore.ts` 或新建 `src/lib/canvas/stores/viewportPerfStore.ts`

```typescript
interface ViewportPerfState {
  nodeExtent: [number, number, number, number] | undefined;  // [[x1,y1],[x2,y2]]
  onlyRenderVisible: boolean;  // default: true
  offscreenDebounceMs: number; // default: 100
  zoomDebounceMs: number;     // default: 100
  isZoomDebouncing: boolean;
  
  setNodeExtent: (extent: [number, number, number, number]) => void;
  setOnlyRenderVisible: (v: boolean) => void;
  scheduleOffscreenRender: (nodeId: string) => void;
  debouncedZoom: () => void;
}
```

### React Flow 配置注入
在 `DDSFlow.tsx` 或 `flowStore.ts` 中：

```typescript
// viewport 层配置
const viewportConfig = {
  nodeExtent: viewportPerf.nodeExtent ?? [[-5000, -5000], [5000, 5000]],
  onlyRenderVisibleElements: viewportPerf.onlyRenderVisible,
  // 懒加载 offscreen 节点
  nodeExtent: viewportPerf.nodeExtent,
};

// debounce zoom updates
const debouncedViewportUpdate = useMemo(() => 
  debounce((update) => applyViewportUpdate(update), viewportPerf.zoomDebounceMs),
[]);
```

### 架构决策
1. **nodeExtent = ±5000**：覆盖大多数实际画布，边界外节点不渲染
2. **debounce 用 Zustand action 而非组件级 useMemo**：store 级别管理更一致
3. **onlyRenderVisible 默认开启**：React Flow 内置，不额外安装依赖
4. **性能测试改为行为测试**：debounce 调用次数（`vi.spyOn`）代替 fps

---

## E4 — 画布版本历史可视化

### 现有状态
`canvasHistoryStore.ts` (DDS 层) 实现 Command Pattern undo/redo：
- `past: Command[]` — 历史栈
- `snapshots` 不在此 store（另有 `SnapshotSelector` from Sprint15）

### 需新增 / 修改
**文件**: `src/stores/dds/snapshotHistoryStore.ts` (新建) 或扩展现有 snapshot 相关 store

```typescript
interface SnapshotHistoryState {
  snapshots: Snapshot[];  // 扩展现有 snapshot 类型
  autoSnapshotPending: boolean;
  
  addAutoSnapshot: (type: 'ai-generate' | 'pre-export') => void;
  getSnapshotsByType: (type: string) => Snapshot[];
  compareSnapshots: (id1: string, id2: string) => SnapshotDiff;
  // debounce: 2s 内不重复触发
  scheduleAutoSnapshot: (type: 'ai-generate' | 'pre-export') => void;
}
```

### 新增组件
1. **Timeline 组件** (`src/components/dds/version-history/Timeline.tsx`)
   - 水平滚动时间轴
   - 节点: AI 生成标记 / 导出前标记 / 手动快照
   - 点击节点: 预览该快照

2. **SnapshotDiff 组件** (`src/components/dds/version-history/SnapshotDiff.tsx`)
   - 双栏对比视图
   - 高亮变化节点

### auto-snapshot hook
```typescript
// 在 useStreamingAgent 的 onComplete 中调用
const handleAIGenerateComplete = () => {
  snapshotHistoryStore.getState().addAutoSnapshot('ai-generate');
};

// 在导出流程入口调用
const handleExport = async () => {
  snapshotHistoryStore.getState().addAutoSnapshot('pre-export');
  // 然后执行导出...
};
```

### 架构决策
1. **新 snapshotHistoryStore 独立于 canvasHistoryStore**：职责分离
2. **auto-snapshot debounce 2s**：防止连续编辑触发多次快照
3. **Timeline 虚拟滚动**：只渲染可见节点，长历史不卡

---

## E5 — 协作评论系统

### 需新增
**文件**: `src/stores/dds/commentStore.ts` (新建)

```typescript
interface Comment {
  commentId: string;
  nodeId: string;
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
  version: number;  // 用于冲突检测
  parentId?: string;  // 回复
}

interface CommentState {
  comments: Comment[];
  activeNodeId: string | null;
  
  addComment: (nodeId: string, text: string) => void;
  resolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  addReply: (parentId: string, text: string) => void;
  getCommentsByNode: (nodeId: string) => Comment[];
  getUnreadCount: (nodeId: string) => number;
}

export const useCommentStore = create<CommentState>()(
  persist(
    (set, get) => ({
      comments: [],
      activeNodeId: null,
      // ...implementations...
    }),
    { name: 'vibex-comments', storage: createJSONStorage(() => indexedDBStorage) }
  )
);
```

### 新增组件
1. **CommentBadge** (`src/components/dds/comments/CommentBadge.tsx`)
   - 节点右上角 badge
   - 显示未读评论数
   - 挂载在 React Flow Node 上

2. **CommentPanel** (`src/components/dds/comments/CommentPanel.tsx`)
   - 右侧边栏抽屉
   - 列出当前画布所有评论
   - 支持回复和标记已解决

### IndexedDB Schema
```typescript
// 使用现有 IndexedDB wrapper (streamingChunkDB.ts 已有模式)
const DB_NAME = 'vibex-comments';
const STORE_NAME = 'comments';
// 结构: Comment[], 以 commentId 为 key
```

### 架构决策
1. **offline-first**：所有评论存 IndexedDB，不依赖后端
2. **commentStore 独立于 flowStore**：评论是独立维度
3. **version 字段乐观更新**：冲突提示由 UI 层处理

---

## 跨 Epic 共享文件

| 文件 | Epic 涉及 |
|------|---------|
| `src/hooks/useStreamingAgent.ts` | E1, E4 (onComplete hook) |
| `src/stores/templateStore.ts` | E2 |
| `src/lib/canvas/stores/viewportBoundsStore.ts` | E3 |
| `src/stores/dds/canvasHistoryStore.ts` | E4 |
| `src/stores/dds/commentStore.ts` (new) | E5 |

---

## 测试策略

| Epic | 测试文件 | 覆盖目标 |
|------|---------|---------|
| E1 | `src/hooks/__tests__/useStreamingAgent.test.ts` (扩展) | 重试计数器 / 超时终止 / 正常完成 |
| E2 | `src/stores/templateStore.test.ts` (扩展) | searchTemplates / filterByCategory / renameTemplate |
| E3 | `src/lib/canvas/stores/viewportBoundsStore.test.ts` (扩展) | debounce 调用次数 |
| E4 | `src/stores/dds/__tests__/snapshotHistoryStore.test.ts` (new) | auto-snapshot debounce / addAutoSnapshot |
| E5 | `src/stores/dds/__tests__/commentStore.test.ts` (new) | CRUD / unread count / resolve |

**性能测试 (E3) 用行为测试替代**：`vi.spyOn` 计数 debounce 调用次数，间接验证性能优化。

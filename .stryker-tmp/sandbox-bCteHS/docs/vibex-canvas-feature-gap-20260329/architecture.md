# ADR-001: VibeX Canvas 画布功能完善 — 架构决策记录

> **项目**: vibex-canvas-feature-gap-20260329  
> **版本**: v1.0  
> **日期**: 2026-03-29  
> **Owner**: Architect Agent  
> **状态**: 已批准  

---

## 目录

1. [ADR-001: 持久化架构](#adr-001-持久化架构)
2. [ADR-002: Undo/Redo 实现方案](#adr-002-undoredo-实现方案)
3. [ADR-003: 拖拽排序库选型](#adr-003-拖拽排序库选型)
4. [ADR-004: 搜索过滤索引方案](#adr-004-搜索过滤索引方案)
5. [ADR-005: 快捷键系统实现](#adr-005-快捷键系统实现)
6. [ADR-006: CardTreeNode 深色主题迁移](#adr-006-cardtreenode-深色主题迁移)
7. [ADR-007: 新增依赖汇总](#adr-007-新增依赖汇总)

---

## ADR-001: 持久化架构

### 状态

**已批准**

### 上下文

当前 `canvasStore` 使用 Zustand `persist` middleware 将数据写入 `localStorage`（key: `vibex-canvas-storage`），但存在以下问题：

1. **配额风险**：localStorage 限制 ~5MB（各浏览器不同），大型项目（200+ 节点）可能溢出
2. **无冲突解决**：多 Tab 或网络恢复后，数据合取策略不明确
3. **无增量同步**：每次保存全量快照，带宽浪费
4. **无法跨设备同步**：用户换设备后数据丢失

### 决策

**采用三层持久化 Fallback 链**，与 PRD P0-F2 方案对齐：

#### Layer 1 — localStorage 热缓存（立即可用）

```typescript
// canvasStore.ts persist middleware 配置
{
  name: 'vibex-canvas-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    projectId: state.projectId,
    prototypeQueue: state.prototypeQueue,
    contextNodes: state.contextNodes,
    flowNodes: state.flowNodes,
    componentNodes: state.componentNodes,
    draggedPositions: state.draggedPositions,
    boundedGroups: state.boundedGroups,
    phase: state.phase,
    leftExpand: state.leftExpand,
    centerExpand: state.centerExpand,
    rightExpand: state.rightExpand,
  }),
}
```

**保留理由**：
- 零网络延迟，用户操作即时持久化
- 已有实现，无需重构
- 仅存储项目数据，排除瞬时 UI 状态（`selected`, `dragOver` 等）

#### Layer 2 — API 异步持久化（后台同步）

```typescript
// src/lib/canvas/persistence/SyncManager.ts
class SyncManager {
  private queue: CanvasAction[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly FLUSH_INTERVAL = 2000; // 2s 节流

  // 节流批量同步，避免频繁请求
  scheduleSync(action: CanvasAction) {
    this.queue.push(action);
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    const snapshot = this.queue.splice(0); // 原子取出
    try {
      await canvasApi.saveProject(this.getProjectId(), {
        actions: snapshot,
        timestamp: Date.now(),
      });
    } catch (err) {
      // 失败时回写队列，下次重试
      this.queue.unshift(...snapshot);
    }
  }
}
```

**调用时机**：
- 节点增删改 → `recordAction()` 触发节流同步
- AI 生成完成 → 立即同步（不节流）
- 页面 `visibilitychange` → 强制同步

#### Layer 3 — 加载时合取

```typescript
// src/lib/canvas/persistence/ConflictResolver.ts
async function loadCanvasState(projectId: string): Promise<CanvasSnapshot> {
  // 1. 立即返回 localStorage（毫秒级）
  const local = getLocalStorageSnapshot();
  // 2. 后台拉取 API 数据
  const remote = await canvasApi.loadProject(projectId);
  // 3. 按时间戳合取
  if (!remote) return local;
  if (!local) return remote;

  // 冲突策略：remote 优先（API 为权威数据源）
  if (remote.timestamp > local.timestamp) {
    return remote;
  }
  return local; // 本地更新，更新于 remote 之后
}
```

### 冲突策略

| 场景 | 策略 |
|------|------|
| 离线期间修改，网络恢复 | 合并 diff，冲突时 API 优先 |
| 多 Tab 同时修改 | Tab 激活时触发合取，后写入者胜出 |
| 节点同时被删除和编辑 | 删除优先（幂等） |

### 配额保护

```typescript
// 检测 localStorage 配额接近上限
function estimateStorageSize(state: CanvasState): number {
  return new Blob([JSON.stringify(state)]).size;
}

const MAX_QUOTA = 4 * 1024 * 1024; // 4MB 安全阈值

if (estimateStorageSize(state) > MAX_QUOTA) {
  // 降级策略：压缩历史快照，仅保留最新 3 个
  compressToRecentSnapshots(state, keep: 3);
}
```

### 后果

**Positive**:
- 用户操作零感知丢失（localStorage 即时写入）
- 后台 API 同步实现跨设备
- 冲突策略明确，行为可预测

**Negative**:
- IndexedDB 的容量和性能优势未利用（P3 离线模式时再升级）
- 冲突解决依赖 API 可用性

---

## ADR-002: Undo/Redo 实现方案

### 状态

**已批准**

### 上下文

画布需要 Undo/Redo 能力，支持节点增删改、状态变更、关系连线变化、拖拽排序。历史深度 max 50 步。

### 决策

**采用命令模式 + 增量 diff（非快照）**，理由如下：

#### 与快照方案对比

| 维度 | 命令模式 | 快照模式 |
|------|---------|---------|
| 内存占用 | O(n)，仅存 diff | O(n×size)，全量副本 |
| 序列化 | 简单 action 对象 | 需序列化完整 state |
| 增量同步 | 天生支持 | 需额外 diff 计算 |
| 实现复杂度 | 中等 | 低 |
| 适用场景 | 细粒度操作 | 粗粒度版本历史 |

#### 实现方案

```typescript
// src/lib/canvas/history/HistoryManager.ts

interface HistoryEntry {
  id: string;
  timestamp: number;
  treeType: TreeType | 'all'; // 受影响的树
  action: CanvasAction;
  inverse: CanvasAction; // 逆向操作，用于 undo
  description: string; // 人类可读描述
}

interface HistoryManager {
  past: HistoryEntry[];    // 可 undo 栈
  future: HistoryEntry[];  // 可 redo 栈
  readonly MAX_DEPTH = 50;

  // 记录操作（节流 300ms，避免拖拽时爆炸）
  recordAction(action: CanvasAction, inverse: CanvasAction, description: string): void;

  // 撤销
  undo(): void;

  // 重做
  redo(): void;

  // 清除指定树的历史（切换 phase 时调用）
  clearTreeHistory(treeType: TreeType): void;
}
```

#### action 类型定义

```typescript
// src/lib/canvas/history/actions.ts
type CanvasAction =
  | { type: 'ADD_CONTEXT_NODE'; nodeId: string; data: BoundedContextDraft }
  | { type: 'EDIT_CONTEXT_NODE'; nodeId: string; before: Partial<BoundedContextNode>; after: Partial<BoundedContextNode> }
  | { type: 'DELETE_CONTEXT_NODE'; nodeId: string; data: BoundedContextNode }
  | { type: 'CONFIRM_CONTEXT_NODE'; nodeId: string }
  | { type: 'ADD_FLOW_STEP'; flowNodeId: string; stepId: string; data: FlowStep }
  | { type: 'REORDER_STEPS'; flowNodeId: string; fromIndex: number; toIndex: number }
  | { type: 'REORDER_TREE_NODES'; treeType: TreeType; fromIndex: number; toIndex: number; nodeId: string }
  | { type: 'UPDATE_NODE_ORDER'; treeType: TreeType; nodeIds: string[] }
  | { type: 'ADD_COMPONENT_NODE'; data: ComponentNode }
  | { type: 'DRAG_END'; nodeId: string; position: Position };
```

#### 与 store 集成

```typescript
// canvasStore.ts — 在每个 mutation 后调用 recordAction
const addContextNode: CanvasStore['addContextNode'] = (data) => {
  const inverse: CanvasAction = { type: 'DELETE_CONTEXT_NODE', nodeId: newId };
  set((s) => ({ contextNodes: [...s.contextNodes, newNode] }));
  historyManager.recordAction(
    { type: 'ADD_CONTEXT_NODE', nodeId: newId, data },
    inverse,
    `添加限界上下文: ${data.name}`
  );
};
```

#### 节流保护

```typescript
// 拖拽类操作节流 300ms
let dragTimer: ReturnType<typeof setTimeout> | null = null;
function recordDragEnd(nodeId: string, position: Position) {
  if (dragTimer) clearTimeout(dragTimer);
  dragTimer = setTimeout(() => {
    historyManager.recordAction(
      { type: 'DRAG_END', nodeId, position },
      { type: 'DRAG_END', nodeId, position: null! }, // 需记录原始位置
      `移动节点 ${nodeId}`
    );
  }, 300);
}
```

#### 三树历史隔离

每个 treeType 维护独立历史栈，互不干扰：
```typescript
// 切换树时，仅清除当前树历史
historyManager.clearTreeHistory(currentTree);
```

### 后果

**Positive**:
- 内存占用可控（50 步 × 平均 action ~200B ≈ 10KB）
- 每个 action 有描述，调试友好
- 天然支持增量同步到 API
- 三树历史隔离，用户体验清晰

**Negative**:
- 每个 store mutation 需配套编写 inverse action，工作量中等
- 复杂操作（如级联删除）需分解为多个 action

---

## ADR-003: 拖拽排序库选型

### 状态

**已批准**

### 上下文

PRD P1-F7 要求在三树面板实现节点拖拽排序。代码中已接入 `@dnd-kit/sortable`，但未完整集成到 FlowCanvas 三树面板。

### 决策

**使用 `@dnd-kit/sortable`（已引入）**，不使用 `react-dnd`。

#### 选型理由

| 维度 | @dnd-kit | react-dnd |
|------|----------|-----------|
| React 19 兼容 | ✅ 官方支持 | ⚠️ 社区维护，有兼容风险 |
| Bundle size | ~15KB（tree-shakeable） | ~30KB |
| TypeScript 支持 | 一流 | 良好 |
| 触控支持 | 内置 | 需额外配置 |
| 学习曲线 | 中等 | 陡峭 |
| 社区活跃度 | 高（2024-2025 爆发增长） | 低（维护不活跃） |
| 可访问性 | 内置 ARIA | 需手动实现 |

#### 实现方案

```typescript
// src/components/canvas/trees/ContextTreeSortable.tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable wrapper
function SortableContextNode({ node }: { node: BoundedContextNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.nodeId,
    data: { type: 'context-node', node },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContextNodeCard node={node} />
    </div>
  );
}

// DnD Context wrapper
export function SortableContextTree({ nodes, treeType }: Props) {
  const [items, setItems] = useState(nodes.map(n => n.nodeId));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // 触发 store 更新 + history 记录
      store.reorderTreeNodes(treeType, newOrder);
      historyManager.recordAction(/* ... */);

      return newOrder;
    });
  }

  return (
    <DndContext
      sensors={[PointerSensor, KeyboardSensor]}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(id => <SortableContextNode key={id} node={nodes.find(n => n.nodeId === id)!} />)}
      </SortableContext>
    </DndContext>
  );
}
```

#### 与 ReactFlow 隔离策略

**问题**：ReactFlow 内部维护节点 position，与三树面板拖拽排序可能冲突。

**解决方案**：
- 三树面板使用 Sortable 列表渲染（不经过 ReactFlow 的 `addNodes`）
- FlowCanvas 使用 ReactFlow 拖拽（position-based）
- 两种模式通过 `treeType` 字段区分，共用同一 `canvasStore`

#### DragOverlay（拖拽预览）

```typescript
import { DragOverlay } from '@dnd-kit/core';

// 在 DndContext 外层添加
<DragOverlay>
  {activeId ? <ContextNodeCard node={activeNode} isDragging /> : null}
</DragOverlay>
```

### 后果

**Positive**:
- 复用已引入的库，无新依赖
- 触控 + 键盘可访问，符合现代 Web 标准
- 与 ReactFlow 解耦，避免状态冲突

**Negative**:
- 需重构现有树渲染逻辑（从列表改为 SortableContext）
- 需处理嵌套 Sortable（Step 排序在 FlowNode 内部）

---

## ADR-004: 搜索过滤索引方案

### 状态

**已批准**

### 上下文

PRD P1-F5 要求模糊搜索三树所有节点，支持节点路径定位、高亮脉冲动画、`↑↓` 键盘导航。节点数量 50-200+。

### 决策

**使用 `fuse.js` 客户端模糊匹配**，不引入后端搜索引擎。

#### 选型理由

| 维度 | fuse.js | lunr.js | 后端搜索 API |
|------|---------|---------|-------------|
| 集成复杂度 | 低 | 低 | 高（需 API 支持） |
| 中文支持 | 好（基于 bitap） | 差 | 好 |
| 索引构建 | 内存即时 | 需预构建 | N/A |
| 增量更新 | 全量重建（< 200 节点无感知） | 增量 | N/A |
| Bundle size | ~25KB | ~30KB | N/A |
| 离线可用 | ✅ | ✅ | ❌ |

对于 200 节点量级，fuse.js 全量重建索引 < 5ms，完全满足需求。

#### 实现方案

```typescript
// src/lib/canvas/search/SearchIndex.ts
import Fuse from 'fuse.js';

interface SearchNode {
  id: string;
  label: string;
  type: TreeType;
  treeType: string; // "限界上下文 > 电商域"
  status: NodeStatus;
  confirmed: boolean;
  path: string[]; // ["限界上下文", "电商域"]
}

class SearchIndex {
  private fuse: Fuse<SearchNode>;
  private nodes: SearchNode[] = [];

  private readonly FUSE_OPTIONS: Fuse.IFuseOptions<SearchNode> = {
    keys: [
      { name: 'label', weight: 0.7 },
      { name: 'path', weight: 0.2 },
      { name: 'treeType', weight: 0.1 },
    ],
    threshold: 0.3, // 模糊度，值越小越精确
    includeMatches: true, // 高亮匹配片段
    minMatchCharLength: 1,
    ignoreLocation: true,
  };

  buildIndex(contextNodes: BoundedContextNode[], flowNodes: BusinessFlowNode[], componentNodes: ComponentNode[]) {
    const allNodes: SearchNode[] = [
      ...contextNodes.map(n => ({
        id: n.nodeId, label: n.name, type: 'context' as TreeType,
        treeType: `限界上下文 / ${n.name}`, status: n.status,
        confirmed: n.confirmed, path: ['限界上下文', n.name],
      })),
      ...flowNodes.map(n => ({
        id: n.nodeId, label: n.name, type: 'flow' as TreeType,
        treeType: `业务流程 / ${n.name}`, status: n.status,
        confirmed: n.confirmed, path: ['业务流程', n.name],
      })),
      ...componentNodes.map(n => ({
        id: n.nodeId, label: n.name, type: 'component' as TreeType,
        treeType: `组件树 / ${n.name}`, status: n.status,
        confirmed: n.confirmed, path: ['组件树', n.name],
      })),
    ];

    this.nodes = allNodes;
    this.fuse = new Fuse(allNodes, this.FUSE_OPTIONS);
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    return this.fuse.search(query).map(r => ({
      ...r.item,
      matches: r.matches,
      score: r.score,
    }));
  }
}

interface SearchResult extends SearchNode {
  matches?: Fuse.FuseResultMatch[];
  score?: number;
}
```

#### 搜索 Dialog UI

```typescript
// src/components/canvas/SearchDialog.tsx
function SearchDialog({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchIndexRef = useRef(new SearchIndex());

  // 重建索引（节点变化时）
  useEffect(() => {
    searchIndexRef.current.buildIndex(contextNodes, flowNodes, componentNodes);
  }, [contextNodes, flowNodes, componentNodes]);

  // 防抖搜索
  const debouncedSearch = useDebouncedCallback((q: string) => {
    setResults(searchIndexRef.current.search(q));
    setActiveIndex(0);
  }, 150);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      navigateToNode(results[activeIndex]);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); debouncedSearch(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder="搜索节点..."
        autoFocus
      />
      <SearchResults>
        {results.map((r, i) => (
          <SearchResultItem
            key={r.id}
            result={r}
            isActive={i === activeIndex}
            onClick={() => { navigateToNode(r); onClose(); }}
          />
        ))}
      </SearchResults>
    </Dialog>
  );
}
```

#### 节点跳转 + 高亮脉冲

```typescript
function navigateToNode(result: SearchResult) {
  // 1. 展开目标树面板
  if (result.type === 'context') store.setActiveTree('context');
  else if (result.type === 'flow') store.setActiveTree('flow');
  else store.setActiveTree('component');

  // 2. 滚动到目标节点
  const nodeEl = document.querySelector(`[data-node-id="${result.id}"]`);
  nodeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 3. 脉冲高亮动画
  nodeEl?.classList.add('search-highlight-pulse');
  setTimeout(() => nodeEl?.classList.remove('search-highlight-pulse'), 2000);
}
```

### 后果

**Positive**:
- fuse.js 零配置，中文支持好
- 索引重建 < 5ms（200 节点），搜索 < 1ms
- 无需后端依赖

**Negative**:
- 200+ 节点时每次输入全量重建索引（P3 考虑增量索引）
- 纯客户端，无法搜索其他用户的协作编辑

---

## ADR-005: 快捷键系统实现

### 状态

**已批准**

### 上下文

PRD P1-F6 要求实现完整快捷键系统：Undo/Redo、搜索、新建节点、删除、展开/折叠等。需处理 Mac/Windows 差异、焦点隔离、与浏览器内置快捷键冲突。

### 决策

**使用 `react-hotkeys-hook` + 自定义 `useKeyboardShortcuts` hook**，不引入 `keyboard.js`。

#### 选型理由

| 维度 | react-hotkeys-hook | useHotkeys (keyboard.js) | 自定义实现 |
|------|-------------------|------------------------|-----------|
| Bundle size | ~8KB | ~50KB | 0（原生实现） |
| React 19 兼容 | ✅ | ⚠️ | ✅ |
| 复杂组合键 | 支持 | 支持 | 支持 |
| Focus scope | 内置 | 内置 | 需手动 |
| 学习曲线 | 低 | 中 | 低 |

`react-hotkeys-hook` 提供最精简的集成方案，与原生 `useEffect` 无异，但具备焦点隔离能力。

#### 实现方案

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface ShortcutConfig {
  key: string;           // e.g., 'command+z', 'ctrl+shift+z'
  handler: () => void;
  description: string;
  /** 何时跳过：输入框聚焦时 */
  skipWhenInputFocused?: boolean;
  /** 哪个 tree 下生效 */
  scope?: 'canvas' | 'global';
}

export function useKeyboardShortcuts(configs: ShortcutConfig[]) {
  // 全局注册
  const globalConfigs = configs.filter(c => c.scope !== 'canvas');

  // 对于每个 shortcut，使用 react-hotkeys-hook
  configs.forEach(({ key, handler, skipWhenInputFocused = true, scope }) => {
    const options = {
      enabled: true,
      // preventDefault: true, // 谨慎使用，避免阻断合法浏览器快捷键
    };

    if (skipWhenInputFocused) {
      // 检查是否聚焦在输入元素
      useHotkeys(key, (e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
        e.preventDefault();
        handler();
      }, options);
    } else {
      useHotkeys(key, (e) => {
        e.preventDefault();
        handler();
      }, options);
    }
  });
}
```

#### 快捷键映射表

```typescript
// src/lib/canvas/shortcuts/keymap.ts
export const CANVAS_SHORTCUTS = {
  // === Undo/Redo ===
  'command+z, ctrl+z': 'undo',
  'command+shift+z, ctrl+shift+z': 'redo',

  // === 搜索 ===
  '/': 'openSearch',
  'command+f, ctrl+f': 'openSearch',

  // === 节点操作 ===
  'n': 'newNode',
  'delete, backspace': 'deleteNode',
  'enter': 'confirmNode',
  'escape': 'cancel',

  // === 面板 ===
  '?': 'showShortcutsHelp',
  'command+e, ctrl+e': 'toggleActivePanel',
  '1': 'focusContextTree',
  '2': 'focusFlowTree',
  '3': 'focusComponentTree',

  // === 导出 ===
  'command+s, ctrl+s': 'save',
  'command+e, ctrl+e': 'export',
} as const;

export type ShortcutId = typeof CANVAS_SHORTCUTS[keyof typeof CANVAS_SHORTCUTS];
```

#### Mac/Windows 适配

```typescript
// src/lib/canvas/shortcuts/platform.ts
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function normalizeShortcut(key: string): string {
  return key
    .replace(/command/gi, isMac ? 'command' : 'ctrl')
    .replace(/mod/gi, isMac ? 'command' : 'ctrl');
}

// 使用 normalizeShortcut 处理每个快捷键
```

#### 快捷键帮助面板

```typescript
// src/components/canvas/ShortcutsHelpPanel.tsx
const SHORTCUTS_HELP = [
  { key: '⌘Z / Ctrl+Z', action: '撤销' },
  { key: '⌘⇧Z / Ctrl+⇧Z', action: '重做' },
  { key: '/', action: '打开搜索' },
  { key: 'N', action: '新建节点' },
  { key: 'Del', action: '删除节点' },
  { key: 'Enter', action: '确认节点' },
  { key: 'Esc', action: '取消 / 关闭面板' },
  { key: '?', action: '显示此帮助' },
  { key: '1 / 2 / 3', action: '聚焦上下文/流程/组件树' },
];
```

#### 焦点隔离

```typescript
// useKeyboardShortcuts.ts — 完整实现
export function useCanvasShortcuts() {
  const { undo, redo } = useHistoryManager();
  const { openSearch } = useSearchDialog();
  const store = useCanvasStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 焦点隔离：输入框中跳过所有画布快捷键
      const tag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      const isContentEditable = (e.target as HTMLElement)?.isContentEditable;

      if (isInputFocused || isContentEditable) return;

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // ? 键 — 显示帮助（无修饰键）
      if (e.key === '?' && !modKey) {
        e.preventDefault();
        showShortcutsHelp();
      }

      // / 键 — 搜索
      if (e.key === '/' && !modKey) {
        e.preventDefault();
        openSearch();
      }

      // ⌘Z / Ctrl+Z — Undo
      if (e.key === 'z' && modKey && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // ⌘⇧Z / Ctrl+⇧Z — Redo
      if (e.key === 'z' && modKey && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, openSearch]);
}
```

### 后果

**Positive**:
- react-hotkeys-hook ~8KB，远小于 keyboard.js ~50KB
- 焦点隔离逻辑清晰，避免干扰输入
- Mac/Windows 自动适配

**Negative**:
- 需处理 Playwright 测试中键盘事件捕获（E2E 需配置）
- Safari 对 `event.metaKey` 行为与 Chrome 不同，需额外测试

---

## ADR-006: CardTreeNode 深色主题迁移

### 状态

**已批准**

### 上下文

`CardTreeNode` 组件（`CardTreeNode.module.css`）使用白底样式（`background: #ffffff`, `border: 1px solid #e5e7eb`），与画布整体深色赛博朋克主题割裂。设计文档 `DESIGN.md v1.1` 节 6.5 已定义迁移方案。

### 决策

**迁移方案：CSS 变量 + Design Token**，零破坏性重构。

#### 目标变量（来自 DESIGN.md v1.1）

```css
/* src/styles/design-tokens.css — 需新增 */
:root {
  /* Canvas Theme */
  --color-canvas-bg: #0d1117;          /* 深色背景 */
  --color-canvas-surface: #161b22;      /* 卡片/面板背景 */
  --color-canvas-elevated: #21262d;    /* 浮层背景 */
  --color-border: #30363d;             /* 边框色 */
  --color-border-subtle: #21262d;      /* 弱边框 */

  /* Text */
  --color-text-primary: #e6edf3;        /* 主文本 */
  --color-text-secondary: #8b949e;      /* 次要文本 */
  --color-text-muted: #6e7681;         /* 辅助文本 */

  /* Status */
  --color-status-pending-bg: rgba(139, 148, 158, 0.1);
  --color-status-pending-text: #8b949e;
  --color-status-progress-bg: rgba(63, 185, 80, 0.1);
  --color-status-progress-text: #3fb950;
  --color-status-done-bg: rgba(63, 185, 80, 0.15);
  --color-status-done-text: #3fb950;
  --color-status-error-bg: rgba(248, 81, 73, 0.1);
  --color-status-error-text: #f85149;

  /* Accent */
  --color-accent: #58a6ff;             /* 主色调 */
  --color-accent-hover: #79c0ff;
}
```

#### CardTreeNode.module.css 迁移清单

```css
/* CardTreeNode.module.css — 迁移后 */

.card {
  /* 旧 */
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #1f2937;

  /* 新 */
  background: var(--color-canvas-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

/* Header */
.header {
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-canvas-elevated);
}

.title {
  color: var(--color-text-primary);
}

/* Status Badge — 全部迁移 */
.statusBadge {
  /* 继承变量 */
}

.statusPending {
  background: var(--color-status-pending-bg);
  color: var(--color-status-pending-text);
}

.statusInProgress {
  background: var(--color-status-progress-bg);
  color: var(--color-status-progress-text);
}

.statusDone {
  background: var(--color-status-done-bg);
  color: var(--color-status-done-text);
}

.statusError {
  background: var(--color-status-error-bg);
  color: var(--color-status-error-text);
}

/* Checkbox */
.checkboxText {
  color: var(--color-text-secondary);
}

.checkboxText.checked {
  color: var(--color-text-muted);
}

/* Footer */
.footer {
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-canvas-elevated);
  color: var(--color-text-muted);
}

/* Lazy loading shimmer */
.lazyBar {
  background: linear-gradient(
    90deg,
    var(--color-canvas-elevated) 25%,
    var(--color-border-subtle) 50%,
    var(--color-canvas-elevated) 75%
  );
}
```

#### Storybook/Chromatic 基线更新

```bash
# 迁移完成后，更新截图基线
npx chromatic --exit-zero-on-changes
```

#### 回归验证检查清单

- [ ] 深色模式下 CardTreeNode 无白底
- [ ] 选中节点边框为 `--color-accent`（蓝色）
- [ ] Status badge 在深色背景上对比度足够（WCAG AA）
- [ ] 选中状态阴影正确（无白色晕染）
- [ ] Lazy loading shimmer 条纹颜色正确
- [ ] Checkbox 在深色背景上可见
- [ ] Storybook 中的 CardTreeNode stories 正常渲染

### 后果

**Positive**:
- 零 JS 改动，纯 CSS 迁移，风险低
- Design Token 体系为后续 P3 设计系统集成打好基础
- 一处修改，多处生效

**Negative**:
- 需同步更新所有使用 `CardTreeNode` 的地方（包括 Storybook）
- 深色主题下 status badge 对比度需 WCAG AA 验证

---

## ADR-007: 新增依赖汇总

### 状态

**已批准**

### 上下文

汇总所有架构决策引入的新 npm 依赖。

### 依赖清单

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "fuse.js": "^7.0.0",
    "react-hotkeys-hook": "^5.1.0",
    "use-debounce": "^11.0.0"
  }
}
```

#### 依赖说明

| 包 | 用途 | ADR | Bundle 增量 |
|----|------|-----|------------|
| `@dnd-kit/core` | 拖拽上下文（已部分引入） | ADR-003 | ~10KB |
| `@dnd-kit/sortable` | 列表拖拽排序 | ADR-003 | ~8KB |
| `@dnd-kit/utilities` | CSS Transform 工具 | ADR-003 | ~2KB |
| `fuse.js` | 模糊搜索 | ADR-004 | ~25KB |
| `react-hotkeys-hook` | 快捷键绑定 | ADR-005 | ~8KB |
| `use-debounce` | 防抖（搜索输入） | ADR-004 | ~1KB |

**总增量**: ~54KB（gzip 后 ~18KB）

### 可选依赖（P2/P3）

```json
{
  "optional": {
    "workbox-window": "^7.0.0",
    "idb": "^8.0.0"
  }
}
```

- `workbox-window`: P3 离线模式 Service Worker
- `idb`: P3 离线模式 IndexedDB 封装

---

## 决策摘要

| ADR | 决策 | 优先级 |
|-----|------|-------|
| ADR-001 | localStorage + API 异步 + 合取三层持久化 | P0 |
| ADR-002 | 命令模式增量历史栈（max 50步，节流300ms） | P1 |
| ADR-003 | @dnd-kit/sortable（已引入，完整集成） | P1 |
| ADR-004 | fuse.js 客户端模糊搜索（阈值0.3，防抖150ms） | P1 |
| ADR-005 | react-hotkeys-hook + 自定义焦点隔离 hook | P1 |
| ADR
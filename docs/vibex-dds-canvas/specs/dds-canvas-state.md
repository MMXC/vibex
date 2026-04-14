# Spec: DDS Canvas Zustand Store 设计规格

## Store 顶层结构

```typescript
interface DDSCanvasStore {
  // 项目上下文
  projectId: string | null;
  activeChapter: ChapterType;   // 当前展开的章节
  setActiveChapter: (ch: ChapterType) => void;
  
  // 章节数据
  chapters: Record<ChapterType, ChapterData>;
  loadChapter: (chapter: ChapterType) => Promise<void>;
  
  // AI 对话
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  
  // 选中状态（卡片微调用）
  selectedCardIds: string[];
  selectCard: (id: string) => void;
  deselectAll: () => void;
  
  // UI 状态
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}
```

## Chapter Data 结构

```typescript
interface ChapterData {
  type: ChapterType;
  cards: BaseCard[];
  edges: DDSEdge[];
  loading: boolean;
  error: string | null;
  
  // CRUD actions
  addCard: (card: BaseCard) => void;
  updateCard: (id: string, updates: Partial<BaseCard>) => void;
  deleteCard: (id: string) => void;
  addEdge: (edge: DDSEdge) => void;
  deleteEdge: (id: string) => void;
}
```

## React Flow 集成

```typescript
// useDDSCanvasFlow hook
function useDDSCanvasFlow(chapter: ChapterType) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useNodesEdges();
  const chapterData = useDDSCanvasStore(s => s.chapters[chapter]);
  
  return {
    nodes: toReactFlowNodes(chapterData.cards),
    edges: toReactFlowEdges(chapterData.edges),
    onNodesChange,
    onEdgesChange,
    onConnect: (conn) => {
      // 创建边关系
      addEdge({ ...conn, id: uuid() });
    },
  };
}
```

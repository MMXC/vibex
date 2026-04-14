# Architecture: VibeX 详细设计画布 (DDS Canvas)

> **类型**: Feature Implementation  
> **日期**: 2026-04-14  
> **依据**: prd.md (vibex-dds-canvas)

---

## 1. Problem Frame

为 VibeX 构建详细设计画布 (DDS Canvas)：AI 驱动的卡片生成 + 横向 scroll-snap 布局 + 三种卡片类型 (user-story / bounded-context / flow-step) + React Flow 可视化。目标是替代或扩展现有 Canvas 的结构化设计能力。

---

## 2. System Architecture

```mermaid
graph TB
    subgraph UI["前端 (Next.js)"]
        STORE[DDSCanvasStore<br/>Zustand + ReactFlow状态]
        RF[ReactFlow<br/>DAG/树图渲染]
        SCROLL[HorizontalScroll<br/>ScrollSnap]
        CARD[CardRenderer<br/>三种卡片类型]
        TOOLBAR[DDSToolbar<br/>AI Draft 触发]
        DRAFT[AI Draft Modal<br/>预览/编辑/重试]
    end

    subgraph State["状态层"]
        CARDS[cards[]<br/>卡片数组]
        CHAPTERS[chapters[]<br/>章节数组]
        NODES[nodes[]<br/>ReactFlow节点]
        EDGES[edges[]<br/>ReactFlow边]
        DRAFTING[draftCards[]<br/>草稿卡片]
    end

    subgraph Backend["后端 (Cloudflare Workers)"]
        DDS_API[DDS API<br/>v1/dds/...路由]
        LLM[LLM Provider<br/>llm-provider.ts]
    end

    subgraph Data["D1 Database"]
        DDS_T[dds_cards table<br/>卡片JSON]
        CHAPTERS_T[dds_chapters table<br/>章节配置]
    end

    TOOLBAR --> DRAFT --> LLM
    DRAFT --> CARDS --> RF --> SCROLL --> CARD
    STORE --> NODES
    STORE --> EDGES
    STORE --> CHAPTERS
    DDS_API --> DDS_T
    LLM --> DDS_API
```

---

## 3. Technical Decisions

### 3.1 Store 设计 — 新建 vs 复用

**决策**: 新建 `DDSCanvasStore`，**不复用**现有 `designStore`。

**trade-off**:  
- `designStore.ts` (326行) 已有 DDD 状态管理，但职责混乱（同时管 DDD + 设计流程）
- DDS Canvas 是独立功能，状态边界清晰，新建更干净
- 但两套 store 并存增加用户困惑

**缓解**: `DDSCanvasStore` 仅管理 Canvas 相关状态，导航/项目元数据仍走 `navigationStore`。

```typescript
// DDSCanvasStore 结构 (对齐 specs/dds-canvas-state.md + React Flow)
interface DDSCanvasStore {
  // 项目上下文
  projectId: string | null;
  activeChapter: ChapterType;  // 'requirement' | 'context' | 'flow'
  setActiveChapter: (ch: ChapterType) => void;
  
  // React Flow 状态 (用于 DAG/树图渲染)
  nodes: Node[];              // 来自 reactflow
  edges: Edge[];              // 来自 reactflow
  viewport: { x: number; y: number; zoom: number };  // F6.2.1 刷新后恢复
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Chapter 数据 (卡片源数据)
  chapters: Record<ChapterType, ChapterData>;
  loadChapter: (chapter: ChapterType) => Promise<void>;
  
  // CRUD actions
  addCard: (card: Card) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  
  // AI Draft
  isGenerating: boolean;
  draftCards: Card[];
  generateAIDraft: (input: string) => Promise<void>;
  acceptDraft: () => void;
  rejectDraft: () => void;
}
```

### 3.2 React Flow 集成

**决策**: 使用 `reactflow` 包渲染三种章节的图结构。**必须依赖**。

- Requirement 章节 → 树结构（自上而下）
- Context 章节 → 树结构（上下游关系）
- Flow 章节 → DAG（有向无环图，多分支）

```tsx
// DDSFlow.tsx
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

function DDSFlow({ chapterType }: { chapterType: ChapterType }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useDDSCanvasFlow();
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

// 各 chapter 对应的默认边类型
const CHAPTER_EDGE_TYPES: Record<ChapterType, EdgeTypes> = {
  requirement: 'step',      // 树 → parent → child
  context: 'smoothstep',     // 树 + 上下游关系
  flow: 'smoothstep',        // DAG，多分支
};
```

**trade-off**:  
- Pros: PRD 核心功能（DAG + 树图）必须依赖，交互成熟
- Cons: 包体积 ~40KB (gzip)，需评估首屏影响（见 §5）

### 3.3 AI Draft Flow — chapter-specific prompt

**决策**: AI Draft 复用 `llm-provider.ts`，prompt 按 chapterType 分支。

```typescript
// chapterType → output schema 映射
const CHAPTER_SCHEMAS = {
  requirement: {
    type: 'user-story',
    required: ['role', 'action', 'benefit'],
    description: '用户故事: 作为[角色] 我想要[行为] 以便于[收益]'
  },
  context: {
    type: 'bounded-context',
    required: ['name', 'description', 'responsibility'],
    description: '限界上下文: 名称 + 职责描述 + 上下游关系'
  },
  flow: {
    type: 'flow-step',
    required: ['stepName', 'preCondition', 'postCondition'],
    description: '流程步骤: 步骤名 + 前置条件 + 后置条件'
  }
};

const CARD_GENERATION_PROMPT = `
根据用户需求生成 ${chapterType} 卡片。
章节类型: ${CHAPTER_SCHEMAS[chapterType].description}
输出 JSON: { "cards": [ { ${CHAPTER_SCHEMAS[chapterType].required.join(', ')} } ] }
最多生成 5 张卡片。
`;
```

### 3.4 Horizontal Scroll-Snap 布局

**决策**: CSS scroll-snap 配合 React Flow，**不引入**第三方轮播库。

```css
/* specs/layout-scroll-snap.md §3 */
.dds-horizontal {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
```

### 3.5 三种卡片类型 (PRD §0 决策 2 + specs/schema-card-types.md)

```typescript
// Base Card
interface BaseCard {
  id: string;
  type: CardType;
  title: string;
  position: { x: number; y: number };  // React Flow position
  createdAt: string;
  updatedAt: string;
}

// User Story Card (需求分析) — 树结构
interface UserStoryCard extends BaseCard {
  type: 'user-story';
  role: string;
  action: string;
  benefit: string;
  priority: 'high' | 'medium' | 'low';
  children?: string[];
  parentId?: string;
}

// Bounded Context Card (上下文分析) — 树结构
interface BoundedContextCard extends BaseCard {
  type: 'bounded-context';
  name: string;
  description: string;
  responsibility: string;
  children?: string[];
  parentId?: string;
  relations?: { targetId: string; type: 'upstream' | 'downstream' | 'anticorruption' | 'shared-kernel'; label?: string }[];
}

// Flow Step Card (领域流程) — DAG 结构
interface FlowStepCard extends BaseCard {
  type: 'flow-step';
  stepName: string;
  actor?: string;
  preCondition?: string;
  postCondition?: string;
  nextSteps?: string[];
  parallelSteps?: string[];
}

type Card = UserStoryCard | BoundedContextCard | FlowStepCard;
type ChapterType = 'requirement' | 'context' | 'flow';
```

### 3.6 API 设计 (与 specs/api-card-crud.md 完全对齐)

```
POST   /api/v1/dds/chapters/:chapterId/cards   — 创建卡片
GET    /api/v1/dds/chapters/:chapterId/cards   — 获取章节卡片
PUT    /api/v1/dds/cards/:cardId               — 更新卡片
DELETE /api/v1/dds/cards/:cardId               — 删除卡片
PUT    /api/v1/dds/cards/:cardId/relations     — 更新卡片关系
PUT    /api/v1/dds/cards/:cardId/position     — 更新卡片位置
```

**统一响应格式** (specs/api-card-crud.md):
```typescript
// 成功
{ "data": Card | Card[] | null, "success": true }
// 错误
{ "error": { "code": string, "message": string }, "success": false }
```

### 3.7 数据存储

D1 存储，每张卡片存 JSON content 列。

```sql
-- specs/api-card-crud.md §1
CREATE TABLE dds_chapters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE dds_cards (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES dds_chapters(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- JSON string (card-specific fields)
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_cards_chapter ON dds_cards(chapter_id);
```

---

## 4. Module Design

| 模块 | 文件 | 职责 |
|------|------|------|
| Store | `stores/ddsCanvasStore.ts` | Zustand + ReactFlow 状态 |
| React Flow | `components/dds/flow/DDSFlow.tsx` | DAG/树图渲染 + 节点交互 |
| Scroll | `components/dds/canvas/DDSCanvas.tsx` | Horizontal scroll-snap 容器 |
| Card Components | `components/dds/cards/` | 三种卡片渲染 |
| AI Draft | `components/dds/ai-draft/` | Draft modal + flow |
| API Client | `services/api/dds.ts` | REST API 调用 |
| Backend Routes | `routes/v1/dds/cards.ts` | CRUD API (对齐 specs) |
| LLM Integration | `services/llm-provider.ts` | chapter-specific prompt |

---

## 5. Performance & Scale

| 关注点 | 评估 | 缓解 |
|--------|------|------|
| React Flow bundle | ~40KB gzip | dynamic import，lazy 加载 |
| 卡片渲染 (100+) | React.memo 优化 | 节点虚拟化（> 500 nodes 时）|
| AI Draft 延迟 | 2-5s LLM 调用 | 乐观 UI + skeleton |
| Horizontal scroll FPS | CSS 硬件加速 | 避免 JS scroll handler |
| D1 JSON 查询 | 卡片数量 < 500 时无压力 | `/position` / `/relations` 独立端点，避免频繁写大 JSON |

---

## 6. Security

| 关注点 | 措施 |
|--------|------|
| AI Draft Prompt 注入 | 用户输入转义，LLM 输入长度限制 |
| 卡片权限 | 继承项目权限 (project membership check) |
| 章节删除 | 级联删除所有子卡片 |

---

## 7. Open Questions

| 问题 | 状态 | 决定 |
|------|------|------|
| 现有 Canvas 页面路由冲突 | 待定 | 单独 `/dds-canvas` 路由，不替代现有 |
| AI Draft 流式输出 | 可选 | 第一版非流式，乐观 UI |

---

## 8. Verification

- [ ] DDSCanvasStore 含 nodes/edges/viewport，React Flow 渲染正常
- [ ] React Flow DAG/树图正确渲染（3 个 chapter type 各正确）
- [ ] Horizontal scroll snap 流畅，章节切换正常
- [ ] AI Draft 流程: 输入 → 预览 → 编辑 → 接受 → 卡片出现
- [ ] 三种卡片类型 (user-story/bounded-context/flow-step) 渲染正确
- [ ] CRUD API (/v1/dds/...) 端到端测试通过
- [ ] AI Prompt 按 chapterType 正确分支（3 套 schema）

---

*Architect Agent | 2026-04-14*

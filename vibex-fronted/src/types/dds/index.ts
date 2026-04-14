/**
 * DDS Canvas Type Definitions
 * 详细设计画布的类型系统
 * 对应 specs/schema-card-types.md
 */

// ==================== Chapter Types ====================

export type ChapterType = 'requirement' | 'context' | 'flow';

// ==================== Card Types ====================

export type CardType = 'user-story' | 'bounded-context' | 'flow-step';

export type Priority = 'high' | 'medium' | 'low';

export type RelationType = 'upstream' | 'downstream' | 'anticorruption' | 'shared-kernel';

// ==================== Base Card ====================

export interface Position {
  x: number;
  y: number;
}

export interface BaseCard {
  id: string;
  type: CardType;
  title: string;
  description?: string;
  position: Position;
  createdAt: string;
  updatedAt: string;
}

// ==================== User Story Card ====================

export interface UserStoryCard extends BaseCard {
  type: 'user-story';
  role: string;            // 作为[角色]
  action: string;         // 我想要[行为]
  benefit: string;        // 以便于[收益]
  priority: Priority;
  acceptanceCriteria?: string[];
  children?: string[];    // 子用户故事 ID（树关系）
  parentId?: string;      // 父用户故事 ID
}

// ==================== Bounded Context Card ====================

export interface BoundedContextCard extends BaseCard {
  type: 'bounded-context';
  name: string;            // 上下文名称
  description: string;
  responsibility: string;  // 职责描述
  children?: string[];     // 子域 ID
  parentId?: string;
  relations?: Array<{
    targetId: string;
    type: RelationType;
    label?: string;
  }>;
}

// ==================== Flow Step Card ====================

export interface FlowStepCard extends BaseCard {
  type: 'flow-step';
  stepName: string;
  actor?: string;
  preCondition?: string;
  postCondition?: string;
  nextSteps?: string[];     // DAG: 后续步骤 ID
  parallelSteps?: string[]; // 并行步骤 ID
}

// ==================== Union Type ====================

export type DDSCard = UserStoryCard | BoundedContextCard | FlowStepCard;

// ==================== Edge ====================

export interface DDSEdge {
  id: string;
  source: string;      // 源卡片 ID
  target: string;     // 目标卡片 ID
  type: 'smoothstep';
  animated?: boolean;  // AI 生成标记
}

// ==================== Chapter Data ====================

export interface ChapterData {
  type: ChapterType;
  cards: DDSCard[];
  edges: DDSEdge[];
  loading: boolean;
  error: string | null;
}

// ==================== Store State ====================

export interface DDSCanvasStoreState {
  // 项目上下文
  projectId: string | null;
  activeChapter: ChapterType;
  setActiveChapter: (ch: ChapterType) => void;

  // 章节数据
  chapters: Record<ChapterType, ChapterData>;
  loadChapter: (chapter: ChapterType) => Promise<void>;

  // AI 对话
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // 选中状态
  selectedCardIds: string[];
  selectCard: (id: string) => void;
  deselectAll: () => void;

  // UI 状态
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

// ==================== Chat Message ====================

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

// ==================== API Response Types ====================

export type DDSResponse<T> =
  | { data: T; success: true }
  | { error: { code: string; message: string }; success: false };

// ==================== Helper Types ====================

export interface CardPositionUpdate {
  position: Position;
}

// ==================== React Flow Node/Edge ====================

// React Flow 节点来自 DDSCard，position 直接复用
// React Flow 边来自 DDSEdge

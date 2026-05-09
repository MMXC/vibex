/**
 * DDS Canvas Type Definitions
 * 详细设计画布的类型系统
 * 对应 specs/schema-card-types.md
 */

import type { Position, BaseCard as BaseCardType } from './base';
import type { APIEndpointCard } from './api-endpoint';
import type { StateMachineCard } from './state-machine';
export * from './state-machine';

// Re-export base types
export type { Position };
export type { APIEndpointCard };

export interface BaseCard extends BaseCardType {
  type: CardType;
}

// ==================== Chapter Types ====================

export type ChapterType = 'requirement' | 'context' | 'flow' | 'api' | 'business-rules';

// ==================== Card Types ====================

export type CardType = 'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint' | 'state-machine';

export type Priority = 'high' | 'medium' | 'low';

export type RelationType = 'upstream' | 'downstream' | 'anticorruption' | 'shared-kernel';

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

export type DDSCard = UserStoryCard | BoundedContextCard | FlowStepCard | APIEndpointCard | StateMachineCard;

// ==================== Edge ====================

export interface DDSEdge {
  id: string;
  source: string;      // 源卡片 ID
  target: string;     // 目标卡片 ID
  type: 'smoothstep';
  animated?: boolean;  // AI 生成标记
  style?: Record<string, string>;
  label?: string;
  /** 跨章节边的源章节类型（same-chapter edges 省略） */
  sourceChapter?: ChapterType;
  /** 跨章节边的目标章节类型（same-chapter edges 省略） */
  targetChapter?: ChapterType;
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

  // 跨章节 DAG 边（E4-U1）
  crossChapterEdges: DDSEdge[];

  // AI 对话
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // 选中状态
  selectedCardIds: string[];
  selectCard: (id: string) => void;
  deselectAll: () => void;
  selectedCardSnapshot: {
    cardId: string;
    cardData: DDSCard;
    wasVisible: boolean;
  } | null;
  setSelectedCardSnapshot: (snapshot: { cardId: string; cardData: DDSCard; wasVisible: boolean } | null) => void;
  updateCardVisibility: (wasVisible: boolean) => void;

  // UI 状态
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;

  // ---- E1: Group 折叠 ----
  /** 已折叠的 Group ID 集合 */
  collapsedGroups: Set<string>;
  /** 切换折叠状态 */
  toggleCollapse: (groupId: string) => void;
  /** 查询指定 Group 是否已折叠 */
  isCollapsed: (groupId: string) => boolean;

  // ---- E2: 冲突可视化 ----
  /** 当前冲突的节点 ID（来自 conflictStore） */
  conflictedCardId: string | null;
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

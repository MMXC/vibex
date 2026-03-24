/**
 * @fileoverview Shared type definitions for Vibex
 *
 * Exported types:
 * - HomePage types (Step, BoundedContext, ContextRelationship)
 * - Visualization types (CardTreeNode, CardTreeVisualization)
 * - Proposal types (DedupResult, DedupCandidate)
 */

// ==================== HomePage Types ====================

/** 步骤定义 */
export interface Step {
  id: number;
  label: string;
  description: string;
}

/** 限界上下文类型 */
export type BoundedContextType = 'core' | 'supporting' | 'generic' | 'external';

/** 限界上下文关系类型 */
export type ContextRelationshipType = 'upstream' | 'downstream' | 'symmetric';

/** 上下文关系 */
export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: ContextRelationshipType;
  description: string;
}

/** 限界上下文 */
export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: BoundedContextType;
  keyResponsibilities?: string[];
  relationships: ContextRelationship[];
}

// ==================== Visualization Types ====================

/** CardTree 节点状态 */
export type CardTreeNodeStatus = 'pending' | 'in-progress' | 'done' | 'failed';

/** CardTree 节点 */
export interface CardTreeNode {
  /** 节点标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 状态 */
  status: CardTreeNodeStatus;
  /** Emoji 图标 */
  icon?: string;
  /** 子节点 */
  children?: CardTreeNodeChild[];
  /** 最后更新时间 (ISO) */
  updatedAt?: string;
}

/** CardTree 子节点 */
export interface CardTreeNodeChild {
  id: string;
  label: string;
  checked: boolean;
  description?: string;
}

/** CardTree 可视化数据 */
export interface CardTreeVisualization {
  nodes: CardTreeNode[];
  projectId?: string;
  name?: string;
}

// ==================== Proposal / Dedup Types ====================

/** 重复检测严重级别 */
export type DedupLevel = 'block' | 'warn' | 'pass';

/** 重复检测候选 */
export interface DedupCandidate {
  name: string;
  similarity: number;
  matchType: string;
  reason?: string;
}

/** 重复检测结果 */
export interface DedupResult {
  level: DedupLevel;
  candidates: DedupCandidate[];
  message: string;
}

// ==================== Team-Tasks Types ====================

/** Team-tasks 项目任务阶段 */
export interface TaskStage {
  agent?: string;
  status?: string;
  task?: string;
  startedAt?: string;
  completedAt?: string;
  output?: string;
  dependsOn?: string[];
  verification?: Record<string, unknown>;
}

/** Team-tasks 项目 */
export interface TeamTaskProject {
  project: string;
  goal?: string;
  created?: string;
  updated?: string;
  status?: string;
  mode?: string;
  workspace?: string;
  stages?: Record<string, TaskStage>;
}

// @ts-nocheck
// ==================== 原型快照 ====================

export interface PrototypeSnapshot {
  id: string;
  projectId: string;
  version: number;
  name?: string;
  description?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrototypeSnapshotCreate {
  projectId: string;
  version?: number;
  name?: string;
  description?: string;
  content?: string;
}

// 反馈
export interface Feedback {
  id: string;
  prototypeSnapshotId: string;
  userId: string;
  type: FeedbackType;
  content: string;
  position?: { x: number; y: number };
  status: FeedbackStatus;
  createdAt?: string;
}

export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'praise';
export type FeedbackStatus = 'open' | 'resolved' | 'dismissed';

export interface FeedbackCreate {
  prototypeSnapshotId: string;
  type: FeedbackType;
  content: string;
  position?: { x: number; y: number };
}

// 澄清对话
export interface Clarification {
  id: string;
  requirementId: string;
  question: string;
  answer?: string;
  status: ClarificationStatus;
  createdAt?: string;
}

export type ClarificationStatus = 'pending' | 'answered' | 'skipped';

// 对话分支
export interface ConversationBranch {
  id: string;
  parentMessageId: string;
  branchName: string;
  messages: any[];
  createdAt?: string;
}

export interface ConversationBranchCreate {
  parentMessageId: string;
  branchName: string;
}

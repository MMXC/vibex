// @ts-nocheck
// ==================== AI 原型类型 - 需求 ====================

import { DomainEntity, EntityRelation } from './domain';
import { UISchema } from './analysis';

// 需求
export interface Requirement {
  id: string;
  userId: string;
  content: string;
  templateId?: string | null;
  status: RequirementStatus;
  analysisResult?: AnalysisResult | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RequirementStatus =
  | 'draft'
  | 'analyzing'
  | 'clarifying'
  | 'completed'
  | 'failed';

export interface RequirementCreate {
  content: string;
  templateId?: string;
  userId: string;
}

export interface RequirementUpdate {
  content?: string;
  templateId?: string;
  status?: RequirementStatus;
}

// 需求分析结果
export interface AnalysisResult {
  requirementId: string;
  domains: DomainEntity[];
  relations: EntityRelation[];
  uiSchema?: UISchema;
  confidence: number;
  analyzedAt: string;
}

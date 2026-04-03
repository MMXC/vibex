/**
 * Diagnosis Types - 诊断结果类型定义
 */
// @ts-nocheck


export interface DiagnosisDimension {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  issues: string[];
  suggestions: string[];
}

export interface DiagnosisResult {
  overallScore: number;
  dimensions: DiagnosisDimension[];
  summary: string;
  suggestions: string[];
  improvedText?: string;
  createdAt: number;
}

export interface AnalyzeRequest {
  requirementText: string;
  context?: {
    projectType?: string;
    existingModels?: string[];
  };
}

export interface OptimizeRequest {
  requirementText: string;
  targetScore?: number;
}

export interface DiagnosisResponse {
  success: boolean;
  result?: DiagnosisResult;
  error?: string;
}

export type DimensionName = 'completeness' | 'clarity' | 'technical' | 'context';

export const DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  completeness: 0.3,
  clarity: 0.3,
  technical: 0.2,
  context: 0.2,
};

export const DIMENSION_LABELS: Record<DimensionName, string> = {
  completeness: '完整性',
  clarity: '清晰度',
  technical: '技术明确度',
  context: '上下文充分度',
};

/**
 * Homepage Constants
 * Constants for the homepage modular refactor
 */

import type { Step } from '@/types/homepage';

/** 五步流程步骤定义 */
export const STEPS: Step[] = [
  { id: 1, label: '需求输入', description: '输入项目需求描述' },
  { id: 2, label: '限界上下文', description: '定义系统边界和核心领域' },
  { id: 3, label: '领域模型', description: '设计实体和聚合根' },
  { id: 4, label: '业务流程', description: '描述业务操作流程' },
  { id: 5, label: '项目创建', description: '生成完整项目代码' },
];

/** localStorage 键名 */
export const HOME_STORAGE_KEY = 'vibex-home-state';

/** 默认面板尺寸 */
export const DEFAULT_PANEL_SIZES = [15, 60, 25];

/** 面板 ID */
export const PANEL_IDS = {
  SIDEBAR: 'sidebar',
  PREVIEW: 'preview',
  INPUT: 'input',
  AI: 'ai',
} as const;

/** 面板尺寸限制 */
export const PANEL_SIZE_LIMITS = {
  MIN: 10,
  MAX: 90,
  DEFAULT: {
    SIDEBAR: 15,
    PREVIEW: 60,
    AI: 25,
  },
} as const;

/** 生成超时时间 (毫秒) */
export const GENERATION_TIMEOUT = 60000;

/** 重试配置 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

/** API 端点 */
export const API_ENDPOINTS = {
  GENERATE_CONTEXTS: '/api/ddd/bounded-context',
  GENERATE_MODELS: '/api/ddd/domain-model',
  GENERATE_FLOWS: '/api/ddd/business-flow',
  CREATE_PROJECT: '/api/project/create',
} as const;

/** 步骤对应的 API 端点 */
export const STEP_API_MAP: Record<number, string> = {
  1: API_ENDPOINTS.GENERATE_CONTEXTS,
  2: API_ENDPOINTS.GENERATE_MODELS,
  3: API_ENDPOINTS.GENERATE_FLOWS,
  4: API_ENDPOINTS.CREATE_PROJECT,
  5: API_ENDPOINTS.CREATE_PROJECT,
};

/** 步骤完成所需的最小数据 */
export const STEP_REQUIREMENTS: Record<number, string[]> = {
  1: ['requirementText'],
  2: ['boundedContexts'],
  3: ['domainModels'],
  4: ['businessFlow'],
  5: ['boundedContexts', 'domainModels', 'businessFlow'],
};

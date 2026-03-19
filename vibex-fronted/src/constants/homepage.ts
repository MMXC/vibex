/**
 * Homepage Constants
 * Constants for the homepage modular refactor
 */

import type { Step } from '@/types/homepage';

/** 三步流程步骤定义 (vibex-homepage-flow-redesign epic4) */
export const STEPS: Step[] = [
  { id: 1, label: '业务流程分析', description: '输入上下文，生成业务流程图' },
  { id: 2, label: 'UI组件分析', description: '勾选流程节点，生成UI组件树' },
  { id: 3, label: '创建项目', description: '选择组件，生成项目代码' },
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

/** 步骤对应的 API 端点 (三步流程) */
export const STEP_API_MAP: Record<number, string> = {
  1: API_ENDPOINTS.GENERATE_CONTEXTS, // 业务流程分析（复用限界上下文API生成流程图）
  2: API_ENDPOINTS.GENERATE_FLOWS,     // UI组件分析（复用业务流程API生成组件图）
  3: API_ENDPOINTS.CREATE_PROJECT,      // 创建项目
};

/** 步骤完成所需的最小数据 (三步流程) */
export const STEP_REQUIREMENTS: Record<number, string[]> = {
  1: ['requirementText', 'boundedContexts'],
  2: ['businessFlow'],
  3: ['boundedContexts', 'domainModels', 'businessFlow'],
};

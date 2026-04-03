/**
 * useButtonStates - 按钮状态管理 Hook
 * 
 * 根据前置条件计算各按钮的启用/禁用状态 (三步流程版本)
 */
// @ts-nocheck


import { useMemo, useCallback } from 'react';
import type { BoundedContext, BusinessFlow, ButtonType, ButtonState, ButtonStates } from '@/types/homepage';

export interface UseButtonStatesParams {
  /** 需求文本 */
  requirementText: string;
  /** 限界上下文列表 */
  boundedContexts: BoundedContext[];
  /** 选中的上下文 ID 集合 */
  selectedContextIds: Set<string>;
  /** 业务流程 */
  businessFlow: BusinessFlow | null;
  /** 页面结构是否已分析 */
  pageStructureAnalyzed: boolean;
}

export interface UseButtonStatesReturn {
  /** 所有按钮状态 */
  buttonStates: ButtonStates;
  /** 获取单个按钮状态 */
  getButtonState: (type: ButtonType) => ButtonState;
}

// 三步流程按钮状态初始化
const DEFAULT_BUTTON_STATES: ButtonStates = {
  context: { enabled: false, tooltip: '请先输入需求描述' },
  flow: { enabled: true, tooltip: '' },  // 三步流程Step1: 业务流程分析直接可用(有需求文本即可)
  page: { enabled: false, tooltip: '请先完成业务流程分析' },
  project: { enabled: false, tooltip: '请先完成UI组件分析' },
};

export function useButtonStates(params: UseButtonStatesParams): UseButtonStatesReturn {
  const { requirementText, boundedContexts, selectedContextIds, businessFlow, pageStructureAnalyzed } = params;

  const buttonStates = useMemo<ButtonStates>(() => {
    // 三步流程按钮逻辑:
    // Step 1 业务流程分析: requirementText.trim().length > 0
    const flowEnabled = requirementText.trim().length > 0;
    
    // Step 2 UI组件分析: businessFlow !== null
    const pageEnabled = businessFlow !== null;
    
    // Step 3 创建项目: pageStructureAnalyzed === true
    const projectEnabled = pageStructureAnalyzed;

    return {
      context: {
        enabled: flowEnabled, // 复用flow状态
        tooltip: flowEnabled ? undefined : '请先输入需求描述',
      },
      flow: {
        enabled: flowEnabled,
        tooltip: flowEnabled ? undefined : '请先输入需求描述',
      },
      page: {
        enabled: pageEnabled,
        tooltip: pageEnabled ? undefined : '请先完成业务流程分析',
      },
      project: {
        enabled: projectEnabled,
        tooltip: projectEnabled ? undefined : '请先完成UI组件分析',
      },
    };
  }, [requirementText, boundedContexts, selectedContextIds, businessFlow, pageStructureAnalyzed]);

  const getButtonState = useCallback((type: ButtonType): ButtonState => {
    return buttonStates[type];
  }, [buttonStates]);

  return {
    buttonStates,
    getButtonState,
  };
}

export default useButtonStates;

/**
 * useButtonStates - 按钮状态管理 Hook
 * 
 * 根据前置条件计算各按钮的启用/禁用状态
 */

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

const DEFAULT_BUTTON_STATES: ButtonStates = {
  context: { enabled: false, tooltip: '请先输入需求描述' },
  flow: { enabled: false, tooltip: '请先完成上下文分析并选择上下文' },
  page: { enabled: false, tooltip: '请先完成流程分析' },
  project: { enabled: false, tooltip: '请先完成页面结构分析' },
};

export function useButtonStates(params: UseButtonStatesParams): UseButtonStatesReturn {
  const { requirementText, boundedContexts, selectedContextIds, businessFlow, pageStructureAnalyzed } = params;

  const buttonStates = useMemo<ButtonStates>(() => {
    // 上下文分析按钮：requirementText.trim().length > 0
    const contextEnabled = requirementText.trim().length > 0;
    
    // 流程分析按钮：boundedContexts.length > 0 && selectedContextIds.size > 0
    const flowEnabled = boundedContexts.length > 0 && selectedContextIds.size > 0;
    
    // 页面结构按钮：businessFlow !== null
    const pageEnabled = businessFlow !== null;
    
    // 创建项目按钮：pageStructureAnalyzed === true
    const projectEnabled = pageStructureAnalyzed;

    return {
      context: {
        enabled: contextEnabled,
        tooltip: contextEnabled ? undefined : '请先输入需求描述',
      },
      flow: {
        enabled: flowEnabled,
        tooltip: flowEnabled ? undefined : '请先完成上下文分析并选择上下文',
      },
      page: {
        enabled: pageEnabled,
        tooltip: pageEnabled ? undefined : '请先完成流程分析',
      },
      project: {
        enabled: projectEnabled,
        tooltip: projectEnabled ? undefined : '请先完成页面结构分析',
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

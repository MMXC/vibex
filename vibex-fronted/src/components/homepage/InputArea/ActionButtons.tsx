/**
 * ActionButtons - 拆分后的操作按钮组件
 * 
 * 支持两种模式：
 * 1. 多按钮模式：显示4个独立按钮
 * 2. 单按钮模式（根据currentStep）：根据当前步骤动态显示按钮文字和调用不同API
 */

import React from 'react';
import type { ButtonType, ButtonStates, ButtonState } from '@/types/homepage';
import styles from './ActionButtons.module.css';

export interface ActionButtonsProps {
  /** 按钮状态 */
  buttonStates: ButtonStates;
  /** 上下文分析回调 */
  onGenerateContexts: () => void;
  /** 流程分析回调 */
  onGenerateFlow: () => void;
  /** 页面结构分析回调 */
  onAnalyzePageStructure: () => void;
  /** 创建项目回调 */
  onCreateProject: () => void;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 当前正在生成的按钮类型 */
  currentGeneratingButton?: ButtonType;
  /** 自定义类名 */
  className?: string;
  /** 当前步骤（用于动态按钮模式） */
  currentStep?: number;
  /** 是否使用动态单按钮模式 */
  useDynamicButton?: boolean;
}

// F2: 根据步骤动态变化的按钮配置
const DYNAMIC_BUTTON_CONFIG: Record<number, { label: string; icon: string }> = {
  1: { label: '开始生成限界上下文', icon: '🔍' },
  2: { label: '生成领域模型', icon: '🏗️' },
  3: { label: '生成业务流程', icon: '📊' },
  4: { label: '分析页面结构', icon: '📄' },
  5: { label: '创建项目', icon: '🚀' },
};

const STATIC_BUTTON_CONFIG: Array<{
  type: ButtonType;
  label: string;
  icon: string;
  key: keyof Pick<ActionButtonsProps, 'onGenerateContexts' | 'onGenerateFlow' | 'onAnalyzePageStructure' | 'onCreateProject'>;
}> = [
  { type: 'context', label: '上下文分析', icon: '🔍', key: 'onGenerateContexts' },
  { type: 'flow', label: '流程分析', icon: '📊', key: 'onGenerateFlow' },
  { type: 'page', label: '页面结构', icon: '📄', key: 'onAnalyzePageStructure' },
  { type: 'project', label: '创建项目', icon: '🚀', key: 'onCreateProject' },
];

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttonStates,
  onGenerateContexts,
  onGenerateFlow,
  onAnalyzePageStructure,
  onCreateProject,
  isGenerating,
  currentGeneratingButton,
  className,
  currentStep = 1,
  useDynamicButton = false,
}) => {
  // F2: 处理动态单按钮点击
  const handleDynamicClick = () => {
    if (isGenerating) return;
    
    switch (currentStep) {
      case 1:
        onGenerateContexts();
        break;
      case 2:
        // 步骤2调用 generateDomainModels (通过 onGenerateFlow 传递)
        onGenerateFlow();
        break;
      case 3:
        onGenerateFlow();
        break;
      case 4:
        onAnalyzePageStructure();
        break;
      case 5:
        onCreateProject();
        break;
    }
  };

  const handleStaticClick = (type: ButtonType) => {
    if (isGenerating) return;
    
    switch (type) {
      case 'context':
        onGenerateContexts();
        break;
      case 'flow':
        onGenerateFlow();
        break;
      case 'page':
        onAnalyzePageStructure();
        break;
      case 'project':
        onCreateProject();
        break;
    }
  };

  // F2: 动态单按钮模式渲染 - 根据步骤获取对应的按钮状态
  if (useDynamicButton) {
    const config = DYNAMIC_BUTTON_CONFIG[currentStep];
    
    // 根据步骤获取对应的按钮状态
    const getStateForStep = (step: number): ButtonState => {
      switch (step) {
        case 1: return buttonStates.context;
        case 2: return buttonStates.flow; // generateDomainModels uses flow button state
        case 3: return buttonStates.flow;
        case 4: return buttonStates.page;
        case 5: return buttonStates.project;
        default: return { enabled: false, tooltip: '' };
      }
    };
    
    const state = getStateForStep(currentStep);
    const isDisabled = !state.enabled || isGenerating;

    return (
      <div className={`${styles.actionButtons} ${className || ''}`}>
        <button
          className={`${styles.button} ${state.enabled ? styles.enabled : styles.disabled} ${isGenerating ? styles.loading : ''}`}
          onClick={handleDynamicClick}
          disabled={isDisabled}
          title={state.tooltip}
        >
          {isGenerating ? (
            <span className={styles.spinner}></span>
          ) : (
            <span className={styles.icon}>{config?.icon || '🔍'}</span>
          )}
          <span className={styles.label}>{config?.label || '生成'}</span>
        </button>
      </div>
    );
  }

  // 多按钮模式渲染
  return (
    <div className={`${styles.actionButtons} ${className || ''}`}>
      {STATIC_BUTTON_CONFIG.map((config) => {
        const state = buttonStates[config.type];
        const isLoading = isGenerating && currentGeneratingButton === config.type;
        const isDisabled = !state.enabled || isGenerating;

        return (
          <button
            key={config.type}
            className={`${styles.button} ${state.enabled ? styles.enabled : styles.disabled} ${isLoading ? styles.loading : ''}`}
            onClick={() => handleStaticClick(config.type)}
            disabled={isDisabled}
            title={state.tooltip}
          >
            {isLoading ? (
              <span className={styles.spinner}></span>
            ) : (
              <span className={styles.icon}>{config.icon}</span>
            )}
            <span className={styles.label}>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ActionButtons;

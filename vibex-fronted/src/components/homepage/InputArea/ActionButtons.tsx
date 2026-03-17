/**
 * ActionButtons - 拆分后的操作按钮组件
 * 
 * 包含 4 个独立按钮：上下文分析、流程分析、页面结构分析、创建项目
 */

import React from 'react';
import type { ButtonType, ButtonStates } from '@/types/homepage';
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
}

const BUTTON_CONFIG: Array<{
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
}) => {
  const handleClick = (type: ButtonType) => {
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

  const getButtonHandler = (key: keyof Pick<ActionButtonsProps, 'onGenerateContexts' | 'onGenerateFlow' | 'onAnalyzePageStructure' | 'onCreateProject'>) => {
    switch (key) {
      case 'onGenerateContexts': return onGenerateContexts;
      case 'onGenerateFlow': return onGenerateFlow;
      case 'onAnalyzePageStructure': return onAnalyzePageStructure;
      case 'onCreateProject': return onCreateProject;
    }
  };

  return (
    <div className={`${styles.actionButtons} ${className || ''}`}>
      {BUTTON_CONFIG.map((config) => {
        const state = buttonStates[config.type];
        const isLoading = isGenerating && currentGeneratingButton === config.type;
        const isDisabled = !state.enabled || isGenerating;

        return (
          <button
            key={config.type}
            className={`${styles.button} ${state.enabled ? styles.enabled : styles.disabled} ${isLoading ? styles.loading : ''}`}
            onClick={() => handleClick(config.type)}
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

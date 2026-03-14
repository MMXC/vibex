import React from 'react';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import styles from './PreviewCanvas.module.css';
import type { PreviewCanvasProps, BoundedContext, DomainModel, BusinessFlow, MermaidCodes } from '@/types/homepage';

/**
 * PreviewCanvas - 预览画布组件
 * 
 * 功能：
 * - 根据 currentStep 渲染不同内容
 * - Mermaid 图表展示
 * - 节点勾选功能
 * - 面板最大/最小化
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  currentStep,
  mermaidCodes,
  boundedContexts,
  domainModels,
  businessFlow,
  selectedNodes,
  onNodeToggle,
  panelSizes,
  onPanelResize,
  maximizedPanel,
  minimizedPanel,
  onMaximize,
  onMinimize,
  className = '',
}) => {
  const isPreviewLoading = false; // TODO: Add loading state
  const isModelLoading = false;
  const isFlowLoading = false;

  // 获取当前步骤的 mermaid code
  const getCurrentMermaidCode = (): string => {
    switch (currentStep) {
      case 1:
        return mermaidCodes.contexts || '';
      case 2:
        return mermaidCodes.contexts || '';
      case 3:
        return mermaidCodes.models || '';
      case 4:
        return mermaidCodes.flows || '';
      default:
        return '';
    }
  };

  const mermaidCode = getCurrentMermaidCode();

  // 渲染空状态
  const renderEmpty = () => (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>👁️</div>
      <div className={styles.emptyText}>
        {currentStep === 1 && '输入需求后，这里将实时显示 AI 生成的设计预览'}
        {currentStep === 2 && '请先生成限界上下文'}
        {currentStep === 3 && '请先生成领域模型'}
        {currentStep === 4 && '请先生成业务流程'}
        {currentStep === 5 && '已完成所有设计步骤'}
      </div>
    </div>
  );

  // 渲染节点勾选
  const renderNodeSelection = () => {
    if (currentStep !== 2 || boundedContexts.length === 0) return null;

    return (
      <div className={styles.nodeSelection}>
        {boundedContexts.map(ctx => (
          <label
            key={ctx.id}
            className={`${styles.nodeCheckbox} ${selectedNodes.has(`ctx-${ctx.id}`) ? styles.checked : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedNodes.has(`ctx-${ctx.id}`)}
              onChange={() => onNodeToggle(`ctx-${ctx.id}`)}
            />
            <span className={styles.nodeLabel}>{ctx.name}</span>
          </label>
        ))}
      </div>
    );
  };

  // 根据步骤渲染标题
  const getStepTitle = (): string => {
    switch (currentStep) {
      case 1:
        return '👁️ 需求分析';
      case 2:
        return '👁️ 限界上下文';
      case 3:
        return '👁️ 领域模型';
      case 4:
        return '👁️ 业务流程';
      case 5:
        return '👁️ 项目概览';
      default:
        return '👁️ 实时预览';
    }
  };

  return (
    <div className={`${styles.previewCanvas} ${className}`}>
      {/* 头部 */}
      <div 
        className={styles.header}
        onDoubleClick={() => maximizedPanel === 'preview' ? onMinimize('preview') : onMaximize('preview')}
      >
        <span className={styles.title}>{getStepTitle()}</span>
        <div className={styles.actions}>
          {minimizedPanel !== 'preview' && (
            <>
              <button 
                className={styles.actionButton}
                onClick={() => onMinimize('preview')}
                title="最小化"
              >
                −
              </button>
              <button 
                className={styles.actionButton}
                onClick={() => onMaximize('preview')}
                title="最大化"
              >
                □
              </button>
            </>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {minimizedPanel === 'preview' ? (
        <div className={styles.minimizedContent}>
          <span>{getStepTitle()}</span>
          <button onClick={() => onMinimize('preview')}>展开</button>
        </div>
      ) : (
        <div className={styles.content}>
          {mermaidCode ? (
            <>
              <div className={styles.mermaidContainer}>
                <MermaidPreview 
                  code={mermaidCode} 
                  diagramType="flowchart"
                  layout="TB"
                  height="100%"
                />
              </div>
              {renderNodeSelection()}
            </>
          ) : (
            renderEmpty()
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewCanvas;
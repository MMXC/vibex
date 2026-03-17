/**
 * PreviewArea - 预览区域组件
 * 
 * 支持两种模式：
 * 1. 旧版：content, isLoading (用于 step 组件)
 * 2. 新版：currentStep, mermaidCode 等 (用于垂直布局)
 */
import React, { useState, useMemo } from 'react';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { NodeTreeSelector } from './NodeTreeSelector';
import styles from './PreviewArea.module.css';
import type { BoundedContext, DomainModel, BusinessFlow } from '@/types/homepage';

// 旧版 Props (用于 Step 组件)
export interface PreviewAreaProps {
  content?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// 新版 Props (用于垂直布局)
export interface VerticalPreviewProps {
  /** 当前步骤 */
  currentStep?: number;
  /** Mermaid 代码 */
  mermaidCode?: string;
  /** 限界上下文 */
  boundedContexts?: BoundedContext[];
  /** 领域模型 */
  domainModels?: DomainModel[];
  /** 业务流程 */
  businessFlow?: BusinessFlow | null;
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** 步骤配置 */
  steps?: Array<{ id: number; label: string; description: string }>;
}

// 合并类型
export type PreviewAreaAllProps = PreviewAreaProps & VerticalPreviewProps;

const DEFAULT_STEPS = [
  { id: 1, label: '需求输入', description: '输入项目需求' },
  { id: 2, label: '限界上下文', description: '分析限界上下文' },
  { id: 3, label: '领域模型', description: '构建领域模型' },
  { id: 4, label: '业务流程', description: '设计业务流程' },
  { id: 5, label: '项目创建', description: '生成项目代码' },
];

export const PreviewArea: React.FC<PreviewAreaAllProps> = ({
  // 旧版 props
  content,
  isLoading: legacyLoading,
  onRefresh,
  // 新版 props
  currentStep,
  mermaidCode,
  boundedContexts = [],
  domainModels = [],
  businessFlow = null,
  isGenerating = false,
  steps = DEFAULT_STEPS,
}) => {
  const [showNodeTree, setShowNodeTree] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // 检测是否使用新版布局
  const isNewLayout = currentStep !== undefined;

  // 从 boundedContexts 生成节点数据
  const nodes = useMemo(() => {
    if (!boundedContexts.length) return [];
    
    return boundedContexts.map((ctx) => ({
      id: ctx.id || `ctx-${Math.random()}`,
      name: ctx.name || 'Unnamed Context',
      type: 'context' as const,
      selected: true,
      description: ctx.description,
      children: ctx.relationships?.map((rel) => ({
        id: rel.id || `rel-${Math.random()}`,
        name: rel.description || 'Related Context',
        type: 'feature' as const,
        selected: true,
        description: `${rel.type} → ${rel.toContextId}`,
      })) || [],
    }));
  }, [boundedContexts]);

  // 处理节点选择变化
  const handleNodeSelectionChange = (nodeIds: string[]) => {
    setSelectedNodes(new Set(nodeIds));
  };

  // 获取步骤标签
  const getStepLabel = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    return step?.label || `Step ${stepId}`;
  };

  // 渲染旧版布局
  if (!isNewLayout) {
    return (
      <div className={styles.previewArea}>
        <div className={styles.header}>
          <span className={styles.title}>预览</span>
          <button 
            className={styles.refreshButton}
            onClick={onRefresh}
            disabled={legacyLoading}
          >
            {legacyLoading ? '加载中...' : '🔄'}
          </button>
        </div>
        <div className={styles.content}>
          {legacyLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>加载中...</p>
            </div>
          ) : content ? (
            <div className={styles.previewContent}>{content}</div>
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.placeholderContent}>
                <span className={styles.placeholderIcon}>🎯</span>
                <p>暂无预览内容</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 渲染新版垂直布局
  const effectiveLoading = legacyLoading || isGenerating;

  return (
    <div className={styles.previewArea}>
      {/* 头部：步骤指示器 */}
      <div className={styles.header}>
        <span className={styles.title}>📺 实时预览</span>
        <div className={styles.stepIndicator}>
          {getStepLabel(currentStep || 1)}
        </div>
        {effectiveLoading && (
          <span className={styles.loadingBadge}>生成中...</span>
        )}
      </div>

      {/* 主内容区 */}
      <div className={styles.content}>
        {/* Mermaid 图表区域 */}
        <div className={styles.diagramContainer}>
          {effectiveLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>AI 正在分析需求...</p>
            </div>
          ) : mermaidCode ? (
            <MermaidPreview 
              code={mermaidCode} 
              diagramType="graph"
              height="100%"
            />
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.placeholderContent}>
                <span className={styles.placeholderIcon}>🎯</span>
                <p>输入需求后，这里将显示 DDD 分析结果</p>
                <p className={styles.placeholderHint}>
                  限界上下文 → 领域模型 → 业务流程
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 节点树选择器 - 仅在有上下文时显示 */}
        {showNodeTree && nodes.length > 0 && (
          <NodeTreeSelector
            nodes={nodes}
            selectedIds={selectedNodes}
            onSelectionChange={handleNodeSelectionChange}
            onToggle={() => setShowNodeTree(!showNodeTree)}
          />
        )}
      </div>

      {/* 思考过程面板 */}
      {effectiveLoading && (
        <div className={styles.thinkingPanel}>
          <div className={styles.thinkingIndicator}>
            <span className={styles.thinkingDot}></span>
            <span>AI 正在分析...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewArea;

/**
 * InputArea - 输入区域组件
 * 
 * 支持两种模式：
 * 1. 旧版：value, onChange, onSubmit (用于 step 组件)
 * 2. 新版：currentStep, requirementText, onRequirementChange, onSubmit (用于垂直布局)
 */
import React, { useCallback } from 'react';
import { RequirementInput } from '@/components/requirement-input';
import { PlanBuildButtons } from '@/components/plan-build';
import { ActionButtons } from './ActionButtons';
import { useButtonStates } from '../hooks/useButtonStates';
import type { Step, BoundedContext, DomainModel, BusinessFlow, ButtonType } from '@/types/homepage';
import styles from './InputArea.module.css';

// 旧版 Props (用于 Step 组件)
export interface InputAreaProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

// 新版 Props (用于垂直布局)
export interface VerticalInputProps {
  /** 当前步骤 */
  currentStep?: number;
  /** 需求文本 */
  requirementText?: string;
  /** 需求变化回调 */
  onRequirementChange?: (text: string) => void;
  /** 提交回调 */
  onSubmit?: () => void;
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** 步骤配置 */
  steps?: Step[];
  /** 已完成步骤 */
  completedStep?: number;
  /** 步骤点击回调 */
  onStepClick?: (step: number) => void;
  /** 生成回调 */
  onGenerate?: () => void;
  /** 生成领域模型回调 */
  onGenerateDomainModel?: () => void;
  /** 生成业务流程回调 */
  onGenerateBusinessFlow?: () => void;
  /** 创建项目回调 */
  onCreateProject?: () => void;
  /** 限界上下文 */
  boundedContexts?: BoundedContext[];
  /** 领域模型 */
  domainModels?: DomainModel[];
  /** 业务流程 */
  businessFlow?: BusinessFlow | null;
  /** 选中的上下文 ID 集合 */
  selectedContextIds?: Set<string>;
  /** 页面结构是否已分析 */
  pageStructureAnalyzed?: boolean;
  /** 页面结构分析回调 */
  onAnalyzePageStructure?: () => void;
}

// 合并类型
export type InputAreaAllProps = InputAreaProps & VerticalInputProps;

// 四步流程常量 (Epic 3: 需求录入 / 需求澄清 / 业务流程 / 组件图)
const DEFAULT_STEPS: Step[] = [
  { id: 1, label: '需求录入', description: '描述您的需求' },
  { id: 2, label: '需求澄清', description: 'AI 追问澄清' },
  { id: 3, label: '业务流程', description: '绘制业务流程' },
  { id: 4, label: '组件图', description: '生成组件关系图' },
];

// 示例需求
const SAMPLE_REQUIREMENTS = [
  { title: '电商平台', desc: '开发一个在线电商平台，支持用户注册、商品浏览、购物车、订单管理、支付集成' },
  { title: '博客系统', desc: '创建一个技术博客系统，支持 Markdown 写作、标签分类、评论系统、SEO 优化' },
  { title: '任务管理', desc: '开发团队任务管理工具，支持看板视图、任务分配、截止日期提醒、进度追踪' },
];

export const InputArea: React.FC<InputAreaAllProps> = ({
  // 旧版 props
  value,
  placeholder,
  onChange,
  onSubmit: legacyOnSubmit,
  disabled: legacyDisabled,
  // 新版 props
  currentStep = 1,
  requirementText = '',
  onRequirementChange,
  onSubmit,
  isGenerating = false,
  steps = DEFAULT_STEPS,
  completedStep = 0,
  onStepClick,
  onGenerate,
  onGenerateDomainModel,
  onGenerateBusinessFlow,
  onCreateProject,
  boundedContexts = [],
  domainModels = [],
  businessFlow = null,
  selectedContextIds = new Set(),
  pageStructureAnalyzed = false,
  onAnalyzePageStructure,
}) => {
  // 检测是否使用新版布局
  const isNewLayout = currentStep !== undefined && onRequirementChange !== undefined;

  // 使用 useButtonStates hook 计算按钮状态
  const { buttonStates } = useButtonStates({
    requirementText,
    boundedContexts,
    selectedContextIds,
    businessFlow,
    pageStructureAnalyzed,
  });

  const currentStepData = steps.find(s => s.id === currentStep);

  // 处理示例点击
  const handleSampleClick = useCallback((desc: string) => {
    if (onRequirementChange) {
      onRequirementChange(desc);
    }
  }, [onRequirementChange]);

  // 处理输入变化
  const handleInputChange = useCallback((val: string) => {
    if (onRequirementChange) {
      onRequirementChange(val);
    }
    if (onChange) {
      onChange(val);
    }
  }, [onRequirementChange, onChange]);

  // 判断按钮是否可用
  const canSubmit = (!isGenerating && !legacyDisabled) && (
    (requirementText && requirementText.trim().length > 0) || 
    (value && value.trim().length > 0)
  );

  // 渲染旧版布局
  if (!isNewLayout) {
    return (
      <div className={styles.inputArea}>
        <div className={styles.header}>
          <span className={styles.title}>📝 输入</span>
        </div>
        <div className={styles.content}>
          <div className={styles.inputSection}>
            <label className={styles.inputLabel}>
              描述你的产品需求
            </label>
            <RequirementInput
              initialValue={value || ''}
              onValueChange={handleInputChange}
              onGenerate={legacyOnSubmit}
            />
          </div>
          <div className={styles.actions}>
            <button
              className={styles.generateButton}
              onClick={legacyOnSubmit}
              disabled={legacyDisabled || !value?.trim()}
            >
              🚀 开始生成
            </button>
            <PlanBuildButtons />
          </div>
        </div>
      </div>
    );
  }

  // 渲染新版垂直布局
  return (
    <div className={styles.inputArea}>
      {/* 头部 */}
      <div className={styles.header}>
        <span className={styles.title}>📝 需求录入</span>
      </div>

      {/* 内容 */}
      <div className={styles.content}>
        {/* 步骤指示器 */}
        <div className={styles.stepBar}>
          {steps.map((step) => (
            <button
              key={step.id}
              className={`${styles.stepItem} ${
                step.id === currentStep ? styles.active : ''
              } ${step.id <= completedStep ? styles.completed : ''}`}
              onClick={() => onStepClick?.(step.id)}
              disabled={step.id > completedStep + 1}
            >
              <span className={styles.stepNumber}>{step.id}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          ))}
        </div>

        {/* 当前步骤说明 */}
        <div className={styles.stepInfo}>
          <h2 className={styles.stepTitle}>
            {currentStepData?.label || '需求输入'}
          </h2>
          <p className={styles.stepDesc}>
            {currentStepData?.description || '描述你的产品需求，AI 将协助你完成完整的设计'}
          </p>
        </div>

        {/* 输入区域 */}
        <div className={styles.inputWrapper}>
          <label className={styles.inputLabel}>
            描述你的产品需求
          </label>
          
          <textarea
            className={styles.textarea}
            value={requirementText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="例如：开发一个在线教育平台，支持课程管理、用户学习进度跟踪、在线测验..."
            disabled={isGenerating}
          />

          {/* 字数统计 */}
          <div className={styles.inputStats}>
            <span>{requirementText.length} 字符</span>
          </div>
        </div>

        {/* 快速开始示例 */}
        <div className={styles.samples}>
          <span className={styles.sampleLabel}>快速开始：</span>
          <div className={styles.sampleButtons}>
            {SAMPLE_REQUIREMENTS.map((sample, idx) => (
              <button
                key={idx}
                className={styles.sampleBtn}
                onClick={() => handleSampleClick(sample.desc)}
                disabled={isGenerating}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* 操作按钮 - 使用拆分后的 ActionButtons */}
        <div className={styles.actions}>
          <ActionButtons
            buttonStates={buttonStates}
            onGenerateContexts={onGenerate || onSubmit || (() => {})}
            onGenerateFlow={onGenerateDomainModel || onGenerateBusinessFlow || (() => {})}
            onAnalyzePageStructure={onAnalyzePageStructure || (() => {})}
            onCreateProject={onCreateProject || (() => {})}
            isGenerating={isGenerating}
            currentGeneratingButton={undefined}
            currentStep={currentStep}
            useDynamicButton={true}
          />
          <PlanBuildButtons />
        </div>
      </div>
    </div>
  );
};

export default InputArea;

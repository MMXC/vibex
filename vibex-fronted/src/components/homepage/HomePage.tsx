/**
 * HomePage - 主页容器组件 (Grid 布局版 - homepage-v4-fix)
 *
 * Epic 2+3: Grid 三栏布局 (220px左侧 | 1fr中央 | 260px右侧) + 底部面板 (380px)
 * 六步流程: 需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成
 *
 * 业务逻辑已抽取到 useHomePage hook
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { Navbar, Sidebar, AIPanel } from '@/components/homepage';
import { useHomePage } from './hooks';
import { PreviewArea } from './PreviewArea/PreviewArea';
import { BottomPanel } from './BottomPanel/BottomPanel';
import type { AIMessage } from './types';
import styles from '@/app/homepage.module.css';
import type { Step } from '@/types/homepage';

// Dynamic import for ParticleBackground (SSR: false to avoid window access on server)
const ParticleBackground = dynamic(
  () => import('@/components/particles/ParticleBackground'),
  { ssr: false }
);

// 六步流程常量 - PRD v2 + Epic 3: 需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成
const STEPS: Step[] = [
  { id: 1, label: '需求输入', description: '描述您的需求' },
  { id: 2, label: '限界上下文', description: '定义系统边界' },
  { id: 3, label: '领域模型', description: '设计领域实体' },
  { id: 4, label: '需求澄清', description: 'AI 追问和需求澄清' },
  { id: 5, label: '业务流程', description: '绘制业务流程' },
  { id: 6, label: 'UI 生成', description: '生成 UI 设计' },
];

export default function HomePage() {
  const {
    currentStep,
    completedStep,
    isAuthenticated,
    setCurrentStep,
    requirementText,
    setRequirementText,
    boundedContexts,
    contextMermaidCode,
    domainModels,
    modelMermaidCode,
    businessFlow,
    flowMermaidCode,
    generateContexts,
    generateDomainModels,
    generateBusinessFlow,
    analyzePageStructure,
    selectedContextIds,
    pageStructureAnalyzed,
    isGenerating,
    thinkingMessages,
  } = useHomePage();

  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);

  // 根据当前步骤返回对应 Mermaid 代码 (PRD 6步流程 + Epic 3)
  const currentMermaidCode = useMemo(() => {
    switch (currentStep) {
      case 1:
        return contextMermaidCode || flowMermaidCode || '';
      case 2:
        return contextMermaidCode || '';
      case 3:
        return modelMermaidCode || '';
      case 4:
        return modelMermaidCode || ''; // 需求澄清 - 显示领域模型供讨论
      case 5:
        return flowMermaidCode || '';
      case 6:
        return flowMermaidCode || ''; // UI 生成 - 复用 flowMermaidCode 占位
      default:
        return '';
    }
  }, [currentStep, contextMermaidCode, modelMermaidCode, flowMermaidCode]);

  // Handle step change
  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  // ST-1.2: thinkingMessages 适配器 - ThinkingStep[] → AIMessage[]
  const adaptedMessages = useMemo<AIMessage[]>(() => {
    return thinkingMessages.map((step, i) => ({
      id: `thinking-${step.step}-${i}`,
      role: 'assistant' as const,
      content: step.message,
    }));
  }, [thinkingMessages]);

  // ST-1.3: 新项目脉冲动画 - 标记最后一个 thinking item 为最新
  const newThinkingItemId = useMemo(() => {
    if (thinkingMessages.length === 0) return undefined;
    const last = thinkingMessages[thinkingMessages.length - 1];
    return `thinking-${last.step}-${thinkingMessages.length - 1}`;
  }, [thinkingMessages]);

  // ST-1.1: AIPanel 发送消息处理
  const handleAIPanelSend = useCallback((_message: string) => {
    // TODO: 实现 AI 对话发送逻辑 (后续 Epic 集成)
  }, []);

  return (
    <div className={styles.page}>
      <ParticleBackground />

      {/* ST-3.3: Grid Header - 全宽 */}
      <Navbar
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginDrawerOpen(true)}
        onMenuToggle={() => {}}
        onSettingsClick={() => {}}
        className={styles.header}
      />

      {/* ST-3.3: 左侧抽屉 - 220px 宽 */}
      <Sidebar
        steps={STEPS}
        currentStep={currentStep}
        completedStep={completedStep}
        onStepClick={handleStepClick}
        isStepClickable={(stepId) => stepId <= (completedStep + 1)}
        className={styles.leftDrawer}
      />

      {/* ST-3.3: 中心预览区 - 自适应宽度 */}
      <main className={styles.preview}>
        <PreviewArea
          currentStep={currentStep}
          mermaidCode={currentMermaidCode}
          boundedContexts={boundedContexts}
          domainModels={domainModels}
          businessFlow={businessFlow}
          isGenerating={isGenerating}
        />
      </main>

      {/* ST-1.1 + ST-3.3: 右侧 AI 面板 - 260px 宽 */}
      <div className={styles.rightDrawer}>
        <AIPanel
          isOpen={true}
          messages={adaptedMessages}
          onClose={() => {}}
          onSendMessage={handleAIPanelSend}
          newItemId={newThinkingItemId}
        />
      </div>

      {/* ST-2.7: 底部面板 - 380px 固定高度 */}
      <div className={styles.bottomPanel}>
        <BottomPanel
          isGenerating={isGenerating}
          onAIAsk={() => {}}
          onDiagnose={() => {}}
          onOptimize={() => {}}
          onHistory={() => {}}
          onSave={() => {}}
          onRegenerate={() => {}}
          onCreateProject={() => {}}
          onSendMessage={handleAIPanelSend}
        />
      </div>

      <LoginDrawer
        isOpen={isLoginDrawerOpen}
        onClose={() => setIsLoginDrawerOpen(false)}
      />
    </div>
  );
}

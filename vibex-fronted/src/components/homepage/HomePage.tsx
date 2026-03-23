/**
 * HomePage - 主页容器组件 (Grid 布局版 - homepage-v4-fix)
 *
 * Epic 2+3: Grid 三栏布局 (220px左侧 | 1fr中央 | 260px右侧) + 底部面板 (380px)
 * 六步流程: 需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成
 *
 * 业务逻辑已抽取到 useHomePage hook
 */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { Navbar, AIPanel } from '@/components/homepage';
import { useHomePage } from './hooks';
import { PreviewArea } from './PreviewArea/PreviewArea';
import { BottomPanel } from './BottomPanel/BottomPanel';
import { StepNavigator } from './StepNavigator';
import { useHomePageStore } from '@/stores/homePageStore';
import type { AIMessage } from './types';
import styles from '@/app/homepage.module.css';
import type { Step } from '@/types/homepage';

// Dynamic import for ParticleBackground (SSR: false to avoid window access on server)
const ParticleBackground = dynamic(
  () => import('@/components/particles/ParticleBackground'),
  { ssr: false }
);

// 四步流程常量 (Epic 3: 需求录入 → 需求澄清 → 业务流程 → 组件图)
const STEPS: Step[] = [
  { id: 1, label: '需求录入', description: '描述您的需求' },
  { id: 2, label: '需求澄清', description: 'AI 追问澄清' },
  { id: 3, label: '业务流程', description: '绘制业务流程' },
  { id: 4, label: '组件图', description: '生成组件关系图' },
];

export default function HomePage() {
  const {
    currentStep,
    isAuthenticated,
    setCurrentStep,
    boundedContexts,
    contextMermaidCode,
    domainModels,
    modelMermaidCode,
    businessFlow,
    flowMermaidCode,
    isGenerating,
    thinkingMessages,
    requirementText,
    setRequirementText,
    generateContexts,
    chatHistory,
    handleDiagnose,
    handleOptimize,
    handleSave,
    handleHistory,
    handleCreateProject,
    handleRegenerate,
  } = useHomePage();

  // Epic4: Integrate homePageStore for completed steps (convert string step IDs to numbers)
  const { completedSteps: completedStepStrings } = useHomePageStore();
  const completedSteps = completedStepStrings
    .map(s => parseInt(s.replace('step', ''), 10))
    .filter(n => !isNaN(n));

  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);

  // 根据当前步骤返回对应 Mermaid 代码 (Epic 3: 4步流程)
  const currentMermaidCode = useMemo(() => {
    switch (currentStep) {
      case 1:
        return contextMermaidCode || flowMermaidCode || '';
      case 2:
        return modelMermaidCode || ''; // 需求澄清 - 显示领域模型供讨论
      case 3:
        return flowMermaidCode || '';
      case 4:
        return flowMermaidCode || ''; // 组件图 - 复用 flowMermaidCode 占位
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

  // ST-1.1: AIPanel 发送消息处理 → 调用 generateContexts pipeline
  const handleAIPanelSend = useCallback((message: string) => {
    if (!message.trim()) return;
    setRequirementText(message);
    generateContexts(message);
  }, [setRequirementText, generateContexts]);

  return (
    <div className={styles.page}>
      <ParticleBackground />

      {/* ST-3.3: Grid Header - 全宽 */}
      <Navbar
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginDrawerOpen(true)}
        onMenuToggle={() => setIsMenuOpen(v => !v)}
        onSettingsClick={() => {}}
        className={styles.header}
      />

      {/* ST-3.3: 左侧抽屉 - StepNavigator */}
      <StepNavigator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
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
          isOpen={isAIPanelOpen}
          messages={adaptedMessages}
          onClose={() => setIsAIPanelOpen(false)}
          onSendMessage={handleAIPanelSend}
          newItemId={newThinkingItemId}
        />
      </div>

      {/* ST-2.7: 底部面板 - 380px 固定高度 */}
      <div className={styles.bottomPanel}>
        <BottomPanel
          isGenerating={isGenerating}
          onAIAsk={(msg) => {
            if (msg) handleAIPanelSend(msg);
          }}
          onDiagnose={handleDiagnose}
          onOptimize={handleOptimize}
          onHistory={handleHistory}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          onCreateProject={handleCreateProject}
          onSendMessage={handleAIPanelSend}
          chatHistory={chatHistory}
        />
      </div>

      <LoginDrawer
        isOpen={isLoginDrawerOpen}
        onClose={() => setIsLoginDrawerOpen(false)}
      />
    </div>
  );
}

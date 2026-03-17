/**
 * HomePage - 主页容器组件 (三栏布局版)
 * 
 * 15% 左侧步骤导航 | 60% 中间内容区 | 25% 右侧AI面板
 * 
 * 业务逻辑已抽取到 useHomePage hook
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { Navbar, Sidebar, MainContent, StepContainer } from '@/components/homepage';
import { useHomePage } from './hooks';
import { InputArea } from './InputArea/InputArea';
import { PreviewArea } from './PreviewArea/PreviewArea';
import { AIPanel } from './AIPanel/AIPanel';
import { ThinkingPanel } from './ThinkingPanel/ThinkingPanel';
import styles from '@/app/homepage.module.css';
import type { Step } from '@/types/homepage';

// Dynamic import for ParticleBackground (SSR: false to avoid window access on server)
const ParticleBackground = dynamic(
  () => import('@/components/particles/ParticleBackground'),
  { ssr: false }
);

// 五步流程常量
const STEPS: Step[] = [
  { id: 1, label: '需求输入', description: '输入项目需求' },
  { id: 2, label: '限界上下文', description: '分析限界上下文' },
  { id: 3, label: '领域模型', description: '构建领域模型' },
  { id: 4, label: '业务流程', description: '设计业务流程' },
  { id: 5, label: '项目创建', description: '生成项目代码' },
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
  } = useHomePage();
  
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);

  // Get current mermaid code based on step (F1: show contextMermaidCode on Step 1)
  const currentMermaidCode = useMemo(() => {
    switch (currentStep) {
      case 1: return contextMermaidCode;  // F1: Step 1 shows context diagram
      case 2: return contextMermaidCode;
      case 3: return modelMermaidCode;
      case 4: return flowMermaidCode;
      default: return '';
    }
  }, [currentStep, contextMermaidCode, modelMermaidCode, flowMermaidCode]);

  // Handle requirement submission
  const handleRequirementSubmit = useCallback(() => {
    if (requirementText.trim()) {
      generateContexts(requirementText);
    }
  }, [requirementText, generateContexts]);

  // Handle step change
  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  return (
    <div className={styles.container}>
      <ParticleBackground />
      <Navbar 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginDrawerOpen(true)}
        onMenuToggle={() => {}} 
        onSettingsClick={() => setIsLoginDrawerOpen(true)} 
      />
      
      {/* 三栏布局容器 */}
      <div className={styles.mainContainer}>
        {/* 左侧栏 - 15%: 步骤导航 */}
        <Sidebar
          steps={STEPS}
          currentStep={currentStep}
          completedStep={completedStep}
          onStepClick={handleStepClick}
          isStepClickable={(stepId) => stepId <= (completedStep || 0) + 1}
          className={styles.sidebar}
        />
        
        {/* 中间栏 - 60%: 预览区域 + 录入区域 */}
        <div className={styles.content}>
          <div className={styles.mainContentVertical}>
            {/* 预览区域 60% */}
            <PreviewArea
              currentStep={currentStep}
              mermaidCode={currentMermaidCode}
              boundedContexts={boundedContexts}
              domainModels={domainModels}
              businessFlow={businessFlow}
              isGenerating={isGenerating}
            />
            
            {/* 录入区域 - 移除步骤相关props */}
            <InputArea
              requirementText={requirementText}
              onRequirementChange={setRequirementText}
              onSubmit={handleRequirementSubmit}
              onGenerate={handleRequirementSubmit}
              onGenerateDomainModel={() => generateDomainModels(requirementText, boundedContexts)}
              onGenerateBusinessFlow={() => generateBusinessFlow(domainModels)}
              onCreateProject={() => {}}
              onAnalyzePageStructure={analyzePageStructure}
              isGenerating={isGenerating}
              boundedContexts={boundedContexts}
              selectedContextIds={selectedContextIds}
              businessFlow={businessFlow}
              pageStructureAnalyzed={pageStructureAnalyzed}
              currentStep={currentStep}
              completedStep={completedStep}
            />
          </div>
        </div>
        
        {/* 右侧栏 - 25%: AI面板 */}
        <div className={styles.aiPanel}>
          <ThinkingPanel
            thinkingMessages={[]}
            contexts={boundedContexts}
            mermaidCode={currentMermaidCode}
            status={isGenerating ? 'thinking' : 'idle'}
            errorMessage={null}
          />
        </div>
      </div>

      <LoginDrawer 
        isOpen={isLoginDrawerOpen} 
        onClose={() => setIsLoginDrawerOpen(false)} 
      />
    </div>
  );
}

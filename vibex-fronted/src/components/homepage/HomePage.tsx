/**
 * HomePage - 主页容器组件 (60/40 垂直布局版)
 * 
 * 预览区域 60% | 录入区域 40%
 * 无 Tab 切换，直接展示
 * 
 * 业务逻辑已抽取到 useHomePage hook
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { Navbar } from '@/components/homepage';
import { useHomePage } from './hooks';
import { InputArea } from './InputArea/InputArea';
import { PreviewArea } from './PreviewArea/PreviewArea';
import styles from '@/app/homepage.module.css';
import type { Step } from '@/types/homepage';

// Dynamic import for ParticleBackground (SSR: false to avoid window access on server)
const ParticleBackground = dynamic(
  () => import('@/components/particles/ParticleBackground'),
  { ssr: false }
);

// 三步流程常量
const STEPS: Step[] = [
  { id: 1, label: '业务流程分析', description: '分析业务流程' },
  { id: 2, label: 'UI组件分析', description: '生成UI组件树' },
  { id: 3, label: '创建项目', description: '生成项目代码' },
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

  // Get current mermaid code based on step (三步流程)
  // 修复: Step 1 时优先显示 contextMermaidCode (限界上下文图)，若无则显示 flowMermaidCode
  const currentMermaidCode = useMemo(() => {
    switch (currentStep) {
      case 1: 
        // Step 1: 优先显示限界上下文图(如有)，否则显示业务流程图
        return contextMermaidCode || flowMermaidCode || '';
      case 2: 
        // Step 2: 显示UI组件树(复用mermaid)
        return contextMermaidCode || flowMermaidCode || '';
      default: 
        return '';
    }
  }, [currentStep, contextMermaidCode, flowMermaidCode]);

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
      
      {/* 60/40 垂直布局容器 - Milestone 1 */}
      <div className={styles.mainContentVertical}>
        {/* 预览区域 - 60% - AC1 */}
        <PreviewArea
          currentStep={currentStep}
          mermaidCode={currentMermaidCode}
          boundedContexts={boundedContexts}
          domainModels={domainModels}
          businessFlow={businessFlow}
          isGenerating={isGenerating}
        />
        
        {/* 录入区域 - 40% - AC2 & AC3: 无 Tab 切换 */}
        <InputArea
          requirementText={requirementText}
          onRequirementChange={setRequirementText}
          onSubmit={handleRequirementSubmit}
          onGenerate={handleRequirementSubmit}
          onGenerateDomainModel={() => generateDomainModels(requirementText, boundedContexts)}
          onGenerateBusinessFlow={() => generateBusinessFlow([], requirementText)}
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

      <LoginDrawer 
        isOpen={isLoginDrawerOpen} 
        onClose={() => setIsLoginDrawerOpen(false)} 
      />
    </div>
  );
}

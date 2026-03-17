/**
 * HomePage - 主页容器组件 (垂直布局版)
 * 
 * 60% 预览区域 + 40% 录入区域
 * 无 Tab 切换，固定展示
 * 
 * 业务逻辑已抽取到 useHomePage hook
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { ParticleBackground } from '@/components/particles/ParticleBackground';
import { Navbar, MainContent, StepContainer } from '@/components/homepage';
import { useHomePage } from './hooks';
import { InputArea } from './InputArea/InputArea';
import { PreviewArea } from './PreviewArea/PreviewArea';
import styles from '@/app/homepage.module.css';
import type { Step } from '@/types/homepage';

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
    isGenerating,
  } = useHomePage();
  
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);

  // Get current mermaid code based on step
  const currentMermaidCode = useMemo(() => {
    switch (currentStep) {
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
        
        {/* 录入区域 40% */}
        <InputArea
          currentStep={currentStep}
          requirementText={requirementText}
          onRequirementChange={setRequirementText}
          onSubmit={handleRequirementSubmit}
          isGenerating={isGenerating}
          steps={STEPS}
          completedStep={completedStep}
          onStepClick={handleStepClick}
        />
      </div>

      <LoginDrawer 
        isOpen={isLoginDrawerOpen} 
        onClose={() => setIsLoginDrawerOpen(false)} 
      />
    </div>
  );
}

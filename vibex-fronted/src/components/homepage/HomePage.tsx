/**
 * HomePage - 主页容器组件 (极简版)
 * 
 * 仅负责 UI 渲染，业务逻辑已抽取到 useHomePage hook
 * 目标: < 100 行
 */
'use client';

import { useState, useCallback } from 'react';
import LoginDrawer from '@/components/ui/LoginDrawer';
import { ParticleBackground } from '@/components/particles/ParticleBackground';
import { Navbar, Sidebar, StepContainer } from '@/components/homepage';
import { useHomePage } from './hooks';
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
  const { currentStep, completedStep, isAuthenticated, setCurrentStep } = useHomePage();
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  const isStepClickable = useCallback((step: number) => {
    return step <= completedStep + 1;
  }, [completedStep]);

  return (
    <div className={styles.container}>
      <ParticleBackground />
      <Navbar 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginDrawerOpen(true)}
        onMenuToggle={() => setIsCollapsed(!isCollapsed)} 
        onSettingsClick={() => setIsLoginDrawerOpen(true)} 
      />
      
      <div className={styles.mainContent}>
        <Sidebar 
          steps={STEPS}
          currentStep={currentStep}
          completedStep={completedStep}
          onStepClick={handleStepClick}
          isStepClickable={isStepClickable}
          isCollapsed={isCollapsed}
          onCollapse={setIsCollapsed}
        />
        
        <main className={styles.content}>
          <StepContainer />
        </main>
      </div>

      <LoginDrawer 
        isOpen={isLoginDrawerOpen} 
        onClose={() => setIsLoginDrawerOpen(false)} 
      />
    </div>
  );
}

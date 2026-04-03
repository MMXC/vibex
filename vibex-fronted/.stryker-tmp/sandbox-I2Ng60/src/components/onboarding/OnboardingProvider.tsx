/**
 * OnboardingProvider
 * 
 * 引导系统 Provider - 整合触发逻辑和弹窗组件
 */
// @ts-nocheck


'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';

export function OnboardingProvider() {
  // 初始化引导触发逻辑
  useOnboarding();

  // 渲染顶部进度条
  return (
    <>
      <OnboardingProgressBar />
      <OnboardingModal />
    </>
  );
}

export default OnboardingProvider;

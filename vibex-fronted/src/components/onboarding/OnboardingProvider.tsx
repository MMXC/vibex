/**
 * OnboardingProvider
 * 
 * 引导系统 Provider - 整合触发逻辑和弹窗组件
 */

'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export function OnboardingProvider() {
  // 初始化引导触发逻辑
  useOnboarding();

  // 渲染引导弹窗
  return <OnboardingModal />;
}

export default OnboardingProvider;

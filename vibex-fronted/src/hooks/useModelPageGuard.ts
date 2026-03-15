/**
 * useModelPageGuard - 防御性检查 Hook
 * 
 * 用于 domain-model/page.tsx 的防御性检查
 * 防止 boundedContexts 或 selectedContextIds 为 undefined 时崩溃
 * 
 * F1: 防御性检查 - 防止 TypeError
 * F2: 可选链操作符 - 使用 ?. 防止访问 undefined
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirmationStore } from '@/stores/confirmationStore';

interface ModelPageGuardState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  canProceed: boolean;
  boundedContexts: any[];
  selectedContextIds: string[];
}

interface ModelPageGuardActions {
  checkAndProceed: () => boolean;
  redirectIfInvalid: () => void;
  resetError: () => void;
}

export type UseModelPageGuard = ModelPageGuardState & ModelPageGuardActions;

// 重定向目标页面
const REDIRECT_TARGET = '/confirm/context';

// 最大的重定向次数，防止无限循环
const MAX_REDIRECT_COUNT = 3;

/**
 * 防御性检查 Hook
 * 
 * @returns {UseModelPageGuard} 包含状态和操作方法
 * 
 * @example
 * const { canProceed, checkAndProceed, redirectIfInvalid } = useModelPageGuard();
 */
export function useModelPageGuard(): UseModelPageGuard {
  const router = useRouter();
  
  // 从 store 获取数据 (使用可选链)
  const boundedContexts = useConfirmationStore((state) => state.boundedContexts);
  const selectedContextIds = useConfirmationStore((state) => state.selectedContextIds);
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectCount, setRedirectCount] = useState(0);
  
  // F2: 可选链操作符 - 安全的属性访问
  const safeBoundedContexts = boundedContexts ?? [];
  const safeSelectedContextIds = selectedContextIds ?? [];
  
  // F2: 使用可选链检查上下文 (可选链操作符)
  const hasBoundedContexts = boundedContexts?.length > 0;
  const hasSelectedContextIds = selectedContextIds?.length > 0;
  
  // 检查是否可以继续
  const canProceed = safeBoundedContexts.length > 0 && safeSelectedContextIds.length > 0;
  
  // F1: 防御性检查 - 验证数据完整性
  const checkAndProceed = useCallback((): boolean => {
    // F2: 使用可选链操作符
    if (!safeBoundedContexts?.length) {
      setHasError(true);
      setErrorMessage('请先生成限界上下文');
      return false;
    }
    
    if (!safeSelectedContextIds?.length) {
      setHasError(true);
      setErrorMessage('请先选择限界上下文');
      return false;
    }
    
    // 验证每个选中的 ID 是否有效
    const hasValidSelection = safeSelectedContextIds?.some((id: string) => 
      safeBoundedContexts?.some((ctx: any) => ctx.id === id)
    );
    
    if (!hasValidSelection) {
      setHasError(true);
      setErrorMessage('选中的限界上下文无效');
      return false;
    }
    
    setHasError(false);
    setErrorMessage('');
    return true;
  }, [safeBoundedContexts, safeSelectedContextIds]);
  
  // F1: 防御性检查 - 无效时重定向
  const redirectIfInvalid = useCallback(() => {
    // F4: 跳转循环防护
    if (redirectCount >= MAX_REDIRECT_COUNT) {
      console.warn('[useModelPageGuard] 达到最大重定向次数，停止重定向');
      setHasError(true);
      setErrorMessage('数据异常，请重新从首页开始');
      return;
    }
    
    if (!checkAndProceed()) {
      setRedirectCount((prev) => prev + 1);
      router.push(REDIRECT_TARGET);
    }
  }, [checkAndProceed, redirectCount, router]);
  
  // 重置错误状态
  const resetError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);
  
  // 初始化检查
  useEffect(() => {
    // 延迟检查，确保 store 已加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return {
    // 状态
    isLoading,
    hasError,
    errorMessage,
    canProceed,
    // F2: 使用可选链返回安全的上下文数据
    boundedContexts: safeBoundedContexts,
    selectedContextIds: safeSelectedContextIds,
    // 操作
    checkAndProceed,
    redirectIfInvalid,
    resetError,
  };
}

/**
 * 安全使用 boundedContexts 的辅助函数
 * 
 * @param contexts - 可能为 undefined 的上下文数组
 * @returns 安全访问的上下文数组
 */
export function safeGetBoundedContexts(contexts: any[] | undefined | null): any[] {
  return contexts ?? [];
}

/**
 * 安全使用 selectedContextIds 的辅助函数
 * 
 * @param ids - 可能为 undefined 的 ID 数组
 * @returns 安全访问的 ID 数组
 */
export function safeGetSelectedContextIds(ids: string[] | undefined | null): string[] {
  return ids ?? [];
}

/**
 * 安全过滤函数 - 防止在 undefined 上调用 filter
 * 
 * @param contexts - 可能为 undefined 的上下文数组
 * @param predicate - 过滤条件
 * @returns 过滤后的数组
 */
export function safeFilterContexts<T>(
  contexts: T[] | undefined | null, 
  predicate: (value: T, index: number) => boolean
): T[] {
  return contexts?.filter(predicate) ?? [];
}

export default useModelPageGuard;

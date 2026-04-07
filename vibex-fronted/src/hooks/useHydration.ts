/**
 * useHydration - Hydration 状态检测 Hook
 * 
 * 用于解决 Zustand persist 中间件在 SSR/CSR 场景下的 hydration 时机问题
 * 确保客户端 hydration 完成后再渲染需要 localStorage 数据的组件
 */

import { useState, useEffect } from 'react';

/**
 * 检测客户端是否完成 hydration
 * 
 * @returns boolean - hydration 是否已完成
 * 
 * @example
 * ```tsx
 * const hydration = useHydration();
 * 
 * if (!hydration) {
 *   return <LoadingSpinner />;
 * }
 * 
 * // Safe to use persisted store data
 * const { requirementText } = useConfirmationStore();
 * ```
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 客户端 hydration 完成
    setHydrated(true);
  }, []);

  return hydrated;
}

export default useHydration;

/**
 * useClarifyAI — E03 S03.2 AI 需求澄清 Hook
 *
 * 封装 /api/ai/clarify 调用，统一管理 loading/error 状态。
 * ClarifyStep 可直接使用此 hook，替代内部 fetch 逻辑。
 *
 * @example
 * ```typescript
 * const { analyze, result, isLoading, error } = useClarifyAI();
 * await analyze('用户需求描述');
 * ```
 */

import { useState, useCallback } from 'react';

export interface ClarifyResult {
  role: string | null;
  goal: string | null;
  constraints: string[];
  raw: string;
  parsed: { role: string; goal: string; constraints: string[] } | null;
  guidance?: string;
}

export interface UseClarifyAIResult {
  /** 执行 AI 解析 */
  analyze: (requirement: string) => Promise<ClarifyResult | null>;
  /** 最近一次解析结果 */
  result: ClarifyResult | null;
  /** 解析中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重置状态 */
  reset: () => void;
}

export function useClarifyAI(): UseClarifyAIResult {
  const [result, setResult] = useState<ClarifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (requirement: string): Promise<ClarifyResult | null> => {
    if (!requirement.trim()) return null;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as ClarifyResult;
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { analyze, result, isLoading, error, reset };
}

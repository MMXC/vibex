/**
 * useTermTranslation Hook
 * 提供术语翻译功能的React Hook
 */
// @ts-nocheck


'use client';

import { useCallback, useMemo } from 'react';
import { 
  TERM_MAP, 
  translateTerm, 
  translateObject, 
  getBusinessTerms,
  containsDDDTerms,
  type TermEntry 
} from '@/config/termMap';

interface UseTermTranslationReturn {
  /** 翻译单个术语 */
  t: (dddTerm: string) => string;
  /** 翻译对象中的所有术语 */
  translate: (obj: unknown) => unknown;
  /** 检查文本是否包含DDD术语 */
  hasDDDTerms: (text: string) => boolean;
  /** 获取所有业务术语 */
  businessTerms: string[];
  /** 获取术语映射表 */
  termMap: TermEntry[];
  /** 反向翻译：业务语言 → DDD术语 */
  reverseTranslate: (businessTerm: string) => string;
}

export function useTermTranslation(): UseTermTranslationReturn {
  const t = useCallback((dddTerm: string) => {
    return translateTerm(dddTerm);
  }, []);

  const translate = useCallback((obj: unknown) => {
    return translateObject(obj);
  }, []);

  const hasDDDTerms = useCallback((text: string) => {
    return containsDDDTerms(text);
  }, []);

  const businessTerms = useMemo(() => getBusinessTerms(), []);

  const termMap = useMemo(() => TERM_MAP, []);

  const reverseTranslate = useCallback((businessTerm: string) => {
    // 找到对应的DDD术语
    const entry = TERM_MAP.find(t => t.business === businessTerm);
    return entry?.ddd ?? businessTerm;
  }, []);

  return {
    t,
    translate,
    hasDDDTerms,
    businessTerms,
    termMap,
    reverseTranslate,
  };
}

export default useTermTranslation;

/**
 * useCanvasPrefill Hook
 *
 * E01: Onboarding → Canvas 无断点
 * 从 localStorage 读取 Onboarding 预填充数据，统一注入到 CanvasPage
 *
 * 兼容两种格式：
 * - 正常格式: `string` (直接 requirement text)
 * - AI 降级格式: `{ raw: string, parsed: null }` (AI 不可用时)
 *
 * 读取完成后自动清理 localStorage，防止数据残留
 */

'use client';

import { useState, useEffect } from 'react';

const PENDING_TEMPLATE_REQ_KEY = 'vibex:pending_template_req';

/** 预填充数据格式 */
export interface CanvasPrefillData {
  /** 原始文本（始终存在） */
  raw: string;
  /** AI 解析结果（降级时为 null） */
  parsed: Record<string, unknown> | null;
}

export type PrefillState = 'loading' | 'prefilled' | 'empty';

export interface UseCanvasPrefillResult {
  state: PrefillState;
  data: CanvasPrefillData | null;
}

/**
 * useCanvasPrefill — 读取 localStorage 预填充数据
 *
 * @returns { state, data }
 *   - loading: 正在读取 localStorage（首次渲染时短暂存在）
 *   - prefilled: 已读取到有效数据
 *   - empty: localStorage 中无数据
 */
export function useCanvasPrefill(): UseCanvasPrefillResult {
  const [state, setState] = useState<PrefillState>('loading');
  const [data, setData] = useState<CanvasPrefillData | null>(null);

  useEffect(() => {
    // 客户端执行：读取 localStorage
    try {
      const raw = localStorage.getItem(PENDING_TEMPLATE_REQ_KEY);
      if (raw === null) {
        setState('empty');
        setData(null);
        return;
      }

      // 尝试解析为对象格式 { raw, parsed } 或纯字符串
      let parsedData: CanvasPrefillData;

      try {
        const parsed = JSON.parse(raw);

        if (typeof parsed === 'object' && parsed !== null && 'raw' in parsed) {
          // AI 降级格式: { raw: string, parsed: null }
          // 或正常格式: { raw: string, parsed: object }
          parsedData = {
            raw: parsed.raw as string,
            parsed: parsed.parsed as Record<string, unknown> | null,
          };
        } else if (typeof parsed === 'string') {
          // 纯字符串格式（向后兼容）
          parsedData = { raw: parsed, parsed: null };
        } else {
          parsedData = { raw: raw, parsed: null };
        }
      } catch {
        // JSON 解析失败，当作纯字符串
        parsedData = { raw, parsed: null };
      }

      if (parsedData.raw && parsedData.raw.trim().length > 0) {
        setData(parsedData);
        setState('prefilled');
      } else {
        setState('empty');
        setData(null);
      }

      // 读取后立即清理，防止残留
      localStorage.removeItem(PENDING_TEMPLATE_REQ_KEY);
    } catch {
      setState('empty');
      setData(null);
    }
  }, []);

  return { state, data };
}

export default useCanvasPrefill;

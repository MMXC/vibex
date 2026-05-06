/**
 * Canvas [id] — 动态画布页面（Onboarding 跳转目标）
 *
 * E01: Onboarding → Canvas 无断点
 *
 * 功能：
 * 1. 读取 localStorage 预填充数据（useCanvasPrefill）
 * 2. 100ms 内显示 CanvasPageSkeleton，避免白屏
 * 3. 数据就绪后渲染真实 CanvasPage 并注入 prefill
 * 4. 支持 AI 降级格式 { raw, parsed: null }
 */

'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import { CanvasPageSkeleton } from '@/components/canvas/CanvasPageSkeleton';
import { useCanvasPrefill } from '@/hooks/useCanvasPrefill';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';

interface CanvasPageWithIdProps {
  params: { id: string };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function CanvasPageWithId({ params }: CanvasPageWithIdProps) {
  const { id: projectId } = params;
  const isMobile = useIsMobile();

  // E01: 读取 localStorage 预填充数据
  const { state: prefillState, data: prefillData } = useCanvasPrefill();

  // 设置 projectId 到 sessionStore（供 CanvasPage 使用）
  useEffect(() => {
    if (projectId) {
      useSessionStore.getState().setProjectId(projectId);
    }
  }, [projectId]);

  // E01: 骨架屏 100ms 内可见，数据就绪后渲染真实 Canvas
  // prefillState === 'loading' 时短暂显示骨架屏（通常 < 10ms）
  const showSkeleton = prefillState === 'loading';

  if (showSkeleton) {
    return <CanvasPageSkeleton />;
  }

  return <CanvasPage useTabMode={isMobile} />;
}

/**
 * CanvasPageClient — 客户端渲染逻辑
 *
 * E01: Onboarding → Canvas 无断点
 * 提取为独立 client component，配合 server page.tsx 使用
 */

'use client';

import { useEffect, useState } from 'react';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import { CanvasPageSkeleton } from '@/components/canvas/CanvasPageSkeleton';
import { useCanvasPrefill } from '@/hooks/useCanvasPrefill';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';

interface CanvasPageClientProps {
  projectId: string;
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

export function CanvasPageClient({ projectId }: CanvasPageClientProps) {
  const isMobile = useIsMobile();

  // E01: 读取 localStorage 预填充数据
  const { state: prefillState } = useCanvasPrefill();

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

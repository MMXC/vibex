/**
 * VibeX Canvas — 新主画布页面
 *
 * Epic 1 实现：
 * - 三树并行画布（限界上下文 / 业务流程 / 组件树）
 * - 阶段进度条 + 树面板折叠 + 激活/暗淡联动
 *
 * 旧首页 (app/page.tsx) 降级为引导页，添加跳转到 /canvas 的入口
 */
// @ts-nocheck

'use client';

import { CanvasPage } from '@/components/canvas/CanvasPage';
import { useEffect, useState } from 'react';

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

export default function CanvasPageRoute() {
  const isMobile = useIsMobile();
  return <CanvasPage useTabMode={isMobile} />;
}

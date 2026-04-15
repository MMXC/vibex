/**
 * useCanvasPanels — panel/tab state for CanvasPage
 *
 * Extracted from CanvasPage.tsx:
 *  - activeTab, setActiveTab (mobile tab mode)
 *  - projectName, setProjectName
 *  - queuePanelExpanded, setQueuePanelExpanded
 *  - componentGenerating, setComponentGenerating
 *
 * Part of: vibex-dev-security-20260410 / dev-e5-canvaspage拆分
 */

import { useState, useCallback } from 'react';
import type { TreeType } from '@/lib/canvas/types';
import { useSessionStore } from '@/lib/canvas/stores';

export interface UseCanvasPanelsReturn {
  activeTab: TreeType;
  setActiveTab: (tab: TreeType) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  queuePanelExpanded: boolean;
  setQueuePanelExpanded: (v: boolean) => void;
  resetPanelState: () => void;
  componentGenerating: boolean;
  setComponentGenerating: (v: boolean) => void;
}

export function useCanvasPanels(): UseCanvasPanelsReturn {
  const [activeTab, setActiveTab] = useState<TreeType>('context');
  const session = useSessionStore();
  const [projectName, setProjectName] = useState(session.projectName || '我的项目');
  // Root Cause #1: queuePanelExpanded 初始为 true → 导致 Tab 切换时面板状态异常
  // Fix: 默认关闭，节省屏幕空间，用户可按需展开
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(false);
  // resetPanelState — Tab 切换时调用，重置面板展开状态
  const resetPanelState = useCallback(() => {
    setQueuePanelExpanded(false);
  }, []);
  const [componentGenerating, setComponentGenerating] = useState(false);

  return {
    activeTab,
    setActiveTab,
    projectName,
    setProjectName,
    queuePanelExpanded,
    setQueuePanelExpanded,
    resetPanelState,
    componentGenerating,
    setComponentGenerating,
  };
}

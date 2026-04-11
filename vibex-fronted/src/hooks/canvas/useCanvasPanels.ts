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

import { useState } from 'react';
import type { TreeType } from '@/lib/canvas/types';
import { useSessionStore } from '@/lib/canvas/stores';

export interface UseCanvasPanelsReturn {
  activeTab: TreeType;
  setActiveTab: (tab: TreeType) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  queuePanelExpanded: boolean;
  setQueuePanelExpanded: (v: boolean) => void;
  componentGenerating: boolean;
  setComponentGenerating: (v: boolean) => void;
}

export function useCanvasPanels(): UseCanvasPanelsReturn {
  const [activeTab, setActiveTab] = useState<TreeType>('context');
  const session = useSessionStore();
  const [projectName, setProjectName] = useState(session.projectName || '我的项目');
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(true);
  const [componentGenerating, setComponentGenerating] = useState(false);

  return {
    activeTab,
    setActiveTab,
    projectName,
    setProjectName,
    queuePanelExpanded,
    setQueuePanelExpanded,
    componentGenerating,
    setComponentGenerating,
  };
}

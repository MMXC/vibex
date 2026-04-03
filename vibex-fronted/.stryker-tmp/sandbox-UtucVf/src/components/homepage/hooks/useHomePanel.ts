// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import type { HomePanel } from '@/types/homepage';

const DEFAULT_PANEL_SIZES = [60, 40];
const STORAGE_KEY = 'vibex-panel-sizes';

/**
 * useHomePanel - 面板控制 Hook
 * 
 * 功能：
 * - 面板尺寸管理 (60/40 布局)
 * - 面板最大化/最小化
 * - 持久化到 localStorage
 */
export const useHomePanel = (): HomePanel => {
  // 面板尺寸 - 初始化为默认值，避免 SSR 水合错误
  const [panelSizes, setPanelSizesState] = useState<number[]>(DEFAULT_PANEL_SIZES);
  
  // 最大化面板
  const [maximizedPanel, setMaximizedPanelState] = useState<string | null>(null);
  
  // 最小化面板
  const [minimizedPanel, setMinimizedPanelState] = useState<string | null>(null);

  // 从 localStorage 加载面板尺寸
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            setPanelSizesState(parsed);
          }
        } catch (e) {
          // ignore parse error
        }
      }
    }
  }, []);

  // 保存面板尺寸到 localStorage
  const setPanelSizes = useCallback((sizes: number[]) => {
    setPanelSizesState(sizes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    }
  }, []);

  // 切换最大化
  const toggleMaximize = useCallback((panelId: string) => {
    setMaximizedPanelState(prev => {
      if (prev === panelId) {
        // 如果已经是最大化，则取消最大化
        return null;
      }
      return panelId;
    });
    // 取消最小化
    setMinimizedPanelState(null);
  }, []);

  // 切换最小化
  const toggleMinimize = useCallback((panelId: string) => {
    setMinimizedPanelState(prev => {
      if (prev === panelId) {
        // 如果已经是最小化，则展开
        return null;
      }
      return panelId;
    });
    // 取消最大化
    setMaximizedPanelState(null);
  }, []);

  // 展开面板 (取消最小化)
  const expandPanel = useCallback((panelId: string) => {
    setMinimizedPanelState(prev => {
      if (prev === panelId) {
        return null;
      }
      return prev;
    });
  }, []);

  // 重置面板状态
  const reset = useCallback(() => {
    setPanelSizesState(DEFAULT_PANEL_SIZES);
    setMaximizedPanelState(null);
    setMinimizedPanelState(null);
  }, []);

  return {
    // 面板尺寸
    panelSizes,
    setPanelSizes,
    
    // 最大化
    maximizedPanel,
    setMaximizedPanel: setMaximizedPanelState,
    toggleMaximize,
    
    // 最小化
    minimizedPanel,
    setMinimizedPanel: setMinimizedPanelState,
    toggleMinimize,
    
    // 重置
    reset,
  };
};

export default useHomePanel;
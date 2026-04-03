/**
 * Home Panel Hook
 * Manages panel sizes, maximized/minimized states
 */
// @ts-nocheck


import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { HOME_STORAGE_KEY, DEFAULT_PANEL_SIZES, PANEL_IDS } from '@/constants/homepage';
import type { HomePanel } from '@/types/homepage';

export function useHomePanel(): HomePanel {
  // 持久化面板尺寸
  const [persistedState, setPersistedState] = useLocalStorage(HOME_STORAGE_KEY, {
    panelSizes: DEFAULT_PANEL_SIZES,
    selectedNodes: [],
    lastRequirementText: '',
    savedAt: new Date().toISOString(),
  });

  // 内存状态
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [minimizedPanel, setMinimizedPanel] = useState<string | null>(null);

  // 面板尺寸
  const panelSizes = persistedState.panelSizes;

  const setPanelSizes = useCallback(
    (sizes: number[] | ((prev: number[]) => number[])) => {
      setPersistedState((prev) => ({
        ...prev,
        panelSizes: typeof sizes === 'function' ? sizes(prev.panelSizes) : sizes,
      }));
    },
    [setPersistedState]
  );

  // 切换最大化
  const toggleMaximize = useCallback(
    (panelId: string) => {
      setMaximizedPanel((prev) => (prev === panelId ? null : panelId));
      // 清除最小化状态
      if (minimizedPanel) {
        setMinimizedPanel(null);
      }
    },
    [minimizedPanel]
  );

  // 切换最小化
  const toggleMinimize = useCallback(
    (panelId: string) => {
      setMinimizedPanel((prev) => (prev === panelId ? null : panelId));
      // 清除最大化状态
      if (maximizedPanel) {
        setMaximizedPanel(null);
      }
    },
    [maximizedPanel]
  );

  // 重置面板状态
  const reset = useCallback(() => {
    setMaximizedPanel(null);
    setMinimizedPanel(null);
    setPersistedState((prev) => ({
      ...prev,
      panelSizes: DEFAULT_PANEL_SIZES,
    }));
  }, [setPersistedState]);

  return useMemo(
    () => ({
      panelSizes,
      setPanelSizes,
      maximizedPanel,
      setMaximizedPanel,
      toggleMaximize,
      minimizedPanel,
      setMinimizedPanel,
      toggleMinimize,
      reset,
    }),
    [
      panelSizes,
      setPanelSizes,
      maximizedPanel,
      toggleMaximize,
      minimizedPanel,
      toggleMinimize,
      reset,
    ]
  );
}

export default useHomePanel;

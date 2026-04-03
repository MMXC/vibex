/**
 * useResponsiveMode.ts — Canvas 响应式模式 Hook
 *
 * E3: 响应式布局
 * 封装响应式断点逻辑，供 CanvasPage 使用
 */
// @ts-nocheck


import { useIsMobile, useIsTablet } from '@/styles/responsive';

export interface ResponsiveMode {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** 移动端使用 Tab 模式切换面板 */
  isTabMode: boolean;
  /** 平板/移动端使用 Overlay Drawer */
  isOverlayDrawer: boolean;
}

/**
 * Canvas 响应式模式 Hook
 *
 * - isMobile (< 768px): Tab 模式，隐藏侧边栏
 * - isTablet (768-1024px): 两列布局 + overlay drawer
 * - isDesktop (>= 1024px): 完整三列布局
 */
export function useResponsiveMode(): ResponsiveMode {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = !isMobile && !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Mobile uses tab navigation to switch between tree panels
    isTabMode: isMobile,
    // Tablet/mobile use overlay drawer for left/right panels
    isOverlayDrawer: isTablet || isMobile,
  };
}

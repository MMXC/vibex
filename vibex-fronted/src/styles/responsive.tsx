/**
 * VibeX Responsive Utilities
 * 移动端响应式适配系统
 */

import React, { createContext, useContext, ReactNode } from 'react';

// 断点配置
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// 响应式 hooks
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

// 响应式上下文
interface ResponsiveContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: BreakpointKey;
}

const ResponsiveContext = createContext<ResponsiveContextValue | null>(null);

export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
}

interface ResponsiveProviderProps {
  children: ReactNode;
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  
  // 确定当前断点
  const getBreakpoint = (): BreakpointKey => {
    if (isMobile) return 'sm';
    if (typeof window === 'undefined') return 'md';
    const width = window.innerWidth;
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    return 'sm';
  };

  return (
    <ResponsiveContext.Provider value={{
      isMobile,
      isTablet,
      isDesktop,
      breakpoint: getBreakpoint(),
    }}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// 响应式显示组件
interface ShowProps {
  children: ReactNode;
  when?: BreakpointKey | 'mobile' | 'tablet' | 'desktop';
  hideOn?: BreakpointKey | 'mobile' | 'tablet' | 'desktop';
}

export function Show({ children, when, hideOn }: ShowProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // hideOn 逻辑
  if (hideOn) {
    if (hideOn === 'mobile' && isMobile) return null;
    if (hideOn === 'tablet' && isTablet) return null;
    if (hideOn === 'desktop' && isDesktop) return null;
  }
  
  // when 逻辑
  if (when) {
    if (when === 'mobile' && !isMobile) return null;
    if (when === 'tablet' && !isTablet) return null;
    if (when === 'desktop' && !isDesktop) return null;
    if (typeof when === 'string' && !breakpoints[when as BreakpointKey]) return null;
  }
  
  return <>{children}</>;
}

// 响应式隐藏组件
interface HideProps {
  children: ReactNode;
  on?: BreakpointKey | 'mobile' | 'tablet' | 'desktop';
}

export function Hide({ children, on }: HideProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (!on) return <>{children}</>;
  
  if (on === 'mobile' && isMobile) return null;
  if (on === 'tablet' && isTablet) return null;
  if (on === 'desktop' && isDesktop) return null;
  
  return <>{children}</>;
}

// 触摸目标尺寸组件
interface TouchTargetProps {
  children: ReactNode;
  size?: number; // 最小 44px
  className?: string;
}

export function TouchTarget({ children, size = 44, className = '' }: TouchTargetProps) {
  const style: React.CSSProperties = {
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// 移动端安全区域
interface SafeAreaProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeArea({ children, edges = ['top', 'bottom'] }: SafeAreaProps) {
  const style: React.CSSProperties = {
    paddingTop: edges.includes('top') ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: edges.includes('bottom') ? 'env(safe-area-inset-bottom)' : undefined,
    paddingLeft: edges.includes('left') ? 'env(safe-area-inset-left)' : undefined,
    paddingRight: edges.includes('right') ? 'env(safe-area-inset-right)' : undefined,
  };
  
  return <div style={style}>{children}</div>;
}

// 响应式网格
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: number | { mobile: number; tablet: number; desktop: number };
  gap?: number | { mobile: number; tablet: number; desktop: number };
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = 1,
  gap = 16,
  className = '' 
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const gridCols = typeof cols === 'number' 
    ? cols 
    : isMobile 
      ? cols.mobile 
      : isTablet 
        ? cols.tablet 
        : cols.desktop;
        
  const gridGap = typeof gap === 'number'
    ? gap
    : isMobile
      ? gap.mobile
      : isTablet
        ? gap.tablet
        : gap.desktop;
  
  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
    gap: `${gridGap}px`,
  };
  
  return <div className={className} style={style}>{children}</div>;
}

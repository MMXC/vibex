/**
 * Particle Performance Hook
 * 
 * Handles performance optimizations:
 * - Lazy loading
 * - Mobile downgrade
 * - Low-end device detection
 * - FPS limit
 * - Off-screen pause
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PerformanceConfig {
  /** Target FPS (default: 60) */
  targetFPS?: number;
  /** Maximum particles on mobile (default: 30) */
  mobileParticleLimit?: number;
  /** Mobile breakpoint (default: 768) */
  mobileBreakpoint?: number;
  /** Reduce particles by this percentage on mobile (default: 0.4 = 40%) */
  mobileReduction?: number;
  /** Enable off-screen pause */
  pauseOffScreen?: boolean;
  /** Minimum device memory for full effects (in GB) */
  minMemoryGB?: number;
}

const DEFAULT_CONFIG: Required<PerformanceConfig> = {
  targetFPS: 60,
  mobileParticleLimit: 30,
  mobileBreakpoint: 768,
  mobileReduction: 0.4,
  pauseOffScreen: true,
  minMemoryGB: 4,
};

/**
 * Hook for particle performance optimization
 */
export function useParticlePerformance(config: PerformanceConfig = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [currentFPS, setCurrentFPS] = useState(options.targetFPS);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const isActiveRef = useRef(true);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < options.mobileBreakpoint;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [options.mobileBreakpoint]);

  // Detect low-end device
  useEffect(() => {
    const checkDevice = async () => {
      // Check device memory if available
      const memory = (navigator as { deviceMemory?: number }).deviceMemory;
      if (memory && memory < options.minMemoryGB) {
        setIsLowEndDevice(true);
        return;
      }
      
      // Check hardware concurrency
      const cores = navigator.hardwareConcurrency;
      if (cores && cores < 4) {
        setIsLowEndDevice(true);
        return;
      }
    };
    
    checkDevice();
  }, [options.minMemoryGB]);

  // Track visibility (pause when off-screen)
  useEffect(() => {
    if (!options.pauseOffScreen) return;
    
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      isActiveRef.current = visible;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.pauseOffScreen]);

  // FPS monitoring
  useEffect(() => {
    let frameId: number;
    
    const measureFPS = () => {
      if (!isActiveRef.current) return;
      
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        setCurrentFPS(fps);
        
        // Reset counters
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      frameId = requestAnimationFrame(measureFPS);
    };
    
    frameId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Calculate effective particle limit based on device/conditions
  const getParticleLimit = useCallback(() => {
    let limit = 100; // Default
    
    if (isMobile) {
      limit = Math.round(options.mobileParticleLimit / (1 - options.mobileReduction));
    }
    
    if (isLowEndDevice) {
      limit = Math.round(limit * 0.5);
    }
    
    if (!isVisible) {
      limit = 0; // Pause
    }
    
    return limit;
  }, [isMobile, isLowEndDevice, isVisible, options.mobileParticleLimit, options.mobileReduction]);

  // Should show particles
  const shouldShowParticles = isVisible && currentFPS >= (options.targetFPS * 0.9);

  return {
    isMobile,
    isLowEndDevice,
    isVisible,
    currentFPS,
    particleLimit: getParticleLimit(),
    shouldShowParticles,
    config: options,
  };
}

export default useParticlePerformance;

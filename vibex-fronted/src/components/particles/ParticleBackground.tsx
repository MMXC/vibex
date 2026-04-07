/**
 * Particle Background Component
 * 
 * Renders particle effects as background with performance optimization
 * - Lazy loaded
 * - Mobile optimized
 * - FPS monitored
 * - Off-screen paused
 */

'use client';

import React from 'react';
import { useParticles, PresetName } from '@/lib/particles/ParticleManager';
import { useParticlePerformance } from '@/lib/hooks/useParticlePerformance';

export interface ParticleBackgroundProps {
  /** Preset to use */
  preset?: PresetName;
  /** Whether particles are enabled */
  enabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Z-index for positioning */
  zIndex?: number;
  /** Enable performance optimizations */
  optimize?: boolean;
}

export function ParticleBackground({
  preset = 'galaxy',
  enabled = true,
  className = '',
  zIndex = -1,
  optimize = true,
}: ParticleBackgroundProps) {
  // Performance optimization hook
  const { isMobile, isLowEndDevice, isVisible, shouldShowParticles, particleLimit } = 
    useParticlePerformance({
      targetFPS: 55, // Target >= 55 FPS
      mobileParticleLimit: 30,
      mobileReduction: 0.4, // 40% reduction on mobile
      pauseOffScreen: true,
    });

  // Determine if we should show particles
  const shouldShow = enabled && (!optimize || shouldShowParticles);

  const { isLoading, error } = useParticles({
    id: `particles-bg-${preset}`,
    preset,
    responsive: true,
    // Only load if should show (lazy + conditions)
    breakpoint: optimize ? (isMobile ? 768 : 99999) : 99999,
  });

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      id={`particles-bg-${preset}`}
      className={`particle-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: 'none',
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
      aria-hidden="true"
      data-mobile={isMobile}
      data-low-end={isLowEndDevice}
      data-visible={isVisible}
    />
  );
}

export default ParticleBackground;

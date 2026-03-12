/**
 * Particle Background Component
 * 
 * Renders particle effects as background
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParticles, PresetName } from '@/lib/particles/ParticleManager';

export interface ParticleBackgroundProps {
  /** Preset to use */
  preset?: PresetName;
  /** Whether particles are enabled */
  enabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Z-index for positioning */
  zIndex?: number;
}

export function ParticleBackground({
  preset = 'galaxy',
  enabled = true,
  className = '',
  zIndex = -1,
}: ParticleBackgroundProps) {
  const containerId = `particles-bg-${preset}`;
  const { isLoading, error } = useParticles({
    id: containerId,
    preset,
    responsive: true,
  });

  if (!enabled) {
    return null;
  }

  return (
    <div
      id={containerId}
      className={`particle-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}

export default ParticleBackground;

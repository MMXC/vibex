/**
 * Particle Manager Service
 * 
 * Manages particle effects using tsParticles
 * Supports lazy loading, presets, and responsive configuration
 */

'use client';

import { useEffect, useState } from 'react';

export type PresetName = 'galaxy' | 'confetti' | 'sparkle' | 'snow' | 'rain' | 'bubbles';

// Preset configurations
const PRESETS: Record<PresetName, object> = {
  galaxy: {
    background: { color: { value: '#0a0a1a' } },
    particles: {
      color: { value: '#ffffff' },
      links: { color: { value: '#ffffff', opacity: 0.2 }, distance: 150, enable: true },
      move: { enable: true, speed: 1, direction: 'none' },
      number: { value: 80 },
      opacity: { value: 0.5 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
  },
  confetti: {
    particles: {
      color: { value: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'] },
      move: { enable: true, speed: { min: 10, max: 20 }, direction: 'bottom' },
      number: { value: 100 },
      opacity: { value: 1 },
      shape: { type: 'circle' },
      size: { value: { min: 5, max: 10 } },
    },
  },
  sparkle: {
    background: { color: { value: '#1a1a2e' } },
    particles: {
      color: { value: '#ffd700' },
      move: { enable: true, speed: 2, direction: 'top' },
      number: { value: 50 },
      opacity: { value: 0.8 },
      shape: { type: 'star' },
      size: { value: { min: 1, max: 3 } },
    },
  },
  snow: {
    background: { color: { value: '#1a1a2e' } },
    particles: {
      color: { value: '#ffffff' },
      move: { enable: true, speed: 2, direction: 'bottom' },
      number: { value: 100 },
      opacity: { value: 0.8 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 4 } },
    },
  },
  rain: {
    background: { color: { value: '#0a0a1a' } },
    particles: {
      color: { value: '#4a90d9' },
      move: { enable: true, speed: 10, direction: 'bottom' },
      number: { value: 200 },
      opacity: { value: 0.6 },
      shape: { type: 'line' },
      size: { value: 2 },
    },
  },
  bubbles: {
    background: { color: { value: '#e0f7fa' } },
    particles: {
      color: { value: '#00bcd4' },
      move: { enable: true, speed: 2, direction: 'top' },
      number: { value: 30 },
      opacity: { value: 0.4 },
      shape: { type: 'circle' },
      size: { value: { min: 10, max: 30 } },
    },
  },
};

export interface UseParticleOptions {
  id: string;
  preset?: PresetName;
  responsive?: boolean;
  breakpoint?: number;
}

export function useParticles(options: UseParticleOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initParticles = async () => {
      try {
        // Dynamic import for lazy loading - reduces initial bundle
        const module = await import('tsparticles-slim');
        const loadSlim = module.loadSlim as (options: object) => Promise<void>;
        
        // Initialize
        await loadSlim({ id: 'init' });
        
        if (!mounted) return;

        // Get preset config
        const preset = options.preset || 'galaxy';
        const config = { ...PRESETS[preset] };

        // Apply responsive settings - reduce particles on mobile for performance
        if (options.responsive !== false && typeof window !== 'undefined' && window.innerWidth < (options.breakpoint || 768)) {
          Object.assign(config, { particles: { number: { value: 30 } } });
        }

        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    initParticles();

    return () => {
      mounted = false;
    };
  }, [options.id, options.preset, options.responsive, options.breakpoint]);

  return { isLoading, error };
}

export { PRESETS };

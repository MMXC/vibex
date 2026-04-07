/**
 * Particle Interaction Hook
 * 
 * Handles particle effects on user interactions (click, hover)
 */

'use client';

import { useCallback, useRef } from 'react';

export interface ParticleEffect {
  id: string;
  type: 'click' | 'hover' | 'burst';
  x: number;
  y: number;
  color?: string;
}

export interface UseParticleInteractionOptions {
  /** Enable click effects */
  clickEffect?: boolean;
  /** Enable hover effects */
  hoverEffect?: boolean;
  /** Custom colors for particles */
  colors?: string[];
  /** Number of particles */
  particleCount?: number;
  /** Callback when effect is triggered */
  onEffect?: (effect: ParticleEffect) => void;
}

/**
 * Hook for managing particle effects on user interactions
 */
export function useParticleInteraction(options: UseParticleInteractionOptions = {}) {
  const {
    clickEffect = true,
    hoverEffect = false,
    colors = ['#667eea', '#764ba2', '#ffd700', '#00bcd4', '#ff6b6b'],
    particleCount = 8,
    onEffect,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Trigger a burst particle effect at the given position
   */
  const triggerBurst = useCallback((x: number, y: number, color?: string) => {
    const effect: ParticleEffect = {
      id: `burst-${Date.now()}`,
      type: 'burst',
      x,
      y,
      color: color || colors[Math.floor(Math.random() * colors.length)],
    };

    // Create DOM elements for particles
    const container = containerRef.current || document.body;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 50 + Math.random() * 50;
      const particleColor = color || colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${4 + Math.random() * 4}px;
        height: ${4 + Math.random() * 4}px;
        background: ${particleColor};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        animation: particle-burst 0.6s ease-out forwards;
      `;

      // Add custom animation with direction
      const keyframes = `
        @keyframes particle-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(
              ${Math.cos(angle) * distance}px,
              ${Math.sin(angle) * distance}px
            ) scale(0);
            opacity: 0;
          }
        }
      `;

      // Add keyframes to head if not exists
      if (!document.getElementById('particle-burst-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-burst-styles';
        style.textContent = keyframes;
        document.head.appendChild(style);
      }

      container.appendChild(particle);

      // Cleanup after animation
      setTimeout(() => {
        particle.remove();
      }, 600);
    }

    onEffect?.(effect);
  }, [colors, particleCount, onEffect]);

  /**
   * Handle click event with particle burst
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!clickEffect) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    triggerBurst(x, y);
  }, [clickEffect, triggerBurst]);

  /**
   * Handle hover event with subtle particles
   */
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!hoverEffect) return;
    
    // Subtle effect on hover - just 2-3 particles
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    triggerBurst(x, y);
  }, [hoverEffect, triggerBurst]);

  return {
    containerRef,
    triggerBurst,
    handlers: {
      onClick: clickEffect ? handleClick : undefined,
      onMouseEnter: hoverEffect ? handleMouseEnter : undefined,
    },
  };
}

export default useParticleInteraction;

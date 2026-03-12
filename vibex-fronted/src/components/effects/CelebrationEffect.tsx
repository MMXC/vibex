/**
 * Celebration Effect Component
 * 
 * Triggers celebration effects (confetti, sparkle) on success events
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export type CelebrationType = 'confetti' | 'sparkle';

export interface CelebrationEffectProps {
  /** Trigger on mount if this param exists in URL */
  triggerParam?: string;
  /** Type of celebration */
  type?: CelebrationType;
  /** Manual trigger - set to true to trigger */
  trigger?: boolean;
}

export function CelebrationEffect({ 
  triggerParam = 'celebrate', 
  type = 'confetti',
  trigger 
}: CelebrationEffectProps) {
  const hasTriggered = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we should trigger
    const shouldTrigger = trigger || searchParams?.get(triggerParam);
    
    if (shouldTrigger && !hasTriggered.current) {
      hasTriggered.current = true;
      
      // For now, we'll use a simple CSS-based celebration
      // In production, you could integrate with the particle system
      const colors = type === 'confetti' 
        ? ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        : ['#ffd700', '#ffec8b', '#fffacd'];
      
      createCelebration(type, colors);
    }
  }, [trigger, searchParams, triggerParam, type]);

  return null;
}

function createCelebration(type: CelebrationType, colors: string[]) {
  // Create celebration elements
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
  
  document.body.appendChild(container);

  // Create particles
  const particleCount = type === 'confetti' ? 100 : 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = type === 'confetti' 
      ? Math.random() * 10 + 5 
      : Math.random() * 20 + 10;
    const x = Math.random() * window.innerWidth;
    const delay = Math.random() * 2;
    const duration = Math.random() * 3 + 2;
    
    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: -${size}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      ${type === 'confetti' ? 'border-radius: 50%;' : 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);'}
      animation: celebrate-${type} ${duration}s ease-out ${delay}s forwards;
    `;
    
    container.appendChild(particle);
  }

  // Add keyframe animation
  if (!document.getElementById('celebration-styles')) {
    const style = document.createElement('style');
    style.id = 'celebration-styles';
    style.textContent = `
      @keyframes celebrate-confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      @keyframes celebrate-sparkle {
        0% { transform: scale(0); opacity: 1; }
        50% { transform: scale(1.5); opacity: 1; }
        100% { transform: scale(0) translateY(-100px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Cleanup after animation
  setTimeout(() => {
    container.remove();
  }, 5000);
}

export default CelebrationEffect;

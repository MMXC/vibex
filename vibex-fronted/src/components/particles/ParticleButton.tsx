/**
 * Particle Button Component
 * 
 * Button with particle effects on click and hover
 */

'use client';

import React, { useState, useRef, CSSProperties } from 'react';

export interface ParticleButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Show ripple on click */
  ripple?: boolean;
  /** Custom class name */
  className?: string;
}

export function ParticleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  ripple = true,
  className = '',
}: ParticleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !ripple) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);

    // Auto cleanup after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  const baseStyles: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles: Record<string, CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' },
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: { 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
    },
    secondary: {
      background: 'white',
      color: '#374151',
      border: '1px solid #e5e7eb',
    },
    ghost: {
      background: 'transparent',
      color: '#667eea',
      border: 'none',
    },
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
      
      {/* Button content */}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>

      {/* Inline keyframes */}
      <style>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
        }
      `}</style>
    </button>
  );
}

export default ParticleButton;

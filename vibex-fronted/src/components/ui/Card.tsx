import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  variant?: 'default' | 'glass' | 'neon';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glowColor?: 'cyan' | 'purple' | 'pink' | 'green';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  glowColor = 'cyan',
  className = '',
  children,
  onClick,
}: CardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hover && styles.hoverable,
    hover && styles[`glow-${glowColor}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function CardContent({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`${styles.content} ${className}`}>{children}</div>;
}

export function CardFooter({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}

export default Card;

// @ts-nocheck
import React from 'react';
import styles from './GridContainer.module.css';

export interface GridContainerProps {
  children: React.ReactNode;
  'data-testid'?: string;
}

/**
 * GridContainer - Main layout container for Homepage
 * 
 * Layout:
 * - Header: 3 columns spanning full width
 * - Body: Left (240px) + Main (flex) + Right (320px)
 * - Footer: Full width bottom panel
 * 
 * Responsive breakpoints:
 * - 1400px+: Full 3-column layout
 * - 1200px: 2-column (hide right drawer)
 * - 900px: Single column (hide left drawer)
 */
export function GridContainer({ children, ...props }: GridContainerProps) {
  return (
    <div 
      className={styles.container} 
      data-testid={props['data-testid'] || 'grid-container'}
    >
      {children}
    </div>
  );
}

export default GridContainer;

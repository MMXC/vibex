// @ts-nocheck
import React from 'react';
import { ThinkingPanel as UITThinkingPanel } from '@/components/ui/ThinkingPanel';
import type { ThinkingPanelProps as UIThinkingPanelProps } from '@/components/ui/ThinkingPanel';
import styles from './ThinkingPanel.module.css';

/**
 * Homepage-specific ThinkingPanel wrapper
 * Provides AI thinking process visualization for the DDD analysis flow
 */
export const ThinkingPanel: React.FC<UIThinkingPanelProps> = ({
  thinkingMessages,
  contexts,
  mermaidCode,
  status,
  errorMessage,
  onAbort,
  onRetry,
  onUseDefault,
}) => {
  return (
    <div className={styles.thinkingPanel}>
      <UITThinkingPanel
        thinkingMessages={thinkingMessages}
        contexts={contexts}
        mermaidCode={mermaidCode}
        status={status}
        errorMessage={errorMessage}
        onAbort={onAbort}
        onRetry={onRetry}
        onUseDefault={onUseDefault}
      />
    </div>
  );
};

export default ThinkingPanel;

/**
 * PRDPreviewPanel.tsx — E4-S3: PRD Preview Panel
 *
 * Displays PRD output in two tabs: Markdown and JSON Schema.
 */

'use client';

import React, { useState } from 'react';
import type { PRDDual } from '@/lib/delivery/PRDGenerator';
import styles from './PRDPreviewPanel.module.css';

interface PRDPreviewPanelProps {
  prd: PRDDual;
}

type Tab = 'markdown' | 'json';

export function PRDPreviewPanel({ prd }: PRDPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('markdown');

  return (
    <div className={styles.panel} data-testid="prd-preview-panel">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'markdown' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('markdown')}
          data-testid="tab-markdown"
        >
          Markdown
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('json')}
          data-testid="tab-json"
        >
          JSON Schema
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'markdown' && (
          <div className={styles.markdownPane}>
            <pre className={styles.markdownText}>{prd.markdown}</pre>
          </div>
        )}
        {activeTab === 'json' && (
          <div className={styles.jsonPane}>
            <pre className={styles.jsonText}>
              <code>{JSON.stringify(prd.jsonSchema, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

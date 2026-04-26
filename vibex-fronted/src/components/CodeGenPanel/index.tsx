'use client';

/**
 * CodeGenPanel — E10 Design-to-Code UI Panel
 *
 * Renders the code generation panel:
 * - "Generate Code" button → triggers generation from canvas nodes
 * - Preview of generated TSX/CSS/types
 * - Download as ZIP button
 * - Node count indicator with 200-limit warning
 *
 * @module components/CodeGenPanel
 */

import React, { useCallback, useState } from 'react';
import { generateComponentCode, type GenerateResult, type TargetFramework } from '@/lib/codeGenerator';
import type { CanvasFlow } from '@/lib/codeGenerator';
import styles from './CodeGenPanel.module.css';

// ============================================================================
// Types
// ============================================================================

interface CodeGenPanelProps {
  /** Canvas flow data to generate code from */
  flow: CanvasFlow;
  /** Called when user clicks "Download ZIP" */
  onDownload?: (blob: Blob, filename: string) => void;
  /** Disabled state */
  disabled?: boolean;
}

type Tab = 'tsx' | 'css' | 'types' | 'index';

interface State {
  status: 'idle' | 'generating' | 'ready' | 'error';
  result: GenerateResult | null;
  error: string | null;
  activeTab: Tab;
  selectedFramework: TargetFramework;
}

// ============================================================================
// Sub-components
// ============================================================================

function CodePreview({ code, language }: { code: string; language: string }) {
  return (
    <pre className={styles.codeBlock} data-language={language}>
      <code>{code}</code>
    </pre>
  );
}

// ============================================================================
// Component
// ============================================================================

export function CodeGenPanel({ flow, onDownload, disabled = false }: CodeGenPanelProps) {
  const [state, setState] = useState<State>({
    status: 'idle',
    result: null,
    error: null,
    activeTab: 'tsx',
    selectedFramework: 'react',
  });

  const handleGenerate = useCallback(async () => {
    setState((s) => ({ ...s, status: 'generating', error: null }));
    try {
      const result = generateComponentCode(flow, state.selectedFramework);
      setState((s) => ({ ...s, status: 'ready', result }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : 'Generation failed',
      }));
    }
  }, [flow, state.selectedFramework]);

  const handleDownload = useCallback(async () => {
    if (!state.result) return;
    const { packageAsZip } = await import('@/lib/codeGenerator');
    const blob = await packageAsZip(state.result, flow.name);
    const filename = `${state.result.componentName.replace(/Component$/, '')}.zip`;
    if (onDownload) {
      onDownload(blob, filename);
    } else {
      // Default browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state.result, flow.name, onDownload]);

  const { status, result, error, activeTab, selectedFramework } = state;
  const tabs: { id: Tab; label: string; key: keyof typeof result.files }[] = [
    { id: 'tsx', label: 'TSX', key: 'component' },
    { id: 'css', label: 'CSS', key: 'css' },
    { id: 'types', label: 'Types', key: 'types' },
    { id: 'index', label: 'Index', key: 'index' },
  ];

  return (
    <div className={styles.panel} data-testid="code-gen-panel">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Code Generation</h2>
        {result && (
          <span className={styles.nodeCount} data-testid="node-count">
            {result.nodeCount} nodes
            {result.limitExceeded && (
              <span className={styles.limitWarning} data-testid="limit-warning">
                ⚠️ Limit exceeded ({result.limit})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Framework selector */}
      <div className={styles.controls}>
        <div className={styles.frameworkSelector}>
          <label htmlFor="framework-select" className={styles.label}>
            Framework:
          </label>
          <select
            id="framework-select"
            className={styles.select}
            value={selectedFramework}
            onChange={(e) =>
              setState((s) => ({ ...s, selectedFramework: e.target.value as TargetFramework }))
            }
            disabled={disabled || status === 'generating'}
            aria-label="Select target framework"
          >
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="solid">Solid</option>
          </select>
        </div>

        <button
          type="button"
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={disabled || status === 'generating'}
          data-testid="generate-button"
          aria-label="Generate code from canvas"
        >
          {status === 'generating' ? 'Generating…' : 'Generate Code'}
        </button>
      </div>

      {/* Error state */}
      {status === 'error' && (
        <div className={styles.error} role="alert" data-testid="error-message">
          {error}
        </div>
      )}

      {/* Code preview tabs */}
      {result && (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Code preview tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setState((s) => ({ ...s, activeTab: tab.id }))}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            className={styles.tabContent}
            data-testid="code-preview"
          >
            {tabs.map(
              (tab) =>
                activeTab === tab.id && (
                  <CodePreview
                    key={tab.id}
                    code={result.files[tab.key]}
                    language={tab.id === 'tsx' ? 'tsx' : tab.id === 'css' ? 'css' : 'typescript'}
                  />
                )
            )}
          </div>

          {/* Download button */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={handleDownload}
              data-testid="download-button"
              aria-label="Download code as ZIP"
            >
              Download ZIP
            </button>
            {result.limitExceeded && (
              <p className={styles.limitNote} role="alert">
                Node count ({result.nodeCount}) exceeds the recommended limit of {result.limit}.
                Generated code may be incomplete.
              </p>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {status === 'idle' && !result && (
        <div className={styles.empty} data-testid="empty-state">
          <p>Click "Generate Code" to create TypeScript types, TSX skeleton, and CSS Module from the canvas.</p>
        </div>
      )}
    </div>
  );
}

export default CodeGenPanel;

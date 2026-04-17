/**
 * ProtoAttrPanel — Right Panel for Node Property Editing
 *
 * Opens when a node is selected. Shows component type, editable props,
 * and a Mock Data tab.
 *
 * Epic1: E1-U4
 * Epic2: E2-U1 (Mock Data tab)
 */

'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { usePrototypeStore } from '@/stores/prototypeStore';
import styles from './ProtoAttrPanel.module.css';

// ==================== Tab ====================

type Tab = 'props' | 'mock';

// ==================== Props ====================

export interface ProtoAttrPanelProps {
  className?: string;
}

// ==================== Component ====================

export const ProtoAttrPanel = memo(function ProtoAttrPanel({
  className = '',
}: ProtoAttrPanelProps) {
  const { selectedNodeId, nodes, updateNode, updateNodeMockData, selectNode, removeNode } =
    usePrototypeStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const [activeTab, setActiveTab] = useState<Tab>('props');
  const [mockInput, setMockInput] = useState('');
  const [mockError, setMockError] = useState<string | null>(null);

  // Reset tab when node changes
  useEffect(() => {
    setActiveTab('props');
    setMockError(null);
    if (selectedNode?.data.mockData) {
      setMockInput(JSON.stringify(selectedNode.data.mockData.data, null, 2));
    } else {
      setMockInput('');
    }
  }, [selectedNodeId]);

  // ---- Prop editing ----
  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return;
      updateNode(selectedNode.id, {
        component: {
          ...selectedNode.data.component,
          props: {
            ...selectedNode.data.component.props,
            [key]: value,
          },
        },
      });
    },
    [selectedNode, updateNode]
  );

  // ---- Mock data editing ----
  const handleMockSave = useCallback(() => {
    if (!selectedNode) return;
    if (mockInput.trim() === '') {
      setMockError(null);
      updateNodeMockData(selectedNode.id, {});
      return;
    }
    try {
      const parsed = JSON.parse(mockInput);
      setMockError(null);
      updateNodeMockData(selectedNode.id, parsed);
    } catch {
      setMockError('JSON 格式错误');
    }
  }, [selectedNode, mockInput, updateNodeMockData]);

  const handleMockChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMockInput(e.target.value);
    setMockError(null);
  }, []);

  if (!selectedNode) {
    return (
      <aside className={`${styles.panel} ${className}`} aria-label="属性面板">
        <div className={styles.empty} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>选中节点以编辑属性</p>
        </div>
      </aside>
    );
  }

  const { component, mockData } = selectedNode.data;
  const props = component.props ?? {};

  return (
    <aside className={`${styles.panel} ${className}`} aria-label="属性面板">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{component.name ?? component.type}</span>
          <span className={styles.headerType}>{component.type}</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => selectNode(null)}
          aria-label="关闭面板"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'props'}
          className={`${styles.tab} ${activeTab === 'props' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('props')}
          type="button"
        >
          属性
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'mock'}
          className={`${styles.tab} ${activeTab === 'mock' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('mock')}
          type="button"
        >
          Mock 数据
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'props' && (
          <div className={styles.propList} role="tabpanel">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className={styles.propRow}>
                <label className={styles.propKey} htmlFor={`prop-${key}`}>
                  {key}
                </label>
                {typeof value === 'boolean' ? (
                  <button
                    id={`prop-${key}`}
                    type="button"
                    className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
                    onClick={() => handlePropChange(key, !value)}
                    aria-pressed={value}
                  >
                    {value ? '是' : '否'}
                  </button>
                ) : typeof value === 'number' ? (
                  <input
                    id={`prop-${key}`}
                    type="number"
                    className={styles.propInput}
                    value={value}
                    onChange={(e) => handlePropChange(key, Number(e.target.value))}
                  />
                ) : (
                  <input
                    id={`prop-${key}`}
                    type="text"
                    className={styles.propInput}
                    value={String(value ?? '')}
                    onChange={(e) => handlePropChange(key, e.target.value)}
                  />
                )}
              </div>
            ))}

            {Object.keys(props).length === 0 && (
              <p className={styles.propEmpty}>无自定义属性</p>
            )}

            {/* Node ID (read-only) */}
            <div className={styles.propRow}>
              <label className={styles.propKey}>节点 ID</label>
              <span className={styles.propReadonly}>{selectedNode.id}</span>
            </div>
          </div>
        )}

        {activeTab === 'mock' && (
          <div className={styles.mockTab} role="tabpanel">
            <div className={styles.mockHeader}>
              <span>JSON 数据</span>
              {mockData && (
                <span className={styles.mockHasData} aria-label="已有 Mock 数据">
                  ✓ 已设置
                </span>
              )}
            </div>
            <textarea
              className={`${styles.mockTextarea} ${mockError ? styles.mockTextareaError : ''}`}
              value={mockInput}
              onChange={handleMockChange}
              placeholder={'{\n  "dataSource": [...],\n  "columns": [...]\n}'}
              rows={12}
              spellCheck={false}
            />
            {mockError && (
              <div className={styles.mockError} role="alert">
                {mockError}
              </div>
            )}
            <button
              type="button"
              className={styles.mockSaveBtn}
              onClick={handleMockSave}
            >
              保存 Mock 数据
            </button>
            <p className={styles.mockHint}>
              表格等数据组件会优先使用 Mock 数据渲染
            </p>
          </div>
        )}
      </div>

      {/* Footer: Delete */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => {
            removeNode(selectedNode.id);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19,6l-1,14H6L5,6" />
            <path d="M10,11v6M14,11v6" />
            <path d="M9,6V4h6v2" />
          </svg>
          删除节点
        </button>
      </div>
    </aside>
  );
});

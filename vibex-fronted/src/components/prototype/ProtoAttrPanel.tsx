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

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePrototypeStore } from '@/stores/prototypeStore';
import type { ProtoNodeNavigation, ProtoNodeBreakpoints } from '@/stores/prototypeStore';
import styles from './ProtoAttrPanel.module.css';

// ==================== Tab ====================

type Tab = 'props' | 'styles' | 'events' | 'mock' | 'navigation' | 'responsive';

// ==================== Props ====================

export interface ProtoAttrPanelProps {
  className?: string;
}

// ==================== Component ====================

export const ProtoAttrPanel = memo(function ProtoAttrPanel({
  className = '',
}: ProtoAttrPanelProps) {
  const {
    selectedNodeId,
    nodes,
    updateNode,
    updateNodeMockData,
    selectNode,
    removeNode,
    updateNodeBreakpoints,
    updateNodeNavigation,
    pages,
  } = usePrototypeStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const [activeTab, setActiveTab] = useState<Tab>('props');
  const [nodeStyles, setNodeStyles] = useState({
    backgroundColor: '',
    borderRadius: '',
    opacity: 1,
    border: '',
  });
  const [nodeEvents, setNodeEvents] = useState({
    onClick: '',
    onHover: '',
    onFocus: '',
  });
  const [mockInput, setMockInput] = useState('');
  const [mockError, setMockError] = useState<string | null>(null);

  // S-P2.1: Virtualization ref for scroll container
  const parentRef = useRef<HTMLDivElement>(null);

  // props is defined below after selectedNode check, use raw accessor below
  // S-P2.2: useMemo — defined after props extraction below

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

  // S-P2.2: useMemo for expensive computations
  const propsEntries = useMemo(() => Object.entries(props), [props]);

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
          aria-selected={activeTab === 'styles'}
          className={`${styles.tab} ${activeTab === 'styles' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('styles')}
          type="button"
        >
          样式
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'events'}
          className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('events')}
          type="button"
        >
          事件
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
        <button
          role="tab"
          aria-selected={activeTab === 'navigation'}
          className={`${styles.tab} ${activeTab === 'navigation' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('navigation')}
          type="button"
        >
          导航
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'responsive'}
          className={`${styles.tab} ${activeTab === 'responsive' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('responsive')}
          type="button"
        >
          响应式
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content} ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
        {activeTab === 'props' && (
          <PropsTabContent
            propsEntries={propsEntries}
            selectedNodeId={selectedNode.id}
            handlePropChange={handlePropChange}
          />
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

        {/* E2-U2: Styles tab */}
        {activeTab === 'styles' && (
          <div className={styles.stylesTab} role="tabpanel">
            <div className={styles.propRow}>
              <label className={styles.propLabel}>背景色</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={nodeStyles.backgroundColor || '#ffffff'}
                  onChange={(e) => setNodeStyles((s) => ({ ...s, backgroundColor: e.target.value }))}
                  className={styles.colorInput}
                  title="背景色"
                />
                <input
                  type="text"
                  value={nodeStyles.backgroundColor}
                  onChange={(e) => setNodeStyles((s) => ({ ...s, backgroundColor: e.target.value }))}
                  placeholder="#ffffff"
                  className={styles.propInput}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className={styles.propRow}>
              <label className={styles.propLabel}>圆角</label>
              <input
                type="text"
                value={nodeStyles.borderRadius}
                onChange={(e) => setNodeStyles((s) => ({ ...s, borderRadius: e.target.value }))}
                placeholder="8px"
                className={styles.propInput}
              />
            </div>
            <div className={styles.propRow}>
              <label className={styles.propLabel}>透明度</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={nodeStyles.opacity}
                onChange={(e) => setNodeStyles((s) => ({ ...s, opacity: Number(e.target.value) }))}
                className={styles.rangeInput}
              />
              <span className={styles.propValue}>{nodeStyles.opacity}</span>
            </div>
            <div className={styles.propRow}>
              <label className={styles.propLabel}>边框</label>
              <input
                type="text"
                value={nodeStyles.border}
                onChange={(e) => setNodeStyles((s) => ({ ...s, border: e.target.value }))}
                placeholder="1px solid #e5e7eb"
                className={styles.propInput}
              />
            </div>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={() => {
                if (selectedNode) {
                  updateNode(selectedNode.id, { style: nodeStyles });
                }
              }}
            >
              应用样式
            </button>
          </div>
        )}

        {/* E2-U3: Events tab */}
        {activeTab === 'events' && (
          <div className={styles.eventsTab} role="tabpanel">
            <div className={styles.propRow}>
              <label className={styles.propLabel}>onClick</label>
              <input
                type="text"
                value={nodeEvents.onClick}
                onChange={(e) => setNodeEvents((s) => ({ ...s, onClick: e.target.value }))}
                placeholder="handleSubmit()"
                className={styles.propInput}
              />
            </div>
            <div className={styles.propRow}>
              <label className={styles.propLabel}>onHover</label>
              <input
                type="text"
                value={nodeEvents.onHover}
                onChange={(e) => setNodeEvents((s) => ({ ...s, onHover: e.target.value }))}
                placeholder="handleHover()"
                className={styles.propInput}
              />
            </div>
            <div className={styles.propRow}>
              <label className={styles.propLabel}>onFocus</label>
              <input
                type="text"
                value={nodeEvents.onFocus}
                onChange={(e) => setNodeEvents((s) => ({ ...s, onFocus: e.target.value }))}
                placeholder="handleFocus()"
                className={styles.propInput}
              />
            </div>
            <p className={styles.eventsHint}>
              事件会在导出 JSON 时作为 interactions 字段保存
            </p>
          </div>
        )}

        {/* E2-AC3: Navigation tab */}
        {activeTab === 'navigation' && (
          <div className={styles.navTab} role="tabpanel">
            <div className={styles.propRow}>
              <label className={styles.propKey} htmlFor="nav-page-select">
                跳转目标页面
              </label>
              <select
                id="nav-page-select"
                className={styles.propSelect}
                value={selectedNode.data.navigation?.pageId ?? ''}
                onChange={(e) => {
                  const page = pages.find((p) => p.id === e.target.value);
                  if (!page) return;
                  const nav: ProtoNodeNavigation = {
                    pageId: page.id,
                    pageName: page.name,
                    pageRoute: page.route,
                  };
                  updateNodeNavigation(selectedNode.id, nav);
                }}
              >
                <option value="">-- 无跳转 --</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.route})
                  </option>
                ))}
              </select>
            </div>
            {selectedNode.data.navigation && (
              <div className={styles.navInfo}>
                当前设置: {selectedNode.data.navigation.pageName}
              </div>
            )}
          </div>
        )}

        {/* E2-AC4: Responsive tab */}
        {activeTab === 'responsive' && (
          <div className={styles.responsiveTab} role="tabpanel">
            <div className={styles.propRow}>
              <label className={styles.propKey}>手机端</label>
              <button
                type="button"
                className={`${styles.toggle} ${(selectedNode.data.breakpoints?.mobile ?? true) ? styles.toggleOn : ''}`}
                aria-pressed={selectedNode.data.breakpoints?.mobile ?? true}
                onClick={() => {
                  const current = selectedNode.data.breakpoints ?? { mobile: true, tablet: true, desktop: true };
                  updateNodeBreakpoints(selectedNode.id, { ...current, mobile: !current.mobile });
                }}
              >
                {(selectedNode.data.breakpoints?.mobile ?? true) ? '可见' : '隐藏'}
              </button>
            </div>
            <div className={styles.propRow}>
              <label className={styles.propKey}>平板端</label>
              <button
                type="button"
                className={`${styles.toggle} ${(selectedNode.data.breakpoints?.tablet ?? true) ? styles.toggleOn : ''}`}
                aria-pressed={selectedNode.data.breakpoints?.tablet ?? true}
                onClick={() => {
                  const current = selectedNode.data.breakpoints ?? { mobile: true, tablet: true, desktop: true };
                  updateNodeBreakpoints(selectedNode.id, { ...current, tablet: !current.tablet });
                }}
              >
                {(selectedNode.data.breakpoints?.tablet ?? true) ? '可见' : '隐藏'}
              </button>
            </div>
            <div className={styles.propRow}>
              <label className={styles.propKey}>桌面端</label>
              <button
                type="button"
                className={`${styles.toggle} ${(selectedNode.data.breakpoints?.desktop ?? true) ? styles.toggleOn : ''}`}
                aria-pressed={selectedNode.data.breakpoints?.desktop ?? true}
                onClick={() => {
                  const current = selectedNode.data.breakpoints ?? { mobile: true, tablet: true, desktop: true };
                  updateNodeBreakpoints(selectedNode.id, { ...current, desktop: !current.desktop });
                }}
              >
                {(selectedNode.data.breakpoints?.desktop ?? true) ? '可见' : '隐藏'}
              </button>
            </div>
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

// ==================== Memoized Tab Contents ====================

interface PropsTabContentProps {
  propsEntries: [string, unknown][];
  selectedNodeId: string;
  handlePropChange: (key: string, value: unknown) => void;
}

const PropsTabContent = memo(function PropsTabContent({
  propsEntries,
  selectedNodeId,
  handlePropChange,
}: PropsTabContentProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: propsEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 3,
  });

  return (
    <div className={styles.propList} role="tabpanel">
      {propsEntries.length === 0 ? (
        <p className={styles.propEmpty}>无自定义属性</p>
      ) : (
        <div
          ref={parentRef}
          style={{ height: Math.min(virtualizer.getTotalSize(), 400), overflow: 'auto' }}
        >
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const pair = propsEntries[virtualItem.index];
              if (!pair) return null;
              const [key, value] = pair;
              return (
                <div
                  key={virtualItem.key}
                  className={styles.propRow}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
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
              );
            })}
          </div>
        </div>
      )}
      {/* Node ID (read-only) */}
      <div className={styles.propRow}>
        <label className={styles.propKey}>节点 ID</label>
        <span className={styles.propReadonly}>{selectedNodeId}</span>
      </div>
    </div>
  );
});

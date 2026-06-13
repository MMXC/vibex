/**
 * AuditLogPanel.test.tsx — S94-E3: Canvas Audit Log Vitest Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AuditLogPanel } from './AuditLogPanel';

// ── Shared mock fns — hoisted so vi.mock can reference them ───────────────────
const { _storeMock, _hookMock, mockSetFilters, mockClearFilters,
        mockClosePanel, mockExportCSV, mockFetchAuditLog, mockFetchNextPage,
        _ctx } = vi.hoisted(() => {
  // Mutable per-test state (closed over by both mocks)
  const ctx = {
    isPanelOpen: true,
    entries: [] as Array<{
      id: string; canvasId: string; userId: string;
      action: string; entityType: string; entityId: string | null;
      details: Record<string, unknown> | null; createdAt: string;
    }>,
    isLoading: false,
  };

  const mockSetFilters = vi.fn();
  const mockClearFilters = vi.fn();
  const mockClosePanel = vi.fn();
  const mockExportCSV = vi.fn().mockResolvedValue(undefined);
  const mockFetchAuditLog = vi.fn().mockResolvedValue(undefined);
  const mockFetchNextPage = vi.fn().mockResolvedValue(undefined);

  const _storeMock = vi.fn((selector?: (s: {
    isPanelOpen: boolean; filters: Record<string,unknown>;
    setFilters: typeof mockSetFilters; clearFilters: typeof mockClearFilters;
    closePanel: typeof mockClosePanel; exportCSV: typeof mockExportCSV;
  }) => unknown) => {
    const state = {
      isPanelOpen: ctx.isPanelOpen,
      entries: ctx.entries,
      total: ctx.entries.length,
      isLoading: false,
      error: null,
      filters: {},
      canvasId: null as string | null,
      limit: 50,
      offset: 0,
      setFilters: mockSetFilters,
      clearFilters: mockClearFilters,
      closePanel: mockClosePanel,
      exportCSV: mockExportCSV,
      openPanel: vi.fn(),
      setEntries: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setOffset: vi.fn(),
    };
    if (!selector) return state;
    return selector(state);
  });

  const _hookMock = vi.fn(() => ({
    entries: ctx.entries,
    total: ctx.entries.length,
    isLoading: ctx.isLoading,
    error: null as string | null,
    hasMore: false,
    fetchAuditLog: mockFetchAuditLog,
    fetchNextPage: mockFetchNextPage,
  }));

  return {
    _storeMock, _hookMock, mockSetFilters, mockClearFilters,
    mockClosePanel, mockExportCSV, mockFetchAuditLog, mockFetchNextPage,
    _ctx: ctx,
  };
});

vi.mock('@/stores/auditStore', () => ({
  useAuditStore: _storeMock,
  AuditAction: {} as unknown as 'create' | 'update' | 'delete' | 'share' | 'permission' | 'all',
  formatAuditAction: (action: string) => action,
  formatEntityType: (type: string) => type,
}));

vi.mock('@/hooks/canvas/useAuditLog', () => ({
  useAuditLog: _hookMock,
}));

describe('AuditLogPanel', () => {
  beforeEach(() => {
    _ctx.isPanelOpen = true;
    _ctx.entries = [];
    _ctx.isLoading = false;
    mockSetFilters.mockClear();
    mockClearFilters.mockClear();
    mockClosePanel.mockClear();
    mockExportCSV.mockClear();
    mockFetchAuditLog.mockClear();
    mockFetchNextPage.mockClear();
    // Reset mock implementations to default behavior
    _storeMock.mockClear();
    _storeMock.mockImplementation((selector) => {
      const state = {
        isPanelOpen: _ctx.isPanelOpen,
        entries: _ctx.entries,
        total: _ctx.entries.length,
        isLoading: false,
        error: null,
        filters: {},
        canvasId: null as string | null,
        limit: 50,
        offset: 0,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters,
        closePanel: mockClosePanel,
        exportCSV: mockExportCSV,
        openPanel: vi.fn(),
        setEntries: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        setOffset: vi.fn(),
      };
      if (!selector) return state;
      return selector(state);
    });
    _hookMock.mockClear();
    _hookMock.mockImplementation(() => ({
      entries: _ctx.entries,
      total: _ctx.entries.length,
      isLoading: _ctx.isLoading,
      error: null as string | null,
      hasMore: false,
      fetchAuditLog: mockFetchAuditLog,
      fetchNextPage: mockFetchNextPage,
    }));
  });

  it('1. Renders nothing when isPanelOpen=false', () => {
    _ctx.isPanelOpen = false;

    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.queryByText('审计日志')).not.toBeInTheDocument();
  });

  it('2. Renders panel when isPanelOpen=true', () => {
    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.getByText('审计日志')).toBeInTheDocument();
  });

  it('3. Shows loading state initially', () => {
    _ctx.isLoading = true;

    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('4. Shows empty state when no entries', () => {
    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.getByText('暂无审计日志')).toBeInTheDocument();
  });

  it('5. Shows audit entries', () => {
    _ctx.entries = [
      {
        id: '1',
        canvasId: 'canvas-123',
        userId: 'user-1',
        action: 'create',
        entityType: 'node',
        entityId: 'node-1',
        details: { name: 'Test Node' },
        createdAt: new Date().toISOString(),
      },
    ];

    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.getByText(/Test Node/)).toBeInTheDocument();
  });

  it('6. Filter bar elements present', () => {
    render(<AuditLogPanel canvasId="canvas-123" />);
    expect(screen.getByText('操作')).toBeInTheDocument();
    expect(screen.getByText('用户')).toBeInTheDocument();
  });

  it('7. Export button present', () => {
    render(<AuditLogPanel canvasId="canvas-123" />);
    const exportBtn = screen.getByRole('button', { name: '📥 导出 CSV' });
    expect(exportBtn).toBeInTheDocument();
  });

  it('8. Close button works', () => {
    render(<AuditLogPanel canvasId="canvas-123" />);
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);
    expect(mockClosePanel).toHaveBeenCalled();
  });
});

/**
 * BatchExportDialog — Unit Tests
 *
 * E2: PNG/SVG/PDF 批量导出进度 UI
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BatchExportDialog } from '../BatchExportDialog';
import type { DDSCard } from '@/types/dds';

// ==================== Mock Data ====================

const makeCard = (id: string, name: string): DDSCard =>
  ({
    id,
    type: 'bounded-context',
    name,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }) as unknown as DDSCard;

const mockCards: DDSCard[] = [
  makeCard('card-1', '用户模块'),
  makeCard('card-2', '订单模块'),
  makeCard('card-3', '支付模块'),
];

// ==================== Shared mock state (set by tests) ====================

interface MockBatchExport {
  status: 'idle' | 'collecting' | 'exporting' | 'done' | 'cancelled' | 'error';
  progress: { current: number; total: number; nodeName: string } | null;
  error: string | null;
  startExport: ReturnType<typeof vi.fn>;
  cancelExport: ReturnType<typeof vi.fn>;
}

interface MockStoreState {
  chapters: Record<string, { type: string; cards: DDSCard[]; edges: unknown[]; loading: boolean; error: null }>;
}

// Module-level refs so vi.mock factory and test setup share state
const batchExportState = { status: 'idle' as const, progress: null as null, error: null, startExport: vi.fn(), cancelExport: vi.fn() };
const storeCards = { cards: [...mockCards] };

// ==================== Mock useBatchExport ====================

vi.mock('@/hooks/useBatchExport', () => ({
  useBatchExport: () => ({
    status: batchExportState.status,
    progress: batchExportState.progress,
    error: batchExportState.error,
    startExport: batchExportState.startExport,
    cancelExport: batchExportState.cancelExport,
  }),
}));

// ==================== Mock useDDSCanvasStore ====================

vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn((selector?: (s: MockStoreState) => unknown) => {
    const state: MockStoreState = {
      chapters: {
        requirement: { type: 'requirement', cards: storeCards.cards, edges: [], loading: false, error: null },
        context: { type: 'context', cards: [], edges: [], loading: false, error: null },
        flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        api: { type: 'api', cards: [], edges: [], loading: false, error: null },
        'business-rules': { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
      },
    };
    if (selector) return selector(state);
    return state;
  }),
}));

// ==================== Helpers ====================

function setup(cardsOverride?: DDSCard[], batchOverride?: Partial<MockBatchExport>) {
  // Update store cards
  storeCards.cards = cardsOverride ?? [...mockCards];

  // Reset / override batch export state
  batchExportState.status = batchOverride?.status ?? 'idle';
  batchExportState.progress = batchOverride?.progress ?? null;
  batchExportState.error = batchOverride?.error ?? null;
  batchExportState.startExport = vi.fn();
  batchExportState.cancelExport = vi.fn();

  const onClose = vi.fn();
  render(<BatchExportDialog isOpen={true} onClose={onClose} />);
  return { onClose };
}

// ==================== Tests ====================

describe('BatchExportDialog — E2', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- D1: Renders card list ----

  it('E2-D1: renders all cards from all chapters when dialog is open', () => {
    setup();
    expect(screen.getByText('用户模块')).toBeInTheDocument();
    expect(screen.getByText('订单模块')).toBeInTheDocument();
    expect(screen.getByText('支付模块')).toBeInTheDocument();
  });

  it('E2-D1: renders empty state when no cards exist', () => {
    setup([]);
    expect(screen.getByText(/没有可导出/i)).toBeInTheDocument();
  });

  // ---- D2: selectAll / selectNone / toggle ----

  it('E2-D2: clicking Select All selects all cards', () => {
    setup();
    const selectAll = screen.getByLabelText('全选');
    expect(selectAll).not.toBeChecked();
    fireEvent.click(selectAll);
    expect(selectAll).toBeChecked();
  });

  it('E2-D2: clicking Select All again deselects all', () => {
    setup();
    const selectAll = screen.getByLabelText('全选');
    fireEvent.click(selectAll); // select all
    expect(selectAll).toBeChecked();
    fireEvent.click(selectAll); // deselect all
    expect(selectAll).not.toBeChecked();
  });

  it('E2-D2: individual card toggle selects/deselects', () => {
    setup();
    const cardCheckbox = screen.getByLabelText('选择 订单模块');
    expect(cardCheckbox).not.toBeChecked();
    fireEvent.click(cardCheckbox);
    expect(cardCheckbox).toBeChecked();
    fireEvent.click(cardCheckbox);
    expect(cardCheckbox).not.toBeChecked();
  });

  // ---- D3: Start export calls startExport ----

  it('E2-D3: clicking Export button calls startExport with selected cards and default png format', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByLabelText('全选')); // select all 3
    fireEvent.click(screen.getByRole('button', { name: /导出.*3.*个/ }));
    expect(batchExportState.startExport).toHaveBeenCalledTimes(1);
    const [selectedCards, _scope, format] = batchExportState.startExport.mock.calls[0] as [DDSCard[], string, string];
    expect(selectedCards).toHaveLength(3);
    expect(format).toBe('png');
  });

  // ---- D4: Progress bar 0→100% ----

  it('E2-D4: progress bar shows correct percentage during export', () => {
    setup(mockCards, {
      status: 'exporting',
      progress: { current: 2, total: 5, nodeName: '用户模块' },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument();
  });

  // ---- D5: Done state shows download message ----

  it('E2-D5: done status shows download started message', () => {
    setup(mockCards, { status: 'done', progress: { current: 5, total: 5, nodeName: '' } });
    expect(screen.getByText(/已开始下载/i)).toBeInTheDocument();
  });

  // ---- D6: Cancel button calls cancelExport ----

  it('E2-D6: clicking Cancel Export calls cancelExport', () => {
    const { onClose } = setup(mockCards, {
      status: 'exporting',
      progress: { current: 2, total: 5, nodeName: 'card-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /取消导出/ }));
    expect(batchExportState.cancelExport).toHaveBeenCalledTimes(1);
  });

  // ---- D7: Export button disabled when no cards selected ----

  it('E2-D7: Export button is disabled when no cards are selected', () => {
    setup(mockCards);
    const exportBtn = screen.getByRole('button', { name: /导出.*0.*个/ });
    expect(exportBtn).toBeDisabled();
  });

  // ---- D8: Close button calls onClose ----

  it('E2-D8: close button calls onClose callback', () => {
    const { onClose } = setup(mockCards);
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

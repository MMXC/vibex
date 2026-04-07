import {vi, Mock, SpyInstance} from 'vitest';
/**
 * left-drawer-send.test.tsx — T4.6: LeftDrawer handleSend integration tests
 *
 * Tests the async handleSend flow with canvasApi.generateContexts
 * Required by: canvas-phase-nav-and-toolbar-issues / E1-T4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LeftDrawer } from './LeftDrawer';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';

// Mock the entire module
vi.mock('@/lib/canvas/api/canvasApi');

// ── Mock sessionStorage ────────────────────────────────────────────────────────
const mockSessionStorage: Record<string, string> = {};
const originalSessionStorage = global.sessionStorage;

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (key: string) => mockSessionStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockSessionStorage[key] = value; },
      removeItem: (key: string) => { delete mockSessionStorage[key]; },
      clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); },
      key: (index: number) => Object.keys(mockSessionStorage)[index] ?? null,
      get length() { return Object.keys(mockSessionStorage).length; },
    },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(global, 'sessionStorage', {
    value: originalSessionStorage,
    writable: true,
    configurable: true,
  });
});

// ── Store helpers ──────────────────────────────────────────────────────────────
function setupStores(ui = {}, session = {}, context = {}) {
  useUIStore.setState({
    leftDrawerOpen: true,
    rightDrawerOpen: false,
    leftDrawerWidth: 200,
    rightDrawerWidth: 200,
    toggleLeftDrawer: vi.fn(),
    toggleRightDrawer: vi.fn(),
    setLeftDrawerWidth: vi.fn(),
    setRightDrawerWidth: vi.fn(),
    ...ui,
  });
  useSessionStore.setState({
    aiThinking: false,
    aiThinkingMessage: null,
    requirementText: '',
    setRequirementText: vi.fn(),
    ...session,
  });
  useContextStore.setState({
    setContextNodes: vi.fn(),
    ...context,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('T4.6: LeftDrawer handleSend — canvasApi integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
    vi.mocked(canvasApi.generateContexts).mockReset();
  });

  it('calls canvasApi.generateContexts with requirementText', async () => {
    const setRequirementText = vi.fn();
    const setContextNodes = vi.fn();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupStores({}, { setRequirementText }, { setContextNodes });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '生成订单管理上下文' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(vi.mocked(canvasApi.generateContexts)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(canvasApi.generateContexts)).toHaveBeenCalledWith(
      expect.objectContaining({ requirementText: '生成订单管理上下文' })
    );
  });

  it('sets contextNodes when API returns success with contexts', async () => {
    const setContextNodes = vi.fn();
    const mockContexts = [
      { id: 'ctx-1', name: '订单管理', description: '管理订单', type: 'core' },
      { id: 'ctx-2', name: '支付', description: '支付处理', type: 'supporting' },
    ];
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: mockContexts } as any);
    setupStores({}, {}, { setContextNodes });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '订单系统' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    await waitFor(() => {
      expect(setContextNodes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ nodeId: 'ctx-1', name: '订单管理' }),
          expect.objectContaining({ nodeId: 'ctx-2', name: '支付' }),
        ])
      );
    });
  });

  it('sets empty contextNodes when API returns success but no contexts', async () => {
    const setContextNodes = vi.fn();
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupStores({}, {}, { setContextNodes });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '空需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    await waitFor(() => {
      expect(setContextNodes).toHaveBeenCalledWith([]);
    });
  });

  it('sets empty contextNodes when API throws', async () => {
    const setContextNodes = vi.fn();
    vi.mocked(canvasApi.generateContexts).mockRejectedValue(new Error('Network error'));
    setupStores({}, {}, { setContextNodes });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '失败需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    await waitFor(() => {
      expect(setContextNodes).toHaveBeenCalledWith([]);
    });
  });

  it('does not call canvasApi when textarea is empty', async () => {
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupStores();
    render(<LeftDrawer />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(vi.mocked(canvasApi.generateContexts)).not.toHaveBeenCalled();
  });

  it('does not call canvasApi when aiThinking=true', async () => {
    vi.mocked(canvasApi.generateContexts).mockResolvedValue({ success: true, contexts: [] } as any);
    setupStores({}, { aiThinking: true });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: 'thinking时需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(vi.mocked(canvasApi.generateContexts)).not.toHaveBeenCalled();
  });
});

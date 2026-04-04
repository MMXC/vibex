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

// ── Mock canvasApi ──────────────────────────────────────────────────────────────
const mockGenerateContexts = jest.fn();
jest.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    generateContexts: mockGenerateContexts,
  },
}));

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
    toggleLeftDrawer: jest.fn(),
    toggleRightDrawer: jest.fn(),
    setLeftDrawerWidth: jest.fn(),
    setRightDrawerWidth: jest.fn(),
    ...ui,
  });
  useSessionStore.setState({
    aiThinking: false,
    aiThinkingMessage: null,
    requirementText: '',
    setRequirementText: jest.fn(),
    ...session,
  });
  useContextStore.setState({
    setContextNodes: jest.fn(),
    ...context,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('T4.6: LeftDrawer handleSend — canvasApi integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
    mockGenerateContexts.mockReset();
  });

  it('calls canvasApi.generateContexts with requirementText', async () => {
    const setRequirementText = jest.fn();
    const setContextNodes = jest.fn();
    mockGenerateContexts.mockResolvedValue({ success: true, contexts: [] });
    setupStores(
      {},
      { setRequirementText },
      { setContextNodes }
    );
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: '生成订单管理上下文' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(mockGenerateContexts).toHaveBeenCalledTimes(1);
    expect(mockGenerateContexts).toHaveBeenCalledWith(
      expect.objectContaining({ requirementText: '生成订单管理上下文' })
    );
  });

  it('sets contextNodes when API returns success with contexts', async () => {
    const setContextNodes = jest.fn();
    const mockContexts = [
      { id: 'ctx-1', name: '订单管理', description: '管理订单', type: 'core' },
      { id: 'ctx-2', name: '支付', description: '支付处理', type: 'supporting' },
    ];
    mockGenerateContexts.mockResolvedValue({ success: true, contexts: mockContexts });
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
    const setContextNodes = jest.fn();
    mockGenerateContexts.mockResolvedValue({ success: true, contexts: [] });
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
    const setContextNodes = jest.fn();
    mockGenerateContexts.mockRejectedValue(new Error('Network error'));
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
    mockGenerateContexts.mockResolvedValue({ success: true, contexts: [] });
    setupStores();
    render(<LeftDrawer />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(mockGenerateContexts).not.toHaveBeenCalled();
  });

  it('does not call canvasApi when aiThinking=true', async () => {
    mockGenerateContexts.mockResolvedValue({ success: true, contexts: [] });
    setupStores({}, { aiThinking: true });
    render(<LeftDrawer />);

    fireEvent.change(screen.getByTestId('left-drawer-textarea'), { target: { value: 'thinking时需求' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('left-drawer-send-btn'));
    });

    expect(mockGenerateContexts).not.toHaveBeenCalled();
  });
});

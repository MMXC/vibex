/**
 * BusinessFlowTree.test.tsx
 *
 * E1: Context Selection Fix Tests
 * Verifies handleContinueToComponents respects selectedNodeIds.context
 */
import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessFlowTree } from './BusinessFlowTree';
import * as contextStore from '@/lib/canvas/stores/contextStore';
import * as flowStore from '@/lib/canvas/stores/flowStore';
import * as componentStore from '@/lib/canvas/stores/componentStore';
import * as sessionStore from '@/lib/canvas/stores/sessionStore';
import { canvasApi } from '@/lib/canvas/api/canvasApi';

// ─── Mock canvasApi ─────────────────────────────────────────────────────────
jest.mock('@/lib/canvas/api/canvasApi');

// ─── Mock toast ────────────────────────────────────────────────────────────
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

// ─── Store mocks ──────────────────────────────────────────────────────────
jest.mock('@/lib/canvas/stores/contextStore');
jest.mock('@/lib/canvas/stores/flowStore');
jest.mock('@/lib/canvas/stores/componentStore');
jest.mock('@/lib/canvas/stores/sessionStore');

const defaultContextNodes = [
  { nodeId: 'ctx-1', name: '患者管理', description: '管理患者', type: 'core' as const, isActive: true, status: 'confirmed' as const, children: [] },
  { nodeId: 'ctx-2', name: '预约挂号', description: '处理预约', type: 'supporting' as const, isActive: true, status: 'confirmed' as const, children: [] },
  { nodeId: 'ctx-3', name: '支付结算', description: '支付', type: 'generic' as const, isActive: true, status: 'confirmed' as const, children: [] },
];

const defaultFlowNodes = [
  { nodeId: 'flow-1', contextId: 'ctx-1', name: 'Order Flow', steps: [], confirmed: false, status: 'pending' as const, isActive: true },
  { nodeId: 'flow-2', contextId: 'ctx-2', name: 'Booking Flow', steps: [], confirmed: false, status: 'pending' as const, isActive: true },
];

function setupStores(overrides: {
  selectedNodeIds?: { context: string[]; flow: string[]; component: string[] };
  contextNodes?: typeof defaultContextNodes;
  flowNodes?: typeof defaultFlowNodes;
} = {}) {
  const {
    selectedNodeIds = { context: [] as string[], flow: [] as string[], component: [] as string[] },
    contextNodes = defaultContextNodes,
    flowNodes = defaultFlowNodes,
  } = overrides;

  (contextStore.useContextStore as jest.Mock).mockReturnValue({
    contextNodes,
    selectedNodeIds,
    advancePhase: jest.fn(),
  });
  (flowStore.useFlowStore as jest.Mock).mockReturnValue({ flowNodes });
  (componentStore.useComponentStore as jest.Mock).mockReturnValue({
    setComponentNodes: jest.fn(),
    componentGenerating: false,
    setComponentGenerating: jest.fn(),
    componentNodes: [],
  });
  (sessionStore.useSessionStore as jest.Mock).mockReturnValue({ projectId: 'test-project' });
}

describe('E1: handleContinueToComponents context selection', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    (canvasApi.fetchComponentTree as jest.Mock) = mockFetch;
    mockFetch.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  // ── Scenario 1: Selected contexts only ─────────────────────────────────
  it('sends only selected contexts when nodes are selected', async () => {
    setupStores({
      selectedNodeIds: { context: ['ctx-1'], flow: [], component: [] },
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' });
    await act(async () => {
      await userEvent.click(continueBtn);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0]?.[0] as { contexts: Array<{ id: string }> };
    expect(callArgs?.contexts.map((c) => c.id)).toEqual(['ctx-1']);
  });

  // ── Scenario 2: No selection → fallback to all ────────────────────────
  it('sends all contexts when nothing is selected', async () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' });
    await act(async () => {
      await userEvent.click(continueBtn);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0]?.[0] as { contexts: Array<{ id: string }> };
    expect(callArgs?.contexts.map((c) => c.id)).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
  });

  // ── Scenario 3: Empty contextNodes → toast error ──────────────────────
  it('shows error toast and does NOT call API when contextNodes is empty', async () => {
    const showToast = jest.fn();
    (require('@/components/ui/Toast') as { useToast: () => { showToast: jest.Mock } }).useToast = () => ({ showToast });

    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      contextNodes: [],
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' });
    await act(async () => {
      await userEvent.click(continueBtn);
    });

    expect(showToast).toHaveBeenCalledWith('请先生成上下文树', 'error');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Scenario 4: Multiple selected contexts ───────────────────────────
  it('sends selected contexts when multiple are selected', async () => {
    setupStores({
      selectedNodeIds: { context: ['ctx-1', 'ctx-3'], flow: [], component: [] },
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' });
    await act(async () => {
      await userEvent.click(continueBtn);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0]?.[0] as { contexts: Array<{ id: string }> };
    expect(callArgs?.contexts.map((c) => c.id)).toEqual(['ctx-1', 'ctx-3']);
  });
});

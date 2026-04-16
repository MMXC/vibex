import {vi, Mock, SpyInstance} from 'vitest';
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
vi.mock('@/lib/canvas/api/canvasApi');

// ─── Mock toast ────────────────────────────────────────────────────────────
const showToastMock = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

// ─── Store mocks ──────────────────────────────────────────────────────────
vi.mock('@/lib/canvas/stores/contextStore');
vi.mock('@/lib/canvas/stores/flowStore');
vi.mock('@/lib/canvas/stores/componentStore');
vi.mock('@/lib/canvas/stores/sessionStore');

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

  (contextStore.useContextStore as Mock).mockReturnValue({
    contextNodes,
    selectedNodeIds,
    advancePhase: vi.fn(),
    setPhase: vi.fn(),
  });
  (flowStore.useFlowStore as Mock).mockReturnValue({ flowNodes });
  (componentStore.useComponentStore as Mock).mockReturnValue({
    setComponentNodes: vi.fn(),
    componentGenerating: false,
    setComponentGenerating: vi.fn(),
    componentNodes: [],
  });
  (sessionStore.useSessionStore as Mock).mockReturnValue({ projectId: 'test-project' });
}

describe('E1: handleContinueToComponents context selection', () => {
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    (canvasApi.fetchComponentTree as Mock) = mockFetch;
    mockFetch.mockResolvedValue([]);
    showToastMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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

  // ── Scenario 3: Empty contextNodes → button disabled (F1.2 guard) ────
  it('button disabled when contextNodes is empty (no contextsToSend possible)', () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      contextNodes: [],
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(true);
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

// ─── F1.1: contextsToSend empty check ──────────────────────────────────────
describe('F1.1: contextsToSend empty validation', () => {
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    (canvasApi.fetchComponentTree as Mock) = mockFetch;
    mockFetch.mockResolvedValue([]);
    showToastMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // F1.2 is the primary guard (button disabled when contextsToSend empty).
  // F1.1 guard exists as a defence-in-depth for programmatic calls.
  // We verify button is disabled when all contexts are inactive (isActive: false).
  it('F1.2 guard: button disabled when all contexts are inactive (contextsToSend empty)', () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      // Context exists but isActive: false → activeContexts filter → []
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', description: '管理患者', type: 'core' as const, isActive: false, status: 'confirmed' as const, children: [] },
      ],
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(true);
  });

  // AC1: With valid contexts, button is enabled and click triggers correct behavior
  it('button enabled and calls API when contextsToSend is valid', async () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      contextNodes: defaultContextNodes,
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(false);

    await act(async () => {
      await userEvent.click(continueBtn);
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
  });
});

// ─── F1.2: Button disabled logic ─────────────────────────────────────────────
describe('F1.2: Continue button disabled state', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // AC1: contextsToSend 为空时按钮 disabled === true
  it('disables button when contextsToSend is empty (all contexts inactive)', () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      // Context exists but isActive: false → contextsToSend will be []
      contextNodes: [
        { nodeId: 'ctx-1', name: '患者管理', description: '管理患者', type: 'core' as const, isActive: false, status: 'confirmed' as const, children: [] },
      ],
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(true);
  });

  // AC2: contextsToSend 有效时按钮 disabled === componentGenerating
  it('enables button when contextsToSend is valid and not generating', () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      contextNodes: defaultContextNodes,
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(false);
  });

  // Regression: Normal path (valid contexts + flows) button remains clickable
  it('regression: enables button with valid contexts and flows', async () => {
    setupStores({
      selectedNodeIds: { context: [], flow: [], component: [] },
      contextNodes: defaultContextNodes,
      flowNodes: defaultFlowNodes,
    });

    render(<BusinessFlowTree />);

    const continueBtn = screen.getByRole('button', { name: '继续到组件树' }) as HTMLButtonElement;
    await act(async () => {
      await userEvent.click(continueBtn);
    });

    // Should have called the API (button was enabled and clickable)
    const mockFetch = canvasApi.fetchComponentTree as Mock;
    expect(mockFetch).toHaveBeenCalled();
  });
});

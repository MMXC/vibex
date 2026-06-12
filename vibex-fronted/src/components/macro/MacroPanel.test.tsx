/**
 * MacroPanel.test.tsx — S92-E1: Canvas Workflow Automation
 *
 * Tests:
 * 1. Renders empty state when no macros
 * 2. Renders macro list when macros exist
 * 3. Record button shows "Record" in idle state
 * 4. Record button starts recording on click
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MacroPanel } from './MacroPanel';

const mockFetchMacros = vi.fn();
const mockCreateMacro = vi.fn();
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn(() => []);
const mockDiscardRecording = vi.fn();

vi.mock('@/stores/macroStore', () => ({
  useMacroStore: vi.fn(),
}));

// Import AFTER vi.mock so the mock is registered
import { useMacroStore } from '@/stores/macroStore';

function setupMockStore(overrides: Partial<ReturnType<typeof useMacroStore>> = {}) {
  (useMacroStore as ReturnType<typeof vi.fn>).mockReturnValue({
    macros: [],
    loading: false,
    error: null,
    recordingState: 'idle' as const,
    currentSteps: [],
    fetchMacros: mockFetchMacros,
    createMacro: mockCreateMacro,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    discardRecording: mockDiscardRecording,
    ...overrides,
  });
}

describe('MacroPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockStore();
  });

  it('renders empty state when no macros', () => {
    render(<MacroPanel currentCanvasId="canvas-1" />);
    expect(screen.getByText(/No macros yet/i)).toBeInTheDocument();
  });

  it('renders macro list when macros exist', () => {
    setupMockStore({
      macros: [
        {
          id: 'macro-1',
          userId: 'u1',
          name: 'Build Rectangles',
          description: '',
          steps: [
            { type: 'create-node', timestamp: 1000, data: { nodeType: 'rect' } },
            { type: 'create-node', timestamp: 2000, data: { nodeType: 'rect' } },
          ],
          shareToken: null,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          stepCount: 2,
        },
      ],
    });

    render(<MacroPanel currentCanvasId="canvas-1" />);
    expect(screen.getByText('Build Rectangles')).toBeInTheDocument();
    // "2 steps" appears in both macro card meta and MacroPlayer button → use getAllByText
    const stepBadges = screen.getAllByText(/2 steps?/i);
    expect(stepBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Record" button in idle state', () => {
    render(<MacroPanel currentCanvasId="canvas-1" />);
    expect(screen.getByTestId('record-toggle')).toHaveTextContent('Record');
  });

  it('starts recording on Record button click', () => {
    render(<MacroPanel currentCanvasId="canvas-1" />);
    fireEvent.click(screen.getByTestId('record-toggle'));
    expect(mockStartRecording).toHaveBeenCalledWith('canvas-1');
  });
});

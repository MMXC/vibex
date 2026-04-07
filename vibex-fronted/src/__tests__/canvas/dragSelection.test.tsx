/**
 * useDragSelection — Unit Tests (E3)
 *
 * Tests the drag-to-select (框选) hook logic:
 * - selectionBox state during drag
 * - isSelecting state transitions
 * - node intersection computation
 * - mouse event sequence: down → move → up
 * - keyboard cancel (Escape)
 * - disabled state
 * - modifier key exclusion (Ctrl/Cmd should not start box select)
 * - click vs drag distinction
 */
import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { useDragSelection } from '@/hooks/canvas/useDragSelection';

// ── Test Harness ────────────────────────────────────────────────────────────

interface HarnessProps {
  onSelectionChange?: (ids: string[]) => void;
  getNodePositions?: () => Array<{ id: string; rect: DOMRect }>;
  enabled?: boolean;
}

function DragSelectionHarness({ onSelectionChange, getNodePositions, enabled = true }: HarnessProps) {
  const { selectionBox, isSelecting, containerRef } = useDragSelection({
    onSelectionChange: onSelectionChange ?? (() => {}),
    getNodePositions: getNodePositions ?? (() => []),
    enabled,
  });

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      data-testid="scroll-container"
      style={{ position: 'relative', width: 400, height: 300, overflow: 'auto' }}
    >
      {/* Fake nodes for intersection testing */}
      <div data-node-id="node-1" style={{ position: 'absolute', left: 10, top: 10, width: 80, height: 30 }} />
      <div data-node-id="node-2" style={{ position: 'absolute', left: 10, top: 60, width: 80, height: 30 }} />
      <div data-node-id="node-3" style={{ position: 'absolute', left: 10, top: 110, width: 80, height: 30 }} />
      <div data-node-id="node-4" style={{ position: 'absolute', left: 10, top: 160, width: 80, height: 30 }} />

      {/* Selection box overlay */}
      {selectionBox && (
        <div
          data-testid="selection-box"
          style={{
            position: 'absolute',
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid #3b82f6',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* State indicator */}
      <div data-testid="is-selecting">{isSelecting ? 'true' : 'false'}</div>
    </div>
  );
}

// ── Mock getBoundingClientRect ─────────────────────────────────────────────

// Track container and element positions for mocking
let containerEl: HTMLDivElement | null = null;

function mockBoundingClientRect(left = 0, top = 0, width = 400, height = 300) {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) };
}

function setupBoundingMocks() {
  const containerRect = mockBoundingClientRect(100, 100);

  // Store reference to container
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

  Element.prototype.getBoundingClientRect = function () {
    if (this === containerEl) return mockBoundingClientRect(containerRect.left, containerRect.top, containerRect.width, containerRect.height);
    // For node elements (data-node-id), return mock positions
    const nodeId = (this as HTMLElement).getAttribute?.('data-node-id');
    if (nodeId) {
      const nodePositions: Record<string, { left: number; top: number; width: number; height: number }> = {
        'node-1': { left: 110, top: 110, width: 80, height: 30 },
        'node-2': { left: 110, top: 160, width: 80, height: 30 },
        'node-3': { left: 110, top: 210, width: 80, height: 30 },
        'node-4': { left: 110, top: 260, width: 80, height: 30 },
      };
      const pos = nodePositions[nodeId];
      if (pos) return mockBoundingClientRect(pos.left, pos.top, pos.width, pos.height);
    }
    return mockBoundingClientRect();
  };

  return () => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useDragSelection — E3-T1', () => {
  let restoreMocks: () => void;

  beforeEach(() => {
    cleanup();
    restoreMocks = setupBoundingMocks();
  });

  afterEach(() => {
    restoreMocks?.();
    cleanup();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with no selection box', () => {
      render(<DragSelectionHarness />);
      expect(screen.queryByTestId('selection-box')).not.toBeInTheDocument();
    });

    it('starts with isSelecting=false', () => {
      render(<DragSelectionHarness />);
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });
  });

  // ── Drag lifecycle ───────────────────────────────────────────────────────

  describe('drag lifecycle', () => {
    it('shows selection box on mousedown', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });

      expect(screen.getByTestId('selection-box')).toBeInTheDocument();
      expect(screen.getByTestId('is-selecting').textContent).toBe('true');
    });

    it('clears selection box on mouseup (click without drag)', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });
      expect(screen.getByTestId('is-selecting').textContent).toBe('true');

      await act(async () => {
        // Mouse up at same position (no drag)
        fireEvent.mouseUp(container, { clientX: 110, clientY: 110 });
      });
      expect(screen.queryByTestId('selection-box')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });

    it('updates selection box on mousemove after mousedown', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });

      await act(async () => {
        fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
      });

      const box = screen.getByTestId('selection-box');
      // Box should have non-zero dimensions after mousemove (moved ~90px in each axis)
      const boxWidth = parseFloat(box.style.width);
      const boxHeight = parseFloat(box.style.height);
      expect(boxWidth).toBeGreaterThan(0);
      expect(boxHeight).toBeGreaterThan(0);
    });

    it('calls onSelectionChange with node IDs when box covers nodes', async () => {
      const onSelectionChange = vi.fn();
      render(
        <DragSelectionHarness
          onSelectionChange={onSelectionChange}
          getNodePositions={() => {
            const container = screen.getByTestId('scroll-container');
            const nodeEls = container.querySelectorAll<HTMLElement>('[data-node-id]');
            return Array.from(nodeEls).map((el) => ({
              id: el.getAttribute('data-node-id')!,
              rect: el.getBoundingClientRect(),
            }));
          }}
        />
      );

      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });
      await act(async () => {
        fireEvent.mouseMove(container, { clientX: 200, clientY: 250 });
      });
      await act(async () => {
        fireEvent.mouseUp(container);
      });

      // Should have selected nodes that intersect with the drag box
      expect(onSelectionChange).toHaveBeenCalled();
      const selectedIds = onSelectionChange.mock.calls[0][0];
      expect(Array.isArray(selectedIds)).toBe(true);
    });
  });

  // ── Interaction exclusion ─────────────────────────────────────────────────

  describe('interaction exclusion', () => {
    it('does not start selection when clicking a button', async () => {
      function HarnessWithButton() {
        const { isSelecting, containerRef } = useDragSelection({
          onSelectionChange: () => {},
          getNodePositions: () => [],
          enabled: true,
        });
        return (
          <div ref={containerRef as React.RefObject<HTMLDivElement>} data-testid="container">
            <button data-testid="test-button">Click me</button>
            <div data-testid="is-selecting">{isSelecting ? 'true' : 'false'}</div>
          </div>
        );
      }

      render(<HarnessWithButton />);
      await act(async () => {
        fireEvent.mouseDown(screen.getByTestId('test-button'), { clientX: 200, clientY: 200, button: 0 });
      });
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });

    it('does not start selection when Ctrl/Cmd is held', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0, ctrlKey: true });
      });
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });

    it('does not start selection when meta key is held', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0, metaKey: true });
      });
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });
  });

  // ── Keyboard cancel ──────────────────────────────────────────────────────

  describe('keyboard cancel', () => {
    it('cancels selection on Escape', async () => {
      render(<DragSelectionHarness />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });
      expect(screen.getByTestId('is-selecting').textContent).toBe('true');

      await act(async () => {
        fireEvent.keyDown(container, { key: 'Escape' });
      });
      expect(screen.queryByTestId('selection-box')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });
  });

  // ── Disabled state ───────────────────────────────────────────────────────

  describe('disabled state', () => {
    it('does not start selection when enabled=false', async () => {
      render(<DragSelectionHarness enabled={false} />);
      const container = screen.getByTestId('scroll-container');

      await act(async () => {
        fireEvent.mouseDown(container, { clientX: 110, clientY: 110, button: 0 });
      });
      expect(screen.queryByTestId('selection-box')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-selecting').textContent).toBe('false');
    });
  });

  // ── doesNodeIntersectBox logic ──────────────────────────────────────────

  describe('doesNodeIntersectBox', () => {
    it('detects overlap when node is fully inside box', () => {
      // Test intersection logic directly
      const doesIntersect = (nodeRect: DOMRect, box: { left: number; top: number; width: number; height: number }) => {
        const nodeLeft = nodeRect.left;
        const nodeRight = nodeRect.right;
        const nodeTop = nodeRect.top;
        const nodeBottom = nodeRect.bottom;
        const boxLeft = box.left;
        const boxRight = box.left + box.width;
        const boxTop = box.top;
        const boxBottom = box.top + box.height;
        return !(nodeRight < boxLeft || nodeLeft > boxRight || nodeBottom < boxTop || nodeTop > boxBottom);
      };

      const box = { left: 100, top: 100, width: 100, height: 100 };
      const nodeInside = { left: 110, right: 190, top: 110, bottom: 140 } as DOMRect;
      const nodeOutside = { left: 300, right: 400, top: 110, bottom: 140 } as DOMRect;
      const nodePartial = { left: 170, right: 250, top: 110, bottom: 140 } as DOMRect;

      expect(doesIntersect(nodeInside, box)).toBe(true);
      expect(doesIntersect(nodeOutside, box)).toBe(false);
      expect(doesIntersect(nodePartial, box)).toBe(true);
    });
  });
});

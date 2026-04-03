/**
 * Tests for useMermaidVisualization hook
 */
// @ts-nocheck


import { renderHook, act, waitFor } from '@testing-library/react';
import { useMermaidVisualization } from '@/hooks/useMermaidVisualization';

// Mock mermaidManager
jest.mock('@/lib/mermaid/MermaidManager', () => ({
  mermaidManager: {
    render: jest.fn(),
    initialize: jest.fn(),
    isInitialized: jest.fn(() => true),
  },
}));

jest.mock('@/stores/visualizationStore', () => ({
  useVisualizationStore: jest.fn(() => ({
    visualizationData: null,
    options: { selectedNodeId: null, zoom: 1, showMinimap: true, searchQuery: '' },
    setOption: jest.fn(),
  })),
}));

import { mermaidManager } from '@/lib/mermaid/MermaidManager';

const mockMermaidRender = mermaidManager.render as jest.MockedFunction<
  typeof mermaidManager.render
>;

describe('useMermaidVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMermaidRender.mockResolvedValue('<svg><rect/></svg>');
  });

  it('should return empty state when code is null', () => {
    const { result } = renderHook(() => useMermaidVisualization(null));
    expect(result.current.svg).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isRendering).toBe(false);
    expect(result.current.code).toBe('');
  });

  it('should return empty state when code is empty string', () => {
    const { result } = renderHook(() => useMermaidVisualization(''));
    expect(result.current.svg).toBe('');
    expect(result.current.code).toBe('');
  });

  it('should render SVG when valid code is provided', async () => {
    const { result } = renderHook(() => useMermaidVisualization('graph TD\n  A --> B'));

    await waitFor(() => {
      expect(result.current.svg).toContain('<svg>');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it('should set error when render fails', async () => {
    mockMermaidRender.mockRejectedValue(new Error('Syntax error'));

    const { result } = renderHook(() => useMermaidVisualization('invalid mermaid'));

    await waitFor(() => {
      expect(result.current.error).toBe('Syntax error');
    });

    expect(result.current.svg).toBe('');
  });

  it('should parse node info from code with bracket syntax', async () => {
    const { result } = renderHook(() =>
      useMermaidVisualization('graph TD\n  A[Start] --> B[End]\n  B[End] --> C[Done]')
    );

    await waitFor(() => {
      expect(result.current.nodeInfo.length).toBeGreaterThan(0);
    });

    const nodeIds = result.current.nodeInfo.map((n) => n.id);
    expect(nodeIds).toContain('A');
    expect(nodeIds).toContain('B');
    expect(nodeIds).toContain('C');
  });

  it('should clear state when clear is called', async () => {
    const { result } = renderHook(() => useMermaidVisualization('graph TD\n  A --> B'));

    await waitFor(() => {
      expect(result.current.svg).toContain('<svg>');
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.svg).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.nodeInfo).toEqual([]);
  });

  it('should update when code changes', async () => {
    const { result, rerender } = renderHook(
      ({ code }: { code: string }) => useMermaidVisualization(code),
      { initialProps: { code: 'graph TD\n  A --> B' } }
    );

    await waitFor(() => {
      expect(result.current.svg).toContain('<svg>');
    });

    rerender({ code: 'graph TD\n  X --> Y' });

    await waitFor(() => {
      expect(result.current.svg).toContain('<svg>');
      expect(mockMermaidRender).toHaveBeenCalledTimes(2);
    });
  });
});

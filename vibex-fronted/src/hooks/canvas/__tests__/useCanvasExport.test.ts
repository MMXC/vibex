/**
 * useCanvasExport — Unit tests
 * F3-F9: 导出 PNG/SVG
 */

import { renderHook, act } from '@testing-library/react';
import { useCanvasExport } from '../useCanvasExport';

// Mock canvas store (avoid persist/devtools middleware issues in JSDOM)
// useCanvasExport calls useCanvasStore.getState() directly (not as a hook)
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-empty-object-pattern
    () => ({}),
    {
      getState: () => ({
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        phase: 'input',
        projectId: 'test-project',
      }),
    }
  ),
}));

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mock-png-data'),
  toSvg: jest.fn().mockResolvedValue('data:image/svg+xml;base64,mock-svg-data'),
}));

// Mock global URL methods
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();
beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

// Track created download link
let createdLink: HTMLAnchorElement | null = null;
beforeEach(() => {
  jest.clearAllMocks();
  createdLink = null;
  // Mock appendChild and removeChild to track link without real DOM operations
  const mockBody = document.createElement('div');
  jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    if (node instanceof HTMLAnchorElement) {
      createdLink = node;
    }
    return mockBody;
  });
  jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockBody);
});

describe('useCanvasExport', () => {
  it('should return correct initial shape', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(typeof result.current.exportCanvas).toBe('function');
    expect(typeof result.current.isExporting).toBe('boolean');
    expect(result.current.error).toBeNull();
    expect(typeof result.current.cancelExport).toBe('function');
  });

  it('should export PNG when target element found', async () => {
    const mockElement = {
      scrollWidth: 800,
      scrollHeight: 600,
    } as HTMLElement;
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    const { result } = renderHook(() => useCanvasExport());

    await act(async () => {
      await result.current.exportCanvas({ format: 'png', scope: 'all' });
    });

    expect(createdLink).not.toBeNull();
    expect(createdLink?.download).toMatch(/vibex-canvas.*\.png/);
  });

  it('should throw error when no target element found', async () => {
    jest.spyOn(document, 'querySelector').mockReturnValue(null);

    const { result } = renderHook(() => useCanvasExport());

    await expect(
      result.current.exportCanvas({ format: 'png', scope: 'all' })
    ).rejects.toThrow('无法找到导出目标元素');
  });

  it('should cancel export without crashing', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(() => result.current.cancelExport()).not.toThrow();
  });

  it('should export JSON format', async () => {
    const { result } = renderHook(() => useCanvasExport());

    await act(async () => {
      await result.current.exportCanvas({ format: 'json', scope: 'all' });
    });

    expect(createdLink).not.toBeNull();
    expect(createdLink?.download).toMatch(/vibex-canvas.*\.json/);
  });

  it('should export markdown format', async () => {
    const { result } = renderHook(() => useCanvasExport());

    await act(async () => {
      await result.current.exportCanvas({ format: 'markdown', scope: 'all' });
    });

    expect(createdLink).not.toBeNull();
    expect(createdLink?.download).toMatch(/vibex-canvas.*\.md/);
  });
});

import { renderHook } from '@testing-library/react';
import { useCanvasExport } from '../useCanvasExport';

// Mock canvas store
jest.mock('@/lib/canvas/canvasStore', () => ({
  useCanvasStore: Object.assign(
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

describe('url mock test', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(result.current.isExporting).toBe(false);
  });
});

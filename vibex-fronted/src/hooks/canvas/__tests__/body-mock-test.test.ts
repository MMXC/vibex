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

// Mock document.body only
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
Object.defineProperty(document, 'body', {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  writable: true,
});

describe('body mock test', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(result.current.isExporting).toBe(false);
  });
});

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

// Mock global URL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock document.body
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
Object.defineProperty(document, 'body', {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  writable: true,
});

describe('mock order test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

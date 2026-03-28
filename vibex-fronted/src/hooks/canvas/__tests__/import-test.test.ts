import { renderHook } from '@testing-library/react';
import { useCanvasExport } from '../useCanvasExport';

describe('import test', () => {
  it('should import useCanvasExport', () => {
    expect(useCanvasExport).toBeDefined();
  });
  
  it('should render hook', () => {
    const { result } = renderHook(() => useCanvasExport());
    expect(result.current).toBeDefined();
  });
});

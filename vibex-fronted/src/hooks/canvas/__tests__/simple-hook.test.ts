import { renderHook } from '@testing-library/react';
import { useState } from 'react';

// Simple test - no imports from the project
describe('simple hook test', () => {
  it('should work', () => {
    const { result } = renderHook(() => useState(0));
    expect(result.current[0]).toBe(0);
  });
});

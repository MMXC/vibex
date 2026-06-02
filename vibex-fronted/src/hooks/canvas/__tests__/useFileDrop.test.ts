/**
 * useFileDrop — unit tests
 * S54-E2: Canvas File Import Enhancement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from '../useFileDrop';

describe('useFileDrop', () => {
  // Mock React.DragEvent
  const mockFile = new File(['{"test": true}'], 'test.json', { type: 'application/json' });

  function createDragEvent(type: string, file: File | null = null): React.DragEvent {
    return {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      type,
      dataTransfer: {
        files: file ? [file] : [],
        dropEffect: 'copy' as DataTransfer['dropEffect'],
      },
      relatedTarget: null,
      currentTarget: null,
      target: null,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      timeStamp: 0,
      isDefaultPrevented: () => false,
      isPropagationStopped: () => false,
      persist: () => {},
      nativeEvent: new Event(''),
      persist2: undefined as unknown as () => void,
    } as unknown as React.DragEvent;
  }

  describe('isDragActive', () => {
    it('should be false initially', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      expect(result.current.isDragActive).toBe(false);
    });

    it('should become true on dragenter', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      act(() => {
        result.current.dragProps.onDragEnter(createDragEvent('dragenter'));
      });
      expect(result.current.isDragActive).toBe(true);
    });
  });

  describe('dragProps', () => {
    it('should call preventDefault on dragover', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      const event = createDragEvent('dragover');
      act(() => {
        result.current.dragProps.onDragOver(event);
      });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call preventDefault on dragenter', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      const event = createDragEvent('dragenter');
      act(() => {
        result.current.dragProps.onDragEnter(event);
      });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call onFileDrop when valid file is dropped', () => {
      const onFileDrop = vi.fn();
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          accept: ['json', 'yaml'],
          onFileDrop,
        })
      );
      const event = createDragEvent('drop', mockFile);
      act(() => {
        result.current.dragProps.onDrop(event);
      });
      expect(onFileDrop).toHaveBeenCalledWith(mockFile);
    });

    it('should call onInvalidDrop when unsupported file is dropped', () => {
      const onInvalidDrop = vi.fn();
      const onFileDrop = vi.fn();
      const badFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          accept: ['json', 'yaml'],
          onFileDrop,
          onInvalidDrop,
        })
      );
      const event = createDragEvent('drop', badFile);
      act(() => {
        result.current.dragProps.onDrop(event);
      });
      expect(onInvalidDrop).toHaveBeenCalledWith('test.txt');
      expect(onFileDrop).not.toHaveBeenCalled();
    });

    it('should clear isDragActive on drop', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      const event = createDragEvent('drop', mockFile);
      act(() => {
        result.current.dragProps.onDragEnter(createDragEvent('dragenter'));
        result.current.dragProps.onDrop(event);
      });
      expect(result.current.isDragActive).toBe(false);
    });

    it('should clear isDragActive on dragleave', () => {
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop: vi.fn(),
        })
      );
      act(() => {
        result.current.dragProps.onDragLeave(createDragEvent('dragleave'));
      });
      expect(result.current.isDragActive).toBe(false);
    });

    it('should accept .yml files by default', () => {
      const onFileDrop = vi.fn();
      const ymlFile = new File(['key: value'], 'data.yml', { type: 'text/yaml' });
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop,
        })
      );
      const event = createDragEvent('drop', ymlFile);
      act(() => {
        result.current.dragProps.onDrop(event);
      });
      expect(onFileDrop).toHaveBeenCalledWith(ymlFile);
    });

    it('should accept .vibex files', () => {
      const onFileDrop = vi.fn();
      const vibexFile = new File(['{"_format": "vibex"}'], 'project.vibex', { type: 'application/octet-stream' });
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          accept: ['vibex', 'json'],
          onFileDrop,
        })
      );
      const event = createDragEvent('drop', vibexFile);
      act(() => {
        result.current.dragProps.onDrop(event);
      });
      expect(onFileDrop).toHaveBeenCalledWith(vibexFile);
    });

    it('should not call onFileDrop when no files in drop', () => {
      const onFileDrop = vi.fn();
      const ref = { current: null };
      const { result } = renderHook(() =>
        useFileDrop(ref as React.RefObject<HTMLElement>, {
          onFileDrop,
        })
      );
      const event = createDragEvent('drop', null);
      act(() => {
        result.current.dragProps.onDrop(event);
      });
      expect(onFileDrop).not.toHaveBeenCalled();
    });
  });
});

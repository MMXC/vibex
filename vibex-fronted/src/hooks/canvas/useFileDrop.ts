/**
 * useFileDrop — Drag & Drop hook for canvas file import
 * S54-E2: Canvas File Import Enhancement
 *
 * Attaches drag event handlers to a ref and provides state + callbacks.
 */

import { useCallback, useState, type RefObject } from 'react';

export interface FileDropState {
  isDragActive: boolean;
  dragProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export interface FileDropOptions {
  /** Accepted file extensions (e.g. ['json', 'yaml', 'vibex']) */
  accept?: string[];
  /** Called when a valid file is dropped */
  onFileDrop: (file: File) => void;
  /** Called when an invalid file type is dropped */
  onInvalidDrop?: (fileName: string) => void;
}

const DEFAULT_ACCEPTED = ['json', 'yaml', 'yml', 'vibex'];

function isAcceptedFile(file: File, accept: string[]): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext !== undefined && accept.includes(ext);
}

export function useFileDrop(
  _ref: RefObject<HTMLElement | null>,
  options: FileDropOptions
): FileDropState {
  const { accept = DEFAULT_ACCEPTED, onFileDrop, onInvalidDrop } = options;
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Explicitly set dropEffect to copy to enable drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the drop zone entirely
    // Use relatedTarget to check if we're still within the element
    const related = e.relatedTarget as HTMLElement | null;
    // If relatedTarget is null or outside the ref, clear
    setIsDragActive((prev) => {
      // Simple heuristic: always clear on dragleave from current target
      // The next dragenter will re-activate
      return false;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Take the first file
      const file = files[0];
      if (isAcceptedFile(file, accept)) {
        onFileDrop(file);
      } else {
        onInvalidDrop?.(file.name);
      }
    },
    [accept, onFileDrop, onInvalidDrop]
  );

  return {
    isDragActive,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}

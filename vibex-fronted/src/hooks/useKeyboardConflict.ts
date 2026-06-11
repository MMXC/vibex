/**
 * useKeyboardConflict.ts — S88-E5: 命令面板增强
 *
 * Detects keyboard shortcut conflicts with system-reserved shortcuts.
 * System reserved: Ctrl+C (copy), Ctrl+V (paste), Ctrl+Z (undo),
 * Ctrl+S (save), Ctrl+W (close), Ctrl+Q (quit), Cmd+C/V/W/Q (macOS)
 *
 * Usage:
 *   const hasConflict = useKeyboardConflict(shortcut);
 */
'use client';

import { useMemo } from 'react';
import { detectShortcutConflict } from '@/stores/commandPaletteStore';

// Re-export for test convenience
export { detectShortcutConflict };

/**
 * Hook that returns true if the given shortcut conflicts with a system-reserved shortcut.
 * @param shortcut - e.g. "Ctrl+C", "Cmd+V", "Ctrl+Shift+S"
 */
export function useKeyboardConflict(shortcut: string | undefined): boolean {
  const hasConflict = useMemo(() => {
    return detectShortcutConflict(shortcut ?? '');
  }, [shortcut]);
  return hasConflict;
}

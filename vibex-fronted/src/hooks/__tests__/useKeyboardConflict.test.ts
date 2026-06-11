/**
 * useKeyboardConflict.test.ts — S88-E5: 命令面板增强
 * ≥6 test cases covering: detectConflict function
 */
import { describe, it, expect } from 'vitest';
import { detectShortcutConflict } from '@/hooks/useKeyboardConflict';

// We test detectShortcutConflict directly since it's the pure logic function
// The hook wraps it with useMemo

describe('detectShortcutConflict', () => {
  // T1: Ctrl+C is a system reserved shortcut
  it('T1: Ctrl+C is detected as conflict', () => {
    expect(detectShortcutConflict('Ctrl+C')).toBe(true);
  });

  // T2: Ctrl+V is a system reserved shortcut
  it('T2: Ctrl+V is detected as conflict', () => {
    expect(detectShortcutConflict('Ctrl+V')).toBe(true);
  });

  // T3: Ctrl+Z is a system reserved shortcut
  it('T3: Ctrl+Z is detected as conflict', () => {
    expect(detectShortcutConflict('Ctrl+Z')).toBe(true);
  });

  // T4: non-reserved shortcuts return false
  it('T4: non-reserved shortcuts are not conflicts', () => {
    expect(detectShortcutConflict('Ctrl+K')).toBe(false);
    expect(detectShortcutConflict('Ctrl+Shift+T')).toBe(false);
    expect(detectShortcutConflict('Ctrl+Alt+K')).toBe(false);  // K is not reserved
  });

  // T5: empty/undefined shortcuts return false
  it('T5: empty shortcuts return false', () => {
    expect(detectShortcutConflict('')).toBe(false);
    expect(detectShortcutConflict(undefined as any)).toBe(false);
  });

  // T6: case-insensitive detection
  it('T6: detection is case-insensitive', () => {
    expect(detectShortcutConflict('ctrl+s')).toBe(true);
    expect(detectShortcutConflict('CTRL+W')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { detectDrift, isDriftAcceptable } from './driftDetector';
import type { DesignToken } from '@/types/designSync';

function makeToken(id: string, name: string, value: string, type: DesignToken['type'] = 'color'): DesignToken {
  return { id, name, value, type };
}

describe('driftDetector', () => {
  describe('Scenario A: Token renamed', () => {
    it('should flag drift when design token has different name', () => {
      const design: DesignToken[] = [
        makeToken('t1', 'primary-color-new', '#00ffff', 'color'),
      ];
      const code: DesignToken[] = [
        makeToken('t1', 'primary-color-old', '#00ffff', 'color'),
      ];
      const report = detectDrift(design, code, 'A');
      expect(report.hasDrift).toBe(true);
      expect(report.changes.length).toBeGreaterThan(0);
      expect(report.scenario).toBe('A');
    });

    it('should have 0% false positive rate for Scenario A', () => {
      const design: DesignToken[] = [makeToken('t1', 'primary-color', '#ff0000', 'color')];
      const code: DesignToken[] = [makeToken('t1', 'primary-color', '#00ffff', 'color')];
      const report = detectDrift(design, code, 'A');
      expect(report.falsePositiveRate).toBe(0);
    });
  });

  describe('Scenario B: Code refactored without design change', () => {
    it('should flag drift when code has extra tokens not in design', () => {
      const design: DesignToken[] = [
        makeToken('t1', 'primary-color', '#00ffff', 'color'),
      ];
      const code: DesignToken[] = [
        makeToken('t1', 'primary-color', '#00ffff', 'color'),
        makeToken('t2', 'unused-token', '#ffffff', 'color'),
      ];
      const report = detectDrift(design, code, 'B');
      expect(report.hasDrift).toBe(true);
      const removed = report.changes.filter((c) => c.type === 'removed');
      expect(removed.some((c) => c.location === 'unused-token')).toBe(true);
    });
  });

  describe('Scenario C: Same token in design and code (no drift)', () => {
    it('should NOT flag drift when tokens match exactly', () => {
      const design: DesignToken[] = [
        makeToken('t1', 'primary-color', '#00ffff', 'color'),
        makeToken('t2', 'spacing-md', '16px', 'spacing'),
      ];
      const code: DesignToken[] = [
        makeToken('t1', 'primary-color', '#00ffff', 'color'),
        makeToken('t2', 'spacing-md', '16px', 'spacing'),
      ];
      const report = detectDrift(design, code, 'C');
      expect(report.hasDrift).toBe(false);
      expect(report.changes.length).toBe(0);
    });

    it('should flag 100% false positive rate if drift detected in Scenario C', () => {
      const design: DesignToken[] = [makeToken('t1', 'primary-color', '#00ffff', 'color')];
      const code: DesignToken[] = [makeToken('t1', 'primary-color', '#ffffff', 'color')];
      const report = detectDrift(design, code, 'C');
      expect(report.hasDrift).toBe(true);
      expect(report.falsePositiveRate).toBe(1.0);
      expect(isDriftAcceptable(report)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty token arrays', () => {
      const report = detectDrift([], []);
      expect(report.hasDrift).toBe(false);
      expect(report.changes.length).toBe(0);
    });

    it('detects modified token values', () => {
      const design: DesignToken[] = [makeToken('t1', 'primary-color', '#00ffff', 'color')];
      const code: DesignToken[] = [makeToken('t1', 'primary-color', '#ff0000', 'color')];
      const report = detectDrift(design, code);
      expect(report.hasDrift).toBe(true);
      expect(report.changes[0].type).toBe('modified');
      expect(report.changes[0].oldValue).toBe('#ff0000');
      expect(report.changes[0].newValue).toBe('#00ffff');
    });

    it('isDriftAcceptable returns true for < 10% false positive', () => {
      const design: DesignToken[] = [
        makeToken('t1', 'a', '1', 'color'),
        makeToken('t2', 'b', '2', 'color'),
      ];
      const code: DesignToken[] = [makeToken('t1', 'a', '1', 'color')];
      const report = detectDrift(design, code);
      expect(isDriftAcceptable(report)).toBe(true);
    });
  });
});

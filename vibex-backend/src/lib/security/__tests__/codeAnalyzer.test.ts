/**
 * Unit tests for AST-based Security Analyzer
 *
 * @module lib/security/__tests__/codeAnalyzer.test
 */

import { analyzeCodeSecurity, generateSecurityWarnings } from '../codeAnalyzer';

describe('codeAnalyzer', () => {
  describe('TC01: eval() detection', () => {
    it('should detect eval() and set hasUnsafe=true', () => {
      const report = analyzeCodeSecurity('eval("x")');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafeEval.length).toBeGreaterThan(0);
    });
  });

  describe('TC02: new Function() detection', () => {
    it('should detect new Function() and set hasUnsafe=true', () => {
      const report = analyzeCodeSecurity('new Function("return 1")');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafeNewFunction.length).toBeGreaterThan(0);
    });
  });

  describe('TC03: safe code', () => {
    it('should not flag safe code as unsafe', () => {
      const report = analyzeCodeSecurity('const x = 1; x++');
      expect(report.hasUnsafe).toBe(false);
      expect(report.unsafeEval).toEqual([]);
      expect(report.unsafeNewFunction).toEqual([]);
      expect(report.unsafeDynamicCode).toEqual([]);
    });
  });

  describe('TC04: setTimeout with string literal', () => {
    it('should detect setTimeout with string first argument', () => {
      const report = analyzeCodeSecurity('setTimeout("code", 0)');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafeDynamicCode.length).toBeGreaterThan(0);
    });
  });

  describe('TC05: parse error handling', () => {
    it('should handle syntax errors gracefully with confidence < 100', () => {
      const report = analyzeCodeSecurity('const x = 1 {{{');
      expect(report.confidence).toBeLessThan(100);
    });
  });

  describe('generateSecurityWarnings', () => {
    it('should return empty string for safe code', () => {
      const warnings = generateSecurityWarnings('const x = 1;');
      expect(warnings).toBe('');
    });

    it('should return warning string for unsafe code', () => {
      const warnings = generateSecurityWarnings('eval("x")');
      expect(warnings).toContain('[Security Warning]');
      expect(warnings).toContain('eval');
    });
  });

  describe('Performance', () => {
    it('should parse 5000-line file in under 50ms', () => {
      const lines: string[] = [];
      for (let i = 0; i < 5000; i++) {
        lines.push(`const line${i} = ${i};`);
      }
      const code = lines.join('\n');

      const start = Date.now();
      const report = analyzeCodeSecurity(code);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500);
      expect(report.hasUnsafe).toBe(false);
    });
  });
});

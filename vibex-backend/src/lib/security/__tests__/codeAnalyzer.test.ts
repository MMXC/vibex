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
      expect(report.unsafePatterns.some(p => p.type === 'eval')).toBe(true);
    });
  });

  describe('TC02: new Function() detection', () => {
    it('should detect new Function() and set hasUnsafe=true', () => {
      const report = analyzeCodeSecurity('new Function("return 1")');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'newFunction')).toBe(true);
    });
  });

  describe('TC03: safe code', () => {
    it('should not flag safe code as unsafe', () => {
      const report = analyzeCodeSecurity('const x = 1; x++');
      expect(report.hasUnsafe).toBe(false);
      expect(report.unsafePatterns).toEqual([]);
    });
  });

  describe('TC04: setTimeout with string literal', () => {
    it('should detect setTimeout with string first argument', () => {
      const report = analyzeCodeSecurity('setTimeout("code", 0)');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'setTimeout-string')).toBe(true);
    });
  });

  describe('TC05: innerHTML/outerHTML detection', () => {
    it('should detect innerHTML assignments', () => {
      const report = analyzeCodeSecurity('element.innerHTML = "<p>Hello</p>"');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'innerHTML')).toBe(true);
    });

    it('should detect outerHTML assignments', () => {
      const report = analyzeCodeSecurity('elem.outerHTML = "<div>replaced</div>"');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'innerHTML')).toBe(true);
    });
  });

  describe('TC06: parse error handling', () => {
    it('should handle syntax errors gracefully with confidence < 100', () => {
      const report = analyzeCodeSecurity('const x = 1 {{{');
      expect(report.confidence).toBeLessThan(100);
      expect(report.hasUnsafe).toBe(false);
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

    it('should include line numbers for innerHTML warnings', () => {
      const warnings = generateSecurityWarnings('const elem = document.createElement("div");\nelem.innerHTML = "<p>Content</p>";');
      expect(warnings).toContain('innerHTML');
      expect(warnings).toContain('line');
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

  describe('Edge cases', () => {
    it('should detect multiple danger patterns in one code', () => {
      const report = analyzeCodeSecurity('eval("x"); element.innerHTML = "hi"; new Function("return 1")');
      expect(report.hasUnsafe).toBe(true);
      expect(report.unsafePatterns.length).toBeGreaterThanOrEqual(3);
      expect(report.unsafePatterns.some(p => p.type === 'eval')).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'innerHTML')).toBe(true);
      expect(report.unsafePatterns.some(p => p.type === 'newFunction')).toBe(true);
    });

    it('should include line numbers in patterns', () => {
      const report = analyzeCodeSecurity('const x = 1;\neval("x");\nconst y = 2;');
      const evalPattern = report.unsafePatterns.find(p => p.type === 'eval');
      expect(evalPattern).toBeDefined();
      expect(evalPattern!.line).toBe(2);
    });
  });
});

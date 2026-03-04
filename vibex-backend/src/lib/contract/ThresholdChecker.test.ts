/**
 * ThresholdChecker Tests
 */

import { ThresholdChecker, ThresholdConfig, DEFAULT_THRESHOLDS, CoverageData } from './ThresholdChecker';

describe('ThresholdChecker', () => {
  const mockCoverageData: CoverageData = {
    lines: { total: 100, covered: 80, skipped: 5, pct: 80 },
    statements: { total: 100, covered: 75, skipped: 5, pct: 75 },
    functions: { total: 50, covered: 45, skipped: 0, pct: 90 },
    branches: { total: 80, covered: 60, skipped: 0, pct: 75 },
    timestamp: Date.now(),
  };

  const lowerCoverageData: CoverageData = {
    lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
    statements: { total: 100, covered: 50, skipped: 0, pct: 50 },
    functions: { total: 50, covered: 30, skipped: 0, pct: 60 },
    branches: { total: 80, covered: 40, skipped: 0, pct: 50 },
    timestamp: Date.now(),
  };

  describe('constructor', () => {
    it('should create instance with default thresholds', () => {
      const checker = new ThresholdChecker();
      expect(checker).toBeDefined();
    });

    it('should create instance with custom thresholds', () => {
      const config: ThresholdConfig = { lines: 80, statements: 80 };
      const checker = new ThresholdChecker(config);
      expect(checker).toBeDefined();
    });

    it('should have correct default thresholds', () => {
      expect(DEFAULT_THRESHOLDS.lines).toBe(70);
      expect(DEFAULT_THRESHOLDS.statements).toBe(70);
      expect(DEFAULT_THRESHOLDS.functions).toBe(70);
      expect(DEFAULT_THRESHOLDS.branches).toBe(60);
    });
  });

  describe('setThresholds', () => {
    it('should update thresholds', () => {
      const checker = new ThresholdChecker();
      checker.setThresholds({ lines: 90 });
      expect(checker).toBeDefined();
    });
  });

  describe('setPreviousCoverage', () => {
    it('should store previous coverage', () => {
      const checker = new ThresholdChecker();
      checker.setPreviousCoverage(mockCoverageData);
      expect(checker).toBeDefined();
    });
  });

  describe('check', () => {
    it('should pass when all metrics above threshold', () => {
      const checker = new ThresholdChecker({ lines: 70, statements: 70, functions: 70, branches: 60 });
      const result = checker.check(mockCoverageData);

      expect(result.passed).toBe(true);
      expect(result.metrics).toHaveLength(4);
    });

    it('should fail when below threshold', () => {
      const checker = new ThresholdChecker({ lines: 90, statements: 70, functions: 70, branches: 60 });
      const result = checker.check(mockCoverageData);

      expect(result.passed).toBe(false);
      expect(result.metrics.find(m => m.name === 'Lines' && !m.passed)).toBeDefined();
    });

    it('should include all four metrics in result', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      const metricNames = result.metrics.map(m => m.name);
      expect(metricNames).toContain('Lines');
      expect(metricNames).toContain('Statements');
      expect(metricNames).toContain('Functions');
      expect(metricNames).toContain('Branches');
    });

    it('should calculate correct actual and threshold values', () => {
      const checker = new ThresholdChecker({ lines: 75, statements: 70, functions: 70, branches: 60 });
      const result = checker.check(mockCoverageData);

      const linesMetric = result.metrics.find(m => m.name === 'Lines');
      expect(linesMetric?.actual).toBe(80);
      expect(linesMetric?.threshold).toBe(75);
      expect(linesMetric?.passed).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('should fail when coverage decreases in strict mode', () => {
      const checker = new ThresholdChecker({ strict: true });
      checker.setPreviousCoverage(mockCoverageData);
      
      const result = checker.check(lowerCoverageData);

      expect(result.passed).toBe(false);
    });

    it('should pass when coverage increases in strict mode', () => {
      const checker = new ThresholdChecker({ strict: true });
      checker.setPreviousCoverage(lowerCoverageData);
      
      const result = checker.check(mockCoverageData);

      expect(result.passed).toBe(true);
    });

    it('should not check strict mode without previous coverage', () => {
      const checker = new ThresholdChecker({ strict: true });
      const result = checker.check(mockCoverageData);

      expect(result.passed).toBe(true);
    });
  });

  describe('change tracking', () => {
    it('should track change when previous coverage is set', () => {
      const checker = new ThresholdChecker();
      checker.setPreviousCoverage(lowerCoverageData);
      const result = checker.check(mockCoverageData);

      const linesMetric = result.metrics.find(m => m.name === 'Lines');
      expect(linesMetric?.change).toBe(30); // 80 - 50
    });

    it('should have undefined change when no previous coverage', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      const linesMetric = result.metrics.find(m => m.name === 'Lines');
      expect(linesMetric?.change).toBeUndefined();
    });
  });

  describe('summary generation', () => {
    it('should generate correct summary', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      expect(result.summary).toContain('4/4 metrics passed');
    });
  });

  describe('suggestion generation', () => {
    it('should generate suggestion when failed', () => {
      const checker = new ThresholdChecker({ lines: 95 });
      const result = checker.check(mockCoverageData);

      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('Lines');
    });

    it('should not have suggestion when passed', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      expect(result.suggestion).toBeUndefined();
    });
  });

  describe('exitIfFailed', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should exit process when check fails', () => {
      const checker = new ThresholdChecker({ lines: 100 });
      const result = checker.check(mockCoverageData);

      checker.exitIfFailed(result);

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should not exit when check passes', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      checker.exitIfFailed(result);

      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate markdown report', () => {
      const checker = new ThresholdChecker();
      const result = checker.check(mockCoverageData);

      const md = checker.generateMarkdownReport(result);

      expect(md).toContain('Coverage Threshold Check Report');
      expect(md).toContain('PASSED');
      expect(md).toContain('| Metric | Actual | Threshold |');
    });

    it('should include failed status when not passed', () => {
      const checker = new ThresholdChecker({ lines: 100 });
      const result = checker.check(mockCoverageData);

      const md = checker.generateMarkdownReport(result);

      expect(md).toContain('FAILED');
    });

    it('should include suggestions when failed', () => {
      const checker = new ThresholdChecker({ lines: 100 });
      const result = checker.check(mockCoverageData);

      const md = checker.generateMarkdownReport(result);

      expect(md).toContain('Suggestions');
    });
  });
});

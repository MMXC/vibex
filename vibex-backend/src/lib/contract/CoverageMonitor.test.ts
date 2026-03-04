/**
 * CoverageMonitor Tests
 */

import { CoverageMonitor, CoverageData, ThresholdConfig } from './CoverageMonitor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CoverageMonitor', () => {
  const mockCoverageData: CoverageData = {
    lines: { total: 100, covered: 80, skipped: 5, pct: 80 },
    statements: { total: 100, covered: 75, skipped: 5, pct: 75 },
    functions: { total: 50, covered: 45, skipped: 0, pct: 90 },
    branches: { total: 80, covered: 60, skipped: 0, pct: 75 },
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default path', () => {
      const monitor = new CoverageMonitor();
      expect(monitor).toBeDefined();
    });

    it('should create instance with custom path', () => {
      const monitor = new CoverageMonitor('/custom/path');
      expect(monitor).toBeDefined();
    });
  });

  describe('parseCoverageReport', () => {
    it('should parse coverage report successfully', async () => {
      const mockSummary = {
        total: {
          lines: { total: 100, covered: 80, skipped: 5, pct: 80 },
          statements: { total: 100, covered: 75, skipped: 5, pct: 75 },
          functions: { total: 50, covered: 45, skipped: 0, pct: 90 },
          branches: { total: 80, covered: 60, skipped: 0, pct: 75 },
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSummary));

      const monitor = new CoverageMonitor('/test');
      const result = await monitor.parseCoverageReport();

      expect(result.lines.pct).toBe(80);
      expect(result.statements.pct).toBe(75);
      expect(result.functions.pct).toBe(90);
      expect(result.branches.pct).toBe(75);
    });

    it('should throw error when file not found', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const monitor = new CoverageMonitor('/test');
      await expect(monitor.parseCoverageReport()).rejects.toThrow('Coverage report not found');
    });

    it('should handle missing metrics gracefully', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({}));

      const monitor = new CoverageMonitor('/test');
      const result = await monitor.parseCoverageReport();

      expect(result.lines.pct).toBe(0);
      expect(result.statements.pct).toBe(0);
    });
  });

  describe('analyzeCoverage', () => {
    it('should analyze coverage with default threshold', async () => {
      const mockSummary = {
        total: {
          lines: { total: 100, covered: 80, skipped: 5, pct: 80 },
          statements: { total: 100, covered: 75, skipped: 5, pct: 75 },
          functions: { total: 50, covered: 45, skipped: 0, pct: 90 },
          branches: { total: 80, covered: 60, skipped: 0, pct: 75 },
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSummary));

      const monitor = new CoverageMonitor('/test');
      const result = await monitor.analyzeCoverage();

      expect(result.passed).toBe(true);
      expect(result.details).toContain('PASS Lines: 80%');
    });

    it('should fail when below threshold', async () => {
      const mockSummary = {
        total: {
          lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
          statements: { total: 100, covered: 50, skipped: 0, pct: 50 },
          functions: { total: 50, covered: 30, skipped: 0, pct: 60 },
          branches: { total: 80, covered: 40, skipped: 0, pct: 50 },
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSummary));

      const monitor = new CoverageMonitor('/test');
      const result = await monitor.analyzeCoverage({ lines: 70 });

      expect(result.passed).toBe(false);
      expect(result.details).toContain('FAIL Lines: 50% (expected: 70%)');
    });

    it('should accept custom threshold', async () => {
      const mockSummary = {
        total: {
          lines: { total: 100, covered: 60, skipped: 0, pct: 60 },
          statements: { total: 100, covered: 60, skipped: 0, pct: 60 },
          functions: { total: 50, covered: 30, skipped: 0, pct: 60 },
          branches: { total: 80, covered: 40, skipped: 0, pct: 50 },
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSummary));

      const monitor = new CoverageMonitor('/test');
      const threshold: ThresholdConfig = { lines: 50, statements: 50, functions: 50, branches: 40 };
      const result = await monitor.analyzeCoverage(threshold);

      expect(result.passed).toBe(true);
    });
  });

  describe('history management', () => {
    it('should save and load history', async () => {
      const mockHistory = [
        { date: '2024-01-01', lines: 70, statements: 70, functions: 70, branches: 60 },
      ];

      mockFs.writeFile.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistory));

      const monitor = new CoverageMonitor('/test');
      await monitor.recordHistory(mockCoverageData);
      const history = await monitor.loadHistory();

      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(history).toEqual(mockHistory);
    });

    it('should handle missing history file', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const monitor = new CoverageMonitor('/test');
      const history = await monitor.loadHistory();

      expect(history).toEqual([]);
    });

    it('should limit history to 30 entries', async () => {
      const longHistory = Array.from({ length: 35 }, (_, i) => ({
        date: `2024-01-${i + 1}`,
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 60,
      }));

      mockFs.writeFile.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(longHistory));

      const monitor = new CoverageMonitor('/test');
      await monitor.recordHistory(mockCoverageData);

      const written = JSON.parse((mockFs.writeFile as jest.Mock).mock.calls[0][1]);
      expect(written.length).toBeLessThanOrEqual(30);
    });
  });

  describe('trend calculation', () => {
    it('should calculate trend correctly', async () => {
      const mockHistory = [
        { date: '2024-01-01', lines: 70, statements: 70, functions: 70, branches: 60 },
        { date: '2024-01-02', lines: 75, statements: 75, functions: 75, branches: 65 },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockHistory));

      const monitor = new CoverageMonitor('/test');
      await monitor.loadHistory();
      const trend = monitor.calculateTrend();

      expect(trend.lines).toBe(5);
      expect(trend.statements).toBe(5);
      expect(trend.functions).toBe(5);
      expect(trend.branches).toBe(5);
    });

    it('should return zeros for insufficient history', () => {
      const monitor = new CoverageMonitor('/test');
      const trend = monitor.calculateTrend();

      expect(trend.lines).toBe(0);
    });
  });

  describe('report generation', () => {
    it('should generate markdown report', () => {
      const monitor = new CoverageMonitor('/test');
      const report = {
        project: '/test',
        data: mockCoverageData,
        threshold: { lines: 70 },
        passed: true,
        details: ['PASS Lines: 80%'],
      };

      const md = monitor.generateMarkdownReport(report);

      expect(md).toContain('Coverage Report');
      expect(md).toContain('/test');
      expect(md).toContain('PASSED');
    });
  });
});

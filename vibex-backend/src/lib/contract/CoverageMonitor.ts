/**
 * Coverage Monitor - 测试覆盖率监控
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import { devLog } from '@/lib/log-sanitizer';

export interface CoverageData {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  timestamp: number;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageReport {
  project: string;
  data: CoverageData;
  threshold: ThresholdConfig;
  passed: boolean;
  details: string[];
}

export interface ThresholdConfig {
  lines?: number;
  statements?: number;
  functions?: number;
  branches?: number;
}

export interface CoverageTrend {
  date: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

const HISTORY_FILE = '.coverage-history.json';

export class CoverageMonitor {
  private projectPath: string;
  private history: CoverageTrend[] = [];

  constructor(projectPath: string = '.') {
    this.projectPath = projectPath;
  }

  async parseCoverageReport(reportPath: string = 'coverage/coverage-summary.json'): Promise<CoverageData> {
    const fullPath = path.join(this.projectPath, reportPath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const summary = JSON.parse(content);
      const total = summary.total || {};
      return {
        lines: this.parseMetric(total.lines),
        statements: this.parseMetric(total.statements),
        functions: this.parseMetric(total.functions),
        branches: this.parseMetric(total.branches),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error('Coverage report not found at ' + fullPath);
    }
  }

  private parseMetric(metric: any): CoverageMetric {
    if (!metric) return { total: 0, covered: 0, skipped: 0, pct: 0 };
    return {
      total: metric.total || 0,
      covered: metric.covered || 0,
      skipped: metric.skipped || 0,
      pct: Math.round(metric.pct || 0),
    };
  }

  async analyzeCoverage(threshold?: ThresholdConfig): Promise<CoverageReport> {
    const data = await this.parseCoverageReport();
    const thresholdConfig = threshold || this.getDefaultThreshold();
    const details: string[] = [];
    let passed = true;

    if (thresholdConfig.lines && data.lines.pct < thresholdConfig.lines) {
      details.push('FAIL Lines: ' + data.lines.pct + '% (expected: ' + thresholdConfig.lines + '%)');
      passed = false;
    } else {
      details.push('PASS Lines: ' + data.lines.pct + '%');
    }

    return {
      project: this.projectPath,
      data,
      threshold: thresholdConfig,
      passed,
      details,
    };
  }

  private getDefaultThreshold(): ThresholdConfig {
    return { lines: 70, statements: 70, functions: 70, branches: 60 };
  }

  async recordHistory(data: CoverageData): Promise<void> {
    const trend: CoverageTrend = {
      date: new Date().toISOString().split('T')[0],
      lines: data.lines.pct,
      statements: data.statements.pct,
      functions: data.functions.pct,
      branches: data.branches.pct,
    };
    this.history.push(trend);
    if (this.history.length > 30) this.history = this.history.slice(-30);
    await this.saveHistory();
  }

  private async saveHistory(): Promise<void> {
    const filePath = path.join(this.projectPath, HISTORY_FILE);
    await fs.writeFile(filePath, JSON.stringify(this.history, null, 2));
  }

  async loadHistory(): Promise<CoverageTrend[]> {
    const filePath = path.join(this.projectPath, HISTORY_FILE);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.history = JSON.parse(content);
    } catch { this.history = []; }
    return this.history;
  }

  getTrend(days: number = 7): CoverageTrend[] {
    return this.history.slice(-days);
  }

  calculateTrend(): { lines: number; statements: number; functions: number; branches: number } {
    if (this.history.length < 2) return { lines: 0, statements: 0, functions: 0, branches: 0 };
    const latest = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];
    return {
      lines: latest.lines - previous.lines,
      statements: latest.statements - previous.statements,
      functions: latest.functions - previous.functions,
      branches: latest.branches - previous.branches,
    };
  }

  generateMarkdownReport(report: CoverageReport): string {
    let md = '# Coverage Report\n\n';
    md += '**Project**: ' + report.project + '\n';
    md += '**Status**: ' + (report.passed ? 'PASSED' : 'FAILED') + '\n\n';
    md += '## Details\n\n';
    for (const d of report.details) {
      md += '- ' + d + '\n';
    }
    return md;
  }

  outputForCI(report: CoverageReport): void {
    devLog('\nCoverage Report: ' + report.project);
    for (const detail of report.details) {
      devLog('  ' + detail);
    }
    devLog('\n' + (report.passed ? 'Coverage check passed!' : 'Coverage below threshold!') + '\n');
    if (!report.passed) process.exit(1);
  }
}

export async function checkCoverage(projectPath: string = '.', threshold?: ThresholdConfig): Promise<CoverageReport> {
  const monitor = new CoverageMonitor(projectPath);
  const report = await monitor.analyzeCoverage(threshold);
  monitor.outputForCI(report);
  return report;
}

export default CoverageMonitor;

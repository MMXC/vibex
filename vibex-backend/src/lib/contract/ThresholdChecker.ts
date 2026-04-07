/**
 * Threshold Checker - 阈值检查器
 * 
 * 功能:
 * - 检查覆盖率是否达到阈值
 * - 支持自定义阈值配置
 * - 生成详细的检查报告
 * - CI 友好输出
 * 
 * Usage:
 * const checker = new ThresholdChecker()
 * const result = checker.check(coverage, thresholds)
 * checker.exitIfFailed(result)
 */

import { CoverageData } from './CoverageMonitor';

import { devLog, safeError } from '@/lib/log-sanitizer';

// 阈值配置
export interface ThresholdConfig {
  lines?: number;
  statements?: number;
  functions?: number;
  branches?: number;
  /**
   * 允许的最小值
   */
  min?: number;
  /**
   * 是否严格模式 (不允许下降)
   */
  strict?: boolean;
}

// 检查结果
export interface ThresholdCheckResult {
  passed: boolean;
  metrics: MetricCheckResult[];
  summary: string;
  suggestion?: string;
}

// 单个指标检查结果
export interface MetricCheckResult {
  name: string;
  actual: number;
  threshold: number;
  passed: boolean;
  change?: number; // 与上次对比的变化
}

// 默认阈值
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  lines: 70,
  statements: 70,
  functions: 70,
  branches: 60,
  strict: false,
};

/**
 * 阈值检查器
 */
export class ThresholdChecker {
  private thresholds: ThresholdConfig;
  private previousCoverage?: CoverageData;

  constructor(thresholds: ThresholdConfig = DEFAULT_THRESHOLDS) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * 设置阈值
   */
  setThresholds(thresholds: ThresholdConfig): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * 设置上次覆盖率 (用于比较)
   */
  setPreviousCoverage(coverage: CoverageData): void {
    this.previousCoverage = coverage;
  }

  /**
   * 检查覆盖率
   */
  check(coverage: CoverageData): ThresholdCheckResult {
    const metrics: MetricCheckResult[] = [];
    let allPassed = true;

    // 检查 Lines
    const linesResult = this.checkMetric(
      'Lines',
      coverage.lines.pct,
      this.thresholds.lines
    );
    metrics.push(linesResult);
    if (!linesResult.passed) allPassed = false;

    // 检查 Statements
    const statementsResult = this.checkMetric(
      'Statements',
      coverage.statements.pct,
      this.thresholds.statements
    );
    metrics.push(statementsResult);
    if (!statementsResult.passed) allPassed = false;

    // 检查 Functions
    const functionsResult = this.checkMetric(
      'Functions',
      coverage.functions.pct,
      this.thresholds.functions
    );
    metrics.push(functionsResult);
    if (!functionsResult.passed) allPassed = false;

    // 检查 Branches
    const branchesResult = this.checkMetric(
      'Branches',
      coverage.branches.pct,
      this.thresholds.branches
    );
    metrics.push(branchesResult);
    if (!branchesResult.passed) allPassed = false;

    // 严格模式检查
    if (this.thresholds.strict && this.previousCoverage) {
      const strictResult = this.checkStrictMode(coverage);
      if (!strictResult.passed) {
        allPassed = false;
        metrics.push(...strictResult.metrics);
      }
    }

    // 生成摘要
    const summary = this.generateSummary(metrics);
    const suggestion = allPassed ? undefined : this.generateSuggestion(metrics);

    return {
      passed: allPassed,
      metrics,
      summary,
      suggestion,
    };
  }

  /**
   * 检查单个指标
   */
  private checkMetric(
    name: string,
    actual: number,
    threshold?: number
  ): MetricCheckResult {
    const thresholdValue = threshold ?? 0;
    const passed = actual >= thresholdValue;

    // 计算变化
    let change: number | undefined;
    if (this.previousCoverage) {
      const prev = this.previousCoverage[name.toLowerCase() as keyof CoverageData] as any;
      if (prev && prev.pct !== undefined) {
        change = actual - prev.pct;
      }
    }

    return {
      name,
      actual,
      threshold: thresholdValue,
      passed,
      change,
    };
  }

  /**
   * 严格模式检查 (不允许覆盖率下降)
   */
  private checkStrictMode(coverage: CoverageData): { passed: boolean; metrics: MetricCheckResult[] } {
    if (!this.previousCoverage) {
      return { passed: true, metrics: [] };
    }

    const metrics: MetricCheckResult[] = [];
    let passed = true;

    const currentMetrics = [
      { name: 'Lines', value: coverage.lines.pct },
      { name: 'Statements', value: coverage.statements.pct },
      { name: 'Functions', value: coverage.functions.pct },
      { name: 'Branches', value: coverage.branches.pct },
    ];

    const prevMetrics = [
      { name: 'Lines', value: this.previousCoverage.lines.pct },
      { name: 'Statements', value: this.previousCoverage.statements.pct },
      { name: 'Functions', value: this.previousCoverage.functions.pct },
      { name: 'Branches', value: this.previousCoverage.branches.pct },
    ];

    for (let i = 0; i < currentMetrics.length; i++) {
      const current = currentMetrics[i];
      const prev = prevMetrics[i];
      const change = current.value - prev.value;

      if (change < 0) {
        const result: MetricCheckResult = {
          name: current.name,
          actual: current.value,
          threshold: prev.value, // 在严格模式下，要求不低于上次值
          passed: false,
          change,
        };
        metrics.push(result);
        passed = false;
      }
    }

    return { passed, metrics };
  }

  /**
   * 生成摘要
   */
  private generateSummary(metrics: MetricCheckResult[]): string {
    const passed = metrics.filter(m => m.passed).length;
    const total = metrics.length;
    return `${passed}/${total} metrics passed`;
  }

  /**
   * 生成建议
   */
  private generateSuggestion(metrics: MetricCheckResult[]): string {
    const failed = metrics.filter(m => !m.passed);
    
    if (failed.length === 0) return '';
    
    const suggestions = failed.map(m => {
      const diff = m.threshold - m.actual;
      return `${m.name}: 需要增加 ${diff}% 覆盖率`;
    });
    
    return `建议:\n${suggestions.join('\n')}`;
  }

  /**
   * 如果检查失败则退出 (CI 使用)
   */
  exitIfFailed(result: ThresholdCheckResult): void {
    if (!result.passed) {
      safeError('\n❌ Coverage threshold check failed!\n');
      safeError(result.summary);
      if (result.suggestion) {
        safeError(`\n${result.suggestion}`);
      }
      process.exit(1);
    }
    
    devLog('\n✅ Coverage threshold check passed!\n');
  }

  /**
   * 生成 Markdown 报告
   */
  generateMarkdownReport(result: ThresholdCheckResult): string {
    let md = '# Coverage Threshold Check Report\n\n';
    
    md += `**Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    md += `**Summary**: ${result.summary}\n\n`;
    
    md += '## Metrics\n\n';
    md += '| Metric | Actual | Threshold | Status | Change |\n';
    md += '|--------|--------|-----------|--------|--------|\n';
    
    for (const m of result.metrics) {
      const status = m.passed ? '✅' : '❌';
      const change = m.change !== undefined 
        ? (m.change > 0 ? `+${m.change}%` : `${m.change}%`)
        : '-';
      md += `| ${m.name} | ${m.actual}% | ${m.threshold}% | ${status} | ${change} |\n`;
    }
    
    if (result.suggestion) {
      md += `\n## Suggestions\n\n${result.suggestion}\n`;
    }
    
    return md;
  }

  /**
   * 从配置文件加载阈值
   */
  static async loadFromConfig(configPath: string = '.coverage-threshold.json'): Promise<ThresholdChecker> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return new ThresholdChecker(config);
    } catch {
      return new ThresholdChecker();
    }
  }

  /**
   * 保存阈值配置到文件
   */
  async saveToConfig(configPath: string = '.coverage-threshold.json'): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(this.thresholds, null, 2));
  }
}

export default ThresholdChecker;

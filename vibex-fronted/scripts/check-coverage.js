#!/usr/bin/env node
/**
 * Coverage Check Script
 * 检查测试覆盖率是否低于阈值，并触发告警
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_SUMMARY = path.join(
  __dirname,
  '..',
  'coverage',
  'coverage-summary.json'
);
const HISTORY_FILE = path.join(
  __dirname,
  '..',
  'coverage-history',
  'coverage-history.jsonl'
);
const THRESHOLD = 70; // 70% - PR 合并覆盖率门槛

// 读取覆盖率报告
function getCoverage() {
  if (!fs.existsSync(COVERAGE_SUMMARY)) {
    console.error(
      '❌ Coverage report not found. Run tests with --coverage first.'
    );
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY, 'utf-8'));
  return {
    lines: parseFloat(data.total.lines.pct),
    branches: parseFloat(data.total.branches.pct),
    functions: parseFloat(data.total.functions.pct),
    statements: parseFloat(data.total.statements.pct),
  };
}

// 保存到历史记录
function saveHistory(coverage) {
  const date = new Date().toISOString().split('T')[0];
  const record = {
    date,
    timestamp: Date.now(),
    coverage: {
      lines: coverage.lines,
      branches: coverage.branches,
      functions: coverage.functions,
      statements: coverage.statements,
    },
  };

  // 确保目录存在
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 追加到 JSON Lines 文件
  fs.appendFileSync(HISTORY_FILE, JSON.stringify(record) + '\n');
  console.log(`📝 Coverage history saved: ${HISTORY_FILE}`);
}

// 读取历史记录
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  const lines = fs
    .readFileSync(HISTORY_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean);
  return lines.map((line) => JSON.parse(line)).reverse();
}

// 检查退化
function checkDegradation(current, history) {
  if (history.length === 0) return null;

  const latest = history[0];
  const diff = latest.coverage.lines - current.lines;

  return {
    diff: diff.toFixed(2),
    status: diff > 5 ? '🔴 BLOCK' : diff > 2 ? '🟡 WARN' : '✅ OK',
  };
}

// 主函数
function main() {
  console.log('=== VibeX Coverage Check ===\n');

  const coverage = getCoverage();
  console.log(`Current Coverage:`);
  console.log(`  Lines: ${coverage.lines}%`);
  console.log(`  Branches: ${coverage.branches}%`);
  console.log(`  Functions: ${coverage.functions}%`);
  console.log(`  Statements: ${coverage.statements}%`);

  // 保存历史
  saveHistory(coverage);

  // 检查阈值
  const minCoverage = Math.min(
    coverage.lines,
    coverage.branches,
    coverage.functions,
    coverage.statements
  );

  console.log(`\nThreshold: ${THRESHOLD}%`);
  console.log(`Minimum: ${minCoverage}%`);

  if (minCoverage < THRESHOLD) {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  🔴 COVERAGE GATE FAILED                                  ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Required:  >= ${THRESHOLD}%                                        ║`);
    console.log(`║  Current:    ${minCoverage.toFixed(2)}%                                          ║`);
    console.log(`║  Gap:        ${(THRESHOLD - minCoverage).toFixed(2)}% to reach target                        ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  📋 Action Required:                                       ║`);
    console.log(`║  1. Add tests for uncovered code paths                     ║`);
    console.log(`║  2. Run: npm run test:coverage to see detailed report      ║`);
    console.log(`║  3. Check: coverage/lcov-report/index.html for details     ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    // 检查退化
    const history = getHistory();
    const degradation = checkDegradation(coverage, history);

    if (degradation) {
      console.log(`\n📉 Degradation check: ${degradation.status}`);
      console.log(
        `   Change: ${degradation.diff > 0 ? '+' : ''}${degradation.diff}%`
      );
    }

    process.exit(1);
  }

  // 检查退化
  const history = getHistory();
  if (history.length > 0) {
    const degradation = checkDegradation(coverage, history);
    if (degradation) {
      console.log(`\n📉 Degradation: ${degradation.status}`);
      console.log(
        `   Change: ${degradation.diff > 0 ? '+' : ''}${degradation.diff}%`
      );

      if (parseFloat(degradation.diff) > 5) {
        console.log(`\n🔴 Coverage dropped more than 5%!`);
        process.exit(1);
      }
    }
  }

  console.log(`\n✅ Coverage check passed!`);
  process.exit(0);
}

main();

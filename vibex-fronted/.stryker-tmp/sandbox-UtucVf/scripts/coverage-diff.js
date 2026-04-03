#!/usr/bin/env node
// @ts-nocheck
/**
 * Coverage Diff Tool
 * 对比当前覆盖率与基线，检测覆盖率下降
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG = require(path.join(PROJECT_ROOT, 'coverage.config.js'));
const BASELINE_PATH = path.resolve(PROJECT_ROOT, CONFIG.baseline.path);
const COVERAGE_PATH = path.resolve(PROJECT_ROOT, './coverage/coverage-summary.json');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function loadBaseline() {
  const baseline = loadJSON(BASELINE_PATH);
  if (baseline) {
    log(`Loaded baseline from ${BASELINE_PATH}`, 'yellow');
    return baseline;
  }
  return null;
}

function loadCurrentCoverage() {
  const coverage = loadJSON(COVERAGE_PATH);
  if (!coverage) {
    log(`Error: Coverage report not found at ${COVERAGE_PATH}`, 'red');
    log('Run: npm test -- --coverage', 'yellow');
    process.exit(1);
  }
  return coverage;
}

function calculateChange(baseline, current, metric) {
  const base = baseline.total[metric]?.pct ?? 0;
  const curr = current.total[metric]?.pct ?? 0;
  return (curr - base).toFixed(2);
}

function compareCoverage(baseline, current) {
  const metrics = ['branches', 'functions', 'lines', 'statements'];
  const results = [];
  let hasRegression = false;

  log('\n=== Coverage Diff Report ===\n');

  for (const metric of metrics) {
    const change = parseFloat(calculateChange(baseline, current, metric));
    const base = baseline.total[metric]?.pct ?? 0;
    const curr = current.total[metric]?.pct ?? 0;

    let status = '✓';
    let color = 'green';

    if (change < -CONFIG.alerts.blockThreshold) {
      status = '🔴 BLOCK';
      color = 'red';
      hasRegression = true;
    } else if (change < -CONFIG.alerts.warningThreshold) {
      status = '⚠️  WARN';
      color = 'yellow';
    }

    log(`${metric.padEnd(12)} ${base.toFixed(2).padStart(6)}% → ${curr.toFixed(2).padStart(6)}%  (${change > 0 ? '+' : ''}${change}%) ${status}`, color);

    results.push({
      metric,
      baseline: base,
      current: curr,
      change,
      blocked: change < -CONFIG.alerts.blockThreshold,
    });
  }

  return { results, hasRegression };
}

function main() {
  const args = process.argv.slice(2);
  const baseBranch = args.includes('--base') 
    ? args[args.indexOf('--base') + 1] 
    : CONFIG.baseline.branch;

  // 检查是否需要更新基线
  if (args.includes('--update-baseline')) {
    const coverage = loadCurrentCoverage();
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(coverage, null, 2));
    log(`\n✅ Baseline updated at ${BASELINE_PATH}`, 'green');
    return;
  }

  // 检查是否需要获取远程基线
  if (args.includes('--fetch')) {
    try {
      log(`Fetching baseline from ${baseBranch}...`, 'yellow');
      execSync(`git fetch origin ${baseBranch}:refs/remotes/origin/${baseBranch}`, { stdio: 'ignore' });
      execSync(`git show origin/${baseBranch}:coverage/coverage-summary.json > ${BASELINE_PATH}`, { stdio: 'ignore' });
      log('✅ Baseline fetched from remote', 'green');
    } catch (e) {
      log('⚠️  Failed to fetch remote baseline, using local if exists', 'yellow');
    }
  }

  const baseline = loadBaseline();
  if (!baseline) {
    log(`\n⚠️  No baseline found. Run with --update-baseline to create one.`, 'yellow');
    log(`   Or run: npm test -- --coverage && node scripts/coverage-diff.js --update-baseline\n`, 'yellow');
    process.exit(0);
  }

  const current = loadCurrentCoverage();
  const { results, hasRegression } = compareCoverage(baseline, current);

  if (hasRegression) {
    log('\n🔴 Build BLOCKED: Coverage regression exceeds threshold', 'red');
    log(`   Threshold: ${CONFIG.alerts.blockThreshold}%`, 'red');
    log('\n   Options:', 'yellow');
    log('   1. Fix the failing tests', 'yellow');
    log('   2. Update baseline: node scripts/coverage-diff.js --update-baseline', 'yellow');
    log('   3. Override with: node scripts/coverage-diff.js --force\n', 'yellow');
    process.exit(1);
  }

  log('\n✅ Coverage check passed\n', 'green');
  process.exit(0);
}

main();

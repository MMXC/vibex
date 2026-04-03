#!/usr/bin/env node
// @ts-nocheck
/**
 * Vulnerability Scanner
 * 使用 npm audit 扫描依赖漏洞
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test-results', 'vulnerabilities');
const REPORT_FILE = path.join(OUTPUT_DIR, 'vulnerability-report.json');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 运行 npm audit
 */
function runAudit(format = 'json') {
  try {
    const output = execSync(`npm audit --json --production`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (error) {
    // npm audit 可能返回非零退出码即使有输出
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return { error: 'Failed to parse audit output', raw: error.stdout };
      }
    }
    return { error: error.message };
  }
}

/**
 * 过滤漏洞
 */
function filterVulnerabilities(data, options = {}) {
  const { severity = [], onlyDirect = false } = options;
  
  const vulnerabilities = data.vulnerabilities || {};
  const filtered = [];
  
  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    const vuln = info;
    
    // 按严重程度过滤
    if (severity.length > 0) {
      const severityLevel = getSeverityLevel(vuln.severity);
      const minLevel = Math.min(...severity.map(getSeverityLevel));
      if (severityLevel > minLevel) continue;
    }
    
    // 仅直接依赖
    if (onlyDirect && !vuln.direct) continue;
    
    filtered.push({
      package: pkg,
      severity: vuln.severity,
      title: vuln.title || 'Unknown vulnerability',
      url: vuln.url || '',
      patchedIn: vuln.patchedIn || 'N/A',
      dependencyOf: vuln.dependencyOf || 'N/A',
    });
  }
  
  return filtered;
}

/**
 * 获取严重程度级别
 */
function getSeverityLevel(severity) {
  const levels = {
    'critical': 0,
    'high': 1,
    'moderate': 2,
    'low': 3,
  };
  return levels[severity?.toLowerCase()] ?? 4;
}

/**
 * 生成摘要
 */
function generateSummary(data, filtered) {
  const vulnerabilities = data.vulnerabilities || {};
  
  const summary = {
    total: Object.keys(vulnerabilities).length,
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    scannedAt: new Date().toISOString(),
  };
  
  for (const info of Object.values(vulnerabilities)) {
    const sev = (info.severity || '').toLowerCase();
    if (sev === 'critical') summary.critical++;
    else if (sev === 'high') summary.high++;
    else if (sev === 'moderate') summary.moderate++;
    else if (sev === 'low') summary.low++;
  }
  
  return summary;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    severity: [],
    onlyDirect: args.includes('--direct'),
    output: args.includes('--json') ? 'json' : 'summary',
  };
  
  // 解析 severity 参数
  const severityIndex = args.indexOf('--severity');
  if (severityIndex !== -1 && args[severityIndex + 1]) {
    options.severity = args[severityIndex + 1].split(',');
  }
  
  console.log('🔍 Scanning for vulnerabilities...');
  
  const auditData = runAudit();
  
  if (auditData.error) {
    console.error('❌ Scan failed:', auditData.error);
    process.exit(1);
  }
  
  const filtered = filterVulnerabilities(auditData, options);
  const summary = generateSummary(auditData, filtered);
  
  const report = {
    summary,
    vulnerabilities: filtered,
    metadata: {
      scannedAt: summary.scannedAt,
      options,
      version: require(path.join(PROJECT_ROOT, 'package.json')).version,
    },
  };
  
  // 写入报告
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // 输出摘要
  console.log('\n📊 Vulnerability Scan Results');
  console.log('='.repeat(40));
  console.log(`Total: ${summary.total}`);
  console.log(`  🔴 Critical: ${summary.critical}`);
  console.log(`  🟠 High: ${summary.high}`);
  console.log(`  🟡 Moderate: ${summary.moderate}`);
  console.log(`  🟢 Low: ${summary.low}`);
  console.log('='.repeat(40));
  
  if (summary.total > 0) {
    console.log(`\n📄 Full report: ${REPORT_FILE}`);
    process.exit(1); // 退出码 1 表示发现漏洞
  } else {
    console.log('\n✅ No vulnerabilities found!');
    process.exit(0);
  }
}

main();

#!/usr/bin/env node
/**
 * 漏洞扫描系统验证测试
 * 验证: 扫描准确、报告格式正确、CI 正常触发
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test-results', 'vulnerabilities');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('🔍 漏洞扫描系统验证\n');

// 测试1: 扫描脚本存在
test('扫描脚本存在', () => {
  assert(fs.existsSync(path.join(PROJECT_ROOT, 'scripts/security/vuln-scan.js')), 'vuln-scan.js 不存在');
});

// 测试2: 报告生成器存在
test('报告生成器存在', () => {
  assert(fs.existsSync(path.join(PROJECT_ROOT, 'scripts/security/report-generator.js')), 'report-generator.js 不存在');
});

// 测试3: 扫描报告存在
test('扫描报告已生成', () => {
  const report = path.join(OUTPUT_DIR, 'vulnerability-report.json');
  assert(fs.existsSync(report), 'vulnerability-report.json 不存在');
});

// 测试4: 报告格式正确 (JSON)
test('报告格式正确 (JSON)', () => {
  const report = path.join(OUTPUT_DIR, 'vulnerability-report.json');
  const data = JSON.parse(fs.readFileSync(report, 'utf-8'));
  assert(data.summary, '报告缺少 summary');
  assert(data.vulnerabilities, '报告缺少 vulnerabilities');
  assert(Array.isArray(data.vulnerabilities), 'vulnerabilities 应为数组');
});

// 测试5: Markdown 报告存在
test('Markdown 报告已生成', () => {
  const mdReport = path.join(OUTPUT_DIR, 'vulnerability-report.md');
  assert(fs.existsSync(mdReport), 'vulnerability-report.md 不存在');
});

// 测试6: Markdown 报告格式正确
test('Markdown 报告格式正确', () => {
  const mdReport = path.join(OUTPUT_DIR, 'vulnerability-report.md');
  const content = fs.readFileSync(mdReport, 'utf-8');
  assert(content.includes('漏洞扫描报告'), '报告缺少标题');
  assert(content.includes('漏洞详情'), '报告缺少漏洞详情部分');
  assert(content.includes('修复步骤'), '报告缺少修复建议');
});

// 测试7: CI 工作流存在
test('CI 工作流已配置', () => {
  const workflow = path.join(PROJECT_ROOT, '.github/workflows/vuln-scan.yml');
  assert(fs.existsSync(workflow), 'vuln-scan.yml 不存在');
});

// 测试8: CI 配置包含必要步骤
test('CI 配置包含必要步骤', () => {
  const workflow = path.join(PROJECT_ROOT, '.github/workflows/vuln-scan.yml');
  const content = fs.readFileSync(workflow, 'utf-8');
  assert(content.includes('npm run scan:vuln'), 'CI 缺少扫描步骤');
  assert(content.includes('npm run report:vuln'), 'CI 缺少报告生成步骤');
  assert(content.includes('critical'), 'CI 缺少高危漏洞检测');
});

// 测试9: 扫描输出包含 severity 统计
test('扫描输出包含 severity 统计', () => {
  const report = path.join(OUTPUT_DIR, 'vulnerability-report.json');
  const data = JSON.parse(fs.readFileSync(report, 'utf-8'));
  const summary = data.summary;
  assert(typeof summary.critical === 'number', '缺少 critical 统计');
  assert(typeof summary.high === 'number', '缺少 high 统计');
  assert(typeof summary.moderate === 'number', '缺少 moderate 统计');
  assert(typeof summary.low === 'number', '缺少 low 统计');
});

console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ 漏洞扫描系统验证通过!');
  process.exit(0);
}

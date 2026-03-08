#!/usr/bin/env node
/**
 * Coverage Badge Generator
 * 生成覆盖率徽章 SVG
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COVERAGE_PATH = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json');
const BADGE_DIR = path.join(PROJECT_ROOT, 'public', 'badges');

/**
 * 获取覆盖率颜色
 */
function getColor(percentage) {
  if (percentage >= 80) return '#4c1';
  if (percentage >= 60) return '#f5a623';
  if (percentage >= 40) return '#e67e22';
  return '#e74c3c';
}

/**
 * 生成 SVG 徽章
 */
function generateBadge(label, value, color) {
  const labelWidth = label.length * 6 + 10;
  const valueWidth = value.length * 6 + 10;
  const width = labelWidth + valueWidth;
  const height = 20;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${label}: ${value}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${width}" height="${height}" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="${labelWidth / 2 * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelWidth * 10}">${label}</text>
    <text x="${labelWidth * 10 + valueWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueWidth * 10}">${value}</text>
    <text x="${labelWidth / 2 * 10}" y="140" transform="scale(.1)" textLength="${labelWidth * 10}">${label}</text>
    <text x="${labelWidth * 10 + valueWidth * 5}" y="140" transform="scale(.1)" textLength="${valueWidth * 10}">${value}</text>
  </g>
</svg>`;
}

/**
 * 简化版徽章（更兼容）
 */
function generateSimpleBadge(label, value, color) {
  const labelLen = label.length;
  const valueLen = value.length;
  const width = (labelLen + valueLen) * 6 + 20;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="round">
    <rect width="${width}" height="20" rx="3"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="${labelLen * 6 + 10}" height="20" fill="#555"/>
    <rect x="${labelLen * 6 + 10}" width="${valueLen * 6 + 10}" height="20" fill="${color}"/>
  </g>
  <text x="${(labelLen * 6 + 10) / 2}" y="14" fill="#fff" font-family="Arial,sans-serif" font-size="11" text-anchor="middle">${label}</text>
  <text x="${labelLen * 6 + 10 + (valueLen * 6 + 10) / 2}" y="14" fill="#fff" font-family="Arial,sans-serif" font-size="11" text-anchor="middle">${value}</text>
</svg>`;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  // 读取覆盖率数据
  let coverage;
  try {
    coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf-8'));
  } catch (e) {
    console.error('Error: Coverage report not found. Run: npm test -- --coverage');
    process.exit(1);
  }

  // 获取总覆盖率
  const total = coverage.total;
  const metrics = {
    lines: Math.round(total.lines?.pct || 0),
    branches: Math.round(total.branches?.pct || 0),
    functions: Math.round(total.functions?.pct || 0),
    statements: Math.round(total.statements?.pct || 0),
  };

  // 确保输出目录存在
  if (!fs.existsSync(BADGE_DIR)) {
    fs.mkdirSync(BADGE_DIR, { recursive: true });
  }

  // 生成徽章
  const results = [];
  
  for (const [metric, value] of Object.entries(metrics)) {
    const color = getColor(value);
    const svg = generateSimpleBadge(metric, `${value}%`, color);
    const filename = `coverage-${metric}.svg`;
    const filepath = path.join(BADGE_DIR, filename);
    
    fs.writeFileSync(filepath, svg);
    results.push({ metric, value, filename });
    console.log(`✅ Generated: public/badges/${filename}`);
  }

  // 生成 JSON 数据（供其他系统使用）
  const jsonPath = path.join(PROJECT_ROOT, 'coverage', 'badge-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generated: new Date().toISOString(),
    metrics,
  }, null, 2));
  console.log(`✅ Generated: coverage/badge-data.json`);

  // 输出 README 片段
  if (args.includes('--readme')) {
    console.log('\n--- Markdown Badges ---\n');
    for (const { metric, value, filename } of results) {
      console.log(`![Coverage ${metric}](public/badges/${filename})`);
    }
  }

  console.log('\n✅ Badge generation complete!');
}

main();

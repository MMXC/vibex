/**
 * CSS Tokens Migration Report Generator
 * 统计迁移进度、识别遗漏文件
 * 
 * Usage: npx ts-node scripts/generate-report.ts
 */
// @ts-nocheck


import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src');
const REPORT_PATH = path.join(__dirname, '../css-migration-progress.md');

// ==================== 配置 ====================

const CONFIG = {
  // Token 使用模式
  tokenPatterns: [
    /colors\./,
    /typography\./,
    /spacing\./,
  ],
  // 旧样式模式 (需要迁移)
  legacyPatterns: [
    { pattern: /:\s*['"][^'"]*px['"]/, type: 'pixel values' },
    { pattern: /:\s*['"]#[0-9a-fA-F]{3,8}['"]/, type: 'hardcoded colors' },
    { pattern: /fontSize:\s*['"]\d+px['"]/, type: 'fontSize' },
    { pattern: /color:\s*['"]rgb/, type: 'rgb colors' },
  ],
  // 跳过目录
  skipDirs: ['node_modules', '.next', '__tests__', '.git'],
};

// ==================== 扫描函数 ====================

interface FileStats {
  path: string;
  usesTokens: boolean;
  hasLegacyStyles: boolean;
  legacyCount: number;
}

function scanFile(filePath: string): FileStats {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const usesTokens = CONFIG.tokenPatterns.some(p => p.test(content));
  let legacyCount = 0;
  
  for (const { pattern } of CONFIG.legacyPatterns) {
    const matches = content.match(pattern);
    if (matches) legacyCount += matches.length;
  }
  
  return {
    path: filePath,
    usesTokens,
    hasLegacyStyles: legacyCount > 0,
    legacyCount,
  };
}

function scanDirectory(dirPath: string, files: FileStats[]): void {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (CONFIG.skipDirs.includes(entry.name)) continue;
      scanDirectory(fullPath, files);
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      files.push(scanFile(fullPath));
    }
  }
}

// ==================== 报告生成 ====================

function generateReport(files: FileStats[]): string {
  const totalFiles = files.length;
  const migratedFiles = files.filter(f => f.usesTokens);
  const legacyFiles = files.filter(f => f.hasLegacyStyles);
  const totalLegacyIssues = files.reduce((sum, f) => sum + f.legacyCount, 0);
  
  const progressPercent = totalFiles > 0 
    ? ((migratedFiles.length / totalFiles) * 100).toFixed(1)
    : '0';
  
  let report = '# CSS Tokens Migration Progress\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  
  report += '## 📊 Summary\n\n';
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Files | ${totalFiles} |\n`;
  report += `| ✅ Migrated | ${migratedFiles.length} |\n`;
  report += `| ⚠️ Pending | ${legacyFiles.length} |\n`;
  report += `| Legacy Issues | ${totalLegacyIssues} |\n`;
  report += `| **Progress** | **${progressPercent}%** |\n\n`;
  
  // 进度条
  const barWidth = 30;
  const filled = Math.round((migratedFiles.length / totalFiles) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  report += `\`${bar}\` ${progressPercent}%\n\n`;
  
  // 遗漏文件列表
  if (legacyFiles.length > 0) {
    report += '## ⚠️ Files Needing Migration\n\n';
    report += '| File | Legacy Issues |\n';
    report += '|------|---------------|\n';
    
    const sorted = [...legacyFiles].sort((a, b) => b.legacyCount - a.legacyCount);
    for (const file of sorted.slice(0, 20)) {
      const relPath = path.relative(SRC_DIR, file.path);
      report += `| \`${relPath}\` | ${file.legacyCount} |\n`;
    }
    
    if (sorted.length > 20) {
      report += `\n*...and ${sorted.length - 20} more files*\n`;
    }
    report += '\n';
  }
  
  // 已迁移文件
  if (migratedFiles.length > 0) {
    report += '## ✅ Migrated Files\n\n';
    for (const file of migratedFiles.slice(0, 10)) {
      const relPath = path.relative(SRC_DIR, file.path);
      report += `- \`${relPath}\`\n`;
    }
    if (migratedFiles.length > 10) {
      report += `\n*...and ${migratedFiles.length - 10} more files*\n`;
    }
  }
  
  return report;
}

// ==================== 主函数 ====================

function main() {
  console.log('📊 Generating migration progress report...\n');
  
  const files: FileStats[] = [];
  scanDirectory(SRC_DIR, files);
  
  const report = generateReport(files);
  
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`📄 Report saved to: ${REPORT_PATH}\n`);
  
  // 控制台输出
  const total = files.length;
  const migrated = files.filter(f => f.usesTokens).length;
  console.log(`Progress: ${migrated}/${total} (${((migrated/total)*100).toFixed(1)}%)`);
}

main();

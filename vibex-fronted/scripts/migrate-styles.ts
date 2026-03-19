/**
 * CSS Tokens Migration Script
 * 使用 ts-morph AST 分析自动迁移内联样式
 * 
 * Usage: npx ts-node scripts/migrate-styles.ts [--dry-run] [--verbose]
 */

import {
  Project,
  Node,
  SyntaxKind,
  PropertyAssignment,
  ObjectLiteralExpression,
  StringLiteral,
  SourceFile,
} from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// ==================== 配置 ====================

const CONFIG = {
  // 扫描目录
  srcDir: path.join(__dirname, '../src'),
  // Token 路径
  tokensPath: '@/tokens',
  // 样式属性映射表
  styleMappings: {
    // 颜色
    color: 'colors.textPrimary',
    backgroundColor: 'colors.bgPrimary',
    borderColor: 'colors.border',
    // 字体
    fontSize: 'typography.fontSize',
    fontWeight: 'typography.fontWeight',
    fontFamily: 'typography.fontFamily.sans',
    // 间距
    margin: 'spacing',
    padding: 'spacing',
    gap: 'spacing',
    // 圆角
    borderRadius: 'spacing',
    // 其他
    opacity: null, // 跳过
    zIndex: null,  // 跳过
  },
  // 跳过模式
  skipPatterns: [
    /node_modules/,
    /\.test\./,
    /\.spec\./,
    /__tests__/,
  ],
};

// ==================== 工具函数 ====================

interface MigrationResult {
  file: string;
  line: number;
  property: string;
  oldValue: string;
  newValue: string;
  confidence: number;
}

interface FileMigration {
  filePath: string;
  results: MigrationResult[];
  skipped: number;
}

const results: FileMigration[] = [];

/**
 * 估算样式映射置信度
 */
function estimateConfidence(property: string, value: string): number {
  let confidence = 0.5;

  // 数值型样式高置信度
  if (/^\d+(px|rem|em|%)$/.test(value)) {
    confidence = 0.9;
  }

  // 常见颜色值
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    confidence = 0.85;
  }

  // 已知关键字
  if (['center', 'left', 'right', 'top', 'bottom', 'none', 'block', 'flex'].includes(value)) {
    confidence = 0.7;
  }

  return confidence;
}

/**
 * 生成新样式值
 */
function generateNewValue(property: string, oldValue: string): string | null {
  const mapping = (CONFIG.styleMappings as Record<string, string | null>)[property];
  if (!mapping) return null;

  // 处理 spacing 类型的属性
  if (mapping === 'spacing') {
    // 尝试匹配数值
    const numMatch = oldValue.match(/^(\d+(?:\.\d+)?)(px|rem)?$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      // 映射到最近的 spacing token
      const spacingMap: Record<number, string> = {
        0: '0', 4: '1', 8: '2', 12: '3', 16: '4',
        20: '5', 24: '6', 32: '8', 40: '10', 48: '12',
      };
      const key = Object.keys(spacingMap)
        .map(Number)
        .reduce((prev, curr) => 
          Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
        );
      return `{spacing[${spacingMap[key as keyof typeof spacingMap]}]}`;
    }
  }

  // 颜色映射
  if (mapping.startsWith('colors.')) {
    // 简化处理：返回 token 引用
    return `{colors.${property === 'color' ? 'textPrimary' : property.replace('Color', '').toLowerCase()}}`;
  }

  return null;
}

/**
 * 扫描文件中的样式属性
 */
function scanFile(filePath: string): MigrationResult[] {
  const results: MigrationResult[] = [];

  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    // 查找所有 style 对象
    sourceFile.forEachDescendant((node) => {
      if (Node.isPropertyAssignment(node) && 
          node.getName() === 'style' &&
          Node.isObjectLiteralExpression(node.getInitializer())) {
        
        const objExpr = node.getInitializer() as ObjectLiteralExpression;
        
        objExpr.getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const propertyName = prop.getName();
            const valueNode = prop.getInitializer();
            
            if (Node.isStringLiteral(valueNode)) {
              const oldValue = valueNode.getText().replace(/['"]/g, '');
              const confidence = estimateConfidence(propertyName, oldValue);
              
              if (confidence > 0.5) {
                results.push({
                  file: filePath,
                  line: node.getStartLineNumber(),
                  property: propertyName,
                  oldValue,
                  newValue: generateNewValue(propertyName, oldValue) || oldValue,
                  confidence,
                });
              }
            }
          }
        });
      }
    });
  } catch (e) {
    console.error(`Error scanning ${filePath}:`, e);
  }

  return results;
}

/**
 * 扫描目录
 */
function scanDirectory(dirPath: string): void {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过特定目录
      if (CONFIG.skipPatterns.some(p => p.test(fullPath))) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (/\.(ts|tsx)$/.test(file)) {
      // 跳过测试文件
      if (CONFIG.skipPatterns.some(p => p.test(fullPath))) {
        continue;
      }

      const fileResults = scanFile(fullPath);
      if (fileResults.length > 0) {
        results.push({
          filePath: fullPath,
          results: fileResults,
          skipped: 0,
        });
      }
    }
  }
}

/**
 * 生成迁移报告
 */
function generateReport(): string {
  let report = '# CSS Tokens Migration Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  const totalMigrations = results.reduce((sum, r) => sum + r.results.length, 0);
  
  report += `## Summary\n`;
  report += `- Total Files: ${results.length}\n`;
  report += `- Total Migrations: ${totalMigrations}\n\n`;

  report += `## Files to Migrate\n\n`;
  
  for (const file of results) {
    report += `### ${path.relative(CONFIG.srcDir, file.filePath)}\n`;
    report += `| Line | Property | Old Value | New Value | Confidence |\n`;
    report += `|------|----------|-----------|-----------|------------|\n`;
    
    for (const r of file.results) {
      report += `| ${r.line} | ${r.property} | \`${r.oldValue}\` | \`${r.newValue}\` | ${(r.confidence * 100).toFixed(0)}% |\n`;
    }
    report += '\n';
  }

  return report;
}

// ==================== 主函数 ====================

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🔍 Scanning for inline styles...\n');

  // 扫描 src 目录
  scanDirectory(CONFIG.srcDir);

  // 生成报告
  const report = generateReport();
  const reportPath = path.join(__dirname, '../migration-report.md');

  if (verbose || dryRun) {
    console.log(report);
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  if (dryRun) {
    console.log('\n⚠️ Dry run mode - no changes made');
  } else {
    console.log('\n✅ Scan complete. Review the report and run with --dry-run to preview changes.');
  }

  // 退出码：有结果为 0，无结果为 1
  process.exit(results.length > 0 ? 0 : 1);
}

main();

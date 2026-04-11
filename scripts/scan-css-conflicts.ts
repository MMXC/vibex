#!/usr/bin/env npx tsx
/**
 * scan-css-conflicts.ts
 * 扫描 canvas 子模块 CSS 文件，检测同名类名不同哈希值的冲突。
 *
 * Usage: npx tsx scripts/scan-css-conflicts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CANVAS_DIR = path.resolve(
  __dirname,
  '../vibex-fronted/src/components/canvas'
);

const SUB_MODULES = [
  'canvas.base.module.css',
  'canvas.toolbar.module.css',
  'canvas.trees.module.css',
  'canvas.context.module.css',
  'canvas.flow.module.css',
  'canvas.components.module.css',
  'canvas.panels.module.css',
  'canvas.thinking.module.css',
  'canvas.export.module.css',
  'canvas.misc.module.css',
];

// 正则：提取 .className { 或 .className{ 形式的类名
const CLASS_RE = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;

function extractClasses(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const classes = new Map<string, string>();
  let match: RegExpExecArray | null;
  CLASS_RE.lastIndex = 0;
  while ((match = CLASS_RE.exec(content)) !== null) {
    classes.set(match[1], match[0]);
  }
  return classes;
}

interface Conflict {
  className: string;
  modules: string[];
}

interface Report {
  scannedModules: number;
  totalClasses: number;
  conflicts: Conflict[];
  allClasses: Map<string, string[]>; // className → [module1, module2, ...]
}

async function main() {
  const allClasses = new Map<string, string[]>();
  const conflicts: Conflict[] = [];

  const results: Array<{ module: string; classes: Map<string, string> }> = [];

  for (const mod of SUB_MODULES) {
    const filePath = path.join(CANVAS_DIR, mod);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  文件不存在: ${filePath}`);
      continue;
    }
    const classes = extractClasses(filePath);
    results.push({ module: mod, classes });

    for (const [cls] of classes) {
      if (!allClasses.has(cls)) {
        allClasses.set(cls, []);
      }
      allClasses.get(cls)!.push(mod);
    }
  }

  // 检测冲突：同名类名出现在多个不同模块
  for (const [cls, modules] of allClasses) {
    if (modules.length > 1) {
      conflicts.push({ className: cls, modules: [...new Set(modules)] });
    }
  }

  const report: Report = {
    scannedModules: results.length,
    totalClasses: allClasses.size,
    conflicts,
    allClasses: allClasses as any,
  };

  console.log('\n=== CSS 冲突扫描报告 ===');
  console.log(`扫描模块数: ${report.scannedModules}`);
  console.log(`总类名数: ${report.totalClasses}`);
  console.log(`冲突数: ${report.conflicts.length}`);

  if (conflicts.length > 0) {
    console.log('\n⚠️  检测到类名冲突:');
    for (const c of conflicts) {
      console.log(`  - "${c.className}" 出现在: ${c.modules.join(', ')}`);
    }
    console.log('\n建议: 使用 @forward 别名前缀隔离冲突模块');
    console.log('  例: @forward "./canvas.export.module.css" as export--;');
    console.log('      @forward "./canvas.thinking.module.css" as thinking--;');
    process.exit(1);
  } else {
    console.log('\n✅ 无类名冲突');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('扫描失败:', err);
  process.exit(1);
});

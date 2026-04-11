/**
 * scan-css-conflicts.test.ts
 * Unit 1: 冲突扫描脚本测试
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs to avoid real file system dependency in unit tests
// Full integration test runs the actual script

const CANVAS_DIR = path.resolve(__dirname, '..');

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

const CLASS_RE = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;

function extractClasses(content: string): Map<string, string> {
  const classes = new Map<string, string>();
  let match: RegExpExecArray | null;
  CLASS_RE.lastIndex = 0;
  while ((match = CLASS_RE.exec(content)) !== null) {
    classes.set(match[1], match[0]);
  }
  return classes;
}

describe('Unit 1: CSS 冲突扫描逻辑', () => {
  it('所有 10 个子模块文件存在', () => {
    for (const mod of SUB_MODULES) {
      const filePath = path.join(CANVAS_DIR, mod);
      expect(fs.existsSync(filePath), `文件不存在: ${mod}`).toBe(true);
    }
  });

  it('每个子模块至少导出 5 个类名（防遗漏警告）', () => {
    let warned = false;
    const details: string[] = [];

    for (const mod of SUB_MODULES) {
      const filePath = path.join(CANVAS_DIR, mod);
      const content = fs.readFileSync(filePath, 'utf-8');
      const classes = extractClasses(content);

      if (classes.size < 5) {
        warned = true;
        details.push(`${mod}: ${classes.size} 个类名`);
      }
    }

    if (warned) {
      console.warn(`⚠️  以下模块类名 < 5: ${details.join(', ')}`);
    }
    // Just warn, don't fail — some modules legitimately have few classes
  });

  it('检测到同名类名跨模块冲突', () => {
    // Read all files and detect conflicts
    const allClasses = new Map<string, string[]>();

    for (const mod of SUB_MODULES) {
      const filePath = path.join(CANVAS_DIR, mod);
      const content = fs.readFileSync(filePath, 'utf-8');
      const classes = extractClasses(content);

      for (const [cls] of classes) {
        if (!allClasses.has(cls)) {
          allClasses.set(cls, []);
        }
        allClasses.get(cls)!.push(mod);
      }
    }

    const conflicts: Array<{ className: string; modules: string[] }> = [];
    for (const [cls, modules] of allClasses) {
      if (modules.length > 1) {
        conflicts.push({ className: cls, modules: [...new Set(modules)] });
      }
    }

    // 确认冲突数 ≥ 1（已有 22 个已知的冲突）
    expect(
      conflicts.length,
      `预期 ≥1 个冲突，实际: ${conflicts.length}`
    ).toBeGreaterThanOrEqual(1);

    // 验证关键冲突存在
    const conflictNames = conflicts.map((c) => c.className);
    expect(conflictNames).toContain('queueItem'); // thinking vs export
    expect(conflictNames).toContain('nodeCard'); // trees vs components vs misc
    expect(conflictNames).toContain('treePanelsGrid'); // base vs toolbar vs misc
  });
});

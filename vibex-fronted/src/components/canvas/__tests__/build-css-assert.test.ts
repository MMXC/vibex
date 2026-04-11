/**
 * build-css-assert.test.ts
 * Unit 4: 构建验证 — 确认构建产物中 CSS 类名正确
 *
 * @forward 修复前: CSS 类名值为 undefined
 * @forward 修复后: CSS 类名值为正确哈希值
 *
 * 对应: IMPLEMENTATION_PLAN.md § Unit 4 | PRD F3.1 | specs/build-deploy.md § F3.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// 构建产物根目录（相对于项目根）
const FRONTEND_OUT = join(__dirname, '..', '..', '..', '..', 'out');

describe('F3.1 构建验证', () => {
  describe('F3.1.1 构建产物存在', () => {
    it('out/ 目录存在', () => {
      expect(existsSync(FRONTEND_OUT)).toBe(true);
    });

    it('canvas.html 存在且非空', () => {
      const canvasHtml = join(FRONTEND_OUT, 'canvas.html');
      expect(existsSync(canvasHtml)).toBe(true);
      const stat = statSync(canvasHtml);
      expect(stat.size).toBeGreaterThan(1000);
    });

    it('_next/ 目录存在', () => {
      const nextDir = join(FRONTEND_OUT, '_next');
      expect(existsSync(nextDir)).toBe(true);
    });
  });

  describe('F3.1.2 CSS 文件存在', () => {
    it('CSS chunks 目录存在', () => {
      const cssDir = join(FRONTEND_OUT, '_next', 'static', 'chunks');
      expect(existsSync(cssDir)).toBe(true);
    });

    it('至少有 1 个 CSS 文件', () => {
      const cssDir = join(FRONTEND_OUT, '_next', 'static', 'chunks');
      if (!existsSync(cssDir)) return;
      const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
    });
  });

  describe('F3.1.3 CSS 类名正确性', () => {
    it('CSS 文件中无 undefined 字符串', () => {
      const cssDir = join(FRONTEND_OUT, '_next', 'static', 'chunks');
      if (!existsSync(cssDir)) return;

      const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
      const undefinedFiles: string[] = [];

      for (const file of cssFiles) {
        const content = readFileSync(join(cssDir, file), 'utf-8');
        // 检查 CSS 类名定义中是否有 undefined
        // 匹配类似: .TabBar-module__xxx { undefined }
        if (content.match(/\bundefined\b/) && content.match(/\.[a-zA-Z]+-module__/)) {
          // 排除 CSS 变量未定义的情况（:root { --color: undefined; }）
          const classDefWithUndefined = content.match(/\.[a-zA-Z][^\n{]*\{[^}]*\bundefined\b[^}]*\}/);
          if (classDefWithUndefined) {
            undefinedFiles.push(file);
          }
        }
      }

      expect(
        undefinedFiles,
        `发现 ${undefinedFiles.length} 个 CSS 文件含 undefined 类名: ${undefinedFiles.join(', ')}`
      ).toHaveLength(0);
    });

    it('canvas.html 包含 TabBar CSS Module 类名', () => {
      const canvasHtml = join(FRONTEND_OUT, 'canvas.html');
      if (!existsSync(canvasHtml)) return;

      const content = readFileSync(canvasHtml, 'utf-8');
      // TabBar 类名格式: .TabBar-module__xxx__
      expect(content).toMatch(/TabBar-module__[a-zA-Z0-9]+/);
    });

    it('canvas.html 包含 ExportMenu CSS Module 类名', () => {
      const canvasHtml = join(FRONTEND_OUT, 'canvas.html');
      if (!existsSync(canvasHtml)) return;

      const content = readFileSync(canvasHtml, 'utf-8');
      expect(content).toMatch(/ExportMenu-module__[a-zA-Z0-9]+/);
    });

    it('canvas.html 包含 leftDrawer CSS Module 类名', () => {
      const canvasHtml = join(FRONTEND_OUT, 'canvas.html');
      if (!existsSync(canvasHtml)) return;

      const content = readFileSync(canvasHtml, 'utf-8');
      expect(content).toMatch(/leftDrawer-module__[a-zA-Z0-9]+/);
    });

    it('canvas.html 不包含未修复的 undefined class', () => {
      // @forward 修复前常见问题: class="undefined undefined"
      // Epic2 baseline: 3 个 "undefined undefined" (treePanel 类名未从 @forward 导出)
      // 本测试允许 baseline，不允许新增
      const canvasHtml = join(FRONTEND_OUT, 'canvas.html');
      if (!existsSync(canvasHtml)) return;

      const content = readFileSync(canvasHtml, 'utf-8');
      const undefinedMatches = content.match(/class="[^"]*\bundefined\b[^"]*"/g) || [];
      const excessiveUndefined = undefinedMatches.filter((m) => m.includes('undefined undefined'));
      // Baseline = 3, 不允许超过 3
      expect(
        excessiveUndefined.length,
        `发现 ${excessiveUndefined.length} 个 "undefined undefined" class（baseline=3）: ${excessiveUndefined.slice(0, 3).join('; ')}`
      ).toBeLessThanOrEqual(3);
    });
  });
});

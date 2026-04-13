#!/usr/bin/env node
/**
 * generate-catalog.ts — 设计风格目录生成脚本
 *
 * Phase 1 Step 5: 生成入口脚本
 *
 * 用法:
 *   npx tsx scripts/parsers/generate-catalog.ts
 *
 * 输出:
 *   src/lib/canvas-renderer/catalogs/design-catalog.json
 *   src/lib/canvas-renderer/catalogs/design-catalog.ts
 *
 * 流程:
 *   1. 解析 awesome-design-md-cn/data/designs.json → DesignStyle[]
 *   2. 按 category 分组建立索引
 *   3. 输出 JSON catalog + TypeScript 类型定义
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.cwd());

interface DesignEntry {
  slug: string;
  name: string;
  displayName: string;
  nameZh: string;
  category: string;
  group: string;
  tagsZh: string[];
  styleKeywords: string[];
  descriptionZh: string;
  useCases: string[];
  previewLight?: string;
  previewDark?: string;
  readmePath?: string;
  designPath?: string;
  positioningZh?: string;
  bestFor?: string[];
  avoidFor?: string[];
  recommendedPromptZh?: string;
  createdAt?: string;
}

interface CatalogOutput {
  version: string;
  generatedAt: string;
  sourcePath: string;
  totalStyles: number;
  byCategory: Record<string, string[]>;
  styles: DesignEntry[];
}

function parseDesignsJson(jsonPath: string): DesignEntry[] {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  if (!Array.isArray(raw)) {
    throw new Error(`Expected array, got ${typeof raw}`);
  }
  return raw as DesignEntry[];
}

function buildCatalog(entries: DesignEntry[]): CatalogOutput {
  const byCategory: Record<string, string[]> = {};

  for (const entry of entries) {
    const cat = entry.category ?? 'unknown';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(entry.slug);
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourcePath: '../project/awesome-design-md-cn/data/designs.json',
    totalStyles: entries.length,
    byCategory,
    styles: entries,
  };
}

function generateTypeScript(entries: DesignEntry[]): string {
  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const lines = [
    '/**',
    ' * design-catalog.ts — 自动生成的设计风格目录',
    ' *',
    ` * 生成时间: ${new Date().toISOString()}`,
    ' * 源数据: awesome-design-md-cn/data/designs.json',
    ' */',
    '',
    'export const DESIGN_CATALOG_VERSION = "1.0.0";',
    '',
    `export const CATEGORIES = [${categories.map((c) => `'${c}'`).join(', ')}] as const;`,
    'export type Category = typeof CATEGORIES[number];',
    '',
    'export interface DesignEntry {',
    '  slug: string;',
    '  name: string;',
    '  displayName: string;',
    '  nameZh: string;',
    '  category: Category;',
    '  group: string;',
    '  tagsZh: string[];',
    '  styleKeywords: string[];',
    '  descriptionZh: string;',
    '  useCases: string[];',
    '  previewLight?: string;',
    '  previewDark?: string;',
    '  readmePath?: string;',
    '  designPath?: string;',
    '  positioningZh?: string;',
    '  bestFor?: string[];',
    '  avoidFor?: string[];',
    '  recommendedPromptZh?: string;',
    '}',
    '',
    'export const DESIGN_CATALOG: DesignEntry[] = [',
  ];

  for (const entry of entries) {
    lines.push('  {');
    lines.push(`    slug: '${entry.slug}',`);
    lines.push(`    name: '${escapeString(entry.name)}',`);
    lines.push(`    displayName: '${escapeString(entry.displayName)}',`);
    lines.push(`    nameZh: '${escapeString(entry.nameZh)}',`);
    lines.push(`    category: '${entry.category}' as Category,`);
    lines.push(`    group: '${escapeString(entry.group)}',`);
    lines.push(`    tagsZh: [${entry.tagsZh.map((t) => `'${escapeString(t)}'`).join(', ')}],`);
    lines.push(`    styleKeywords: [${entry.styleKeywords.map((k) => `'${escapeString(k)}'`).join(', ')}],`);
    lines.push(`    descriptionZh: '${escapeString(entry.descriptionZh)}',`);
    lines.push(`    useCases: [${entry.useCases.map((u) => `'${escapeString(u)}'`).join(', ')}],`);
    if (entry.previewLight) lines.push(`    previewLight: '${escapeString(entry.previewLight)}',`);
    if (entry.previewDark) lines.push(`    previewDark: '${escapeString(entry.previewDark)}',`);
    if (entry.designPath) lines.push(`    designPath: '${escapeString(entry.designPath)}',`);
    if (entry.bestFor) lines.push(`    bestFor: [${entry.bestFor.map((b) => `'${escapeString(b)}'`).join(', ')}],`);
    if (entry.avoidFor) lines.push(`    avoidFor: [${entry.avoidFor.map((a) => `'${escapeString(a)}'`).join(', ')}],`);
    if (entry.recommendedPromptZh) lines.push(`    recommendedPromptZh: '${escapeString(entry.recommendedPromptZh)}',`);
    lines.push('  },');
  }

  lines.push('] as const;');
  return lines.join('\n');
}

function escapeString(s: string): string {
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');
}

export function run(): void {
  const jsonPath = resolve(process.cwd(), '/project/awesome-design-md-cn/data/designs.json');
  const outDir = resolve(ROOT, 'src/lib/canvas-renderer/catalogs');
  mkdirSync(outDir, { recursive: true });

  console.log(`[generate-catalog] Reading: ${jsonPath}`);

  const entries = parseDesignsJson(jsonPath);
  console.log(`[generate-catalog] Parsed ${entries.length} designs`);

  const catalog = buildCatalog(entries);

  const jsonOut = resolve(outDir, 'design-catalog.json');
  writeFileSync(jsonOut, JSON.stringify(catalog, null, 2));
  console.log(`[generate-catalog] JSON catalog: ${jsonOut}`);

  const tsOut = resolve(outDir, 'design-catalog.ts');
  const tsContent = generateTypeScript(entries);
  writeFileSync(tsOut, tsContent);
  console.log(`[generate-catalog] TS catalog: ${tsOut}`);

  console.log(`[generate-catalog] Done! ${entries.length} styles across ${Object.keys(catalog.byCategory).length} categories.`);
}

// CLI
run();

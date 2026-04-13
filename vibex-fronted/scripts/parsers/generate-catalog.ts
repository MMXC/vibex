#!/usr/bin/env node
/**
 * generate-catalog.ts — 设计风格目录生成脚本
 *
 * Phase 1 Step 5 / Phase 2 Step 8: 生成入口脚本
 *
 * 用法:
 *   npx tsx scripts/parsers/generate-catalog.ts              # 生成合并 catalog
 *   npx tsx scripts/parsers/generate-catalog.ts --all     # 生成所有 59 个 individual + 合并
 *
 * 输出:
 *   src/lib/canvas-renderer/catalogs/design-catalog.json
 *   src/lib/canvas-renderer/catalogs/design-catalog.ts
 *   src/lib/canvas-renderer/catalogs/{slug}.json            # --all 时生成
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(process.cwd());
const SOURCE_JSON = '/project/awesome-design-md-cn/data/designs.json';
const OUT_DIR = resolve(ROOT, 'src/lib/canvas-renderer/catalogs');

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

function parseDesignsJson(): DesignEntry[] {
  const raw = JSON.parse(readFileSync(SOURCE_JSON, 'utf-8'));
  if (!Array.isArray(raw)) throw new Error(`Expected array, got ${typeof raw}`);
  return raw as DesignEntry[];
}

function buildCatalog(entries: DesignEntry[]): CatalogOutput {
  const byCategory: Record<string, string[]> = {};
  for (const e of entries) {
    const cat = e.category ?? 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e.slug);
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
    '/** 自动生成 — 不要手动编辑 */',
    `export const DESIGN_CATALOG_VERSION = "1.0.0";`,
    `export const CATEGORIES = [${categories.map((c) => `'${c}'`).join(', ')}] as const;`,
    'export type Category = typeof CATEGORIES[number];',
    '',
    'export interface DesignEntry {',
    '  slug: string; name: string; displayName: string; nameZh: string;',
    '  category: Category; group: string;',
    '  tagsZh: string[]; styleKeywords: string[];',
    '  descriptionZh: string; useCases: string[];',
    '}',
    '',
    'export const DESIGN_CATALOG: readonly DesignEntry[] = [',
  ];
  for (const e of entries) {
    const esc = (s: string) => (s ?? '').replace(/'/g, "\\'").replace(/\n/g, ' ');
    lines.push(
      `  { slug:'${esc(e.slug)}', name:'${esc(e.name)}', displayName:'${esc(e.displayName)}', nameZh:'${esc(e.nameZh)}', category:'${e.category}' as Category, group:'${esc(e.group)}', tagsZh:[${e.tagsZh.map((t) => `'${esc(t)}'`).join(', ')}], styleKeywords:[${e.styleKeywords.map((k) => `'${esc(k)}'`).join(', ')}], descriptionZh:'${esc(e.descriptionZh)}', useCases:[${e.useCases.map((u) => `'${esc(u)}'`).join(', ')}] },`
    );
  }
  lines.push('] as const;');
  return lines.join('\n');
}

function slugToFilename(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, '_');
}

function run(): void {
  const mode = process.argv[2]; // undefined | '--all'
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[generate-catalog] Reading: ${SOURCE_JSON}`);
  const entries = parseDesignsJson();
  console.log(`[generate-catalog] Parsed ${entries.length} designs`);

  if (mode === '--all') {
    // Generate individual catalog per design
    const errors: string[] = [];
    for (const entry of entries) {
      try {
        const filename = slugToFilename(entry.slug);
        const single: CatalogOutput = {
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          sourcePath: entry.designPath ?? '',
          totalStyles: 1,
          byCategory: { [entry.category]: [entry.slug] },
          styles: [entry],
        };
        writeFileSync(join(OUT_DIR, `${filename}.json`), JSON.stringify(single, null, 2));
      } catch (err) {
        errors.push(`${entry.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Merged catalog
    const merged = buildCatalog(entries);
    writeFileSync(join(OUT_DIR, 'design-catalog.json'), JSON.stringify(merged, null, 2));
    writeFileSync(join(OUT_DIR, 'design-catalog.ts'), generateTypeScript(entries));
    console.log(`[generate-catalog] --all: ${entries.length - errors.length}/${entries.length} individual catalogs + merged`);
    if (errors.length) errors.forEach((e) => console.error(`  ERR: ${e}`));
  } else {
    const catalog = buildCatalog(entries);
    writeFileSync(join(OUT_DIR, 'design-catalog.json'), JSON.stringify(catalog, null, 2));
    writeFileSync(join(OUT_DIR, 'design-catalog.ts'), generateTypeScript(entries));
    console.log(`[generate-catalog] Done! ${entries.length} styles across ${Object.keys(catalog.byCategory).length} categories.`);
  }
}

run();

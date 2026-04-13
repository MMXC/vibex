#!/usr/bin/env node
/**
 * generate-catalog.ts — 设计风格目录生成脚本（增强版）
 *
 * Phase 1 Step 5 / Phase 2 Step 8: 生成入口脚本
 *
 * 用法:
 *   npx tsx scripts/parsers/generate-catalog.ts              # 生成合并 catalog
 *   npx tsx scripts/parsers/generate-catalog.ts --all         # 生成所有 59 个 individual + 合并
 *   npx tsx scripts/parsers/generate-catalog.ts --style <slug> # 单风格
 *
 * 输出:
 *   src/lib/canvas-renderer/catalogs/design-catalog.json
 *   src/lib/canvas-renderer/catalogs/design-catalog.ts
 *   src/lib/canvas-renderer/catalogs/{slug}.json             # --all 时生成
 *
 * 每个 individual catalog 包含:
 *   - colorPalette: 从 DESIGN.md 解析的颜色定义
 *   - typography: 从 DESIGN.md 解析的字体规则
 *   - catalog.components: 10 个标准组件元数据
 *   - styleComponents: 2-3 个风格特征组件（带 tokens）
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  parseDesignMd,
  parseDesignBySlug,
  type DesignColorPalette,
  type DesignTypography,
  type DesignComponentTokens,
  type DesignStyleComponent,
} from './design-parser';

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT = resolve(process.cwd());
const AWESOME_DESIGN = '/project/awesome-design-md-cn';
const SOURCE_JSON = `${AWESOME_DESIGN}/data/designs.json`;
const OUT_DIR = resolve(ROOT, 'src/lib/canvas-renderer/catalogs');
const SCRIPTS_DIR = resolve(ROOT, 'scripts/parsers');

// ─── Types ───────────────────────────────────────────────────────────────────

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
  summaryZh?: string;
  aliases?: string[];
  relatedItems?: string[];
}

interface CatalogOutput {
  version: string;
  generatedAt: string;
  sourcePath: string;
  totalStyles: number;
  byCategory: Record<string, string[]>;
  styles: DesignEntry[];
}

interface IndividualCatalog {
  version: string;
  style: string;
  displayName: string;
  styleZh: string;
  tags: string[];
  styleKeywords: string[];
  useCases: string[];
  bestFor: string[];
  avoidFor: string[];
  positioningZh: string;
  colorPalette: DesignColorPalette;
  typography: DesignTypography;
  componentTokens: DesignComponentTokens;
  catalog: {
    version: string;
    components: Record<string, { description: string; props?: Record<string, unknown> }>;
  };
  styleComponents: DesignStyleComponent[];
  _meta: {
    generatedAt: string;
    designMdPath: string;
    sourceCommit?: string;
  };
}

// ─── Standard Components (10 per catalog) ─────────────────────────────────────

const STANDARD_COMPONENTS: Array<[string, string]> = [
  ['Page', '页面容器'],
  ['Button', '按钮'],
  ['Card', '卡片'],
  ['Input', '输入框'],
  ['Navigation', '导航栏'],
  ['Modal', '弹窗'],
  ['List', '列表'],
  ['Badge', '徽章'],
  ['Avatar', '头像'],
  ['Table', '表格'],
];

// ─── Source JSON Parser ───────────────────────────────────────────────────────

function parseDesignsJson(): DesignEntry[] {
  const raw = JSON.parse(readFileSync(SOURCE_JSON, 'utf-8'));
  if (!Array.isArray(raw)) throw new Error(`Expected array, got ${typeof raw}`);
  return raw as DesignEntry[];
}

// ─── Merged Catalog Builders ──────────────────────────────────────────────────

function buildCatalog(entries: DesignEntry[]): CatalogOutput {
  const byCategory: Record<string, string[]> = {};
  for (const e of entries) {
    const cat = e.category ?? 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    if (!byCategory[cat].includes(e.slug)) byCategory[cat].push(e.slug);
  }
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourcePath: `../project/awesome-design-md-cn/data/designs.json`,
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
    '  positioningZh?: string; bestFor?: string[]; avoidFor?: string[];',
    '  summaryZh?: string;',
    '}',
    '',
    'export const DESIGN_CATALOG: readonly DesignEntry[] = [',
  ];
  for (const e of entries) {
    const esc = (s: string | undefined) => (s ?? '').replace(/'/g, "\\'").replace(/\n/g, ' ');
    lines.push(
      `  { slug:'${esc(e.slug)}', name:'${esc(e.name)}', displayName:'${esc(e.displayName)}', nameZh:'${esc(e.nameZh)}', category:'${e.category}' as Category, group:'${esc(e.group)}', tagsZh:[${e.tagsZh.map((t) => `'${esc(t)}'`).join(', ')}], styleKeywords:[${e.styleKeywords.map((k) => `'${esc(k)}'`).join(', ')}], descriptionZh:'${esc(e.descriptionZh)}', useCases:[${e.useCases.map((u) => `'${esc(u)}'`).join(', ')}] },`
    );
  }
  lines.push('] as const;');
  return lines.join('\n');
}

// ─── Individual Catalog Builder ────────────────────────────────────────────────

function slugToFilename(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, '_');
}

function buildIndividualCatalog(
  entry: DesignEntry,
  designMeta: { colorPalette: DesignColorPalette; typography: DesignTypography; componentTokens: DesignComponentTokens; styleComponents: DesignStyleComponent[] } | null
): IndividualCatalog {
  const now = new Date().toISOString();

  // Build standard components
  const components: Record<string, { description: string; props?: Record<string, unknown> }> = {};
  for (const [name, desc] of STANDARD_COMPONENTS) {
    components[name] = { description: desc };
  }

  // Merge design metadata or use fallbacks
  const colors = designMeta?.colorPalette ?? { primary: '#6366f1', background: '#ffffff', textPrimary: '#111827' };
  const typography = designMeta?.typography ?? {
    fontFamily: 'system-ui',
    headingWeight: 600,
    bodyWeight: 400,
    headingSize: '24px',
    bodySize: '14px',
  };
  const componentTokens = designMeta?.componentTokens ?? {};
  const styleComponents = designMeta?.styleComponents ?? [];

  return {
    version: '1.0',
    style: entry.slug,
    displayName: entry.displayName,
    styleZh: entry.nameZh,
    tags: entry.tagsZh,
    styleKeywords: entry.styleKeywords,
    useCases: entry.useCases,
    bestFor: entry.bestFor ?? [],
    avoidFor: entry.avoidFor ?? [],
    positioningZh: entry.positioningZh ?? '',
    colorPalette: colors,
    typography,
    componentTokens,
    catalog: {
      version: '1.0',
      components,
    },
    styleComponents,
    _meta: {
      generatedAt: now,
      designMdPath: `design-md/${entry.slug}/DESIGN.md`,
    },
  };
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

function run(): void {
  const { values, positionals } = parseArgs({
    options: {
      style: { type: 'string' },
      all: { type: 'boolean', default: false },
      validate: { type: 'boolean', default: false },
    },
  });

  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[generate-catalog] Reading: ${SOURCE_JSON}`);
  const entries = parseDesignsJson();
  console.log(`[generate-catalog] Parsed ${entries.length} designs from index`);

  if (values.all) {
    // ── Batch mode: generate all 59 individual catalogs + merged ──
    const errors: Array<{ slug: string; reason: string }> = [];
    let parsed = 0;
    let skipped = 0;

    for (const entry of entries) {
      const designMdPath = `${AWESOME_DESIGN}/design-md/${entry.slug}/DESIGN.md`;

      // Parse DESIGN.md
      let designMeta: ReturnType<typeof parseDesignBySlug> = null;
      if (existsSync(designMdPath)) {
        designMeta = parseDesignBySlug(entry.slug, AWESOME_DESIGN);
        if (designMeta) parsed++;
      } else {
        skipped++;
        console.warn(`  ⚠  DESIGN.md not found for ${entry.slug}, using defaults`);
      }

      try {
        const catalog = buildIndividualCatalog(entry, designMeta);
        const filename = slugToFilename(entry.slug);
        writeFileSync(
          join(OUT_DIR, `${filename}.json`),
          JSON.stringify(catalog, null, 2),
          'utf-8'
        );
      } catch (err) {
        errors.push({ slug: entry.slug, reason: err instanceof Error ? err.message : String(err) });
      }
    }

    // Merged catalog
    const merged = buildCatalog(entries);
    writeFileSync(join(OUT_DIR, 'design-catalog.json'), JSON.stringify(merged, null, 2), 'utf-8');
    writeFileSync(join(OUT_DIR, 'design-catalog.ts'), generateTypeScript(entries), 'utf-8');

    console.log(`\n[generate-catalog] --all: ${entries.length - errors.length}/${entries.length} individual catalogs`);
    if (parsed > 0) console.log(`  DESIGN.md parsed: ${parsed}/${entries.length}`);
    if (skipped > 0) console.log(`  DESIGN.md skipped (not found): ${skipped}`);
    if (errors.length) {
      console.error(`  Errors: ${errors.length}`);
      errors.forEach((e) => console.error(`    ${e.slug}: ${e.reason}`));
    }
    console.log(`[generate-catalog] Merged catalog + TS generated.`);
    return;
  }

  if (values.style) {
    // ── Single style mode ──
    const entry = entries.find((e) => e.slug === values.style);
    if (!entry) {
      console.error(`❌ Style not found: ${values.style}`);
      console.error(`Available: ${entries.map((e) => e.slug).join(', ')}`);
      process.exit(1);
    }

    const designMeta = parseDesignBySlug(entry.slug, AWESOME_DESIGN);
    const catalog = buildIndividualCatalog(entry, designMeta);

    const filename = slugToFilename(entry.slug);
    const outPath = join(OUT_DIR, `${filename}.json`);
    writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`✅ Generated: ${outPath}`);

    if (designMeta) {
      console.log(`  colorPalette: ${Object.keys(designMeta.colorPalette).length} colors`);
      console.log(`  typography: ${designMeta.typography.fontFamily}`);
      console.log(`  styleComponents: ${designMeta.styleComponents.length}`);
    } else {
      console.log('  ⚠ DESIGN.md not found, used defaults');
    }
    return;
  }

  // Default: merged catalog only
  const catalog = buildCatalog(entries);
  writeFileSync(join(OUT_DIR, 'design-catalog.json'), JSON.stringify(catalog, null, 2), 'utf-8');
  writeFileSync(join(OUT_DIR, 'design-catalog.ts'), generateTypeScript(entries), 'utf-8');
  console.log(`[generate-catalog] Done! ${entries.length} styles across ${Object.keys(catalog.byCategory).length} categories.`);
}

run();

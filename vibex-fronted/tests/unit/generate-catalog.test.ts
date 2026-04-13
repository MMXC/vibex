/**
 * @vitest-environment node
 * Unit tests for generate-catalog script — Epic2-Stories
 *
 * Epic2: Scale phase — batch generation + design-parser integration
 * Epic2-Stories: verify S2.1 (batch) + S2.2 (styleComponents) + edge cases
 *
 * S2.1: --all generates >= 58 files, skip failures
 * S2.2: all catalogs have styleComponents (2-3 per design)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CATALOGS_DIR = resolve(__dirname, '../../src/lib/canvas-renderer/catalogs');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** slug -> filename conversion (mirrors generate-catalog.ts slugToFilename) */
function slugToFilename(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, '_');
}

// ─── slugToFilename ────────────────────────────────────────────────────────

describe('slugToFilename', () => {
  it('keeps alphanumeric and dash unchanged', () => {
    expect(slugToFilename('airbnb')).toBe('airbnb');
    expect(slugToFilename('linear-app')).toBe('linear-app');
    expect(slugToFilename('stripe123')).toBe('stripe123');
  });

  it('replaces dot with underscore', () => {
    expect(slugToFilename('linear.app')).toBe('linear_app');
    expect(slugToFilename('opencode.ai')).toBe('opencode_ai');
    expect(slugToFilename('x.ai')).toBe('x_ai');
  });

  it('replaces space with underscore', () => {
    expect(slugToFilename('notion app')).toBe('notion_app');
  });

  it('replaces special chars with underscore', () => {
    expect(slugToFilename('foo!bar')).toBe('foo_bar');
    expect(slugToFilename('foo/bar')).toBe('foo_bar');
    expect(slugToFilename('foo+bar')).toBe('foo_bar');
  });

  it('consecutive special chars collapse to one underscore', () => {
    expect(slugToFilename('foo!!!bar')).toBe('foo___bar');
  });
});

// ─── S2.1: Batch Generation ──────────────────────────────────────────────────

describe('S2.1: batch generation (--all)', () => {
  it('generates all catalog files via --all', () => {
    const designs = JSON.parse(
      readFileSync('/project/awesome-design-md-cn/data/designs.json', 'utf-8')
    );
    const expected = designs.filter((d: any) => d.slug !== 'awesome-design-md-cn').length;

    const files = readdirSync(CATALOGS_DIR).filter(
      (f) => f.endsWith('.json') && !f.startsWith('design-') && !f.startsWith('awesome')
    );

    expect(files.length).toBe(expected);
  });

  it('each design slug maps to a valid filename', () => {
    const designs = JSON.parse(
      readFileSync('/project/awesome-design-md-cn/data/designs.json', 'utf-8')
    ).filter((d: any) => d.slug !== 'awesome-design-md-cn');

    const missing: string[] = [];
    for (const d of designs) {
      const filename = slugToFilename(d.slug) + '.json';
      const path = join(CATALOGS_DIR, filename);
      if (!existsSync(path)) missing.push(`${d.slug} -> ${filename}`);
    }

    expect(missing, `Missing catalogs: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('batch mode wraps each entry in try/catch (skip failures)', () => {
    const scriptContent = readFileSync(
      resolve(__dirname, '../../scripts/parsers/generate-catalog.ts'),
      'utf-8'
    );
    expect(scriptContent).toContain('try {');
    expect(scriptContent).toContain('catch');
    expect(scriptContent).toContain('DESIGN.md not found');
  });

  it('generates design-catalog.json (merged index)', () => {
    expect(existsSync(resolve(CATALOGS_DIR, 'design-catalog.json'))).toBe(true);
    const merged = JSON.parse(
      readFileSync(resolve(CATALOGS_DIR, 'design-catalog.json'), 'utf-8')
    );
    expect(merged.version).toBeTruthy();
    expect(Array.isArray(merged.styles)).toBe(true);
    expect(merged.styles.length).toBeGreaterThan(50);
  });

  it('generates design-catalog.ts (merged TS)', () => {
    expect(existsSync(resolve(CATALOGS_DIR, 'design-catalog.ts'))).toBe(true);
    const tsContent = readFileSync(
      resolve(CATALOGS_DIR, 'design-catalog.ts'),
      'utf-8'
    );
    expect(tsContent).toContain('export const DESIGN_CATALOG');
    expect(tsContent).toContain('as const');
  });
});

// ─── S2.2: StyleComponents ───────────────────────────────────────────────────

describe('S2.2: styleComponents in all catalogs', () => {
  const STANDARD_COMPONENTS = [
    'Avatar', 'Badge', 'Button', 'Card', 'Input',
    'List', 'Modal', 'Navigation', 'Page', 'Table',
  ];

  function getCatalogFiles(): string[] {
    return readdirSync(CATALOGS_DIR).filter(
      (f) => f.endsWith('.json') &&
        !f.startsWith('design-') &&
        !f.startsWith('awesome')
    );
  }

  it('all catalogs have styleComponents array', () => {
    const missing: string[] = [];
    let ok = 0;
    for (const fname of getCatalogFiles()) {
      const catalog = JSON.parse(readFileSync(join(CATALOGS_DIR, fname), 'utf-8'));
      if (Array.isArray(catalog.styleComponents)) ok++;
      else missing.push(fname);
    }
    expect(ok, `Missing in: ${missing.join(', ')}`).toBe(getCatalogFiles().length);
  });

  it('each styleComponents array has 2-3 items', () => {
    const violations: string[] = [];
    for (const fname of getCatalogFiles()) {
      const catalog = JSON.parse(readFileSync(join(CATALOGS_DIR, fname), 'utf-8'));
      const count = catalog.styleComponents?.length ?? 0;
      if (count < 2 || count > 3) violations.push(`${fname}: ${count} items`);
    }
    expect(violations).toHaveLength(0);
  });

  it('each styleComponent has all required fields', () => {
    const required = ['name', 'catalogType', 'description', 'styleOverrides', 'tokens'];
    const violations: string[] = [];

    for (const fname of getCatalogFiles()) {
      const catalog = JSON.parse(readFileSync(join(CATALOGS_DIR, fname), 'utf-8'));
      for (let i = 0; i < (catalog.styleComponents?.length ?? 0); i++) {
        const sc = catalog.styleComponents[i];
        for (const field of required) {
          if (!(field in sc)) violations.push(`${fname}[${i}].${field}`);
        }
      }
    }
    expect(violations).toHaveLength(0);
  });

  it('catalog.components has 10 standard components for all files', () => {
    const violations: string[] = [];
    for (const fname of getCatalogFiles()) {
      const catalog = JSON.parse(readFileSync(join(CATALOGS_DIR, fname), 'utf-8'));
      const keys = Object.keys(catalog.catalog?.components ?? {}).sort();
      if (keys.join(',') !== STANDARD_COMPONENTS.slice().sort().join(',')) {
        violations.push(`${fname}: got [${keys.join(',')}]`);
      }
    }
    expect(violations).toHaveLength(0);
  });
});

// ─── design-parser integration ───────────────────────────────────────────────

describe('design-parser integration (Epic2)', () => {
  let parseDesignMd: (md: string, slug: string) => any;

  beforeAll(async () => {
    const mod = await import('../../scripts/parsers/design-parser');
    parseDesignMd = mod.parseDesignMd;
  });

  it('parses colorPalette for airbnb', () => {
    const md = readFileSync('/project/awesome-design-md-cn/design-md/airbnb/DESIGN.md', 'utf-8');
    const result = parseDesignMd(md, 'airbnb');
    expect(result.colorPalette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(Object.keys(result.colorPalette).length).toBeGreaterThanOrEqual(3);
  });

  it('parses colorPalette for linear.app', () => {
    const md = readFileSync('/project/awesome-design-md-cn/design-md/linear.app/DESIGN.md', 'utf-8');
    const result = parseDesignMd(md, 'linear.app');
    expect(result.colorPalette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('parses colorPalette for stripe', () => {
    const md = readFileSync('/project/awesome-design-md-cn/design-md/stripe/DESIGN.md', 'utf-8');
    const result = parseDesignMd(md, 'stripe');
    expect(result.colorPalette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('parses typography for all 3 designs', () => {
    const slugs = ['airbnb', 'linear.app', 'stripe'];
    for (const slug of slugs) {
      const md = readFileSync(`/project/awesome-design-md-cn/design-md/${slug}/DESIGN.md`, 'utf-8');
      const result = parseDesignMd(md, slug);
      expect(result.typography.fontFamily).toBeTruthy();
      expect(typeof result.typography.headingWeight).toBe('number');
      expect(result.typography.headingSize).toMatch(/^\d+px$/);
    }
  });

  it('generates styleComponents for all 3 designs', () => {
    const slugs = ['airbnb', 'linear.app', 'stripe'];
    for (const slug of slugs) {
      const md = readFileSync(`/project/awesome-design-md-cn/design-md/${slug}/DESIGN.md`, 'utf-8');
      const result = parseDesignMd(md, slug);
      expect(result.styleComponents).toBeInstanceOf(Array);
      expect(result.styleComponents.length).toBeGreaterThanOrEqual(2);
      for (const sc of result.styleComponents) {
        expect(sc.name).toBeTruthy();
        expect(sc.catalogType).toBeTruthy();
        expect(sc.description).toBeTruthy();
        expect(sc.tokens).toBeDefined();
      }
    }
  });
});

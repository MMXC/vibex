/**
 * designs-parser.ts — 解析 awesome-design-md-cn/data/designs.json
 *
 * Phase 1 Step 3: 解析 designs.json
 *
 * 输入: /project/awesome-design-md-cn/data/designs.json
 * 输出: DesignStyle[] (符合 design-schema.ts)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DesignStyleSchema, type DesignStyle } from '../../src/lib/canvas-renderer/catalogs/design-schema';

export interface ParseResult {
  success: boolean;
  styles: DesignStyle[];
  errors: string[];
  total: number;
}

const DESIGN_DATA_PATH = resolve('/project/awesome-design-md-cn/data/designs.json');

export function parseDesignsJson(dataPath?: string): ParseResult {
  const path = dataPath ?? DESIGN_DATA_PATH;
  const errors: string[] = [];
  let rawData: unknown;

  try {
    rawData = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    return {
      success: false,
      styles: [],
      errors: [`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`],
      total: 0,
    };
  }

  if (!Array.isArray(rawData)) {
    return {
      success: false,
      styles: [],
      errors: [`Expected designs.json to be an array, got ${typeof rawData}`],
      total: 0,
    };
  }

  const styles: DesignStyle[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const result = DesignStyleSchema.safeParse(item);

    if (result.success) {
      styles.push(result.data);
    } else {
      const slug = (item as Record<string, unknown>)?.slug ?? `(index ${i})`;
      errors.push(`[${slug}] ${result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')}`);
    }
  }

  return {
    success: errors.length === 0,
    styles,
    errors,
    total: rawData.length,
  };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = parseDesignsJson();
  console.log(`Parsed ${result.styles.length}/${result.total} styles`);
  if (result.errors.length > 0) {
    console.error('Parse errors:');
    result.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('All styles parsed successfully!');
  }
}

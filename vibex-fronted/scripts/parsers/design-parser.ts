/**
 * design-parser.ts — 解析单个 awesome-design-md-cn DESIGN.md 文件
 *
 * Phase 1 Step 4: DESIGN.md 解析器（最小可行版）
 *
 * 提取设计系统关键信息:
 * - Visual Theme
 * - Color Palette
 * - Typography Rules
 * - Component Patterns
 *
 * 输出: DesignMetadata (符合后续 json-render catalog 转换需要)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DesignMetadata {
  slug: string;
  /** 设计系统名称（标题行）*/
  title: string;
  /** 视觉主题描述（第一段） */
  visualTheme: string;
  /** 关键特性列表 */
  keyCharacteristics: string[];
  /** 颜色定义 */
  colors: Record<string, string>;
  /** 主字体 */
  primaryFont: string;
  /** 组件模式列表 */
  componentPatterns: string[];
}

/**
 * 从 DESIGN.md 内容提取元数据
 */
export function parseDesignMd(content: string): Partial<DesignMetadata> {
  const lines = content.split('\n');
  const result: Partial<DesignMetadata> = {
    keyCharacteristics: [],
    colors: {},
    componentPatterns: [],
  };

  let inKeyCharacteristics = false;
  let inColorSection = false;
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Title
    if (line.startsWith('# Design System:')) {
      result.title = line.replace('# Design System:', '').trim();
    }

    // Key Characteristics
    if (line.startsWith('**Key Characteristics:**') || line === '**Key Characteristics:**') {
      inKeyCharacteristics = true;
      continue;
    }
    if (inKeyCharacteristics) {
      if (line.startsWith('**') && !line.startsWith('- ')) {
        inKeyCharacteristics = false;
      } else if (line.startsWith('- ')) {
        result.keyCharacteristics!.push(line.slice(2).trim());
      }
    }

    // Color section
    if (line.includes('Color Palette') || line.includes('### Primary') || line.includes('### Surface')) {
      inColorSection = true;
      continue;
    }
    if (inColorSection) {
      if (line.startsWith('### ') && !line.includes('Primary') && !line.includes('Surface') && !line.includes('Supporting')) {
        inColorSection = false;
      }
      // Parse color entries like: - **Name** (`#rrggbb`): description
      const colorMatch = line.match(/^\s*-\s+\*\*([^*]+)\*\*\s*\(`(#[0-9a-fA-F]+)`\)/);
      if (colorMatch) {
        const [, name, hex] = colorMatch;
        result.colors![name.trim()] = hex.trim();
      }
    }

    // Font section
    if (line.includes('Font Family') || line.includes('Primary')) {
      const fontMatch = line.match(/`([^`]+)`/g);
      if (fontMatch && fontMatch.length > 0) {
        result.primaryFont = fontMatch[0].replace(/`/g, '');
      }
    }

    // Component Patterns (headers like ## 4., ## 5.)
    if (/^##\s+\d+\./.test(line) || /^##\s+Component/.test(line)) {
      currentSection = line.replace(/^##\s+/, '').trim();
    }
    if (currentSection && line.startsWith('- ')) {
      result.componentPatterns!.push(line.slice(2).trim());
    }
  }

  return result;
}

/**
 * 解析指定 slug 的 DESIGN.md 文件
 */
export function parseDesignBySlug(slug: string, baseDir?: string): DesignMetadata | null {
  const base = baseDir ?? resolve('/project/awesome-design-md-cn');
  const designPath = join(base, 'design-md', slug, 'DESIGN.md');

  if (!existsSync(designPath)) {
    console.warn(`[design-parser] DESIGN.md not found: ${designPath}`);
    return null;
  }

  const content = readFileSync(designPath, 'utf-8');
  const meta = parseDesignMd(content);

  return {
    slug,
    title: meta.title ?? slug,
    visualTheme: meta.visualTheme ?? '',
    keyCharacteristics: meta.keyCharacteristics ?? [],
    colors: meta.colors ?? {},
    primaryFont: meta.primaryFont ?? 'sans-serif',
    componentPatterns: meta.componentPatterns ?? [],
  };
}

/**
 * 获取所有已存在的 DESIGN.md slug 列表
 */
export function listAvailableDesigns(baseDir?: string): string[] {
  const base = baseDir ?? resolve('/project/awesome-design-md-cn');
  const designMdDir = join(base, 'design-md');

  if (!existsSync(designMdDir)) {
    return [];
  }

  return readdirSync(designMdDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

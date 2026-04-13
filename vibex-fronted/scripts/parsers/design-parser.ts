/**
 * design-parser.ts — 解析单个 awesome-design-md-cn DESIGN.md 文件
 *
 * Phase 1 Step 4 (增强版): DESIGN.md 解析器
 *
 * 提取设计系统关键信息:
 * - Visual Theme
 * - Color Palette (structured)
 * - Typography Rules (structured)
 * - Component Tokens (Button, Card, Input, Nav)
 * - Style Components (2-3 characteristic components)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface DesignColorPalette {
  primary: string;
  primaryHover?: string;
  background: string;
  textPrimary: string;
  textSecondary?: string;
  border?: string;
  error?: string;
  surface?: string;
  accent?: string;
  [key: string]: string | undefined;
}

export interface DesignTypography {
  fontFamily: string;
  fontFamilyMono?: string;
  headingWeight: number;
  bodyWeight: number;
  headingSize: string;
  bodySize: string;
  letterSpacing?: string;
  lineHeightHeading?: string;
  lineHeightBody?: string;
  openTypeFeatures?: string[];
}

export interface DesignComponentTokens {
  Button?: {
    borderRadius?: string;
    paddingX?: string;
    background?: string;
    textColor?: string;
  };
  Card?: {
    borderRadius?: string;
    shadow?: string;
    background?: string;
  };
  Input?: {
    borderRadius?: string;
    borderColor?: string;
    background?: string;
  };
  Navigation?: {
    height?: string;
    borderRadius?: string;
  };
}

export interface DesignStyleComponent {
  name: string;
  catalogType: string;
  description: string;
  styleOverrides: Record<string, string>;
  tokens: Record<string, string>;
}

export interface DesignMetadata {
  slug: string;
  title: string;
  visualTheme: string;
  keyCharacteristics: string[];
  colorPalette: DesignColorPalette;
  typography: DesignTypography;
  componentTokens: DesignComponentTokens;
  styleComponents: DesignStyleComponent[];
}

// ─── Color Extraction ─────────────────────────────────────────────────────────

function extractColors(content: string): DesignColorPalette {
  const result: DesignColorPalette = {
    primary: '#6366f1',
    background: '#ffffff',
    textPrimary: '#111827',
  };

  // Extract hex colors from the document
  const hexMatches = [...content.matchAll(/#([0-9a-fA-F]{3,8})\b/g)];
  const hexes = hexMatches.map((m) => m[0]);

  // Find "primary brand" or "brand" color — usually the first bold-named color
  const primaryMatch = content.match(/\*\*[\w\s]+\*\*[^#\n]*\(`(#[0-9a-fA-F]{3,8})`\)/);
  if (primaryMatch) {
    result.primary = primaryMatch[1];
  } else if (hexes.length > 0) {
    result.primary = hexes[0];
  }

  // Find hover/active variant (usually second hex or "hover" line)
  const hoverMatch = content.match(/hover[:\s]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i);
  if (hoverMatch) {
    result.primaryHover = hoverMatch[1];
  } else if (hexes.length > 1) {
    // Use second hex as hover if it looks like a variant
    const h = hexes[1];
    if (h !== result.primary) result.primaryHover = h;
  }

  // Background — white or light surface
  if (content.includes('#ffffff') || content.includes('white') || content.includes('Pure White')) {
    result.background = '#ffffff';
  } else if (content.match(/background[:\s]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i)) {
    const bgMatch = content.match(/background[:\s]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i);
    if (bgMatch) result.background = bgMatch[1];
  }

  // Text primary — usually near-black or dark gray
  const textPrimaryMatch = content.match(/\*\*Primary Text[^#]*?(#[0-9a-fA-F]{3,8})/i);
  if (textPrimaryMatch) {
    result.textPrimary = textPrimaryMatch[1];
  } else if (content.match(/\*\*Near Black[^#]*?(#[0-9a-fA-F]{3,8})/i)) {
    const nm = content.match(/\*\*Near Black[^#]*?(#[0-9a-fA-F]{3,8})/i);
    if (nm) result.textPrimary = nm[1];
  } else {
    // Last resort: look for dark gray hex
    for (const h of hexes) {
      if (h.match(/^#[0-9a-fA-F]{2}[0-9a-fA-F]{2}[0-9a-fA-F]{2}$/i)) {
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        if (r < 80 && g < 80 && b < 80) {
          result.textPrimary = h;
          break;
        }
      }
    }
  }

  // Text secondary
  const textSecMatch = content.match(/\*\*Secondary[^#]*?(#[0-9a-fA-F]{3,8})/i);
  if (textSecMatch) result.textSecondary = textSecMatch[1];

  // Error
  const errorMatch = content.match(/\*\*Error[^#]*?(#[0-9a-fA-F]{3,8})/i);
  if (errorMatch) result.error = errorMatch[1];

  // Border
  const borderMatch = content.match(/\*\*Border[^#]*?(#[0-9a-fA-F]{3,8})/i);
  if (borderMatch) result.border = borderMatch[1];

  // Accent — secondary brand color
  if (hexes.length > 2) {
    const third = hexes[2];
    if (third !== result.primary && third !== result.background) {
      result.accent = third;
    }
  }

  return result;
}

// ─── Typography Extraction ────────────────────────────────────────────────────

function extractTypography(content: string): DesignTypography {
  const result: DesignTypography = {
    fontFamily: 'system-ui',
    headingWeight: 600,
    bodyWeight: 400,
    headingSize: '24px',
    bodySize: '14px',
  };

  // Primary font — look for font family line
  const fontMatch = content.match(/\*\*Primary[^#]*?`([^`]+)`/);
  if (fontMatch) {
    const fontStr = fontMatch[1].trim();
    result.fontFamily = fontStr.split(',')[0].trim();
  } else {
    const altFontMatch = content.match(/`([A-Za-z][A-Za-z\s-]{2,30}VF?)`/);
    if (altFontMatch) {
      result.fontFamily = altFontMatch[1].trim().split(',')[0].trim();
    }
  }

  // Monospace font
  const monoMatch = content.match(/\*\*Monospace[^#]*?`([^`]+)`/);
  if (monoMatch) {
    result.fontFamilyMono = monoMatch[1].trim().split(',')[0].trim();
  }

  // Weights
  const headingWeight = content.match(/Heading[^0-9]*(\d{3})/);
  if (headingWeight) result.headingWeight = parseInt(headingWeight[1]);

  const bodyWeight = content.match(/Body[^0-9]*(\d{3})/);
  if (bodyWeight) result.bodyWeight = parseInt(bodyWeight[1]);

  // Sizes — look for heading size (largest heading number)
  const headingSize = content.match(/Heading[^0-9]*?(\d+)px/);
  if (headingSize) result.headingSize = `${headingSize[1]}px`;

  const bodySize = content.match(/Body[^0-9]*?(\d+)px/);
  if (bodySize) result.bodySize = `${bodySize[1]}px`;

  // Letter spacing
  const letterSpacing = content.match(/letter-spacing[:\s-]*(-?[\d.]+)px/i);
  if (letterSpacing) result.letterSpacing = `${letterSpacing[1]}px`;

  // Line heights
  const lhHeading = content.match(/Heading[^0-9]*?(\d+\.?\d*)\s*\(?\s*line/);
  if (lhHeading) result.lineHeightHeading = lhHeading[1];

  const lhBody = content.match(/Body[^0-9]*?(\d+\.?\d*)\s*\(?\s*line/);
  if (lhBody) result.lineHeightBody = lhBody[1];

  // OpenType features
  const otMatch = [...content.matchAll(/"([a-z0-9]+)"/g)]
    .map((m) => m[1])
    .filter((f) => f.length <= 12 && /^[a-z0-9]+$/.test(f))
    .slice(0, 5);
  if (otMatch.length > 0) result.openTypeFeatures = otMatch;

  return result;
}

// ─── Component Tokens Extraction ──────────────────────────────────────────────

function extractComponentTokens(content: string): DesignComponentTokens {
  const tokens: DesignComponentTokens = {};

  // Button section
  const btnSection = content.match(/\*\*Buttons?\*\*([\s\S]*?)(?=\*\*[A-Z][a-z]|## [0-9]|\n## |---)/);
  if (btnSection) {
    const btn = btnSection[1];
    const radius = btn.match(/Radius[:\s-]*(\d+)px/)?.[1] ?? '8';
    const paddingX = btn.match(/Padding[:\s-]*0px\s+(\d+)px/)?.[1] ?? btn.match(/Padding[:\s-]*(\d+)px/)?.[1] ?? '16';
    tokens.Button = {
      borderRadius: `${radius}px`,
      paddingX: `${paddingX}px`,
    };
    // Background color
    const bgMatch = btn.match(/Background[:\s-]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i);
    if (bgMatch) tokens.Button.background = bgMatch[1];
    // Text color
    const tcMatch = btn.match(/Text[:\s-]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i);
    if (tcMatch) tokens.Button.textColor = tcMatch[1];
  }

  // Card section
  const cardSection = content.match(/\*\*Cards?(?:[^S]|Shadow)??(?:[^C]|Container)\*\*([\s\S]*?)(?=\*\*[A-Z][a-z]|## [0-9]|\n## |---)/i);
  if (cardSection) {
    const card = cardSection[1];
    const radius = card.match(/Radius[:\s-]*(\d+)px/)?.[1] ?? '12';
    const shadow = card.match(/Shadow[:\s-]*`([^`]+)`/)?.[1];
    tokens.Card = { borderRadius: `${radius}px` };
    if (shadow) tokens.Card.shadow = shadow;
  }

  // Input section
  const inputSection = content.match(/\*\*Inputs?\*\*([\s\S]*?)(?=\*\*[A-Z][a-z]|## [0-9]|\n## |---)/i);
  if (inputSection) {
    const inp = inputSection[1];
    const radius = inp.match(/Radius[:\s-]*(\d+)px/)?.[1] ?? '6';
    tokens.Input = { borderRadius: `${radius}px` };
    const bgMatch = inp.match(/background[:\s]*[^#\n]*?(#[0-9a-fA-F]{3,8})/i);
    if (bgMatch) tokens.Input.background = bgMatch[1];
  }

  // Navigation section
  const navSection = content.match(/\*\*Navigation\*\*([\s\S]*?)(?=\*\*[A-Z][a-z]|## [0-9]|\n## |---)/i);
  if (navSection) {
    const nav = navSection[1];
    const height = nav.match(/Height[:\s-]*(\d+)px/)?.[1];
    if (height) tokens.Navigation = { height: `${height}px` };
  }

  return tokens;
}

// ─── Style Components Extraction ──────────────────────────────────────────────

function extractStyleComponents(
  slug: string,
  colors: DesignColorPalette,
  tokens: DesignComponentTokens,
  keywords: string[]
): DesignStyleComponent[] {
  const components: DesignStyleComponent[] = [];

  // Card — most universal
  const cardTokens: Record<string, string> = {};
  if (tokens.Card?.borderRadius) cardTokens.borderRadius = tokens.Card.borderRadius;
  if (tokens.Card?.background) cardTokens.background = tokens.Card.background;
  if (colors.primary) cardTokens.primaryColor = colors.primary;

  components.push({
    name: 'Card',
    catalogType: 'Card',
    description: '卡片容器',
    styleOverrides: {
      borderRadius: tokens.Card?.borderRadius ?? '12px',
      padding: '16px',
      background: tokens.Card?.background ?? colors.background,
    },
    tokens: cardTokens,
  });

  // Button — characteristic
  const btnTokens: Record<string, string> = {};
  if (colors.primary) btnTokens.primaryColor = colors.primary;
  if (tokens.Button?.borderRadius) btnTokens.borderRadius = tokens.Button.borderRadius;

  components.push({
    name: 'Button',
    catalogType: 'Button',
    description: '按钮',
    styleOverrides: {
      borderRadius: tokens.Button?.borderRadius ?? '8px',
      paddingX: tokens.Button?.paddingX ?? '16px',
      background: tokens.Button?.background ?? colors.primary,
    },
    tokens: btnTokens,
  });

  // Input — if there's input styling info
  if (tokens.Input) {
    components.push({
      name: 'Input',
      catalogType: 'Input',
      description: '输入框',
      styleOverrides: {
        borderRadius: tokens.Input.borderRadius ?? '6px',
        background: tokens.Input.background ?? colors.background,
      },
      tokens: {
        borderColor: tokens.Input.borderColor ?? colors.border ?? '#e5e7eb',
        textColor: colors.textPrimary,
      },
    });
  }

  // Navigation — if there's nav info
  if (tokens.Navigation) {
    components.push({
      name: 'Navigation',
      catalogType: 'Navigation',
      description: '导航栏',
      styleOverrides: {
        height: tokens.Navigation.height ?? '64px',
        background: colors.background,
      },
      tokens: {
        primaryColor: colors.primary,
      },
    });
  }

  return components.slice(0, 3); // Max 3 per design
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * 从 DESIGN.md 内容提取完整元数据
 */
export function parseDesignMd(
  content: string,
  slug: string,
  keywords: string[] = []
): DesignMetadata {
  const colors = extractColors(content);
  const typography = extractTypography(content);
  const componentTokens = extractComponentTokens(content);

  // Title
  const titleMatch = content.match(/^#\s+Design System[:\s]*(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Key characteristics
  const keyChars: string[] = [];
  const keyCharsMatch = content.match(/\*\*Key Characteristics:\*\*([\s\S]*?)(?=\*\*[A-Z]|## )/);
  if (keyCharsMatch) {
    const lines = keyCharsMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        keyChars.push(trimmed.slice(2).replace(/[`*#]/g, '').trim());
      }
    }
  }

  // Visual theme — first paragraph after title
  const vtMatch = content.match(/^#\s+Design System[^\n]*\n\n([^\n#]{10,200})/m);
  const visualTheme = vtMatch ? vtMatch[1].replace(/[*_`#]/g, '').trim() : '';

  return {
    slug,
    title,
    visualTheme,
    keyCharacteristics: keyChars,
    colorPalette: colors,
    typography,
    componentTokens,
    styleComponents: extractStyleComponents(slug, colors, componentTokens, keywords),
  };
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
  return parseDesignMd(content, slug);
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

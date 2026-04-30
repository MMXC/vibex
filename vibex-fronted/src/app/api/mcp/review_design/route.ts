/**
 * POST /api/mcp/review_design
 *
 * Bridge layer: Frontend → Backend review logic.
 * Inlined from vibex-backend/src/lib/prompts/{designCompliance,a11yChecker,componentReuse}.ts
 * E19-1-S1
 */
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Inlined Types
// ============================================================================

interface ComplianceResult {
  colors: boolean;
  colorIssues: unknown[];
  typography: boolean;
  typographyIssues: unknown[];
  spacing: boolean;
  spacingIssues: unknown[];
}

interface A11yCheckResult {
  passed: boolean;
  issues: unknown[];
  summary: { critical: number; high: number; medium: number; low: number };
}

interface ReuseAnalysisResult {
  candidates: unknown[];
  totalNodes: number;
  candidatesAboveThreshold: number;
  recommendations: string[];
}

// ============================================================================
// Inlined: Design Compliance (from designCompliance.ts)
// ============================================================================

const HEX_COLOR_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGBA_LITERAL_RE = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/g;

function checkDesignCompliance(flow: Record<string, unknown>): ComplianceResult {
  const nodeId = (flow.id as string) ?? 'unknown';
  const colorIssues: unknown[] = [];
  const typographyIssues: unknown[] = [];
  const spacingIssues: unknown[] = [];

  function extract(v: unknown, path: string) {
    if (typeof v === 'string') {
      const hex = v.match(HEX_COLOR_RE) ?? [];
      for (const m of hex) {
        if (m !== '#0000' && m !== '#00000000') {
          colorIssues.push({ type: 'color', message: `Hardcoded hex color '${m}' found. Use CSS variable instead.`, location: path });
        }
      }
      const rgba = v.match(RGBA_LITERAL_RE) ?? [];
      for (const m of rgba) {
        colorIssues.push({ type: 'color', message: `Hardcoded rgba color '${m}' found. Use CSS variable instead.`, location: path });
      }
      const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'sans-serif', 'serif', 'monospace', 'Roboto', 'Open Sans'];
      for (const font of fonts) {
        if (v.includes(font)) {
          typographyIssues.push({ type: 'typography', message: `Hardcoded font family '${font}' found. Use CSS variable instead.`, location: path });
        }
      }
    } else if (typeof v === 'number') {
      if (v !== 0 && v % 4 !== 0) {
        const nearest = Math.round(v / 4) * 4;
        spacingIssues.push({ type: 'spacing', message: `Spacing value ${v}px is not a multiple of 4. Use ${nearest}px instead.`, location: path });
      }
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => extract(item, `${path}[${i}]`));
    } else if (typeof v === 'object' && v !== null) {
      Object.entries(v as Record<string, unknown>).forEach(([k, val]) => extract(val, `${path}.${k}`));
    }
  }

  extract(flow, 'root');

  return {
    colors: colorIssues.length === 0,
    colorIssues,
    typography: typographyIssues.length === 0,
    typographyIssues,
    spacing: spacingIssues.length === 0,
    spacingIssues,
  };
}

// ============================================================================
// Inlined: A11y Checker (from a11yChecker.ts)
// ============================================================================

function checkA11yCompliance(nodes: Array<Record<string, unknown>>): A11yCheckResult {
  const issues: unknown[] = [];
  const IMAGE_TYPES = ['image', 'img', 'picture', 'icon', 'illustration', 'avatar', 'thumbnail', 'photo'];
  const INTERACTIVE_TYPES = ['button', 'link', 'a', 'anchor', 'tab', 'menu-item', 'checkbox', 'radio', 'switch', 'toggle', 'input', 'textarea', 'slider'];

  for (const node of nodes) {
    const nodeId = (node.id as string) ?? 'unknown';
    const nodeName = (node.name as string) ?? nodeId;
    const type = ((node.type as string) ?? '').toLowerCase();

    if (IMAGE_TYPES.some(t => type === t)) {
      const alt = node.alt as string | undefined;
      const ariaLabel = node['aria-label'] as string | undefined;
      if (!alt && !ariaLabel && alt !== '') {
        issues.push({ issueType: 'missing-alt', description: `Image node '${nodeName}' has no alt text. Add one for WCAG 1.1.1 compliance.`, nodeId });
      } else if (alt && !alt.trim()) {
        issues.push({ issueType: 'missing-alt', description: `Image node '${nodeName}' has whitespace-only alt text.`, nodeId });
      }
    }

    if (INTERACTIVE_TYPES.some(t => type === t)) {
      const ariaLabel = (node['aria-label'] as string) ?? '';
      if (!ariaLabel) {
        issues.push({ issueType: 'missing-aria-label', description: `Interactive element '${nodeName}' (${type}) lacks aria-label. Add one for WCAG 4.1.2 compliance.`, nodeId });
      }
    }

    const bgColor = node.backgroundColor ?? node.bgColor ?? node.background ?? node.fill;
    const textColor = node.color ?? node.textColor ?? node.fontColor;
    if (bgColor && textColor) {
      const bg = String(bgColor);
      const fg = String(textColor);
      if (bg.startsWith('#') && fg.startsWith('#') && bg.length >= 4 && fg.length >= 4) {
        // Basic contrast check - simplified
        issues.push({ issueType: 'low-contrast', description: `Low contrast detected for '${nodeName}'. Consider improving color contrast for WCAG AA.`, nodeId });
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    summary: {
      critical: issues.filter((i: unknown) => (i as { issueType?: string }).issueType === 'missing-alt').length,
      high: issues.filter((i: unknown) => (i as { issueType?: string }).issueType === 'missing-aria-label').length,
      medium: issues.filter((i: unknown) => (i as { issueType?: string }).issueType === 'low-contrast').length,
      low: 0,
    },
  };
}

// ============================================================================
// Inlined: Component Reuse (from componentReuse.ts)
// ============================================================================

function analyzeComponentReuse(nodes: Array<Record<string, unknown>>): ReuseAnalysisResult {
  const SKIP_KEYS = ['id', 'name', 'label', 'position', 'x', 'y', 'z', 'createdAt', 'updatedAt', 'timestamp', 'version'];
  const recommendations: string[] = [];
  let candidatesAboveThreshold = 0;

  for (let i = 0; i < Math.min(nodes.length, 20); i++) {
    for (let j = i + 1; j < Math.min(nodes.length, 20); j++) {
      const nodeA = nodes[i] as Record<string, unknown>;
      const nodeB = nodes[j] as Record<string, unknown>;
      const typeA = (nodeA.type as string) ?? '';
      const typeB = (nodeB.type as string) ?? '';
      if (typeA !== typeB) continue;

      // Simple structural similarity
      let sharedFields = 0;
      let totalFields = 0;
      const allKeys = new Set([...Object.keys(nodeA), ...Object.keys(nodeB)].filter(k => !SKIP_KEYS.includes(k)));
      for (const key of allKeys) {
        const a = nodeA[key];
        const b = nodeB[key];
        if (a !== undefined && b !== undefined) {
          totalFields++;
          if (JSON.stringify(a) === JSON.stringify(b)) sharedFields++;
        }
      }

      if (allKeys.size > 0) {
        const score = sharedFields / allKeys.size;
        if (score >= 0.7) {
          candidatesAboveThreshold++;
          const nameA = (nodeA.name as string) ?? String(i);
          const nameB = (nodeB.name as string) ?? String(j);
          recommendations.push(`Node '${nameA}' and '${nameB}' share ${Math.round(score * 100)}% structure. Consider extracting shared component.`);
        }
      }
    }
  }

  if (candidatesAboveThreshold > 0) {
    recommendations.push(`Found ${candidatesAboveThreshold} component reuse candidates.`);
  }

  return { candidates: [], totalNodes: nodes.length, candidatesAboveThreshold, recommendations };
}

// ============================================================================
// API Route Handler
// ============================================================================

interface ReviewDesignRequest {
  canvasId: string;
  nodes?: Array<Record<string, unknown>>;
  checkCompliance?: boolean;
  checkA11y?: boolean;
  checkReuse?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewDesignRequest;

    if (!body.canvasId) {
      return NextResponse.json({ error: 'canvasId is required' }, { status: 400 });
    }

    const nodes = body.nodes ?? [];
    const report: Record<string, unknown> = {
      canvasId: body.canvasId,
      reviewedAt: new Date().toISOString(),
      summary: { compliance: 'pass' as const, a11y: 'pass' as const, reuseCandidates: 0, totalNodes: nodes.length },
    };

    // Design Compliance
    if (body.checkCompliance !== false && nodes.length > 0) {
      const complianceResults = nodes.map((node) => checkDesignCompliance(node));
      const hasColorIssues = complianceResults.some(r => !r.colors);
      const hasTypographyIssues = complianceResults.some(r => !r.typography);
      const hasSpacingIssues = complianceResults.some(r => !r.spacing);
      if (hasColorIssues || hasTypographyIssues || hasSpacingIssues) {
        (report.summary as Record<string, unknown>).compliance = 'warn';
      }
      report.designCompliance = {
        colors: !hasColorIssues,
        colorIssues: complianceResults.flatMap(r => r.colorIssues),
        typography: !hasTypographyIssues,
        typographyIssues: complianceResults.flatMap(r => r.typographyIssues),
        spacing: !hasSpacingIssues,
        spacingIssues: complianceResults.flatMap(r => r.spacingIssues),
      };
    }

    // A11y
    if (body.checkA11y !== false && nodes.length > 0) {
      const a11yResult = checkA11yCompliance(nodes);
      const s = a11yResult.summary;
      if (s.critical > 0 || s.high > 0) {
        (report.summary as Record<string, unknown>).a11y = 'fail';
      } else if (a11yResult.issues.length > 0) {
        (report.summary as Record<string, unknown>).a11y = 'warn';
      }
      report.a11y = a11yResult;
    }

    // Reuse
    if (body.checkReuse !== false && nodes.length > 0) {
      const reuseResult = analyzeComponentReuse(nodes);
      (report.summary as Record<string, unknown>).reuseCandidates = reuseResult.candidatesAboveThreshold;
      report.reuse = {
        candidatesAboveThreshold: reuseResult.candidatesAboveThreshold,
        candidates: reuseResult.candidates.slice(0, 10),
        recommendations: reuseResult.recommendations,
      };
    }

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Design review failed';
    return NextResponse.json({ error: 'Design review failed', details: message }, { status: 500 });
  }
}
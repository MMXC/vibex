export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/review_design
 *
 * Bridge layer: Frontend → MCP Server (Design Review)
 * E1 Design Review MCP — Epic1-Design-Review-MCP
 *
 * C-E1-1: Graceful degradation — falls back to static analysis if MCP unavailable
 * C-E1-2: MCP call timeout = 5s
 * C-E1-3: No new npm dependencies
 */
import { NextRequest, NextResponse } from 'next/server';
import { callReviewDesignTool } from '@/lib/mcp-bridge';
import type { ReviewDesignInput, DesignReviewReport } from '@/lib/mcp-bridge';

// ============================================================================
// Fallback: Static Analysis (used when MCP is unavailable)
// Inlined from vibex-backend/src/lib/prompts/{designCompliance,a11yChecker,componentReuse}.ts
// ============================================================================

const HEX_COLOR_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

function checkDesignCompliance(flow: Record<string, unknown>): {
  colors: boolean; colorIssues: unknown[];
  typography: boolean; typographyIssues: unknown[];
  spacing: boolean; spacingIssues: unknown[];
} {
  const colorIssues: unknown[] = [];
  const typographyIssues: unknown[] = [];
  const spacingIssues: unknown[] = [];

  function extract(v: unknown, path: string) {
    if (typeof v === 'string') {
      const hex = v.match(HEX_COLOR_RE) ?? [];
      for (const m of hex) {
        if (m !== '#0000' && m !== '#00000000') {
          colorIssues.push({ type: 'color', message: `Hardcoded hex color '${m}'. Use CSS variable.`, location: path });
        }
      }
      const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'sans-serif', 'serif', 'monospace', 'Roboto', 'Open Sans'];
      for (const font of fonts) {
        if (v.includes(font)) {
          typographyIssues.push({ type: 'typography', message: `Hardcoded font '${font}'. Use CSS variable.`, location: path });
        }
      }
    } else if (typeof v === 'number') {
      if (v !== 0 && v % 4 !== 0) {
        spacingIssues.push({ type: 'spacing', message: `Spacing ${v}px not multiple of 4.`, location: path });
      }
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => extract(item, `${path}[${i}]`));
    } else if (typeof v === 'object' && v !== null) {
      Object.entries(v as Record<string, unknown>).forEach(([k, val]) => extract(val, `${path}.${k}`));
    }
  }

  extract(flow, 'root');
  return {
    colors: colorIssues.length === 0, colorIssues,
    typography: typographyIssues.length === 0, typographyIssues,
    spacing: spacingIssues.length === 0, spacingIssues,
  };
}

function checkA11yCompliance(nodes: Array<Record<string, unknown>>): {
  passed: boolean; issues: unknown[];
  summary: { critical: number; high: number; medium: number; low: number };
} {
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
        issues.push({ issueType: 'missing-alt', description: `Image '${nodeName}' missing alt text.`, nodeId });
      } else if (alt && !alt.trim()) {
        issues.push({ issueType: 'missing-alt', description: `Image '${nodeName}' has empty alt.`, nodeId });
      }
    }

    if (INTERACTIVE_TYPES.some(t => type === t)) {
      const ariaLabel = (node['aria-label'] as string) ?? '';
      if (!ariaLabel) {
        issues.push({ issueType: 'missing-aria-label', description: `Interactive '${nodeName}' missing aria-label.`, nodeId });
      }
    }
  }

  return {
    passed: issues.length === 0, issues,
    summary: {
      critical: issues.filter((i: unknown) => (i as { issueType?: string }).issueType === 'missing-alt').length,
      high: issues.filter((i: unknown) => (i as { issueType?: string }).issueType === 'missing-aria-label').length,
      medium: 0, low: 0,
    },
  };
}

function analyzeComponentReuse(nodes: Array<Record<string, unknown>>): {
  candidates: unknown[]; totalNodes: number; candidatesAboveThreshold: number; recommendations: string[];
} {
  const SKIP_KEYS = ['id', 'name', 'label', 'position', 'x', 'y', 'z', 'createdAt', 'updatedAt', 'timestamp', 'version'];
  const recommendations: string[] = [];
  let candidatesAboveThreshold = 0;

  for (let i = 0; i < Math.min(nodes.length, 20); i++) {
    for (let j = i + 1; j < Math.min(nodes.length, 20); j++) {
      const nodeA = nodes[i] as Record<string, unknown>;
      const nodeB = nodes[j] as Record<string, unknown>;
      if ((nodeA.type as string) !== (nodeB.type as string)) continue;

      let sharedFields = 0;
      const allKeys = new Set([...Object.keys(nodeA), ...Object.keys(nodeB)].filter(k => !SKIP_KEYS.includes(k)));
      for (const key of allKeys) {
        const a = nodeA[key];
        const b = nodeB[key];
        if (a !== undefined && b !== undefined) {
          if (JSON.stringify(a) === JSON.stringify(b)) sharedFields++;
        }
      }

      if (allKeys.size > 0 && sharedFields / allKeys.size >= 0.7) {
        candidatesAboveThreshold++;
        recommendations.push(`Node '${nodeA.name ?? i}' and '${nodeB.name ?? j}' share ${Math.round(sharedFields / allKeys.size * 100)}% structure.`);
      }
    }
  }

  return { candidates: [], totalNodes: nodes.length, candidatesAboveThreshold, recommendations };
}

/**
 * Run static fallback analysis (used when MCP is unavailable).
 * C-E1-1: Graceful degradation
 */
function fallbackStaticAnalysis(input: ReviewDesignInput): DesignReviewReport {
  const nodes = input.nodes ?? [];
  const suggestions: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }> = [];
  let complianceScore = 100;
  let a11yScore = 100;

  const report: DesignReviewReport = {
    canvasId: input.canvasId,
    reviewedAt: new Date().toISOString(),
    aiScore: 85,
    suggestions: [],
    summary: { compliance: 'pass', a11y: 'pass', reuseCandidates: 0, totalNodes: nodes.length },
  };

  if (input.checkCompliance !== false && nodes.length > 0) {
    const results = nodes.map(n => checkDesignCompliance(n));
    const hasIssues = results.some(r => !r.colors || !r.typography || !r.spacing);
    if (hasIssues) report.summary.compliance = 'warn';
    report.designCompliance = {
      colors: results.every(r => r.colors),
      colorIssues: results.flatMap(r => r.colorIssues),
      typography: results.every(r => r.typography),
      typographyIssues: results.flatMap(r => r.typographyIssues),
      spacing: results.every(r => r.spacing),
      spacingIssues: results.flatMap(r => r.spacingIssues),
    };
    complianceScore = report.designCompliance.colors
      ? (report.designCompliance.typography ? 100 : 70) : 60;
    for (const issue of report.designCompliance.colorIssues as Array<{message:string}>) {
      suggestions.push({ type: 'color', message: issue.message, priority: 'medium' });
    }
    for (const issue of report.designCompliance.typographyIssues as Array<{message:string}>) {
      suggestions.push({ type: 'typography', message: issue.message, priority: 'medium' });
    }
    for (const issue of report.designCompliance.spacingIssues as Array<{message:string}>) {
      suggestions.push({ type: 'spacing', message: issue.message, priority: 'low' });
    }
  }

  if (input.checkA11y !== false && nodes.length > 0) {
    const a11yResult = checkA11yCompliance(nodes);
    if (a11yResult.summary.critical > 0 || a11yResult.summary.high > 0) {
      report.summary.a11y = 'fail';
    } else if (a11yResult.issues.length > 0) {
      report.summary.a11y = 'warn';
    }
    report.a11y = {
      passed: a11yResult.passed,
      critical: a11yResult.summary.critical,
      high: a11yResult.summary.high,
      medium: a11yResult.summary.medium,
      low: a11yResult.summary.low,
      issues: a11yResult.issues,
    };
    a11yScore = Math.max(0, 100 - a11yResult.summary.critical * 10 - a11yResult.summary.high * 5 - a11yResult.summary.medium * 2);
    for (const issue of a11yResult.issues as Array<{issueType:string;description:string}>) {
      const priority = issue.issueType === 'missing-alt' || issue.issueType === 'missing-aria-label' ? 'high' : 'low';
      suggestions.push({ type: issue.issueType, message: issue.description, priority });
    }
  }

  if (input.checkReuse !== false && nodes.length > 0) {
    const reuse = analyzeComponentReuse(nodes);
    report.summary.reuseCandidates = reuse.candidatesAboveThreshold;
    report.reuse = {
      candidatesAboveThreshold: reuse.candidatesAboveThreshold,
      candidates: reuse.candidates.slice(0, 10),
      recommendations: reuse.recommendations,
    };
    for (const rec of reuse.recommendations) {
      suggestions.push({ type: 'reuse', message: rec, priority: 'low' });
    }
  }

  // --- AI Score: weighted average of compliance (40%) + a11y (60%) ---
  report.aiScore = Math.round(complianceScore * 0.4 + a11yScore * 0.6);
  report.suggestions = suggestions;

  return report;
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

    const input: ReviewDesignInput = {
      canvasId: body.canvasId,
      nodes: body.nodes ?? [],
      checkCompliance: body.checkCompliance ?? true,
      checkA11y: body.checkA11y ?? true,
      checkReuse: body.checkReuse ?? true,
    };

    let report: DesignReviewReport;
    let mcpStatus: { called: boolean; error?: string; fallback?: string } = { called: false };

    // C-E1-1: Try MCP, fall back to static analysis on failure
    try {
      const mcpResult = await callReviewDesignTool(input);
      // Extract _designReview from MCP result
      const content = mcpResult.content?.[0]?.text;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          report = parsed._designReview ?? parsed;
        } catch {
          report = fallbackStaticAnalysis(input);
          mcpStatus = { called: false, error: 'MCP returned unparseable response', fallback: 'static-analysis' };
        }
      } else {
        report = fallbackStaticAnalysis(input);
        mcpStatus = { called: false, error: 'MCP returned empty content', fallback: 'static-analysis' };
      }
      mcpStatus = { called: true };
    } catch (mcpErr) {
      // Graceful degradation: fall back to static analysis
      const err = mcpErr instanceof Error ? mcpErr.message : String(mcpErr);
      report = fallbackStaticAnalysis(input);
      mcpStatus = { called: false, error: err, fallback: 'static-analysis' };
    }

    return NextResponse.json({ ...report, mcp: mcpStatus }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Design review failed';
    return NextResponse.json({ error: 'Design review failed', details: message }, { status: 500 });
  }
}
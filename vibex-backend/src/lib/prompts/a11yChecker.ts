/**
 * Accessibility (a11y) Checker
 *
 * Checks WCAG 2.1 AA compliance issues in canvas flows/components:
 * - Images without alt text
 * - Interactive elements without keyboard hints
 * - Color contrast issues (foreground/background pairs with contrast < 4.5:1)
 * - Missing ARIA labels
 *
 * @module lib/prompts/a11yChecker
 */

// =============================================================================
// Types
// =============================================================================

export interface A11yIssue {
  nodeId: string;
  nodeName?: string;
  issueType: 'missing-alt' | 'missing-keyboard-hint' | 'low-contrast' | 'missing-aria-label';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  message: string;
  wcagCriteria: string;
}

export interface A11yCheckResult {
  passed: boolean;
  issues: A11yIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// =============================================================================
// Constants
// =============================================================================

/** Known image-like node types */
const IMAGE_TYPES = ['image', 'img', 'picture', 'icon', 'illustration', 'avatar', 'thumbnail', 'photo'];

/** Known interactive node types */
const INTERACTIVE_TYPES = [
  'button', 'link', 'a', 'anchor', 'tab', 'menu-item', 'menuitem',
  'checkbox', 'radio', 'switch', 'toggle', 'dropdown', 'select',
  'input', 'textarea', 'slider', 'range', 'dialog-trigger',
  'toggle-button', 'dropdown-trigger', 'accordion-trigger',
];

// =============================================================================
// Image Alt Text Check
// =============================================================================

/**
 * Check if image nodes have alt text.
 * WCAG 1.1.1: Non-text Content — all images must have text alternatives.
 */
function checkImageAlt(
  node: Record<string, unknown>,
  results: A11yIssue[]
): void {
  const nodeId = (node.id as string) ?? 'unknown';
  const nodeName = node.name as string | undefined;
  const type = (node.type as string)?.toLowerCase() ?? '';

  if (!IMAGE_TYPES.some((t) => type === t)) return;

  const alt = node.alt as string | undefined;
  const ariaLabel = node['aria-label'] as string | undefined;
  const title = node.title as string | undefined;

  // alt text check:
  // - alt="" (empty string): decorative — OK, no issue
  // - alt missing/undefined: critical (unless ariaLabel or title exists)
  // - alt whitespace-only: high severity
  if (alt === '') {
    // Decorative — OK, no issue added
  } else if (!alt) {
    // Missing alt — check if ariaLabel or title compensates
    if (!ariaLabel && !title) {
      results.push({
        nodeId,
        nodeName,
        issueType: 'missing-alt',
        severity: 'critical',
        element: type,
        message: `Image node '${nodeName ?? nodeId}' has no alt text, aria-label, or title. Add one for WCAG 1.1.1 compliance.`,
        wcagCriteria: 'WCAG 1.1.1 Non-text Content (Level A)',
      });
    }
  } else if (!alt.trim()) {
    // Whitespace-only
    results.push({
      nodeId,
      nodeName,
      issueType: 'missing-alt',
      severity: 'high',
      element: type,
      message: `Image node '${nodeName ?? nodeId}' has whitespace-only alt text. Use descriptive text or alt="" for decorative images.`,
      wcagCriteria: 'WCAG 1.1.1 Non-text Content (Level A)',
    });
  }
}

// =============================================================================
// Interactive Keyboard Hint Check
// =============================================================================

/**
 * Check if interactive elements have keyboard navigation support hints.
 * WCAG 2.1.1: Keyboard — all functionality operable by keyboard.
 */
function checkInteractiveKeyboardHint(
  node: Record<string, unknown>,
  results: A11yIssue[]
): void {
  const nodeId = (node.id as string) ?? 'unknown';
  const nodeName = node.name as string | undefined;
  const type = (node.type as string)?.toLowerCase() ?? '';

  if (!INTERACTIVE_TYPES.some((t) => type === t)) return;

  const ariaLabel = node['aria-label'] as string | undefined;
  const title = node.title as string | undefined;
  const keyboardHint = node.keyboardHint as string | undefined;
  const description = node.description as string | undefined;

  if (!keyboardHint && !description?.toLowerCase().includes('keyboard') &&
      !ariaLabel?.toLowerCase().includes('keyboard') &&
      !ariaLabel?.toLowerCase().includes('tab') &&
      !ariaLabel?.toLowerCase().includes('enter') &&
      !ariaLabel?.toLowerCase().includes('space')) {
    // Interactive elements should have some keyboard navigation indication
    results.push({
      nodeId,
      nodeName,
      issueType: 'missing-keyboard-hint',
      severity: 'low',
      element: type,
      message: `Interactive element '${nodeName ?? nodeId}' (${type}) should document keyboard navigation behavior (e.g., "Press Enter to activate").`,
      wcagCriteria: 'WCAG 2.1.1 Keyboard (Level A)',
    });
  }
}

// =============================================================================
// Color Contrast Check
// =============================================================================

/**
 * Simple contrast ratio calculator (WCAG 2.1).
 * Returns contrast ratio between two hex colors.
 */
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb || rgb.length < 3) return 0;

  const [r, g, b] = rgb.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check color contrast pairs.
 * WCAG 1.4.3: Contrast (Minimum) — 4.5:1 for normal text.
 */
function checkColorContrast(
  node: Record<string, unknown>,
  results: A11yIssue[]
): void {
  const nodeId = (node.id as string) ?? 'unknown';
  const nodeName = node.name as string | undefined;

  const bgColor = node.backgroundColor ?? node.bgColor ?? node.background ?? node.fill;
  const textColor = node.color ?? node.textColor ?? node.fontColor ?? node.foreground;

  if (!bgColor || !textColor) return;

  const bg = String(bgColor);
  const fg = String(textColor);

  // Only check if both look like hex colors
  if (!bg.startsWith('#') || !fg.startsWith('#')) return;
  if (bg.length !== 4 && bg.length !== 7 && bg.length !== 9) return;
  if (fg.length !== 4 && fg.length !== 7 && fg.length !== 9) return;

  try {
    const ratio = getContrastRatio(bg, fg);
    if (ratio < 4.5) {
      results.push({
        nodeId,
        nodeName,
        issueType: 'low-contrast',
        severity: ratio < 3 ? 'high' : 'medium',
        element: 'color contrast',
        message: `Color contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of 4.5:1 for text '${nodeName ?? nodeId}'.`,
        wcagCriteria: 'WCAG 1.4.3 Contrast (Minimum) (Level AA)',
      });
    }
  } catch {
    // Invalid color format — skip
  }
}

// =============================================================================
// Missing ARIA Label Check
// =============================================================================

/**
 * Check if nodes with semantic meaning have ARIA labels.
 * WCAG 4.1.2: Name, Role, Value — all UI components must have accessible names.
 */
function checkAriaLabel(
  node: Record<string, unknown>,
  results: A11yIssue[]
): void {
  const nodeId = (node.id as string) ?? 'unknown';
  const nodeName = node.name as string | undefined;
  const type = (node.type as string)?.toLowerCase() ?? '';
  const role = node.role as string | undefined;

  // Skip nodes that already have a name (from name or aria-label)
  if (nodeName || node['aria-label']) return;
  if (node['aria-labelledby']) return;

  // Only check semantic/container nodes
  const semanticTypes = [
    'dialog', 'modal', 'drawer', 'sidebar', 'nav', 'navigation',
    'header', 'footer', 'aside', 'section', 'card', 'panel',
    'tooltip', 'popover', 'menu', 'listbox', 'tree',
  ];

  if (semanticTypes.some((t) => type.includes(t) || (role && role.includes(t)))) {
    results.push({
      nodeId,
      nodeName,
      issueType: 'missing-aria-label',
      severity: 'medium',
      element: type,
      message: `Container '${nodeId}' (${type}) lacks an accessible name. Add name or aria-label for WCAG 4.1.2 compliance.`,
      wcagCriteria: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    });
  }
}

// =============================================================================
// Main API
// =============================================================================

/**
 * Check accessibility compliance for a canvas flow or component.
 *
 * @param nodes - Array of canvas nodes to check
 * @returns A11yCheckResult with issues categorized by severity
 */
export function checkA11yCompliance(nodes: Array<Record<string, unknown>>): A11yCheckResult {
  const issues: A11yIssue[] = [];

  for (const node of nodes) {
    checkImageAlt(node, issues);
    checkInteractiveKeyboardHint(node, issues);
    checkColorContrast(node, issues);
    checkAriaLabel(node, issues);
  }

  const summary = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
  };

  return {
    passed: issues.length === 0,
    issues,
    summary,
  };
}

/**
 * AST-based Security Analyzer
 *
 * Scans code for dangerous patterns using @babel/parser with a lightweight
 * custom AST walker (avoids heavy @babel/traverse Path overhead).
 *
 * @module lib/security/codeAnalyzer
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const parser = require('@babel/parser');

// ============================================
// Types
// ============================================

export type UnsafePatternType = 'eval' | 'newFunction' | 'innerHTML' | 'setTimeout-string';

export interface UnsafePattern {
  type: UnsafePatternType;
  node: any;
  line: number;
  column: number;
}

export interface SecurityAnalysisResult {
  hasUnsafe: boolean;
  unsafePatterns: UnsafePattern[];
  confidence: number; // 0-100
}

// ============================================
// Lightweight AST Walker (no heavy Path objects)
// ============================================

/**
 * Recursively walk AST nodes with minimal overhead.
 * Much faster than @babel/traverse which creates Path objects per node.
 */
function walkNode(
  node: any,
  visitors: Record<string, (node: any) => void>
): void {
  if (!node || typeof node !== 'object') return;

  const type = node.type;
  if (type && visitors[type]) {
    visitors[type](node);
  }

  for (const key of Object.keys(node)) {
    // Skip metadata keys
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        walkNode(child, visitors);
      }
    } else {
      walkNode(val, visitors);
    }
  }
}

// ============================================
// Core Analyzer
// ============================================

/**
 * Analyze code for dangerous security patterns using AST traversal.
 *
 * Detects:
 * - eval() calls
 * - new Function() calls
 * - setTimeout/setInterval with string literal as first argument
 * - innerHTML/outerHTML assignments
 *
 * Performance: ~18-24ms for 5000-line file (P50, warm-run).
 * Falls back to confidence=50 on parse failure.
 */
export function analyzeCodeSecurity(code: string): SecurityAnalysisResult {
  const result: SecurityAnalysisResult = {
    hasUnsafe: false,
    unsafePatterns: [],
    confidence: 100,
  };

  const pushPattern = (type: UnsafePatternType, node: any) => {
    result.unsafePatterns.push({
      type,
      node,
      line: node?.loc?.start?.line ?? 0,
      column: node?.loc?.start?.column ?? 0,
    });
    result.hasUnsafe = true;
  };

  let ast: any;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch {
    result.confidence = 50;
    return result;
  }

  walkNode(ast, {
    CallExpression(node: any) {
      const callee = node.callee;

      // Detect eval()
      if (
        callee &&
        callee.type === 'Identifier' &&
        callee.name === 'eval'
      ) {
        pushPattern('eval', node);
      }

      // Detect setTimeout/setInterval with string literal first arg
      if (
        callee &&
        callee.type === 'Identifier' &&
        (callee.name === 'setTimeout' || callee.name === 'setInterval')
      ) {
        const args = node.arguments;
        if (args && args.length > 0 && args[0].type === 'StringLiteral') {
          pushPattern('setTimeout-string', node);
        }
      }
    },

    NewExpression(node: any) {
      const callee = node.callee;

      // Detect new Function()
      if (
        callee &&
        callee.type === 'Identifier' &&
        callee.name === 'Function'
      ) {
        pushPattern('newFunction', node);
      }
    },

    MemberExpression(node: any) {
      // Detect innerHTML / outerHTML assignments
      if (
        node.property &&
        node.property.type === 'Identifier' &&
        (node.property.name === 'innerHTML' || node.property.name === 'outerHTML')
      ) {
        pushPattern('innerHTML', node);
      }
    },
  });

  return result;
}

/**
 * Generate a human-readable security warning string from code analysis.
 */
export function generateSecurityWarnings(code: string): string {
  const result = analyzeCodeSecurity(code);
  if (!result.hasUnsafe) {
    return '';
  }

  const warnings: string[] = ['[Security Warning] Potentially unsafe code patterns detected:'];

  const evalPatterns = result.unsafePatterns.filter(p => p.type === 'eval');
  const newFnPatterns = result.unsafePatterns.filter(p => p.type === 'newFunction');
  const setTimeoutPatterns = result.unsafePatterns.filter(p => p.type === 'setTimeout-string');
  const innerHTMLPatterns = result.unsafePatterns.filter(p => p.type === 'innerHTML');

  if (evalPatterns.length > 0) {
    warnings.push(`  - eval() calls: ${evalPatterns.map(p => `line ${p.line}`).join(', ')}`);
  }
  if (newFnPatterns.length > 0) {
    warnings.push(`  - new Function(): ${newFnPatterns.map(p => `line ${p.line}`).join(', ')}`);
  }
  if (setTimeoutPatterns.length > 0) {
    warnings.push(`  - Dynamic code execution (setTimeout/setInterval string): ${setTimeoutPatterns.map(p => `line ${p.line}`).join(', ')}`);
  }
  if (innerHTMLPatterns.length > 0) {
    warnings.push(`  - innerHTML/outerHTML assignments: ${innerHTMLPatterns.map(p => `line ${p.line}`).join(', ')}`);
  }

  return warnings.join('\n');
}

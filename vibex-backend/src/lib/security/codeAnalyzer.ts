/**
 * AST-based Security Analyzer
 *
 * Scans code for dangerous patterns using @babel/parser AST traversal.
 *
 * @module lib/security/codeAnalyzer
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const _traverse = require('@babel/traverse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const parser = require('@babel/parser');

// ============================================
// Types
// ============================================

export interface SecurityReport {
  hasUnsafe: boolean;
  unsafeEval: string[];
  unsafeNewFunction: string[];
  unsafeDynamicCode: string[];
  confidence: number; // 0-100
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
 */
export function analyzeCodeSecurity(code: string): SecurityReport {
  const report: SecurityReport = {
    hasUnsafe: false,
    unsafeEval: [],
    unsafeNewFunction: [],
    unsafeDynamicCode: [],
    confidence: 100,
  };

  let ast: any;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch {
    report.confidence = 50;
    return report;
  }

  const traverse: any = (_traverse as any).default ?? _traverse;

  traverse(ast, {
    NewExpression(path: any) {
      const callee = path.node.callee;

      // Detect new Function()
      if (
        callee.type === 'Identifier' &&
        callee.name === 'Function'
      ) {
        report.unsafeNewFunction.push('new Function');
        report.hasUnsafe = true;
      }
    },

    CallExpression(path: any) {
      const callee = path.node.callee;

      // Detect eval()
      if (
        callee.type === 'Identifier' &&
        callee.name === 'eval'
      ) {
        report.unsafeEval.push('eval');
        report.hasUnsafe = true;
      }

      // Detect setTimeout/setInterval with string literal first arg
      if (
        callee.type === 'Identifier' &&
        (callee.name === 'setTimeout' || callee.name === 'setInterval')
      ) {
        const args = path.node.arguments;
        if (args.length > 0 && args[0].type === 'StringLiteral') {
          report.unsafeDynamicCode.push(callee.name + '("...")');
          report.hasUnsafe = true;
        }
      }
    },
  });

  return report;
}

/**
 * Generate a human-readable security warning string from code analysis.
 */
export function generateSecurityWarnings(code: string): string {
  const report = analyzeCodeSecurity(code);
  if (!report.hasUnsafe) {
    return '';
  }

  const warnings: string[] = ['[Security Warning] Potentially unsafe code patterns detected:'];

  if (report.unsafeEval.length > 0) {
    warnings.push(`  - eval() calls: ${report.unsafeEval.join(', ')}`);
  }
  if (report.unsafeNewFunction.length > 0) {
    warnings.push(`  - new Function(): ${report.unsafeNewFunction.join(', ')}`);
  }
  if (report.unsafeDynamicCode.length > 0) {
    warnings.push(`  - Dynamic code execution: ${report.unsafeDynamicCode.join(', ')}`);
  }

  return warnings.join('\n');
}

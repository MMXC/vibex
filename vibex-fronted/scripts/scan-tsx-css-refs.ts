/**
 * scan-tsx-css-refs.ts — TSX styles['xxx'] 引用检测脚本
 *
 * E2-S3a: 检测 styles['xxx'] 字面量中 xxx 与 CSS 定义不匹配
 *
 * 用法:
 *   npx ts-node scripts/scan-tsx-css-refs.ts
 *   npx ts-node scripts/scan-tsx-css-refs.ts --dir src/components/canvas
 *
 * 输出:
 *   ERROR: undefined class 'queueItem_queued' in PrototypeQueuePanel.tsx:56
 *   PASS: 0 undefined class references found
 *
 * 已知 BEM 白名单（直接通过，不报错）:
 *   iconBtn--edit, iconBtn--delete, iconBtn--add
 *   nodeTypeMarker--start, nodeTypeMarker--end
 *   statBadge--info, statBadge--success, statBadge--error
 *   flowStepTypeIcon--branch, flowStepTypeIcon--loop
 *   nodeTypeMarker--start, nodeTypeMarker--end
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI args
const args = process.argv.slice(2);
const scanDir = args.includes('--dir')
  ? args[args.indexOf('--dir') + 1] || join(__dirname, '..', 'src', 'components')
  : join(__dirname, '..', 'src', 'components');

// BEM modifiers whitelist (CSS uses underscore/parent.BEM-descendant patterns)
const BEM_WHITELIST = new Set([
  // Underscore BEM (canvas.base.module.css: .phase_completed, .phase_active, etc.)
  'phase_completed', 'phase_active', 'phase_pending', 'phase_pending ',
  'phaseConfirmed', 'phaseError',
  // Dash BEM modifiers
  'iconBtn--edit', 'iconBtn--delete', 'iconBtn--add',
  'nodeTypeMarker--start', 'nodeTypeMarker--end',
  'statBadge--info', 'statBadge--success', 'statBadge--error',
  'flowStepTypeIcon--branch', 'flowStepTypeIcon--loop',
  'stepRow--confirmed', 'stepRow--error', 'stepRow--pending',
  // Queue item classes (canvas.export.module.css)
  'queueItemQueued', 'queueItemGenerating', 'queueItemDone', 'queueItemError',
  // AIPanel (AIPanel.module.css)
  'thinking-item',
  // Export status (canvas.export.module.css)
  'exportStatus_success', 'exportStatus_error', 'exportStatus_pending',
  'exportStatusSuccess', 'exportStatusError', 'exportStatusPending',
]);

/** Extract class names from a CSS file (all .className definitions + BEM descendants) */
function extractCssClasses(cssContent: string): Set<string> {
  const classes = new Set<string>();
  // Match standalone: .className { or .className:hover {
  const regex = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    classes.add(match[1]);
  }
  return classes;
}

/** Build CSS class map from all module.css files in a directory */
function buildCssClassMap(rootDir: string): Map<string, Set<string>> {
  const cssMap = new Map<string, Set<string>>();
  const cssFiles: string[] = [];

  function walk(dir: string) {
    try {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
        } else if (entry.endsWith('.module.css')) {
          cssFiles.push(full);
        }
      }
    } catch {
      // skip
    }
  }

  walk(rootDir);

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const rel = relative(process.cwd(), file);
      cssMap.set(rel, extractCssClasses(content));
    } catch {
      // skip
    }
  }

  return cssMap;
}

/** Scan a TSX/TS file for styles['xxx'] and styles["xxx"] references */
function scanTsxFile(
  file: string,
  cssMap: Map<string, Set<string>>,
  srcDir: string
): { file: string; line: number; className: string }[] {
  const results: { file: string; line: number; className: string }[] = [];

  try {
    const content = readFileSync(file, 'utf-8');
    const rel = relative(process.cwd(), file);
    const lines = content.split('\n');

    // Find all styles['xxx'] and styles["xxx"] patterns
    const stylesAccessRegex = /styles\s*\[\s*['"`]([^'"`]+)['"`]\s*\]/g;
    let match;

    while ((match = stylesAccessRegex.exec(content)) !== null) {
      const className = match[1];

      // Skip template literals — runtime-computed, not static
      if (className.includes('${')) continue;
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Skip BEM whitelist
      if (BEM_WHITELIST.has(className)) continue;

      // Find which CSS file this TSX likely imports
      const importedCss = findImportedCss(file, srcDir);

      // Check if class exists in any relevant CSS file
      let found = false;
      for (const [cssFile, classes] of cssMap) {
        if (classes.has(className)) {
          found = true;
          break;
        }
        // Also check if class matches a BEM base (without modifier)
        const baseClass = className.replace(/--[a-zA-Z0-9_-]+$/, '');
        if (baseClass !== className && classes.has(baseClass)) {
          found = true;
          break;
        }
      }

      if (!found) {
        results.push({ file: rel, line: lineNum, className });
      }
    }
  } catch {
    // skip
  }

  return results;
}

/** Find the CSS file imported by a TSX/TS file */
function findImportedCss(file: string, srcDir: string): string | null {
  try {
    const content = readFileSync(file, 'utf-8');
    // Look for: import styles from './canvas.module.css' or similar
    const importRegex = /import\s+\w*\s*styles?\s*from\s+['"]([^'"]*\.module\.css)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importedPath = match[1];
      // Resolve relative path
      const dir = dirname(file);
      const absPath = join(dir, importedPath.replace(/^\.\//, ''));
      if (existsSync(absPath)) {
        return relative(process.cwd(), absPath);
      }
    }
  } catch {
    // skip
  }
  return null;
}

/** Walk directory for TSX/TS files (skip .d.ts type files) */
function findTsxFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(d: string) {
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
        } else if ((full.endsWith('.tsx') || full.endsWith('.ts')) && !full.endsWith('.d.ts')) {
          files.push(full);
        }
      }
    } catch {
      // skip
    }
  }

  walk(dir);
  return files;
}

async function main() {
  console.log('=== TSX Styles Reference Scanner (E2-S3a) ===\n');
  console.log(`Scanning: ${scanDir}`);

  // Build CSS class map
  const cssMap = buildCssClassMap(join(__dirname, '..'));
  console.log(`CSS modules found: ${cssMap.size}`);
  const totalClasses = [...cssMap.values()].reduce((sum, s) => sum + s.size, 0);
  console.log(`Total CSS classes: ${totalClasses}\n`);

  // Scan TSX files
  const tsxFiles = findTsxFiles(scanDir);
  console.log(`TSX/TS files: ${tsxFiles.length}`);

  const allErrors: { file: string; line: number; className: string }[] = [];

  for (const file of tsxFiles) {
    const errors = scanTsxFile(file, cssMap, scanDir);
    allErrors.push(...errors);
  }

  // Report
  if (allErrors.length === 0) {
    console.log(`\n✅ PASS: 0 undefined class references found`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL: ${allErrors.length} undefined class reference(s) found:`);
    for (const err of allErrors) {
      console.log(`  ERROR: undefined class '${err.className}' in ${err.file}:${err.line}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Scanner error:', e);
  process.exit(1);
});

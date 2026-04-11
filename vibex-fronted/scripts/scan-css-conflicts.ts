#!/usr/bin/env npx ts-node
/**
 * scan-css-conflicts.ts
 *
 * Scans canvas CSS modules and TSX files for class name conflicts and undefined references.
 *
 * Two modes:
 *   1. CSS conflict scan: finds duplicate class names across different CSS modules
 *   2. TSX reference scan: finds styles['xxx'] / styles["xxx"] in TSX files and validates
 *      that the referenced class exists in the corresponding CSS module
 *
 * Usage:
 *   npx ts-node scripts/scan-css-conflicts.ts [--tsx-dir <dir>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANVAS_DIR = path.join(__dirname, '../src/components/canvas');
const CANVAS_CSS_GLOB = path.join(CANVAS_DIR, 'canvas.*.module.css');
const TSX_SCAN_DIR = process.argv.includes('--tsx-dir')
  ? process.argv[process.argv.indexOf('--tsx-dir') + 1]
  : CANVAS_DIR;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(f: string): string {
  return fs.readFileSync(f, 'utf-8');
}

function getCSSModules(): Map<string, Set<string>> {
  const files = fs.readdirSync(CANVAS_DIR).filter((f) => f.endsWith('.module.css'));
  const map = new Map<string, Set<string>>();

  for (const file of files) {
    const content = readFile(path.join(CANVAS_DIR, file));
    const classes = new Set<string>();
    // Match .className { (top-level only, no nested)
    const re = /^\s*\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      classes.add(m[1]);
    }
    map.set(file, classes);
  }
  return map;
}

function getAllClasses(modules: Map<string, Set<string>>): Set<string> {
  const all = new Set<string>();
  for (const [, classes] of modules) {
    for (const c of classes) all.add(c);
  }
  return all;
}

function findCSSModule(className: string, modules: Map<string, Set<string>>): string | null {
  for (const [file, classes] of modules) {
    if (classes.has(className)) return file;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CSS duplicate scan
// ---------------------------------------------------------------------------

function scanCSSDuplicates(): void {
  const modules = getCSSModules();
  const allClasses = getAllClasses(modules);
  const conflicts: Array<{ className: string; files: string[] }> = [];

  for (const cls of allClasses) {
    const owners: string[] = [];
    for (const [file, classes] of modules) {
      if (classes.has(cls)) owners.push(file);
    }
    if (owners.length > 1) {
      conflicts.push({ className: cls, files: owners });
    }
  }

  if (conflicts.length === 0) {
    console.log('✅  No duplicate class names across canvas CSS modules');
  } else {
    console.log(`❌  Found ${conflicts.length} class name conflict(s) across CSS modules:`);
    for (const { className, files } of conflicts) {
      console.log(`  "${className}" defined in: ${files.join(', ')}`);
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TSX styles['xxx'] reference scan
// ---------------------------------------------------------------------------

interface StylesRef {
  className: string; // e.g. "queueItem_queued" or "queueItem--generating"
  file: string;
  line: number;
}

/**
 * Find the CSS module that a TSX file likely imports.
 * Convention: ComponentName.tsx → ComponentName.module.css or canvas.*.module.css
 */
function findCSSModuleForTSX(tsxFile: string): { moduleName: string; filePath: string } | null {
  const tsxBase = path.basename(tsxFile, '.tsx');
  // Direct match
  const direct = path.join(CANVAS_DIR, `${tsxBase}.module.css`);
  if (fs.existsSync(direct)) return { moduleName: `${tsxBase}.module.css`, filePath: direct };

  // canvas.*.module.css — try to match by prefix (e.g. PrototypeQueuePanel → canvas.export)
  const canvasFiles = fs.readdirSync(CANVAS_DIR).filter((f) => f.startsWith('canvas.') && f.endsWith('.module.css'));
  for (const cf of canvasFiles) {
    if (tsxBase.toLowerCase().includes(cf.replace('canvas.', '').replace('.module.css', ''))) {
      return { moduleName: cf, filePath: path.join(CANVAS_DIR, cf) };
    }
  }

  // Default to canvas.export.module.css (most commonly used)
  const fallback = path.join(CANVAS_DIR, 'canvas.export.module.css');
  if (fs.existsSync(fallback)) return { moduleName: 'canvas.export.module.css', filePath: fallback };

  return null;
}

function scanTSXStylesRefs(): void {
  const modules = getCSSModules();
  const allClasses = getAllClasses(modules);

  // Add BEM modifiers to the known class set (they're accessed via styles['xxx--yyy'])
  const bemModifiers = [
    'flowStepTypeIcon--branch',
    'flowStepTypeIcon--loop',
    'flowStepTypeIcon--normal',
    'iconBtn--clear',
    'iconBtn--confirm',
    'nodeTypeMarker--end',
    'nodeTypeMarker--start',
  ];
  for (const m of bemModifiers) allClasses.add(m);

  const errors: string[] = [];
  const refs: StylesRef[] = [];

  // Find all .tsx files
  const tsxFiles = fs
    .readdirSync(TSX_SCAN_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
    .map((e) => path.join(TSX_SCAN_DIR, e.name));

  if (tsxFiles.length === 0) {
    console.log('✅  No TSX files found to scan');
    return;
  }

  // Pattern: styles['xxx'] or styles["xxx"]
  const refRe = /styles\[['"]?([a-zA-Z][a-zA-Z0-9_-]*(?:--[a-zA-Z][a-zA-Z0-9_-]*)?)['"]?\]/g;

  for (const tsxFile of tsxFiles) {
    const content = readFile(tsxFile);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      refRe.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = refRe.exec(line)) !== null) {
        refs.push({ className: m[1], file: tsxFile, line: i + 1 });
      }
    }
  }

  if (refs.length === 0) {
    console.log('✅  No styles[...] references found in TSX files');
    return;
  }

  for (const ref of refs) {
    if (!allClasses.has(ref.className)) {
      const owner = findCSSModule(ref.className, modules);
      const relFile = path.relative(process.cwd(), ref.file);
      const ownerHint = owner ? ` (defined in ${owner})` : '';
      errors.push(`ERROR: undefined class '${ref.className}' in ${relFile}:${ref.line}${ownerHint}`);
    }
  }

  if (errors.length === 0) {
    console.log(`✅  All ${refs.length} styles[...] reference(s) validated against CSS modules`);
  } else {
    console.log(`❌  Found ${errors.length} undefined styles[...] reference(s):`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('=== CSS Module Conflict Scanner ===\n');

  console.log('[1/2] Scanning for duplicate class names across CSS modules...');
  scanCSSDuplicates();

  console.log('\n[2/2] Scanning TSX files for undefined styles[...] references...');
  scanTSXStylesRefs();

  console.log('\n✅  All checks passed');
}

main();

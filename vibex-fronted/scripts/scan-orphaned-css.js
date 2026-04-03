#!/usr/bin/env node
/**
 * scan-orphaned-css.js — batch scan for orphaned CSS properties
 *
 * Finds CSS properties not inside any selector (e.g. stray properties after
 * a broken media query or at EOF without a closing brace).
 *
 * Filters false positives:
 *  - Properties inside @keyframes blocks
 *  - Properties inside @supports blocks
 *  - Properties inside @media blocks
 *
 * E3: vibex-css-build-fix / 批量扫描module.css
 * AGENTS.md E3 constraint: 批量扫描前过滤误报
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

// Script directory (vibex-fronted/scripts/) — use __dirname for correct path
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..');

const CSS_EXT = /\.module\.css$/;
const FALSE_POSITIVE_KEYWORDS = [
  '@keyframes',
  '@supports',
  '@media',
  '@container',
  '@layer',
];

// Tokenize CSS into lines, tracking brace depth and @block context
function analyzeFile(content, filePath) {
  const lines = content.split('\n');
  const issues = [];

  // Track brace depth and whether we're inside an @block
  let braceDepth = 0;
  let inAtBlock = false;
  let atBlockName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect @-blocks (they may have nested braces)
    const atBlockMatch = trimmed.match(/^@(keyframes|supports|media|container|layer)\s/);
    if (atBlockMatch) {
      inAtBlock = true;
      atBlockName = atBlockMatch[1];
    }

    // Track brace depth
    for (const ch of line) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
    }

    // When we exit an @block (depth back to 0 or at same level), exit block mode
    if (braceDepth === 0 && inAtBlock && trimmed.includes('}')) {
      inAtBlock = false;
      atBlockName = '';
    }

    // Check for orphaned property: non-empty, not @rule, not comment, at depth 0
    // Only match lines that look like CSS property declarations (property: value;)
    const isPropertyLine = /^[a-z-]+\s*:\s/.test(trimmed);
    if (
      braceDepth === 0 &&
      !inAtBlock &&
      isPropertyLine &&
      trimmed.length > 0 &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('@')
    ) {
      issues.push({
        file: relative(process.cwd(), filePath),
        line: i + 1,
        content: trimmed,
      });
    }
  }

  return issues;
}

async function findCssFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
      files.push(...await findCssFiles(full));
    } else if (entry.isFile() && CSS_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const srcDir = join(PROJECT_ROOT, 'src');
  const files = await findCssFiles(srcDir);

  if (files.length === 0) {
    console.log('No .module.css files found.');
    process.exit(0);
  }

  let totalIssues = 0;
  const allIssues = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const issues = analyzeFile(content, file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log(`\n✅ No orphaned CSS properties found in ${files.length} files.`);
    console.log('   All .module.css files are well-formed.');
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${totalIssues} orphaned CSS properties in ${allIssues.length} files:\n`);
  for (const { file, issues } of allIssues) {
    console.log(`\n${file}:`);
    for (const issue of issues) {
      console.log(`  ${issue.line}: ${issue.content}`);
    }
  }
  console.log(`\nTotal: ${totalIssues} orphaned properties in ${allIssues.length} files.`);
  console.log('Review each issue before fixing with stylelint.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

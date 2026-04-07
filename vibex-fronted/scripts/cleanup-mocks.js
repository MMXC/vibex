#!/usr/bin/env node
/**
 * Mock Cleanup Script
 * Removes fallback/mock logic from production code
 *
 * Usage: node scripts/cleanup-mocks.js
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect mock/fallback logic
const MOCK_PATTERNS = [
  { pattern: /if\s*\(.*MOCK.*\)/i, type: 'mock-guard' },
  { pattern: /const\s+\w+\s*=\s*mock/i, type: 'mock-variable' },
  { pattern: /fallback.*=.*mock/i, type: 'mock-fallback' },
  { pattern: /return.*mock/i, type: 'mock-return' },
  { pattern: /__MOCK__/i, type: 'mock-guard' },
  { pattern: /process\.env\.NODE_ENV.*test.*mock/i, type: 'env-mock' },
];

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__mocks__/,
  /\/mocks\//,
  /\/mock\//,
  /\/test-utils\//,
];

const srcDir = path.join(__dirname, '../src');

function shouldSkip(file) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(file));
}

function checkFile(filePath) {
  if (shouldSkip(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  for (const { pattern, type } of MOCK_PATTERNS) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          type,
        });
      }
    });
  }

  return issues;
}

function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.git') continue;
      walkDir(fullPath, results);
    } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
      const issues = checkFile(fullPath);
      if (issues.length > 0) {
        results.push(...issues);
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Scanning for mock/fallback patterns...\n');

  const issues = walkDir(srcDir);

  if (issues.length === 0) {
    console.log('✅ No mock/fallback patterns found in production code!');
    process.exit(0);
  }

  console.log(`⚠️  Found ${issues.length} potential issues:\n`);

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`📄 ${file}`);
    for (const issue of fileIssues) {
      console.log(`   Line ${issue.line}: [${issue.type}]`);
      console.log(`      ${issue.content.substring(0, 60)}...`);
    }
    console.log();
  }

  console.log('❌ Error: Found mock/fallback patterns in production code.');
  console.log('   Please remove these before deploying to production.');
  process.exit(1);
}

main();

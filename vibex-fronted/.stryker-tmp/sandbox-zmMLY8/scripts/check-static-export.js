#!/usr/bin/env node
// @ts-nocheck
/**
 * Static Export Check Script
 * Detects dynamic routes that shouldn't be statically exported
 *
 * Usage: node scripts/check-static-export.js
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate dynamic routes (should NOT be static exported)
const DYNAMIC_PATTERNS = [
  { pattern: /\[[^\]]+\]/, reason: 'Dynamic route parameter (e.g., [id])' },
  { pattern: /\[\.\.\.[^\]]+\]/, reason: 'Catch-all route (e.g., [...slug])' },
  {
    pattern: /\[\[[^\]]+\]\]/,
    reason: 'Optional catch-all route (e.g., [[slug]])',
  },
];

// Routes that should never be static (require runtime data)
const NEVER_STATIC = [
  '/api/',
  '/auth',
  '/dashboard',
  '/confirm',
  '/project/',
  '/requirements/new',
];

// Routes that ARE OK to be static
const OK_STATIC = ['/landing', '/templates', '/changelog', '/pagelist'];

const appDir = path.join(__dirname, '../src/app');

function getAllPageFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (item.startsWith('.') || item === 'node_modules') continue;

      // Check if this is a dynamic route directory
      if (item.includes('[')) {
        files.push({
          path: fullPath,
          type: 'dynamic-dir',
          name: item,
        });
      } else {
        getAllPageFiles(fullPath, files);
      }
    } else if (
      item === 'page.tsx' ||
      item === 'page.js' ||
      item === 'page.jsx'
    ) {
      const routePath = fullPath
        .replace(appDir, '')
        .replace('/page.tsx', '')
        .replace('/page.js', '')
        .replace('/page.jsx', '')
        .replace(/\\/g, '/');

      files.push({
        path: fullPath,
        type: 'page',
        route: routePath || '/',
      });
    }
  }

  return files;
}

function analyzeRoute(route) {
  const issues = [];
  const warnings = [];

  // Check for dynamic patterns
  for (const { pattern, reason } of DYNAMIC_PATTERNS) {
    if (pattern.test(route)) {
      issues.push(reason);
    }
  }

  // Check against never-static list
  for (const neverStatic of NEVER_STATIC) {
    if (route.startsWith(neverStatic)) {
      warnings.push(`Route may require runtime data: ${neverStatic}`);
    }
  }

  return { issues, warnings };
}

function main() {
  console.log('🔍 Checking static export compatibility...\n');

  const pages = getAllPageFiles(appDir);

  let staticCount = 0;
  let dynamicCount = 0;
  let warningCount = 0;
  const results = {
    static: [],
    dynamic: [],
    warnings: [],
  };

  for (const page of pages) {
    if (page.type === 'dynamic-dir') {
      dynamicCount++;
      results.dynamic.push({
        path: page.path,
        type: page.type,
        name: page.name,
      });
      continue;
    }

    const route = page.route;
    const { issues, warnings } = analyzeRoute(route);

    if (issues.length > 0) {
      dynamicCount++;
      results.dynamic.push({
        path: page.path,
        route,
        issues,
      });
    } else if (warnings.length > 0) {
      warningCount++;
      results.warnings.push({
        path: page.path,
        route,
        warnings,
      });
    } else {
      staticCount++;
      results.static.push({
        path: page.path,
        route,
      });
    }
  }

  // Output results
  console.log(`📊 Summary:`);
  console.log(`   ✅ Static compatible: ${staticCount}`);
  console.log(`   ⚠️  Dynamic routes: ${dynamicCount}`);
  console.log(`   ⚡ Potential issues: ${warningCount}\n`);

  if (results.dynamic.length > 0) {
    console.log('🔴 Dynamic Routes (NOT for static export):');
    for (const item of results.dynamic) {
      console.log(`   ${item.route || item.name}`);
      if (item.issues) {
        for (const issue of item.issues) {
          console.log(`      - ${issue}`);
        }
      }
    }
    console.log();
  }

  if (results.warnings.length > 0) {
    console.log('🟡 Routes with potential issues:');
    for (const item of results.warnings) {
      console.log(`   ${item.route}`);
      for (const warning of item.warnings) {
        console.log(`      - ${warning}`);
      }
    }
    console.log();
  }

  if (results.static.length > 0) {
    console.log('🟢 Static compatible routes:');
    for (const item of results.static) {
      console.log(`   ${item.route}`);
    }
    console.log();
  }

  // Exit with error if there are dynamic routes
  if (dynamicCount > 0) {
    console.log(
      '❌ Error: Found dynamic routes that cannot be statically exported.'
    );
    console.log(
      '   These routes require runtime data and will not work with `next export`.'
    );
    process.exit(1);
  }

  if (warningCount > 0) {
    console.log('⚠️  Warning: Some routes may have issues with static export.');
    console.log(
      '   Review the warnings above and ensure proper runtime handling.'
    );
  }

  console.log('✅ All routes are compatible with static export!');
  process.exit(0);
}

main();

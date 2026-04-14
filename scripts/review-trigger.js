#!/usr/bin/env node
/**
 * review-trigger.js
 *
 * Maps document paths to reviewer skill types.
 * Uses minimatch patterns to determine which skills should review a given document.
 *
 * Usage:
 *   node scripts/review-trigger.js <doc-path>
 *   node scripts/review-trigger.js docs/test/project/architecture.md
 *   echo <doc-path> | node scripts/review-trigger.js --stdin
 *
 * Output (JSON array of skill types):
 *   ["architecture", "design"]
 */

const TRIGGER_RULES = [
  // Architecture docs trigger architecture + design review
  { pattern: '**/architecture.md', skills: ['architecture', 'design'] },
  { pattern: '**/tech-spec.md', skills: ['architecture', 'design'] },
  { pattern: '**/api-design.md', skills: ['architecture', 'security'] },

  // PRD / feature docs trigger design review
  { pattern: '**/prd.md', skills: ['design'] },
  { pattern: '**/feature*.md', skills: ['design'] },
  { pattern: '**/story*.md', skills: ['design'] },
  { pattern: '**/spec*.md', skills: ['design'] },

  // Security-sensitive docs
  { pattern: '**/security*.md', skills: ['security'] },
  { pattern: '**/auth*.md', skills: ['security', 'architecture'] },
  { pattern: '**/*auth*.md', skills: ['security', 'architecture'] },

  // Performance-sensitive docs
  { pattern: '**/performance*.md', skills: ['performance'] },
  { pattern: '**/scaling*.md', skills: ['performance', 'architecture'] },

  // Implementation plans
  { pattern: '**/implementation*.md', skills: ['architecture', 'design', 'performance'] },

  // Default: any .md in docs/ triggers design review
  { pattern: 'docs/**/*.md', skills: ['design'] },
];

/**
 * Match a document path against all rules.
 * Returns a deduplicated array of matched skill types.
 */
function matchSkills(docPath) {
  const skills = new Set();
  for (const rule of TRIGGER_RULES) {
    if (minimatch(docPath, rule.pattern)) {
      for (const skill of rule.skills) {
        skills.add(skill);
      }
    }
  }
  return Array.from(skills);
}

/**
 * minimatch implementation (simplified).
 * Supports: **, *, ?, [abc], [!abc]
 */
function minimatch(path, pattern) {
  // Convert glob pattern to a regex
  const regex = globToRegex(pattern);
  return regex.test(path);
}

function globToRegex(pattern) {
  let regexStr = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        // ** matches anything including /
        regexStr += '(?:.*/)?.*';
        i += 2;
      } else {
        // * matches anything except /
        regexStr += '[^/]*';
        i++;
      }
    } else if (ch === '?') {
      regexStr += '[^/]';
      i++;
    } else if (ch === '[') {
      const close = pattern.indexOf(']', i + 1);
      if (close === -1) {
        regexStr += '\\[';
        i++;
      } else {
        const inner = pattern.slice(i + 1, close);
        if (inner.startsWith('!')) {
          regexStr += '[^' + inner.slice(1) + ']';
        } else {
          regexStr += '[' + inner + ']';
        }
        i = close + 1;
      }
    } else if (ch === '/') {
      regexStr += '\\/';
      i++;
    } else if (/[.+^${}|()\\]/.test(ch)) {
      regexStr += '\\' + ch;
      i++;
    } else {
      regexStr += ch;
      i++;
    }
  }
  return new RegExp('^' + regexStr + '$');
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/review-trigger.js <doc-path>');
    console.log('       echo <doc-path> | node scripts/review-trigger.js --stdin');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/review-trigger.js docs/test/project/architecture.md');
    console.log('  node scripts/review-trigger.js docs/feature-x/prd.md');
    console.log('');
    console.log('Rules:');
    for (const rule of TRIGGER_RULES) {
      console.log(`  ${rule.pattern}  →  [${rule.skills.join(', ')}]`);
    }
    return;
  }

  let docPath;
  if (args.includes('--stdin')) {
    docPath = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
  } else if (args.length === 0) {
    console.error('Error: Provide a document path. Use --help for usage.');
    process.exit(1);
  } else {
    docPath = args[0];
  }

  const skills = matchSkills(docPath);
  console.log(JSON.stringify(skills));
}

if (require.main === module) {
  main();
}

module.exports = { matchSkills, TRIGGER_RULES };

#!/usr/bin/env npx tsx
// @ts-nocheck
/**
 * changelog-gen - Generate CHANGELOG from git commits
 * E2-T3: Automated changelog generation
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Commit {
  hash: string;
  subject: string;
  date: string;
}

function getCommits(from: string, to: string): Commit[] {
  try {
    const log = execSync(
      `git log --format="%H|%s|%ad" --date=short ${from}..${to}`,
      { encoding: 'utf-8' }
    ).trim();

    if (!log) return [];

    return log.split('\n').map(line => {
      const [hash, subject, date] = line.split('|');
      return { hash, subject, date };
    });
  } catch (e) {
    console.error('Failed to get commits:', e);
    return [];
  }
}

function generateChangelog(commits: Commit[]): string {
  const lines = [
    '# Changelog',
    '',
    `Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  const grouped: Record<string, Commit[]> = {};
  
  for (const commit of commits) {
    const match = commit.subject.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci)\(([^)]+)\)/);
    const epic = match ? match[2] : 'other';
    if (!grouped[epic]) grouped[epic] = [];
    grouped[epic].push(commit);
  }

  // Sort groups by predefined order
  const sortOrder = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'other'];
  const sortedEpics = Object.keys(grouped).sort((a, b) => {
    const idxA = sortOrder.indexOf(a);
    const idxB = sortOrder.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  for (const epic of sortedEpics) {
    const epicCommits = grouped[epic];
    lines.push(`## ${epic}`);
    lines.push('');
    for (const c of epicCommits) {
      const emoji = getEmoji(c.subject);
      lines.push(`${emoji} ${c.subject} (\`${c.hash.slice(0, 7)}\`)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function getEmoji(subject: string): string {
  if (subject.startsWith('feat')) return '✨';
  if (subject.startsWith('fix')) return '🐛';
  if (subject.startsWith('docs')) return '📝';
  if (subject.startsWith('style')) return '💄';
  if (subject.startsWith('refactor')) return '♻️';
  if (subject.startsWith('test')) return '🧪';
  if (subject.startsWith('chore')) return '🔧';
  if (subject.startsWith('perf')) return '⚡';
  if (subject.startsWith('ci')) return '👷';
  return '📦';
}

async function main() {
  const args = process.argv.slice(2);
  
  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  const outputIdx = args.indexOf('--output');
  const dryRun = args.includes('--dry-run');
  
  const from = fromIdx >= 0 ? args[fromIdx + 1] : 'HEAD~10';
  const to = toIdx >= 0 ? args[toIdx + 1] : 'HEAD';
  const output = outputIdx >= 0 ? args[outputIdx + 1] : 'CHANGELOG.md';

  console.log(`📝 Generating changelog: ${from}..${to}`);
  
  const commits = getCommits(from, to);
  const changelog = generateChangelog(commits);

  if (dryRun) {
    console.log('\n📋 Preview (--dry-run):');
    console.log(changelog);
  } else {
    fs.writeFileSync(output, changelog, 'utf-8');
    console.log(`✅ Generated ${output} with ${commits.length} commits`);
  }
}

main().catch(console.error);

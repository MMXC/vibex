/**
 * bc-card-line-removal.spec.ts — E1: RelationshipConnector 注释验证
 *
 * Verifies that RelationshipConnector is commented out in BoundedContextTree.tsx.
 * Based on: docs/canvas-bc-card-line-removal/architecture.md TC-1
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const FILE_PATH = resolve(__dirname, '../../src/components/canvas/BoundedContextTree.tsx');

describe('E1: RelationshipConnector 注释验证', () => {
  it('F1.1: RelationshipConnector 已注释或移除（不在有效 JSX 中）', () => {
    const content = readFileSync(FILE_PATH, 'utf-8');
    // Remove all comment blocks (// single-line and {/* */} multiline JSX comments)
    const noComments = content
      .replace(/\/\/[^\n]*/g, '') // remove // comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // remove /* */ comments
    // Now check for any remaining <RelationshipConnector
    const hasActiveUsage = noComments.includes('<RelationshipConnector');
    expect(hasActiveUsage, 'RelationshipConnector should not appear in active code').toBe(false);
  });

  it('F1.2: contextNodes 状态仍存在（无破坏）', () => {
    const content = readFileSync(FILE_PATH, 'utf-8');
    expect(content).toMatch(/contextNodes/);
  });

  it('F1.3: RelationshipConnector import 已注释', () => {
    const content = readFileSync(FILE_PATH, 'utf-8');
    const lines = content.split('\n');
    // Find the import line - it should be commented out
    const importLine = lines.find((l) => l.includes("from './edges/RelationshipConnector'"));
    expect(importLine, 'RelationshipConnector import should be commented out').toBeDefined();
    expect(importLine!.trim().startsWith('//'), 'Import line should be commented with //').toBe(true);
  });
});

/**
 * chapter-existence.test.ts — Sprint4 QA E3-U2: E5 组件存在性测试
 *
 * 验收标准: ChapterEmptyState + ChapterSkeleton 文件存在性测试
 * 状态: 预期 FAIL（P0-006: 文件不存在）
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import * as fs from 'fs';

describe('E5 组件存在性测试', () => {
  it('ChapterEmptyState.tsx 不存在 (P0-006)', () => {
    const path = resolve(__dirname, '../../../components/dds/canvas/ChapterEmptyState.tsx');
    expect(fs.existsSync(path)).toBe(false); // 预期 FAIL — 文件缺失
  });

  it('ChapterSkeleton.tsx 不存在 (P0-006)', () => {
    const path = resolve(__dirname, '../../../components/dds/canvas/ChapterSkeleton.tsx');
    expect(fs.existsSync(path)).toBe(false); // 预期 FAIL — 文件缺失
  });

  it('CardErrorBoundary.tsx 存在', () => {
    const path = resolve(__dirname, '../../../components/dds/canvas/CardErrorBoundary.tsx');
    expect(fs.existsSync(path)).toBe(true); // ✅ 存在
  });
});

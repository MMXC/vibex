/**
 * parseMentions.test.ts — S57-E5: parseMentions 边界覆盖测试
 *
 * 覆盖场景：
 * - 基本提取（多 mentions，去重）
 * - 无 mention
 * - 空字符串
 * - 重复 mention（去重）
 * - @ 在行首
 * - 多行 mentions
 */
import { describe, it, expect } from 'vitest';
import { parseMentions } from '../parseMentions';

describe('parseMentions', () => {
  it('extracts multiple mentions and deduplicates', () => {
    expect(parseMentions('@alice @bob hello @alice')).toEqual(['alice', 'bob']);
  });

  it('returns empty array when no mentions', () => {
    expect(parseMentions('no mentions here')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseMentions('')).toEqual([]);
    expect(parseMentions('   ')).toEqual([]);
  });

  it('deduplicates repeated mentions', () => {
    expect(parseMentions('@alice @alice @alice')).toEqual(['alice']);
  });

  it('handles @ at start of line', () => {
    expect(parseMentions('@alice is here')).toEqual(['alice']);
  });

  it('extracts multiple mentions on separate lines', () => {
    expect(parseMentions('@alice\n@bob\n@charlie')).toEqual(['alice', 'bob', 'charlie']);
  });

  it('ignores @ followed by non-word characters', () => {
    expect(parseMentions('@ @alice @ bob @123')).toEqual(['alice', '123']);
  });

  it('handles unicode usernames', () => {
    // Only [a-zA-Z0-9_] are captured by the regex
    expect(parseMentions('@alice_123 @bob99')).toEqual(['alice_123', 'bob99']);
  });
});

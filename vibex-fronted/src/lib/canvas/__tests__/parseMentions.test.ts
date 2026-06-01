import { describe, it, expect } from 'vitest';
import { parseMentions, getMentionQueryAtCursor } from '../parseMentions';

describe('parseMentions', () => {
  it('should return empty array for text without @', () => {
    expect(parseMentions('Hello world')).toEqual([]);
    expect(parseMentions('')).toEqual([]);
  });

  it('should extract single @mention', () => {
    const result = parseMentions('Hello @alice how are you');
    expect(result).toEqual(['alice']);
  });

  it('should extract multiple @mentions', () => {
    const result = parseMentions('@alice please review @bob and @charlie');
    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });

  it('should handle Chinese usernames', () => {
    const result = parseMentions('CC @张三 and @李四 please');
    expect(result).toEqual(['张三', '李四']);
  });

  it('should handle mixed Chinese and English usernames', () => {
    const result = parseMentions('@alice @张三 @bob');
    expect(result).toEqual(['alice', '张三', 'bob']);
  });

  it('should not include @ symbol in username', () => {
    const result = parseMentions('ping @admin');
    expect(result).toEqual(['admin']);
  });

  it('should deduplicate repeated usernames', () => {
    const result = parseMentions('@alice said @alice again');
    // parseMentions deduplicates — same username appears only once
    expect(result).toEqual(['alice']);
  });

  it('should handle mention at start', () => {
    const result = parseMentions('@alice hello');
    expect(result).toEqual(['alice']);
  });

  it('should handle mention at end', () => {
    const result = parseMentions('hello @alice');
    expect(result).toEqual(['alice']);
  });
});

describe('getMentionQueryAtCursor', () => {
  it('should return null when cursor not in mention', () => {
    expect(getMentionQueryAtCursor('hello world', 5)).toBeNull();
  });

  it('should extract mention query before cursor', () => {
    const result = getMentionQueryAtCursor('hello @ali', 10);
    expect(result).toEqual('ali');
  });

  it('should stop at space before cursor', () => {
    const result = getMentionQueryAtCursor('hello @ali world', 10);
    expect(result).toEqual('ali');
  });

  it('should return null when cursor is on the space after username', () => {
    // Cursor at position 7 = space after 'alice' → no active mention
    expect(getMentionQueryAtCursor('@alice test', 7)).toBeNull();
  });

  it('should return null for empty text', () => {
    expect(getMentionQueryAtCursor('', 0)).toBeNull();
  });
});

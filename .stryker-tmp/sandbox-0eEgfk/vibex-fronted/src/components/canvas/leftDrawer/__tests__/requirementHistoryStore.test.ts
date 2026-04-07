/**
 * requirementHistoryStore.test.ts — S2.4: 需求历史存储测试
 */
// @ts-nocheck


import { getHistory, addHistory, clearHistory, removeHistoryItem } from '../requirementHistoryStore';

const STORAGE_KEY = 'vibex-requirement-history';

describe('requirementHistoryStore', () => {
  beforeEach(() => {
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  });

  describe('getHistory', () => {
    it('空存储返回空数组', () => {
      sessionStorage.removeItem(STORAGE_KEY);
      expect(getHistory()).toEqual([]);
    });

    it('解析有效历史数据', () => {
      const items = [
        { id: 'h1', text: '需求1', timestamp: 1000 },
        { id: 'h2', text: '需求2', timestamp: 2000 },
      ];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      expect(getHistory()).toEqual(items);
    });

    it('最多返回 5 条', () => {
      const items = Array.from({ length: 7 }, (_, i) => ({
        id: `h${i}`,
        text: `需求${i}`,
        timestamp: i * 1000,
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      expect(getHistory()).toHaveLength(5);
    });

    it('过滤空文本项', () => {
      const items = [
        { id: 'h1', text: '有效需求', timestamp: 1000 },
        { id: 'h2', text: '', timestamp: 2000 },
        { id: 'h3', text: '  ', timestamp: 3000 },
      ];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      expect(getHistory()).toHaveLength(1);
      expect(getHistory()[0].text).toBe('有效需求');
    });
  });

  describe('addHistory', () => {
    it('添加新历史记录', () => {
      const result = addHistory('新需求');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('新需求');
      expect(result[0].id).toMatch(/^hist-/);
    });

    it('相同文本去重（移到最前）', () => {
      addHistory('需求A');
      addHistory('需求B');
      const result = addHistory('需求A'); // re-submit A

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('需求A');
      expect(result[1].text).toBe('需求B');
    });

    it('最多保留 5 条', () => {
      for (let i = 0; i < 7; i++) {
        addHistory(`需求${i}`);
      }
      const result = getHistory();
      expect(result).toHaveLength(5);
    });

    it('空文本不添加', () => {
      const result = addHistory('   ');
      expect(result).toHaveLength(0);
    });
  });

  describe('clearHistory', () => {
    it('清空后 getHistory 返回空', () => {
      addHistory('需求1');
      addHistory('需求2');
      clearHistory();
      expect(getHistory()).toEqual([]);
    });
  });

  describe('removeHistoryItem', () => {
    it('删除指定 id 的项', () => {
      const result = addHistory('需求1');
      const idToRemove = result[0].id;
      const afterRemove = removeHistoryItem(idToRemove);
      expect(afterRemove).toHaveLength(0);
    });

    it('不存在的 id 不报错', () => {
      addHistory('需求1');
      expect(() => removeHistoryItem('non-existent')).not.toThrow();
    });
  });
});

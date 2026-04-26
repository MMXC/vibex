/**
 * designCompliance — 单元测试
 */
// Vitest/Jest globals auto-imported by ts-jest preset
import { checkDesignCompliance } from '../lib/prompts/designCompliance';

describe('designCompliance', () => {
  describe('颜色合规', () => {
    it('通过：使用 CSS 变量', () => {
      const node = {
        id: 'node-1',
        name: 'Primary Button',
        style: 'background: var(--color-primary); color: var(--color-text);',
      };
      const result = checkDesignCompliance(node);
      expect(result.colors).toBe(true);
      expect(result.colorIssues).toHaveLength(0);
    });

    it('失败：硬编码 hex 颜色', () => {
      const node = {
        id: 'node-2',
        name: 'Alert Box',
        style: 'background: #ff0000; color: #ffffff;',
      };
      const result = checkDesignCompliance(node);
      expect(result.colors).toBe(false);
      expect(result.colorIssues.length).toBeGreaterThan(0);
      expect(result.colorIssues[0].value).toBe('#ff0000');
    });

    it('失败：硬编码 rgba 颜色', () => {
      const node = {
        id: 'node-3',
        name: 'Modal Overlay',
        style: 'background: rgba(0, 0, 0, 0.5);',
      };
      const result = checkDesignCompliance(node);
      expect(result.colors).toBe(false);
      expect(result.colorIssues.some((i: { value: string }) => i.value.includes('rgba'))).toBe(true);
    });

    it('通过：rgba transparent (无硬编码)', () => {
      const node = {
        id: 'node-4',
        name: 'Input',
        style: 'border-color: var(--color-border);',
      };
      const result = checkDesignCompliance(node);
      expect(result.colors).toBe(true);
    });
  });

  describe('字体合规', () => {
    it('失败：硬编码字体族', () => {
      const node = {
        id: 'node-5',
        name: 'Heading',
        style: 'font-family: Arial, sans-serif;',
      };
      const result = checkDesignCompliance(node);
      expect(result.typography).toBe(false);
      expect(result.typographyIssues.length).toBeGreaterThan(0);
    });

    it('通过：使用 CSS 变量', () => {
      const node = {
        id: 'node-6',
        name: 'Text',
        style: 'font-family: var(--font-sans); font-size: var(--text-sm);',
      };
      const result = checkDesignCompliance(node);
      expect(result.typography).toBe(true);
    });
  });

  describe('间距合规', () => {
    it('通过：间距是 4 的倍数', () => {
      const node = {
        id: 'node-7',
        name: 'Card',
        padding: 16,
        margin: 8,
      };
      const result = checkDesignCompliance(node);
      expect(result.spacing).toBe(true);
      expect(result.spacingIssues).toHaveLength(0);
    });

    it('失败：间距不是 4 的倍数', () => {
      const node = {
        id: 'node-8',
        name: 'Gap',
        gap: 10,
      };
      const result = checkDesignCompliance(node);
      expect(result.spacing).toBe(false);
      expect(result.spacingIssues[0].value).toBe(10);
      expect(result.spacingIssues[0].expectedMultiple).toBe(4);
    });

    it('通过：间距为 0', () => {
      const node = {
        id: 'node-9',
        name: 'Zero Gap',
        gap: 0,
      };
      const result = checkDesignCompliance(node);
      expect(result.spacing).toBe(true);
    });
  });

  describe('多字段节点', () => {
    it('检测多个问题', () => {
      const node = {
        id: 'node-10',
        name: 'Bad Node',
        backgroundColor: '#ff0000',
        fontFamily: 'Helvetica',
        padding: 10,
      };
      const result = checkDesignCompliance(node);
      expect(result.colors).toBe(false);
      expect(result.typography).toBe(false);
      expect(result.spacing).toBe(false);
      expect(result.colorIssues.length).toBeGreaterThan(0);
      expect(result.typographyIssues.length).toBeGreaterThan(0);
      expect(result.spacingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('选择性检查', () => {
    it('只检查颜色', () => {
      const node = {
        id: 'node-11',
        backgroundColor: '#ff0000',
        fontFamily: 'Arial',
        padding: 10,
      };
      const result = checkDesignCompliance(node, {
        checkColors: true,
        checkTypography: false,
        checkSpacing: false,
      });
      expect(result.colors).toBe(false);
      expect(result.typographyIssues).toHaveLength(0);
      expect(result.spacingIssues).toHaveLength(0);
    });
  });
});

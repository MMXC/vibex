/**
 * a11yChecker — 单元测试
 */

import { checkA11yCompliance } from '../lib/prompts/a11yChecker';

describe('a11yChecker', () => {
  describe('missing-alt (WCAG 1.1.1)', () => {
    it('失败：图片无 alt 属性', () => {
      const nodes = [
        { id: 'img-1', name: 'Hero Image', type: 'image' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.passed).toBe(false);
      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.issues[0].issueType).toBe('missing-alt');
      expect(result.issues[0].wcagCriteria).toContain('1.1.1');
    });

    it('通过：图片有 alt 属性', () => {
      const nodes = [
        { id: 'img-2', name: 'Hero Image', type: 'image', alt: 'Hero banner' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.passed).toBe(true);
    });

    it('通过：图片有 aria-label', () => {
      const nodes = [
        { id: 'img-3', name: 'Icon', type: 'icon', 'aria-label': 'Close icon' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.passed).toBe(true);
    });

    it('通过：装饰图片 alt=""', () => {
      const nodes = [
        { id: 'img-4', name: 'Decorative', type: 'image', alt: '' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.summary.critical).toBe(0);
    });

    it('失败：图片有空 alt 文本', () => {
      const nodes = [
        { id: 'img-5', name: 'Border', type: 'image', alt: '   ' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.summary.high).toBeGreaterThan(0);
    });
  });

  describe('missing-aria-label (WCAG 4.1.2)', () => {
    it('失败：语义容器无 accessible name', () => {
      const nodes = [
        { id: 'dialog-1', type: 'dialog' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.issues.some((i) => i.issueType === 'missing-aria-label')).toBe(true);
    });

    it('通过：容器有 name', () => {
      const nodes = [
        { id: 'dialog-2', type: 'dialog', name: 'Confirm Dialog' },
      ];
      const result = checkA11yCompliance(nodes);
      const ariaIssues = result.issues.filter((i) => i.issueType === 'missing-aria-label');
      expect(ariaIssues).toHaveLength(0);
    });

    it('通过：容器有 aria-label', () => {
      const nodes = [
        { id: 'modal-1', type: 'modal', 'aria-label': 'Settings' },
      ];
      const result = checkA11yCompliance(nodes);
      const ariaIssues = result.issues.filter((i) => i.issueType === 'missing-aria-label');
      expect(ariaIssues).toHaveLength(0);
    });
  });

  describe('low-contrast (WCAG 1.4.3)', () => {
    it('失败：低对比度文本', () => {
      const nodes = [
        { id: 'text-1', name: 'Light on White', type: 'text', backgroundColor: '#ffffff', color: '#cccccc' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.issues.some((i) => i.issueType === 'low-contrast')).toBe(true);
    });

    it('通过：高对比度文本', () => {
      const nodes = [
        { id: 'text-2', name: 'High Contrast', type: 'text', backgroundColor: '#ffffff', color: '#000000' },
      ];
      const result = checkA11yCompliance(nodes);
      const contrastIssues = result.issues.filter((i) => i.issueType === 'low-contrast');
      expect(contrastIssues).toHaveLength(0);
    });

    it('跳过：非 hex 颜色格式', () => {
      const nodes = [
        { id: 'text-3', name: 'CSS Var', type: 'text', backgroundColor: 'var(--bg)', color: 'var(--fg)' },
      ];
      const result = checkA11yCompliance(nodes);
      const contrastIssues = result.issues.filter((i) => i.issueType === 'low-contrast');
      expect(contrastIssues).toHaveLength(0);
    });
  });

  describe('missing-keyboard-hint (WCAG 2.1.1)', () => {
    it('失败：按钮无键盘提示', () => {
      const nodes = [
        { id: 'btn-1', name: 'Submit', type: 'button' },
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.issues.some((i) => i.issueType === 'missing-keyboard-hint')).toBe(true);
    });

    it('通过：按钮有 keyboard hint', () => {
      const nodes = [
        { id: 'btn-2', name: 'Submit', type: 'button', keyboardHint: 'Press Enter to submit' },
      ];
      const result = checkA11yCompliance(nodes);
      const kbIssues = result.issues.filter((i) => i.issueType === 'missing-keyboard-hint');
      expect(kbIssues).toHaveLength(0);
    });
  });

  describe('severity 分级', () => {
    it('严重程度分级正确', () => {
      // critical: missing alt, high: whitespace-only alt
      const nodes = [
        { id: 'img-bad', name: 'Image', type: 'image' }, // critical: no alt
        { id: 'img-ws', name: 'Space Image', type: 'image', alt: '   ' }, // high: whitespace alt
      ];
      const result = checkA11yCompliance(nodes);
      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.summary.high).toBeGreaterThan(0);
    });
  });

  describe('空节点列表', () => {
    it('空列表返回 passed=true', () => {
      const result = checkA11yCompliance([]);
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });
});

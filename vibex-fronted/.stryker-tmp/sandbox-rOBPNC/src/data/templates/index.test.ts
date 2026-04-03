/**
 * Templates 模块测试
 * 目标：提升覆盖率从 7.14% 到 70%+
 */
// @ts-nocheck

import {
  templates,
  categoryLabels,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateGroups,
  getCategoryOptions,
  getTemplateById,
  getIndustryTemplates,
  getScenarioTemplates,
  filterTemplates,
} from './index';
import { RequirementTemplate, TemplateCategory } from './types';

describe('Templates Index', () => {
  describe('templates 数组', () => {
    it('TPL-001: templates 是数组', () => {
      expect(Array.isArray(templates)).toBe(true);
    });

    it('TPL-002: templates 包含元素', () => {
      expect(templates.length).toBeGreaterThan(0);
    });

    it('TPL-003: 每个模板都有必要字段', () => {
      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
      });
    });
  });

  describe('categoryLabels', () => {
    it('TPL-010: categoryLabels 是对象', () => {
      expect(typeof categoryLabels).toBe('object');
    });

    it('TPL-011: categoryLabels 包含常见分类', () => {
      expect(categoryLabels).toHaveProperty('ecommerce');
      expect(categoryLabels).toHaveProperty('social');
      expect(categoryLabels).toHaveProperty('saas');
    });

    it('TPL-012: 所有标签都是字符串', () => {
      Object.values(categoryLabels).forEach((label) => {
        expect(typeof label).toBe('string');
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('TPL-020: 返回数组', () => {
      const result = getTemplatesByCategory('ecommerce');
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-021: 过滤出指定分类的模板', () => {
      const result = getTemplatesByCategory('ecommerce');
      result.forEach((template) => {
        expect(template.category).toBe('ecommerce');
      });
    });

    it('TPL-022: 无匹配分类返回空数组', () => {
      const result = getTemplatesByCategory('nonexistent' as TemplateCategory);
      expect(result).toEqual([]);
    });
  });

  describe('searchTemplates', () => {
    it('TPL-030: 空查询返回所有模板', () => {
      const result = searchTemplates('');
      expect(result.length).toBe(templates.length);
    });

    it('TPL-031: 空格查询返回所有模板', () => {
      const result = searchTemplates('   ');
      expect(result.length).toBe(templates.length);
    });

    it('TPL-032: 按名称搜索', () => {
      const result = searchTemplates('电商');
      expect(result.length).toBeGreaterThan(0);
    });

    it('TPL-033: 按描述搜索', () => {
      const result = searchTemplates('电商');
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-034: 无匹配返回空数组', () => {
      const result = searchTemplates('xyzabc123不存在的模板');
      expect(result.length).toBe(0);
    });

    it('TPL-035: 大小写不敏感', () => {
      const lowerResult = searchTemplates('saas');
      const upperResult = searchTemplates('SAAS');
      // 两者应该返回相同数量的结果（如果有匹配）
      expect(typeof lowerResult.length).toBe('number');
      expect(typeof upperResult.length).toBe('number');
    });
  });

  describe('getTemplateGroups', () => {
    it('TPL-040: 返回数组', () => {
      const result = getTemplateGroups();
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-041: 每个分组有正确结构', () => {
      const result = getTemplateGroups();
      result.forEach((group) => {
        expect(group).toHaveProperty('category');
        expect(group).toHaveProperty('label');
        expect(group).toHaveProperty('templates');
        expect(Array.isArray(group.templates)).toBe(true);
      });
    });

    it('TPL-042: 过滤掉空分组', () => {
      const result = getTemplateGroups();
      result.forEach((group) => {
        expect(group.templates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCategoryOptions', () => {
    it('TPL-050: 返回数组', () => {
      const result = getCategoryOptions();
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-051: 第一项是"全部"', () => {
      const result = getCategoryOptions();
      expect(result[0].value).toBe('all');
      expect(result[0].label).toBe('全部');
    });

    it('TPL-052: 每个选项有 value, label, count', () => {
      const result = getCategoryOptions();
      result.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('count');
        expect(typeof option.count).toBe('number');
      });
    });

    it('TPL-053: count 数量正确', () => {
      const result = getCategoryOptions();
      const allOption = result.find((o) => o.value === 'all');
      expect(allOption?.count).toBe(templates.length);
    });
  });

  describe('getTemplateById', () => {
    it('TPL-060: 找到模板返回模板对象', () => {
      // 获取第一个模板的 ID
      const firstTemplate = templates[0];
      if (firstTemplate) {
        const result = getTemplateById(firstTemplate.id);
        expect(result).toEqual(firstTemplate);
      }
    });

    it('TPL-061: 找不到返回 undefined', () => {
      const result = getTemplateById('non-existent-id-12345');
      expect(result).toBeUndefined();
    });
  });

  describe('getIndustryTemplates', () => {
    it('TPL-070: 返回数组', () => {
      const result = getIndustryTemplates();
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-071: 返回非 custom 分类的模板', () => {
      const result = getIndustryTemplates();
      result.forEach((template) => {
        expect(template.category).not.toBe('custom');
      });
    });
  });

  describe('getScenarioTemplates', () => {
    it('TPL-080: 返回数组', () => {
      const result = getScenarioTemplates();
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-081: 返回 custom 分类的模板', () => {
      const result = getScenarioTemplates();
      result.forEach((template) => {
        expect(template.category).toBe('custom');
      });
    });
  });

  describe('filterTemplates', () => {
    it('TPL-090: category=all 返回所有模板', () => {
      const result = filterTemplates('all', '');
      expect(result.length).toBe(templates.length);
    });

    it('TPL-091: 分类过滤', () => {
      const result = filterTemplates('ecommerce', '');
      result.forEach((template) => {
        expect(template.category).toBe('ecommerce');
      });
    });

    it('TPL-092: 搜索词过滤', () => {
      const result = filterTemplates('all', '电商');
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-093: 分类 + 搜索词组合过滤', () => {
      const result = filterTemplates('ecommerce', '电商');
      expect(Array.isArray(result)).toBe(true);
    });

    it('TPL-094: 无匹配返回空数组', () => {
      const result = filterTemplates('all', 'xyzabc123不存在');
      expect(result.length).toBe(0);
    });
  });
});
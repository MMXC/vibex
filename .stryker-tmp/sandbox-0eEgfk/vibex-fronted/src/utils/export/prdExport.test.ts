/**
 * PRD Export Tests
 */
// @ts-nocheck


import { exportPRDToMarkdown, validatePRD, createPRDFromTemplate } from '@/utils/export/prdExport';

describe('prdExport', () => {
  describe('exportPRDToMarkdown', () => {
    it('should export basic PRD', () => {
      const data = {
        projectName: 'Test Project',
        version: '1.0.0',
        sections: [
          { id: 'overview', title: 'Overview', content: 'Project overview content' },
        ],
      };
      
      const md = exportPRDToMarkdown(data);
      expect(md).toContain('# Test Project');
      expect(md).toContain('## 1. Overview');
      expect(md).toContain('Project overview content');
    });

    it('should include metadata', () => {
      const data = {
        projectName: 'Test',
        version: '1.0.0',
        author: 'Test Author',
        createdAt: '2024-01-01',
        sections: [],
      };
      
      const md = exportPRDToMarkdown(data, { includeMetadata: true });
      expect(md).toContain('**版本**: 1.0.0');
      expect(md).toContain('**作者**: Test Author');
    });

    it('should include table of contents', () => {
      const data = {
        projectName: 'Test',
        sections: [
          { id: 's1', title: 'Section 1', content: 'Content 1' },
          { id: 's2', title: 'Section 2', content: 'Content 2' },
        ],
      };
      
      const md = exportPRDToMarkdown(data, { includeTOC: true });
      expect(md).toContain('## 目录');
      expect(md).toContain('[Section 1]');
    });
  });

  describe('validatePRD', () => {
    it('should validate valid PRD', () => {
      const data = {
        projectName: 'Test',
        sections: [
          { id: 's1', title: 'Section', content: 'Content' },
        ],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(true);
    });

    it('should fail for empty project name', () => {
      const data = { projectName: '', sections: [] };
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('项目名称不能为空');
    });

    it('should fail for empty sections', () => {
      const data = { projectName: 'Test', sections: [] };
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('createPRDFromTemplate', () => {
    it('should create from default template', () => {
      const prd = createPRDFromTemplate('My Project', 'default');
      expect(prd.projectName).toBe('My Project');
      expect(prd.sections.length).toBeGreaterThan(0);
    });

    it('should create from website template', () => {
      const prd = createPRDFromTemplate('Website', 'website');
      expect(prd.sections.length).toBeGreaterThan(0);
    });
  });
});

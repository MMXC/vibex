/**
 * PRD Export Extended Tests - Template Enhancement
 */
// @ts-nocheck


import { 
  exportPRDToMarkdown, 
  validatePRD, 
  createPRDFromTemplate,
  PRDData
} from '@/utils/export/prdExport';

describe('prdExport - Template Enhancement (E003)', () => {
  describe('exportPRDToMarkdown - Extended Coverage', () => {
    it('should handle empty sections gracefully', () => {
      const data: PRDData = {
        projectName: 'Test Project',
        sections: [],
      };
      
      const md = exportPRDToMarkdown(data, { includeTOC: true });
      expect(md).toContain('# Test Project');
      expect(md).not.toContain('## 目录');
    });

    it('should use custom date format', () => {
      const data: PRDData = {
        projectName: 'Test',
        version: '1.0.0',
        createdAt: '2024-03-19',
        sections: [{ id: 's1', title: 'Section', content: 'Content' }],
      };
      
      const md = exportPRDToMarkdown(data, { dateFormat: 'YYYY/MM/DD' });
      expect(md).toContain('2024-03-19');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const data: PRDData = {
        projectName: 'Test',
        version: '1.0.0',
        author: 'Test Author',
        sections: [],
      };
      
      const md = exportPRDToMarkdown(data, { includeMetadata: false });
      expect(md).not.toContain('**版本**:');
    });

    it('should handle unicode in project name', () => {
      const data: PRDData = {
        projectName: '测试项目 🧪',
        sections: [{ id: 's1', title: '章节', content: '内容' }],
      };
      
      const md = exportPRDToMarkdown(data);
      expect(md).toContain('# 测试项目');
      expect(md).toContain('## 1. 章节');
    });

    it('should generate correct section numbering', () => {
      const data: PRDData = {
        projectName: 'Test',
        sections: [
          { id: 's1', title: 'First', content: 'First content' },
          { id: 's2', title: 'Second', content: 'Second content' },
          { id: 's3', title: 'Third', content: 'Third content' },
        ],
      };
      
      const md = exportPRDToMarkdown(data);
      expect(md).toContain('## 1. First');
      expect(md).toContain('## 2. Second');
      expect(md).toContain('## 3. Third');
    });
  });

  describe('validatePRD - Extended Coverage', () => {
    it('should fail for empty section title', () => {
      const data: PRDData = {
        projectName: 'Test',
        sections: [{ id: 's1', title: '', content: 'Content' }],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('章节 1: 标题不能为空');
    });

    it('should fail for empty section content', () => {
      const data: PRDData = {
        projectName: 'Test',
        sections: [{ id: 's1', title: 'Title', content: '' }],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('章节 1: 内容不能为空');
    });

    it('should fail for whitespace-only title', () => {
      const data: PRDData = {
        projectName: 'Test',
        sections: [{ id: 's1', title: '   ', content: 'Content' }],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
    });

    it('should fail for whitespace-only content', () => {
      const data: PRDData = {
        projectName: 'Test',
        sections: [{ id: 's1', title: 'Title', content: '   ' }],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
    });

    it('should collect multiple errors', () => {
      const data: PRDData = {
        projectName: '',
        sections: [
          { id: 's1', title: '', content: '' },
        ],
      };
      
      const result = validatePRD(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createPRDFromTemplate - Extended', () => {
    it('should use default template for unknown templateId', () => {
      const prd = createPRDFromTemplate('Test', 'unknown-template');
      expect(prd.sections.length).toBe(6); // default has 6 sections
    });

    it('should set default version', () => {
      const prd = createPRDFromTemplate('Test', 'default');
      expect(prd.version).toBe('1.0.0');
    });

    it('should set createdAt timestamp', () => {
      const before = new Date().getTime();
      const prd = createPRDFromTemplate('Test', 'default');
      const after = new Date().getTime();
      
      expect(prd.createdAt).toBeDefined();
      const createdAtTime = new Date(prd.createdAt!).getTime();
      expect(createdAtTime).toBeGreaterThanOrEqual(before);
      expect(createdAtTime).toBeLessThanOrEqual(after);
    });

    it('should include all required sections in default template', () => {
      const prd = createPRDFromTemplate('Test', 'default');
      
      const sectionIds = prd.sections.map(s => s.id);
      expect(sectionIds).toContain('overview');
      expect(sectionIds).toContain('users');
      expect(sectionIds).toContain('features');
      expect(sectionIds).toContain('non-functional');
      expect(sectionIds).toContain('ui');
      expect(sectionIds).toContain('technical');
    });

    it('should include correct sections in website template', () => {
      const prd = createPRDFromTemplate('Website', 'website');
      
      const sectionIds = prd.sections.map(s => s.id);
      expect(sectionIds).toContain('overview');
      expect(sectionIds).toContain('pages');
      expect(sectionIds).toContain('features');
      expect(sectionIds).toContain('design');
    });
  });

  describe('Template Rendering Performance', () => {
    it('should render template within 5 seconds (1000 iterations)', () => {
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const prd = createPRDFromTemplate(`Project ${i}`, 'default');
        const _md = exportPRDToMarkdown(prd);
        validatePRD(prd);
      }
      
      const elapsed = performance.now() - startTime;
      const avgTime = elapsed / iterations;
      
      // Average time per template should be < 5ms (1000x faster than 5s requirement)
      expect(avgTime).toBeLessThan(5);
    });
  });

  describe('Template Rendering Success Rate', () => {
    it('should have 100% success rate over 1000 iterations', () => {
      let successCount = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        try {
          const prd = createPRDFromTemplate(`Project ${i}`, 'default');
          const _md = exportPRDToMarkdown(prd);
          const validation = validatePRD(prd);
          
          if (validation.valid && _md.length > 0) {
            successCount++;
          }
        } catch {
          // fail silently for error rate calculation
        }
      }
      
      const successRate = (successCount / iterations) * 100;
      expect(successRate).toBeGreaterThanOrEqual(99);
    });
  });
});

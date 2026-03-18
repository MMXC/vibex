import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep,
  canProceedToStep,
  validateAllSteps,
  stepValidationRules,
} from '../step-validation';
import type { StepData } from '../step-validation';

describe('step-validation', () => {
  describe('validateStep1 (Requirement Input)', () => {
    it('should fail when requirement text is empty', () => {
      const result = validateStep1();
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入需求描述');
    });

    it('should fail when requirement text is too short', () => {
      const result = validateStep1({ requirement: { text: '短' } });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('需求描述至少需要10个字符');
    });

    it('should pass with valid requirement text', () => {
      const result = validateStep1({ requirement: { text: '这是一个有效的需求描述文本' } });
      expect(result.valid).toBe(true);
    });

    it('should pass with whitespace-only requirement text with length >= 10', () => {
      const result = validateStep1({ requirement: { text: '  需求描述  12345' } });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStep2 (Bounded Context)', () => {
    it('should fail when no contexts exist', () => {
      const result = validateStep2();
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请至少选择一个限界上下文');
    });

    it('should fail when no contexts are selected', () => {
      const result = validateStep2({
        boundedContext: {
          contexts: [
            { id: '1', name: 'ctx1', description: '', type: 'core', relationships: [] },
          ],
          relationships: [],
          selectedContextIds: [],
        },
      });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请至少选择一个限界上下文');
    });

    it('should pass when at least one context is selected', () => {
      const result = validateStep2({
        boundedContext: {
          contexts: [
            { id: '1', name: 'ctx1', description: '', type: 'core', relationships: [] },
            { id: '2', name: 'ctx2', description: '', type: 'supporting', relationships: [] },
          ],
          relationships: [],
          selectedContextIds: ['2'],
        },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStep3 (Business Flow)', () => {
    it('should fail when no flowchart nodes exist', () => {
      const result = validateStep3();
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请添加至少2个流程节点');
    });

    it('should fail when only 1 node exists', () => {
      const result = validateStep3({
        flowchart: {
          nodes: [{ id: '1', type: 'start', label: 'Start', position: { x: 0, y: 0 }, connections: [] }],
          edges: [],
        },
      });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请添加至少2个流程节点');
    });

    it('should pass when at least 2 nodes exist', () => {
      const result = validateStep3({
        flowchart: {
          nodes: [
            { id: '1', type: 'start', label: 'Start', position: { x: 0, y: 0 }, connections: ['2'] },
            { id: '2', type: 'end', label: 'End', position: { x: 100, y: 0 }, connections: [] },
          ],
          edges: [{ id: 'e1', source: '1', target: '2' }],
        },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStep4 (UI Components)', () => {
    it('should fail when no components exist', () => {
      const result = validateStep4();
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请至少选择一个UI组件');
    });

    it('should fail when no components are selected', () => {
      const result = validateStep4({
        uiComponents: {
          components: [{ id: '1', name: 'Button', category: 'basic', selected: false }],
        },
      });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请至少选择一个UI组件');
    });

    it('should pass when at least one component is selected', () => {
      const result = validateStep4({
        uiComponents: {
          components: [
            { id: '1', name: 'Button', category: 'basic', selected: true },
            { id: '2', name: 'Input', category: 'form', selected: false },
          ],
        },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStep5 (Project Create)', () => {
    it('should fail when project name is empty', () => {
      const result = validateStep5();
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入项目名称');
    });

    it('should fail when project name is too short', () => {
      const result = validateStep5({ project: { name: 'A' } });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('项目名称至少需要2个字符');
    });

    it('should pass with valid project name', () => {
      const result = validateStep5({ project: { name: 'My Project', description: 'Test' } });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateStep', () => {
    it('should route to correct validator by step number', () => {
      expect(validateStep(1, { requirement: { text: 'valid requirement text here' } }).valid).toBe(true);
      expect(validateStep(2, { boundedContext: { contexts: [{ id: '1', name: 'c', description: '', type: 'core', relationships: [] }], relationships: [], selectedContextIds: ['1'] } }).valid).toBe(true);
      expect(validateStep(3, { flowchart: { nodes: [{ id: '1', type: 'start', label: 's', position: { x: 0, y: 0 }, connections: ['2'] }, { id: '2', type: 'end', label: 'e', position: { x: 1, y: 0 }, connections: [] }], edges: [] } }).valid).toBe(true);
      expect(validateStep(4, { uiComponents: { components: [{ id: '1', name: 'c', category: 'x', selected: true }] } }).valid).toBe(true);
      expect(validateStep(5, { project: { name: 'My Project' } }).valid).toBe(true);
    });

    it('should return error for unknown step', () => {
      const result = validateStep(99);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('未知的步骤: 99');
    });
  });

  describe('canProceedToStep', () => {
    it('should return true when step is valid', () => {
      expect(canProceedToStep(5, { project: { name: 'Test Project' } })).toBe(true);
    });

    it('should return false when step is invalid', () => {
      expect(canProceedToStep(1)).toBe(false);
    });
  });

  describe('validateAllSteps', () => {
    it('should return empty array when all steps valid', () => {
      const data: StepData = {
        requirement: { text: '这是一个有效的需求描述文本' },
        boundedContext: { contexts: [{ id: '1', name: 'c', description: '', type: 'core' as const, relationships: [] }], relationships: [], selectedContextIds: ['1'] },
        flowchart: { nodes: [{ id: '1', type: 'start' as const, label: 's', position: { x: 0, y: 0 }, connections: ['2'] }, { id: '2', type: 'end' as const, label: 'e', position: { x: 1, y: 0 }, connections: [] }], edges: [] },
        uiComponents: { components: [{ id: '1', name: 'c', category: 'x', selected: true }] },
        project: { name: 'Test Project' },
      };
      expect(validateAllSteps(data)).toEqual([]);
    });

    it('should return array of failed step numbers', () => {
      const result = validateAllSteps({});
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).toContain(5);
      expect(result.length).toBe(5);
    });
  });
});

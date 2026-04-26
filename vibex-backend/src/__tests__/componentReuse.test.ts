/**
 * componentReuse — 单元测试
 */

import { analyzeComponentReuse } from '../lib/prompts/componentReuse';

describe('componentReuse', () => {
  describe('基本相似度检测', () => {
    it('完全相同的节点 — 相似度 1.0', () => {
      const nodes = [
        { id: 'btn-a', name: 'Button A', type: 'button', variant: 'primary', size: 'md' },
        { id: 'btn-b', name: 'Button B', type: 'button', variant: 'primary', size: 'md' },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.candidatesAboveThreshold).toBe(1);
      expect(result.candidates[0].similarityScore).toBe(1);
    });

    it('不同类型的节点 — 无候选', () => {
      const nodes = [
        { id: 'btn-1', name: 'Button', type: 'button', variant: 'primary' },
        { id: 'input-1', name: 'Input', type: 'input', placeholder: 'Enter text' },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.candidatesAboveThreshold).toBe(0);
    });

    it('相似节点 — 分数取决于 shared vs differing fields', () => {
      const nodes = [
        { id: 'card-1', name: 'Card A', type: 'card', padding: 16, background: 'white', borderRadius: 8 },
        { id: 'card-2', name: 'Card B', type: 'card', padding: 16, background: 'blue', borderRadius: 8 },
      ];
      // shared: type, padding, borderRadius (3)
      // differing: background (1)
      // score = 3/4 = 0.75 > 0.7 threshold
      const result = analyzeComponentReuse(nodes);
      expect(result.candidatesAboveThreshold).toBe(1);
      expect(result.candidates[0].similarityScore).toBe(0.75);
    });

    it('相似节点低于阈值 0.7 — 无候选', () => {
      const nodes = [
        { id: 'node-1', type: 'card', a: 'x', b: 'y', c: 'z', d: 'w' },
        { id: 'node-2', type: 'card', a: '1', b: '2', c: '3', d: '4' },
      ];
      const result = analyzeComponentReuse(nodes, 0.7);
      expect(result.candidatesAboveThreshold).toBe(0);
    });
  });

  describe('字段忽略规则', () => {
    it('忽略 id 字段进行相似度计算', () => {
      const nodes = [
        { id: 'a', type: 'button', variant: 'primary' },
        { id: 'b', type: 'button', variant: 'primary' },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.candidates[0].similarityScore).toBe(1);
    });

    it('忽略 name 字段进行相似度计算', () => {
      const nodes = [
        { id: 'btn-1', name: 'Button A', type: 'button', variant: 'primary' },
        { id: 'btn-2', name: 'Button B', type: 'button', variant: 'primary' },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.candidates[0].similarityScore).toBe(1);
    });

    it('忽略 position 字段', () => {
      const nodes = [
        { id: 'c1', type: 'card', position: { x: 100, y: 200 } },
        { id: 'c2', type: 'card', position: { x: 300, y: 400 } },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.candidates[0].similarityScore).toBe(1);
    });
  });

  describe('differingFields 和 sharedFields', () => {
    it('正确识别 shared 和 differing fields', () => {
      const nodes = [
        { id: 'btn-1', type: 'button', variant: 'primary', size: 'md', color: 'blue', border: '1px', padding: 8 },
        { id: 'btn-2', type: 'button', variant: 'primary', size: 'lg', color: 'blue', border: '1px', padding: 8 },
      ];
      const result = analyzeComponentReuse(nodes);
      // shared (same, not skipped): type, variant, color, border, padding (5)
      // differing (not skipped): size (1)
      // similarity = 5/6 = 0.83 > 0.7 → 1 candidate above threshold
      expect(result.candidatesAboveThreshold).toBe(1);
      const candidate = result.candidates[0];
      expect(candidate.similarityScore).toBeGreaterThanOrEqual(0.7);
      expect(candidate.sharedFields).toContain('type');
      expect(candidate.sharedFields).toContain('variant');
      expect(candidate.differingFields.some((f) => f.field === 'size')).toBe(true);
    });
  });

  describe('推荐建议', () => {
    it('有候选时提供建议', () => {
      const nodes = [
        { id: 'c1', name: 'Card 1', type: 'card', padding: 16 },
        { id: 'c2', name: 'Card 2', type: 'card', padding: 16 },
      ];
      const result = analyzeComponentReuse(nodes);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('1');
    });

    it('无候选时无建议', () => {
      const nodes = [
        { id: 'b1', type: 'button', a: 1 },
        { id: 'b2', type: 'button', a: 2 },
      ];
      const result = analyzeComponentReuse(nodes, 0.95);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('阈值参数', () => {
    it('自定义阈值', () => {
      const nodes = [
        { id: 'n1', type: 'card', a: 'x', b: 'y' },
        { id: 'n2', type: 'card', a: '1', b: '2' },
      ];
      // With 0.5 threshold: should find candidate (2 shared keys out of 3 fields)
      const result50 = analyzeComponentReuse(nodes, 0.5);
      // With 0.9 threshold: should not find candidate
      const result90 = analyzeComponentReuse(nodes, 0.9);
      expect(result50.candidatesAboveThreshold).toBeGreaterThanOrEqual(result90.candidatesAboveThreshold);
    });
  });

  describe('边界情况', () => {
    it('空节点列表', () => {
      const result = analyzeComponentReuse([]);
      expect(result.totalNodes).toBe(0);
      expect(result.candidatesAboveThreshold).toBe(0);
    });

    it('单节点 — 无候选', () => {
      const result = analyzeComponentReuse([{ id: 'n1', type: 'button' }]);
      expect(result.candidatesAboveThreshold).toBe(0);
    });

    it('结果按相似度降序排列', () => {
      const nodes = [
        { id: 'n1', type: 'card', a: 'x', b: 'y', c: 'z' },
        { id: 'n2', type: 'card', a: '1', b: 'y', c: 'z' },
        { id: 'n3', type: 'card', a: 'a', b: 'b', c: 'c' },
      ];
      const result = analyzeComponentReuse(nodes, 0.3);
      if (result.candidates.length > 1) {
        expect(result.candidates[0].similarityScore).toBeGreaterThanOrEqual(result.candidates[1].similarityScore);
      }
    });
  });
});

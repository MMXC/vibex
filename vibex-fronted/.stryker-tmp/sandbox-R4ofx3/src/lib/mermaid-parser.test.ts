/**
 * Mermaid Parser Tests
 */
// @ts-nocheck


import { parseMermaidGraph, convertMermaidToFlow } from '@/lib/mermaid-parser';

describe('mermaid-parser', () => {
  describe('parseMermaidGraph', () => {
    it('should parse simple graph', () => {
      const mermaidCode = `graph TD
        A[Start] --> B{Decision}`;

      const result = parseMermaidGraph(mermaidCode);

      expect(result.diagramType).toBeDefined();
      expect(result.nodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty graph', () => {
      const result = parseMermaidGraph('');

      expect(result.diagramType).toBeDefined();
      expect(result.nodes).toHaveLength(0);
    });

    it('should handle graph with nodes', () => {
      const mermaidCode = `graph TD
        A[Node 1]`;

      const result = parseMermaidGraph(mermaidCode);

      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('should handle edges with labels', () => {
      const mermaidCode = `graph TD
        A -->|Label| B`;

      const result = parseMermaidGraph(mermaidCode);

      expect(result.edges.length).toBeGreaterThan(0);
    });
  });

  describe('convertMermaidToFlow', () => {
    it('should convert mermaid to flow format', () => {
      const mermaidCode = `graph TD
        A[Start] --> B[End]`;

      const result = convertMermaidToFlow(mermaidCode);

      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('should handle empty mermaid code', () => {
      const result = convertMermaidToFlow('');

      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('should create nodes with positions', () => {
      const mermaidCode = `graph TD
        A[Start] --> B[End]`;

      const result = convertMermaidToFlow(mermaidCode);

      result.nodes.forEach(node => {
        expect(node.position).toBeDefined();
      });
    });
  });
});
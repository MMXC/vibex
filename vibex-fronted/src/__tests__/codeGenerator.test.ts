/**
 * codeGenerator — 单元测试
 * E10 Sprint 12: Design-to-Code
 */
// Vitest auto-imports describe, it, expect
import { generateComponentCode, packageAsZip, MAX_NODES_LIMIT } from '@/lib/codeGenerator';

describe('codeGenerator', () => {
  describe('generateComponentCode — Type Definitions', () => {
    it('生成 TypeScript 类型定义', () => {
      const flow = {
        name: 'User Registration',
        nodes: [
          { id: 'ctx-1', name: 'User Context', type: 'bounded-context' },
          { id: 'flow-1', name: 'Register Flow', type: 'user-task' },
          { id: 'comp-1', name: 'Form Component', type: 'component' },
        ],
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.types).toContain('export interface CanvasNode');
      expect(result.files.types).toContain('export interface CanvasFlow');
      expect(result.files.types).toContain('export interface Chapter');
    });

    it('生成 flow-specific types', () => {
      const flow = {
        name: 'Checkout',
        nodes: [
          { id: 'ctx-1', type: 'bounded-context' },
          { id: 'flow-1', type: 'user-task' },
        ],
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.types).toContain("type: 'bounded-context'");
      expect(result.files.types).toContain("type: 'flow'");
    });

    it('使用 flow name 作为组件名', () => {
      const flow = { name: 'Shopping Cart', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.componentName).toBe('ShoppingCartComponent');
      expect(result.files.types).toContain('ShoppingCartComponentProps');
    });

    it('处理无 name 的 flow', () => {
      const flow = { nodes: [{ id: 'n1', type: 'button' }] };
      const result = generateComponentCode(flow, 'react');
      expect(result.componentName).toBe('FlowComponent');
    });

    it('sanitize 中文 name', () => {
      const flow = { name: '用户注册流程', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.componentName).toBe('用户注册流程Component');
    });

    it('sanitize 特殊字符', () => {
      const flow = { name: 'User @#$% Registration!', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      // sanitizeName removes all non-alphanumeric chars, then PascalCase
      expect(result.componentName).toBe('UserRegistrationComponent');
    });
  });

  describe('generateComponentCode — TSX Skeleton', () => {
    it('生成 React TSX 骨架', () => {
      const flow = { name: 'Button', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.component).toContain('export function ButtonComponent');
      expect(result.files.component).toContain("import React from 'react'");
      expect(result.files.component).toContain('className={`${styles.container}');
    });

    it('TSX 使用 CSS Module import', () => {
      const flow = { name: 'Card', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.component).toContain("import styles from './Card.module.css'");
    });

    it('TSX 包含 TODO 注释', () => {
      const flow = {
        name: 'Page',
        nodes: [
          { id: 'ctx-1', name: 'Header Context', type: 'bounded-context' },
          { id: 'flow-1', name: 'Main Flow', type: 'user-task' },
        ],
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.component).toContain('@TODO');
      expect(result.files.component).toContain('bounded context sections');
      expect(result.files.component).toContain('flow steps');
    });

    it('Vue 生成 Vue 组件', () => {
      const flow = { name: 'Modal', nodes: [] };
      const result = generateComponentCode(flow, 'vue');
      expect(result.files.component).toContain('<script setup');
      expect(result.files.component).toContain('<template>');
    });
  });

  describe('generateComponentCode — CSS Module', () => {
    it('CSS 使用 CSS 变量（无硬编码）', () => {
      const flow = { name: 'Panel', nodes: [] };
      const result = generateComponentCode(flow, 'react');

      // All color/spacing/typography declarations must use var()
      expect(result.files.css).toContain('var(--color');
      expect(result.files.css).toContain('var(--spacing');
      expect(result.files.css).toContain('var(--radius');
      expect(result.files.css).toContain('var(--font');
    });

    it('CSS 包含 container 样式', () => {
      const flow = { name: 'Box', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.css).toContain('.container');
      expect(result.files.css).toContain('display: flex');
    });

    it('CSS 包含响应式媒体查询', () => {
      const flow = { name: 'Card', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.css).toContain('@media');
    });
  });

  describe('generateComponentCode — Index File', () => {
    it('生成 index.ts', () => {
      const flow = { name: 'Input', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.index).toContain('export');
    });

    it('index 导出类型和组件', () => {
      const flow = { name: 'Select', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      expect(result.files.index).toContain('SelectComponent');
    });
  });

  describe('generateComponentCode — Node Count & Limit', () => {
    it('正确计算节点数', () => {
      const flow = {
        nodes: Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, type: 'component' })),
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.nodeCount).toBe(5);
    });

    it('不超过限制时不标记 limitExceeded', () => {
      const flow = {
        nodes: Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, type: 'button' })),
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.limitExceeded).toBe(false);
    });

    it('超过 200 限制时标记 limitExceeded', () => {
      const flow = {
        nodes: Array.from({ length: 201 }, (_, i) => ({ id: `n${i}`, type: 'button' })),
      };
      const result = generateComponentCode(flow, 'react');
      expect(result.limitExceeded).toBe(true);
      expect(result.limit).toBe(200);
    });

    it('MAX_NODES_LIMIT 常量 = 200', () => {
      expect(MAX_NODES_LIMIT).toBe(200);
    });
  });

  describe('packageAsZip', () => {
    it('生成 ZIP blob', async () => {
      const flow = { name: 'Test', nodes: [{ id: 'n1', type: 'button' }] };
      const result = generateComponentCode(flow, 'react');
      const blob = await packageAsZip(result);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/zip');
    });

    it('ZIP 包含 4 个代码文件 + README', async () => {
      const flow = { name: 'ZipTest', nodes: [] };
      const result = generateComponentCode(flow, 'react');
      const JSZip = (await import('jszip')).default;
      const blob = await packageAsZip(result);
      const zip = await JSZip.loadAsync(blob);
      const filenames = Object.keys(zip.files).map((f) => f.replace(/^.*\//, ''));
      expect(filenames).toContain('ZipTest.types.ts');
      expect(filenames).toContain('ZipTest.tsx');
      expect(filenames).toContain('ZipTest.module.css');
      expect(filenames).toContain('index.ts');
      expect(filenames).toContain('README.md');
    });

    it('limitExceeded 时 README 包含警告', async () => {
      // flow.name undefined → componentName = 'FlowComponent', prefix = 'Flow'
      const flow = { nodes: Array.from({ length: 201 }, (_, i) => ({ id: `n${i}` })) } as any;
      const result = generateComponentCode(flow, 'react');
      expect(result.limitExceeded).toBe(true);
      const JSZip = (await import('jszip')).default;
      const blob = await packageAsZip(result);
      const zip = await JSZip.loadAsync(blob);
      const readme = await zip.file('README.md')!.async('string');
      expect(readme).toContain('201');
      expect(readme).toContain('200');
    });
  });
});

describe('codeGenerator — Edge Cases', () => {
  it('空 nodes 列表', () => {
    const flow = { name: 'Empty', nodes: [] };
    const result = generateComponentCode(flow, 'react');
    expect(result.nodeCount).toBe(0);
    expect(result.files.types).toContain('CanvasFlow');
  });

  it('undefined nodes', () => {
    const flow = { name: 'NoNodes' } as any;
    const result = generateComponentCode(flow, 'react');
    expect(result.nodeCount).toBe(0);
    expect(result.limitExceeded).toBe(false);
  });

  it('特殊字符的 flow name', () => {
    const flow = { name: 'Component-2024_V1.0!', nodes: [] };
    const result = generateComponentCode(flow, 'react');
    expect(result.componentName).toBe('Component2024V10Component');
    expect(result.files.types).toContain('Component2024V10ComponentProps');
  });
});

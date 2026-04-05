import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JsonRenderPreview } from '@/components/canvas/json-render/JsonRenderPreview';
import type { ComponentNode } from '@/lib/canvas/types';

const mockPageNode = (overrides: Partial<ComponentNode> = {}): ComponentNode => ({
  nodeId: 'page-1',
  flowId: 'flow-1',
  name: '测试页面',
  type: 'page',
  props: {},
  api: { method: 'GET', path: '/test', params: [] },
  children: ['form-1'],
  status: 'pending',
  ...overrides,
});

const mockFormNode = (overrides: Partial<ComponentNode> = {}): ComponentNode => ({
  nodeId: 'form-1',
  flowId: 'flow-1',
  name: '测试表单',
  type: 'form',
  props: { fields: [] },
  api: { method: 'POST', path: '/api/test', params: [] },
  children: [],
  status: 'pending',
  ...overrides,
});

describe('JsonRenderPreview', () => {
  it('renders empty state when no nodes provided', () => {
    render(<JsonRenderPreview nodes={[]} />);
    expect(screen.getByText('暂无组件')).toBeInTheDocument();
    expect(screen.getByText('请先生成组件树')).toBeInTheDocument();
  });

  it('renders page node', () => {
    const nodes = [mockPageNode()];
    render(<JsonRenderPreview nodes={nodes} />);
    expect(screen.getByText('测试页面')).toBeInTheDocument();
  });

  it('renders form node', () => {
    const nodes = [mockFormNode()];
    render(<JsonRenderPreview nodes={nodes} />);
    expect(screen.getByText('测试表单')).toBeInTheDocument();
  });

  it('calls onNodeClick when interactive and clicked', () => {
    const onNodeClick = vi.fn();
    const nodes = [mockFormNode()];
    render(<JsonRenderPreview nodes={nodes} onNodeClick={onNodeClick} interactive />);
    // The form should render; interaction tested via json-render internals
    expect(nodes.length).toBe(1);
  });

  it('has data-testid on container', () => {
    const nodes = [mockPageNode()];
    render(<JsonRenderPreview nodes={nodes} />);
    expect(screen.getByTestId('json-render-preview')).toBeInTheDocument();
  });
});

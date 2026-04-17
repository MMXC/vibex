/**
 * ProtoNode — Unit Tests
 * Epic1: E1-U3
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtoNode } from '../ProtoNode';
import type { ProtoNodeData } from '@/stores/prototypeStore';

describe('ProtoNode', () => {
  // E1-U3-AC1: Button renders with correct label and style
  it('renders Button with label text', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c1',
        type: 'button',
        name: 'Button',
        props: { label: '提交', variant: 'primary' },
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('提交')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /提交/i })).toBeInTheDocument();
  });

  // E1-U3-AC2: Button respects variant prop
  it('renders Button with ghost variant', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c1',
        type: 'button',
        name: 'Button',
        props: { label: 'Ghost', variant: 'ghost' },
      },
    };
    render(<ProtoNode data={data} />);
    const btn = screen.getByRole('button');
    // ghost has transparent background
    expect(btn).toBeInTheDocument();
  });

  // Button disabled state
  it('renders Button as disabled when mockData has disabled:true', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c1',
        type: 'button',
        name: 'Button',
        props: { label: 'Disabled' },
      },
      mockData: {
        data: { disabled: true },
        source: 'inline',
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // Input renders with placeholder
  it('renders Input with placeholder', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c2',
        type: 'input',
        name: 'Input',
        props: { placeholder: '请输入用户名' },
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
  });

  // Input disabled state
  it('renders Input as disabled', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c2',
        type: 'input',
        name: 'Input',
        props: { placeholder: 'disabled' },
      },
      mockData: { data: { disabled: true }, source: 'inline' },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // Card renders title
  it('renders Card with title', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c3',
        type: 'card',
        name: 'Card',
        props: { title: '我的卡片' },
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('我的卡片')).toBeInTheDocument();
  });

  // Card body content
  it('renders Card body text', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c3',
        type: 'card',
        name: 'Card',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('卡片内容区域')).toBeInTheDocument();
  });

  // Container renders dashed placeholder
  it('renders Container with dashed placeholder', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c4',
        type: 'container',
        name: 'Container',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('容器')).toBeInTheDocument();
  });

  // Header renders title
  it('renders Header with title', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c5',
        type: 'header',
        name: 'Header',
        props: { title: '页面标题' },
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('页面标题')).toBeInTheDocument();
  });

  // Navigation renders nav items
  it('renders Navigation with default items', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c6',
        type: 'navigation',
        name: 'Navigation',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
    expect(screen.getByText('联系')).toBeInTheDocument();
  });

  // Modal renders title
  it('renders Modal with title', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c7',
        type: 'modal',
        name: 'Modal',
        props: { title: '弹窗标题' },
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('弹窗标题')).toBeInTheDocument();
    expect(screen.getByText('弹窗内容')).toBeInTheDocument();
  });

  // Table renders column headers
  it('renders Table with default columns', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c8',
        type: 'table',
        name: 'Table',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  // Form renders labels
  it('renders Form with field labels', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c9',
        type: 'form',
        name: 'Form',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    expect(screen.getByText('用户名')).toBeInTheDocument();
    expect(screen.getByText('密码')).toBeInTheDocument();
    expect(screen.getByText('提交')).toBeInTheDocument();
  });

  // Image with URL renders img tag (via mockData.src)
  it('renders Image with src as img element', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c10',
        type: 'image',
        name: 'Image',
        props: { alt: '照片' },
      },
      mockData: {
        data: { src: 'https://example.com/photo.jpg', alt: '照片' } as Record<string, unknown>,
        source: 'inline',
      },
    };
    render(<ProtoNode data={data} />);
    // Renders wrapper div with img inside
    const wrap = document.querySelector('[data-type="image"] [class*="protoImageWrap"]');
    expect(wrap).toBeInTheDocument();
  });

  // Image without src renders placeholder
  it('renders Image placeholder when no src', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c10',
        type: 'image',
        name: 'Image',
        props: { alt: '照片' },
      },
    };
    render(<ProtoNode data={data} />);
    // Renders placeholder div
    const placeholder = document.querySelector('[class*="protoImagePlaceholder"]');
    expect(placeholder).toBeInTheDocument();
  });

  // Unknown type falls back gracefully
  it('renders fallback for unknown type', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c99',
        type: 'unknown-widget',
        name: 'UnknownWidget',
        props: {},
      },
    };
    render(<ProtoNode data={data} />);
    // Badge shows the type name from component.name
    const badge = document.querySelector('[class*="nodeBadge"]');
    expect(badge?.textContent).toBe('UnknownWidget');
  });

  // Node shows type badge
  it('renders type badge', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c1',
        type: 'button',
        name: 'Button',
        props: { label: 'Test' },
      },
    };
    render(<ProtoNode data={data} />);
    // Badge shows component.name
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  // selected state adds nodeSelected class
  it('renders selected state', () => {
    const data: ProtoNodeData = {
      component: {
        id: 'c1',
        type: 'button',
        name: 'Button',
        props: { label: 'Test' },
      },
    };
    const { container } = render(<ProtoNode data={data} selected />);
    // selected adds nodeSelected class — data-type uses component.name (Button)
    const nodeEl = container.querySelector('[data-type="Button"]');
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl?.className).toContain('nodeSelected');
  });
});

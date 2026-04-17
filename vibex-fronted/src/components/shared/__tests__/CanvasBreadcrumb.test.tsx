/**
 * CanvasBreadcrumb.test.tsx — Sprint5 T5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CanvasBreadcrumb } from '../CanvasBreadcrumb';

describe('CanvasBreadcrumb — T5', () => {
  it('renders all breadcrumb items', () => {
    render(
      <CanvasBreadcrumb
        items={[
          { label: '交付中心', href: '/canvas/delivery' },
          { label: '原型画布', href: '/prototype/editor' },
          { label: '当前页面' },
        ]}
      />
    );
    expect(screen.getByText('交付中心')).toBeInTheDocument();
    expect(screen.getByText('原型画布')).toBeInTheDocument();
    expect(screen.getByText('当前页面')).toBeInTheDocument();
  });

  it('marks last item as current page', () => {
    render(
      <CanvasBreadcrumb
        items={[
          { label: 'Canvas', href: '/canvas' },
          { label: '交付中心' },
        ]}
      />
    );
    const current = screen.getByText('交付中心');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders separators between items', () => {
    render(
      <CanvasBreadcrumb
        items={[
          { label: 'A', href: '/a' },
          { label: 'B', href: '/b' },
          { label: 'C' },
        ]}
      />
    );
    const separators = screen.getAllByText('>');
    expect(separators).toHaveLength(2);
  });

  it('handles single item gracefully', () => {
    render(<CanvasBreadcrumb items={[{ label: 'Only' }]} />);
    expect(screen.getByText('Only')).toBeInTheDocument();
  });
});

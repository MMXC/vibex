/**
 * DeliveryNav.test.tsx — Sprint5 T4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

import { DeliveryNav } from '../DeliveryNav';

describe('DeliveryNav — T4', () => {
  beforeEach(() => {
    mockPathname.mockReset();
  });

  it('renders three canvas links', () => {
    mockPathname.mockReturnValue('/canvas/delivery');
    render(<DeliveryNav />);
    expect(screen.getByText('原型画布')).toBeInTheDocument();
    expect(screen.getByText('详设画布')).toBeInTheDocument();
    expect(screen.getByText('交付中心')).toBeInTheDocument();
  });

  it('marks active canvas with aria-current', () => {
    mockPathname.mockReturnValue('/prototype/editor');
    render(<DeliveryNav />);
    expect(screen.getByText('原型画布')).toHaveAttribute('aria-current', 'page');
  });

  it('links to correct canvas routes', () => {
    mockPathname.mockReturnValue('/dds/canvas');
    render(<DeliveryNav />);
    expect(screen.getByRole('link', { name: '原型画布' })).toHaveAttribute('href', '/prototype/editor');
    expect(screen.getByRole('link', { name: '详设画布' })).toHaveAttribute('href', '/dds/canvas');
    expect(screen.getByRole('link', { name: '交付中心' })).toHaveAttribute('href', '/canvas/delivery');
  });

  it('non-active links have no aria-current', () => {
    mockPathname.mockReturnValue('/prototype/editor');
    render(<DeliveryNav />);
    expect(screen.getByText('详设画布')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('交付中心')).not.toHaveAttribute('aria-current');
  });

  it('all three links are rendered as links', () => {
    mockPathname.mockReturnValue('/dds/canvas');
    render(<DeliveryNav />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('renders with custom className', () => {
    mockPathname.mockReturnValue('/prototype/editor');
    const { container } = render(<DeliveryNav className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('handles sub-route as active', () => {
    mockPathname.mockReturnValue('/prototype/editor/page-123');
    render(<DeliveryNav />);
    expect(screen.getByText('原型画布')).toHaveAttribute('aria-current', 'page');
  });
});

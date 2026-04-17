/**
 * DeliveryNav.test.tsx — Sprint5 T4
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryNav } from '../DeliveryNav';
import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const { usePathname } = await import('next/navigation');

describe('DeliveryNav — T4', () => {
  it('renders three canvas links', () => {
    vi.mocked(usePathname).mockReturnValue('/canvas/delivery');
    render(<DeliveryNav />);
    expect(screen.getByText('原型画布')).toBeInTheDocument();
    expect(screen.getByText('详设画布')).toBeInTheDocument();
    expect(screen.getByText('交付中心')).toBeInTheDocument();
  });

  it('marks active canvas with aria-current', () => {
    vi.mocked(usePathname).mockReturnValue('/prototype/editor');
    render(<DeliveryNav />);
    const activeLink = screen.getByText('原型画布');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('links to correct canvas routes', () => {
    vi.mocked(usePathname).mockReturnValue('/dds/canvas');
    render(<DeliveryNav />);
    expect(screen.getByRole('link', { name: '原型画布' })).toHaveAttribute('href', '/prototype/editor');
    expect(screen.getByRole('link', { name: '详设画布' })).toHaveAttribute('href', '/dds/canvas');
    expect(screen.getByRole('link', { name: '交付中心' })).toHaveAttribute('href', '/canvas/delivery');
  });
});

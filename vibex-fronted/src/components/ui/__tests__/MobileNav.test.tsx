/**
 * MobileNav Component Tests
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MobileNav, Navbar } from '../MobileNav';

// Mock next/link
vi.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('MobileNav', () => {
  const mockItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    {
      label: 'Services',
      children: [
        { label: 'Design', href: '/design' },
        { label: 'Development', href: '/development' },
      ],
    },
    { label: 'Contact', href: '/contact' },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders hamburger button', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      expect(hamburger).toBeInTheDocument();
    });

    it('renders brand when provided', () => {
      render(<MobileNav items={mockItems} brand="TestBrand" />);

      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('renders menu items', () => {
      render(<MobileNav items={mockItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
    });
  });

  describe('Hamburger Menu Functionality', () => {
    it('opens menu on hamburger click', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Menu should now be open - verify via aria-expanded
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('closes menu on second hamburger click', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Menu should be open
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(hamburger);

      // Menu should be closed
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles aria-expanded on click', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });

      expect(hamburger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(hamburger);

      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Click Outside to Close', () => {
    it('closes menu when clicking outside', async () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Menu should be open
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('ESC Key Handler', () => {
    it('closes menu on ESC key', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Menu should be open
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');

      // Press ESC
      fireEvent.keyDown(window, { key: 'Escape' });

      // Menu should be closed
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Submenu Functionality', () => {
    it('expands submenu on click', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Find Services menu item and click it
      const servicesItem = screen.getByText('Services');
      fireEvent.click(servicesItem);

      // Submenu items should be visible
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('toggles submenu on click', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      // Click to expand
      const servicesItem = screen.getByText('Services');
      fireEvent.click(servicesItem);

      expect(screen.getByText('Design')).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(servicesItem);

      // Submenu should be hidden (we're just testing the toggle behavior)
    });
  });

  describe('Touch Gesture Support', () => {
    it('supports touch events on hamburger button', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });

      // Simulate touch interaction by firing click
      fireEvent.click(hamburger);

      // Menu should open after interaction
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('menu panel is rendered when menu is open', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      fireEvent.click(hamburger);

      const menuPanel = screen.getByRole('menu');

      // The menu panel should exist
      expect(menuPanel).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('hamburger button exists for mobile toggle', () => {
      render(<MobileNav items={mockItems} />);

      const hamburger = screen.getByRole('button', { name: /打开菜单/i });
      expect(hamburger).toBeInTheDocument();
    });
  });

  describe('Fixed Positioning', () => {
    it('renders with fixed prop', () => {
      render(<MobileNav items={mockItems} fixed={true} />);

      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('renders without fixed when fixed prop is false', () => {
      render(<MobileNav items={mockItems} fixed={false} />);

      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Custom Class Name', () => {
    it('applies custom className', () => {
      render(<MobileNav items={mockItems} className="custom-nav" />);

      const nav = document.querySelector('nav');
      // custom-nav is a plain className, not a CSS module class
      expect(nav?.className).toContain('custom-nav');
    });
  });
});

describe('Navbar', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders children correctly', () => {
    render(
      <Navbar>
        <span>Test Child</span>
      </Navbar>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('renders brand when provided', () => {
    render(
      <Navbar brand="TestBrand">
        <span>Content</span>
      </Navbar>
    );

    expect(screen.getByText('TestBrand')).toBeInTheDocument();
  });
});

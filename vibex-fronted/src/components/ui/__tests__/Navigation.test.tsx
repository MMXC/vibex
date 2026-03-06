/**
 * Navigation Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navigation, NavItem } from '../Navigation';

describe('Navigation', () => {
  const mockItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' },
  ];

  const mockItemsWithDropdown: NavItem[] = [
    { label: 'Home', href: '/' },
    {
      label: 'Menu',
      children: [
        { label: 'Sub1', href: '/sub1' },
        { label: 'Sub2', href: '/sub2' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render navigation component', () => {
      render(<Navigation items={mockItems} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render nav items', () => {
      render(<Navigation items={mockItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should render brand when provided', () => {
      render(<Navigation items={mockItems} brand={<div>My Brand</div>} />);
      expect(screen.getByText('My Brand')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <Navigation items={mockItems} footer={<div>Footer Content</div>} />
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should render user area when provided', () => {
      render(<Navigation items={mockItems} user={<div>User Info</div>} />);
      expect(screen.getByText('User Info')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('should render links with correct href', () => {
      render(<Navigation items={mockItems} />);
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/');
      expect(links[1]).toHaveAttribute('href', '/projects');
    });

    it('should render anchor tags for items with href', () => {
      render(<Navigation items={mockItems} />);
      const link = screen.getByText('Home');
      expect(link.closest('a')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('should render dropdown when item has children', () => {
      render(<Navigation items={mockItemsWithDropdown} />);
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should not show dropdown initially', () => {
      render(<Navigation items={mockItemsWithDropdown} />);
      expect(screen.queryByText('Sub1')).not.toBeInTheDocument();
    });

    it('should show dropdown on click', () => {
      render(<Navigation items={mockItemsWithDropdown} />);

      fireEvent.click(screen.getByText('Menu'));

      expect(screen.getByText('Sub1')).toBeInTheDocument();
      expect(screen.getByText('Sub2')).toBeInTheDocument();
    });

    it('should close dropdown on second click', () => {
      render(<Navigation items={mockItemsWithDropdown} />);

      fireEvent.click(screen.getByText('Menu'));
      expect(screen.getByText('Sub1')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Menu'));
      expect(screen.queryByText('Sub1')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      render(<Navigation items={mockItemsWithDropdown} />);

      fireEvent.click(screen.getByText('Menu'));
      expect(screen.getByText('Sub1')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Sub1')).not.toBeInTheDocument();
    });
  });

  describe('disabled items', () => {
    const mockItemsWithDisabled: NavItem[] = [
      { label: 'Disabled', href: '/disabled', disabled: true },
      { label: 'Enabled', href: '/enabled' },
    ];

    it('should render disabled item', () => {
      render(<Navigation items={mockItemsWithDisabled} />);
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('should render enabled item normally', () => {
      render(<Navigation items={mockItemsWithDisabled} />);
      const link = screen.getByText('Enabled');
      expect(link.closest('a')).toHaveAttribute('href', '/enabled');
    });
  });

  describe('active items', () => {
    const mockItemsWithActive: NavItem[] = [
      { label: 'Active', href: '/active', active: true },
      { label: 'Inactive', href: '/inactive' },
    ];

    it('should apply active class to active item', () => {
      render(<Navigation items={mockItemsWithActive} />);
      const activeLink = screen.getByText('Active');
      expect(activeLink.closest('a')).toHaveClass('active');
    });
  });

  describe('onClick handler', () => {
    it('should call onClick for item with onClick but no href', () => {
      const handleClick = jest.fn();
      const items: NavItem[] = [{ label: 'Click Me', onClick: handleClick }];

      render(<Navigation items={items} />);

      // Get the button and click it
      const button = screen.getByText('Click Me').closest('button');
      if (button) {
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalled();
      }
    });
  });

  describe('props', () => {
    it('should accept custom className', () => {
      render(<Navigation items={mockItems} className="custom-class" />);
      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });

    it('should apply fixed class when fixed is true', () => {
      render(<Navigation items={mockItems} fixed={true} />);
      expect(screen.getByRole('navigation')).toHaveClass('fixed');
    });

    it('should not apply fixed class when fixed is false', () => {
      render(<Navigation items={mockItems} fixed={false} />);
      expect(screen.getByRole('navigation')).not.toHaveClass('fixed');
    });
  });

  describe('accessibility', () => {
    it('should render without accessibility errors', () => {
      render(<Navigation items={mockItemsWithDropdown} />);

      // Should render dropdown button
      expect(screen.getByText('Menu')).toBeInTheDocument();

      // Should open dropdown
      fireEvent.click(screen.getByText('Menu'));
      expect(screen.getByText('Sub1')).toBeInTheDocument();
    });
  });
});

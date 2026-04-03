// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No projects yet"
        description="Create your first project to get started"
      />
    );
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first project to get started')
    ).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items"
        description="Nothing here yet"
      />
    );
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Lucide icon renders as an SVG inside the status
    const svg = status.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Add item</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(
      <EmptyState variant="projects" title="No projects" />
    );
    expect(container.firstChild).toHaveClass('projects');
  });

  it('has role=status for accessibility', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

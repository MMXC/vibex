import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Badge variant="default">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with error variant', () => {
    render(<Badge variant="error">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Badge size="small">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with medium size', () => {
    render(<Badge size="medium">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with large size', () => {
    render(<Badge size="large">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with color', () => {
    render(<Badge color="#f00">5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders zero', () => {
    render(<Badge>0</Badge>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
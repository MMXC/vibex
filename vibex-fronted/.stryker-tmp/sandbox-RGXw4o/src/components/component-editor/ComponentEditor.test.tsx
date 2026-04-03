/**
 * Component Editor Tests
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import { ComponentEditor } from '../component-editor/ComponentEditor';

describe('ComponentEditor', () => {
  const mockComponents = [
    { id: '1', type: 'button', name: 'Submit' },
    { id: '2', type: 'input', name: 'Name' },
  ];

  it('should render', () => {
    render(<ComponentEditor components={mockComponents} />);
    expect(screen.getByText('添加组件')).toBeInTheDocument();
  });

  it('should show add button', () => {
    render(<ComponentEditor components={[]} />);
    expect(screen.getByText('添加组件')).toBeInTheDocument();
  });

  it('should display component list', () => {
    render(<ComponentEditor components={mockComponents} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

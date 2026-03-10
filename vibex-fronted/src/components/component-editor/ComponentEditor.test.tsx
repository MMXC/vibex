/**
 * Component Editor Tests
 */

import { render, screen } from '@testing-library/react';
import { ComponentEditor } from '../component-editor/ComponentEditor';

describe('ComponentEditor', () => {
  const mockComponents = [
    { id: '1', type: 'button', name: 'Submit' },
    { id: '2', type: 'input', name: 'Name' },
  ];

  it('should render', () => {
    render(<ComponentEditor components={mockComponents} />);
    expect(screen.getByText('组件列表')).toBeInTheDocument();
  });

  it('should show add form', () => {
    render(<ComponentEditor components={[]} />);
    expect(screen.getByText('添加组件')).toBeInTheDocument();
  });

  it('should list components', () => {
    render(<ComponentEditor components={mockComponents} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should call onAdd', () => {
    const onAdd = jest.fn();
    render(<ComponentEditor components={[]} onAdd={onAdd} />);
  });

  it('should call onDelete', () => {
    const onDelete = jest.fn();
    render(<ComponentEditor components={mockComponents} onDelete={onDelete} />);
  });
});

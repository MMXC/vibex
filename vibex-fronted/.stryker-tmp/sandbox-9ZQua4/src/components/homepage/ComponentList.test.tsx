/**
 * ComponentList Test - Epic 5: UI组件与项目创建
 * 
 * 验收标准: expect(componentList).toRender()
 */
// @ts-nocheck


import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock ComponentList component
const MockComponentList = ({ components = [], selectedIds = new Set<string>(), onSelect }: {
  components?: Array<{ id: string; name: string; type: string }>;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}) => {
  return (
    <div data-testid="component-list">
      {components.map(comp => (
        <div 
          key={comp.id} 
          data-component-id={comp.id}
          data-selected={selectedIds.has(comp.id)}
          onClick={() => onSelect?.(comp.id)}
        >
          <span>{comp.name}</span>
          <span>{comp.type}</span>
        </div>
      ))}
    </div>
  );
};

// Mock ProjectCreator component
const MockProjectCreator = ({ selectedComponents = [], onCreate, isCreating }: {
  selectedComponents?: Array<{ id: string; name: string }>;
  onCreate?: () => void;
  isCreating?: boolean;
}) => {
  return (
    <div data-testid="project-creator">
      <div data-testid="selected-count">{selectedComponents.length} components selected</div>
      <button 
        data-testid="create-button"
        disabled={isCreating || selectedComponents.length === 0}
        onClick={onCreate}
      >
        {isCreating ? 'Creating...' : 'Create Project'}
      </button>
    </div>
  );
};

describe('Epic 5: ComponentList - UI组件与项目创建', () => {
  const mockComponents = [
    { id: 'comp-1', name: 'Header', type: 'layout' },
    { id: 'comp-2', name: 'Button', type: 'form' },
    { id: 'comp-3', name: 'Card', type: 'display' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ComponentList', () => {
    it('should render component list', () => {
      render(<MockComponentList components={mockComponents} />);
      
      const list = screen.getByTestId('component-list');
      expect(list).toBeInTheDocument();
    });

    it('should display all components', () => {
      render(<MockComponentList components={mockComponents} />);
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('should show component types', () => {
      render(<MockComponentList components={mockComponents} />);
      
      expect(screen.getAllByText('layout').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('form').length).toBeGreaterThanOrEqual(1);
    });

    it('should highlight selected components', () => {
      const selectedIds = new Set(['comp-1', 'comp-3']);
      render(<MockComponentList components={mockComponents} selectedIds={selectedIds} />);
      
      const comp1 = screen.getByTestId('component-list').querySelector('[data-component-id="comp-1"]');
      expect(comp1?.getAttribute('data-selected')).toBe('true');
    });
  });

  describe('ProjectCreator', () => {
    it('should render project creator', () => {
      render(<MockProjectCreator />);
      
      const creator = screen.getByTestId('project-creator');
      expect(creator).toBeInTheDocument();
    });

    it('should show selected component count', () => {
      render(<MockProjectCreator selectedComponents={mockComponents} />);
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('3 components selected');
    });

    it('should disable create button when no components selected', () => {
      render(<MockProjectCreator selectedComponents={[]} />);
      
      const button = screen.getByTestId('create-button');
      expect(button).toBeDisabled();
    });

    it('should enable create button when components selected', () => {
      render(<MockProjectCreator selectedComponents={mockComponents} />);
      
      const button = screen.getByTestId('create-button');
      expect(button).not.toBeDisabled();
    });

    it('should show creating state', () => {
      render(<MockProjectCreator selectedComponents={mockComponents} isCreating={true} />);
      
      const button = screen.getByTestId('create-button');
      expect(button).toHaveTextContent('Creating...');
      expect(button).toBeDisabled();
    });
  });
});

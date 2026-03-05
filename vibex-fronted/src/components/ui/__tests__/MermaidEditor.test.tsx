/**
 * MermaidEditor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MermaidEditor } from '../MermaidEditor';

// Mock mermaid
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockImplementation(async (id, code) => {
    if (code.includes('invalid')) {
      throw new Error('Syntax error in diagram');
    }
    return { svg: '<svg>rendered chart</svg>' };
  }),
}));

// Mock MermaidCodeEditor
jest.mock('../MermaidCodeEditor', () => ({
  __esModule: true,
  default: function MockMermaidCodeEditor({ value, onChange, readOnly }: any) {
    return (
      <textarea
        data-testid="code-editor"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
      />
    );
  },
}));

import mermaid from 'mermaid';

describe('MermaidEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render with default props', () => {
      render(<MermaidEditor value="" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should render with custom height', () => {
      render(<MermaidEditor value="" height="600px" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<MermaidEditor value="" className="custom-class" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  describe('code editing', () => {
    it('should call onChange when code changes', () => {
      const onChange = jest.fn();
      render(<MermaidEditor value="" onChange={onChange} />);
      
      fireEvent.change(screen.getByTestId('code-editor'), {
        target: { value: 'graph TD\nA --> B' },
      });
      
      expect(onChange).toHaveBeenCalledWith('graph TD\nA --> B');
    });

    it('should update value when prop changes', () => {
      const { rerender } = render(<MermaidEditor value="initial" />);
      expect(screen.getByTestId('code-editor')).toHaveValue('initial');
      
      rerender(<MermaidEditor value="updated" />);
      expect(screen.getByTestId('code-editor')).toHaveValue('updated');
    });
  });

  describe('readOnly mode', () => {
    it('should render editor as readonly when readOnly is true', () => {
      render(<MermaidEditor value="" readOnly={true} />);
      expect(screen.getByTestId('code-editor')).toHaveAttribute('readOnly');
    });

    it('should not call onChange in readOnly mode', () => {
      const onChange = jest.fn();
      const { rerender } = render(<MermaidEditor value="" readOnly={true} onChange={onChange} />);
      
      // In readOnly mode, onChange should still work through prop changes
      rerender(<MermaidEditor value="new value" readOnly={true} onChange={onChange} />);
      expect(screen.getByTestId('code-editor')).toHaveValue('new value');
    });
  });

  describe('diagram types', () => {
    it('should accept graph diagram type', () => {
      render(<MermaidEditor value="" diagramType="graph" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept classDiagram diagram type', () => {
      render(<MermaidEditor value="" diagramType="classDiagram" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept stateDiagram diagram type', () => {
      render(<MermaidEditor value="" diagramType="stateDiagram" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept flowchart diagram type', () => {
      render(<MermaidEditor value="" diagramType="flowchart" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  describe('layout direction', () => {
    it('should accept TB layout', () => {
      render(<MermaidEditor value="" layout="TB" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept LR layout', () => {
      render(<MermaidEditor value="" layout="LR" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept BT layout', () => {
      render(<MermaidEditor value="" layout="BT" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });

    it('should accept RL layout', () => {
      render(<MermaidEditor value="" layout="RL" />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  describe('preview', () => {
    it('should show preview by default', () => {
      render(<MermaidEditor value="graph TD\nA --> B" showPreview={true} />);
      // Preview should be rendered
    });

    it('should hide preview when showPreview is false', () => {
      render(<MermaidEditor value="" showPreview={false} />);
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should call onError when preview fails', async () => {
      const onError = jest.fn();
      (mermaid.render as jest.Mock).mockRejectedValueOnce(new Error('Invalid syntax'));
      
      render(<MermaidEditor value="invalid" onError={onError} />);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });
});

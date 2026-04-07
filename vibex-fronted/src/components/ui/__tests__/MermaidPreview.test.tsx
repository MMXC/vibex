/**
 * MermaidPreview Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MermaidPreview } from '../MermaidPreview';

// Use vi.hoisted to ensure mock functions are hoisted with vi.mock
const { mockRender } = vi.hoisted(() => ({
  mockRender: vi.fn(),
}));

vi.mock('@/lib/mermaid/MermaidManager', () => ({
  mermaidManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    render: mockRender,
    isInitialized: vi.fn().mockReturnValue(true),
  },
}));

describe('MermaidPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRender.mockReset();
    mockRender.mockImplementation(async (code: string) => ({
      svg: '<svg>rendered chart</svg>',
      id: 'mermaid-svg',
    }));
  });

  describe('basic rendering', () => {
    it('should render empty state when no code provided', () => {
      render(<MermaidPreview code="" />);
      expect(screen.getByText('暂无图表内容')).toBeInTheDocument();
    });

    it('should render empty state when code is whitespace only', () => {
      render(<MermaidPreview code="   " />);
      expect(screen.getByText('暂无图表内容')).toBeInTheDocument();
    });

    it('should accept custom height prop', () => {
      render(<MermaidPreview code="" height="600px" />);
      expect(screen.getByText('暂无图表内容')).toBeInTheDocument();
    });

    it('should accept custom className prop', () => {
      render(<MermaidPreview code="" className="custom-class" />);
      expect(screen.getByText('暂无图表内容')).toBeInTheDocument();
    });
  });

  describe('diagram types', () => {
    it('should render with graph type', async () => {
      render(<MermaidPreview code="graph TD\nA --> B" diagramType="graph" />);
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
    });

    it('should render with classDiagram type', async () => {
      render(<MermaidPreview code="class A" diagramType="classDiagram" />);
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
    });

    it('should render with stateDiagram type', async () => {
      render(<MermaidPreview code="state A" diagramType="stateDiagram" />);
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
    });

    it('should render with flowchart type', async () => {
      render(<MermaidPreview code="flowchart TD\nA --> B" diagramType="flowchart" />);
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
    });
  });

  describe('layout direction', () => {
    it('should accept TB layout', () => {
      render(<MermaidPreview code="graph TD\nA --> B" layout="TB" />);
    });

    it('should accept LR layout', () => {
      render(<MermaidPreview code="graph LR\nA --> B" layout="LR" />);
    });

    it('should accept BT layout', () => {
      render(<MermaidPreview code="graph BT\nA --> B" layout="BT" />);
    });

    it('should accept RL layout', () => {
      render(<MermaidPreview code="graph RL\nA --> B" layout="RL" />);
    });
  });

  describe('error handling', () => {
    it('should render error state when rendering fails', async () => {
      mockRender.mockRejectedValueOnce(new Error('Invalid syntax'));

      render(<MermaidPreview code="invalid code" onError={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/语法错误:/)).toBeInTheDocument();
      });
    });

    it('should call onError callback when error occurs', async () => {
      const onError = vi.fn();
      mockRender.mockRejectedValueOnce(new Error('Test error'));

      render(<MermaidPreview code="invalid" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });
});

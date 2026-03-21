/**
 * AIResultCards + AICard Tests
 * 
 * Epic 7: AI 展示区
 * Test IDs: ST-7.1, ST-7.2, ST-7.3
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AIResultCards } from './AIResultCards';
import { AICard } from './AICard';
import type { AIResult } from '../hooks/useSSEStream';

// Mock AICard standalone
describe('AICard', () => {
  const mockMeta = {
    title: '限界上下文',
    icon: '🔵',
    description: 'Define system boundaries',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ST-7.2: 卡片内容填充', () => {
    it('should render card with meta title', () => {
      render(
        <AICard
          type="context"
          meta={mockMeta}
        />
      );
      expect(screen.getByText('限界上下文')).toBeInTheDocument();
    });

    it('should render card with icon', () => {
      render(
        <AICard
          type="context"
          meta={mockMeta}
        />
      );
      expect(screen.getByText('🔵')).toBeInTheDocument();
    });

    it('should display result content when provided', () => {
      const result: AIResult = {
        type: 'context',
        content: 'User Management Context - handles user registration and authentication',
        mermaidCode: 'graph TD; A-->B',
        confidence: 0.85,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      expect(screen.getByText(/User Management Context/)).toBeInTheDocument();
    });

    it('should display confidence percentage', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Test content',
        mermaidCode: '',
        confidence: 0.85,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      expect(screen.getByTestId('card-confidence-context')).toHaveTextContent('85%');
    });

    it('should show empty state when no result', () => {
      render(
        <AICard
          type="context"
          meta={mockMeta}
        />
      );
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should show loading skeleton when isLoading is true', () => {
      render(
        <AICard
          type="context"
          meta={mockMeta}
          isLoading={true}
        />
      );

      const card = screen.getByTestId('ai-card-context');
      expect(card).toHaveAttribute('data-state', 'loading');
    });
  });

  describe('ST-7.3: 卡片点击展开详情', () => {
    it('should expand on click when has result', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Short content',
        mermaidCode: 'graph TD; A-->B',
        confidence: 0.85,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      // Initially collapsed
      expect(screen.getByTestId('ai-card-context')).toHaveAttribute('data-state', 'collapsed');

      // Click to expand
      fireEvent.click(screen.getByTestId('ai-card-context'));
      expect(screen.getByTestId('ai-card-context')).toHaveAttribute('data-state', 'expanded');

      // Expanded content visible
      expect(screen.getByTestId('card-expanded-context')).toBeInTheDocument();
    });

    it('should show full content when expanded', () => {
      const result: AIResult = {
        type: 'context',
        content: 'This is the full content that should be shown when expanded.',
        mermaidCode: '',
        confidence: 0.9,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-context'));

      // Full content visible in expanded area
      expect(screen.getByTestId('card-expanded-context')).toHaveTextContent(
        'This is the full content that should be shown when expanded.'
      );
    });

    it('should show mermaid code preview when expanded and mermaidCode exists', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Context content',
        mermaidCode: 'graph TD\n  A[Start] --> B[End]',
        confidence: 0.8,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-context'));

      // Mermaid code visible in expanded content
      expect(screen.getByText(/graph TD/)).toBeInTheDocument();
    });

    it('should collapse on second click', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      const card = screen.getByTestId('ai-card-context');

      // Expand
      fireEvent.click(card);
      expect(card).toHaveAttribute('data-state', 'expanded');

      // Collapse
      fireEvent.click(card);
      expect(card).toHaveAttribute('data-state', 'collapsed');
    });

    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      const result: AIResult = {
        type: 'context',
        content: 'Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-context'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should toggle selected state', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      const { rerender } = render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
          isSelected={false}
        />
      );

      expect(screen.getByTestId('ai-card-context')).not.toHaveClass('selected');

      rerender(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
          isSelected={true}
        />
      );

      expect(screen.getByTestId('ai-card-context')).toHaveClass('selected');
    });

    it('should handle keyboard Enter key to expand', () => {
      const result: AIResult = {
        type: 'context',
        content: 'Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AICard
          type="context"
          meta={mockMeta}
          result={result}
        />
      );

      const card = screen.getByTestId('ai-card-context');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(card).toHaveAttribute('data-state', 'expanded');
    });
  });
});

// Mock AIResultCards
describe('AIResultCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ST-7.1: 三列卡片布局', () => {
    it('should render three cards in a grid', () => {
      render(<AIResultCards />);
      
      expect(screen.getByTestId('ai-card-context')).toBeInTheDocument();
      expect(screen.getByTestId('ai-card-model')).toBeInTheDocument();
      expect(screen.getByTestId('ai-card-flow')).toBeInTheDocument();
    });

    it('should render with three column grid', () => {
      render(<AIResultCards />);
      
      const grid = screen.getByTestId('cards-grid');
      expect(grid).toHaveAttribute('data-columns', '3');
    });

    it('should render section header', () => {
      render(<AIResultCards />);
      expect(screen.getByText('AI 分析结果')).toBeInTheDocument();
    });

    it('should show loading badge when isLoading', () => {
      render(<AIResultCards isLoading={true} />);
      expect(screen.getByTestId('cards-loading-badge')).toHaveTextContent('分析中...');
    });

    it('should show placeholder when no results and not loading', () => {
      render(<AIResultCards />);
      expect(screen.getByTestId('cards-placeholder')).toBeInTheDocument();
    });

    it('should not show placeholder when has results', () => {
      const results: AIResult[] = [
        { type: 'context', content: 'Context', mermaidCode: '', confidence: 0.8 },
      ];
      render(<AIResultCards results={results} />);
      expect(screen.queryByTestId('cards-placeholder')).not.toBeInTheDocument();
    });

    it('should render with correct card count', () => {
      const results: AIResult[] = [
        { type: 'context', content: 'Context', mermaidCode: '', confidence: 0.8 },
        { type: 'model', content: 'Model', mermaidCode: '', confidence: 0.8 },
        { type: 'flow', content: 'Flow', mermaidCode: '', confidence: 0.8 },
      ];
      render(<AIResultCards results={results} />);
      
      const container = screen.getByTestId('ai-result-cards');
      expect(container).toHaveAttribute('data-card-count', '3');
    });
  });

  describe('ST-7.2: 卡片内容填充', () => {
    it('should pass context result to context card', () => {
      const contextResult: AIResult = {
        type: 'context',
        content: 'User Management Context',
        mermaidCode: 'graph TD;',
        confidence: 0.85,
      };

      render(
        <AIResultCards
          contextResult={contextResult}
        />
      );

      expect(screen.getByText(/User Management Context/)).toBeInTheDocument();
    });

    it('should pass model result to model card', () => {
      const modelResult: AIResult = {
        type: 'model',
        content: 'User Entity',
        mermaidCode: 'classDiagram;',
        confidence: 0.9,
      };

      render(
        <AIResultCards
          modelResult={modelResult}
        />
      );

      expect(screen.getByText(/User Entity/)).toBeInTheDocument();
    });

    it('should pass flow result to flow card', () => {
      const flowResult: AIResult = {
        type: 'flow',
        content: 'Registration Flow',
        mermaidCode: 'flowchart TD;',
        confidence: 0.75,
      };

      render(
        <AIResultCards
          flowResult={flowResult}
        />
      );

      expect(screen.getByText(/Registration Flow/)).toBeInTheDocument();
    });

    it('should use results array when provided', () => {
      const results: AIResult[] = [
        { type: 'context', content: 'Context A', mermaidCode: '', confidence: 0.8 },
        { type: 'model', content: 'Model B', mermaidCode: '', confidence: 0.85 },
        { type: 'flow', content: 'Flow C', mermaidCode: '', confidence: 0.9 },
      ];

      render(<AIResultCards results={results} />);

      expect(screen.getByText('Context A')).toBeInTheDocument();
      expect(screen.getByText('Model B')).toBeInTheDocument();
      expect(screen.getByText('Flow C')).toBeInTheDocument();
    });

    it('should show all three card titles', () => {
      render(<AIResultCards />);

      expect(screen.getByText('限界上下文')).toBeInTheDocument();
      expect(screen.getByText('领域模型')).toBeInTheDocument();
      expect(screen.getByText('业务流程')).toBeInTheDocument();
    });
  });

  describe('ST-7.3: 卡片点击展开详情', () => {
    it('should call onCardClick with context type', () => {
      const onCardClick = jest.fn();
      const contextResult: AIResult = {
        type: 'context',
        content: 'Context Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AIResultCards
          contextResult={contextResult}
          onCardClick={onCardClick}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-context'));
      expect(onCardClick).toHaveBeenCalledWith('context');
    });

    it('should call onCardClick with model type', () => {
      const onCardClick = jest.fn();
      const modelResult: AIResult = {
        type: 'model',
        content: 'Model Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AIResultCards
          modelResult={modelResult}
          onCardClick={onCardClick}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-model'));
      expect(onCardClick).toHaveBeenCalledWith('model');
    });

    it('should call onCardClick with flow type', () => {
      const onCardClick = jest.fn();
      const flowResult: AIResult = {
        type: 'flow',
        content: 'Flow Content',
        mermaidCode: '',
        confidence: 0.8,
      };

      render(
        <AIResultCards
          flowResult={flowResult}
          onCardClick={onCardClick}
        />
      );

      fireEvent.click(screen.getByTestId('ai-card-flow'));
      expect(onCardClick).toHaveBeenCalledWith('flow');
    });

    it('should sync selected type across cards', () => {
      const contextResult: AIResult = {
        type: 'context',
        content: 'Context',
        mermaidCode: '',
        confidence: 0.8,
      };
      const modelResult: AIResult = {
        type: 'model',
        content: 'Model',
        mermaidCode: '',
        confidence: 0.8,
      };

      const { rerender } = render(
        <AIResultCards
          contextResult={contextResult}
          modelResult={modelResult}
          selectedType="context"
        />
      );

      expect(screen.getByTestId('ai-card-context')).toHaveAttribute('data-selected', 'true');

      rerender(
        <AIResultCards
          contextResult={contextResult}
          modelResult={modelResult}
          selectedType="model"
        />
      );

      expect(screen.getByTestId('ai-card-model')).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('R-4: 卡片内容与预览区同步', () => {
    it('should reflect results from individual props', () => {
      const contextResult: AIResult = {
        type: 'context',
        content: 'Shared Context Content',
        mermaidCode: 'shared-mermaid',
        confidence: 0.92,
      };

      render(<AIResultCards contextResult={contextResult} />);

      // Card shows the shared content
      expect(screen.getByText('Shared Context Content')).toBeInTheDocument();
      // Confidence is synced
      expect(screen.getByTestId('card-confidence-context')).toHaveTextContent('92%');
    });

    it('should use results array as primary source when both are provided', () => {
      const results: AIResult[] = [
        { type: 'context', content: 'From Array', mermaidCode: '', confidence: 0.95 },
      ];
      const contextResult: AIResult = {
        type: 'context',
        content: 'From Prop',
        mermaidCode: '',
        confidence: 0.7,
      };

      render(<AIResultCards results={results} contextResult={contextResult} />);

      // Results array takes precedence
      expect(screen.getByText('From Array')).toBeInTheDocument();
    });
  });
});

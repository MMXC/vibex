/**
 * Epic2: 本地数据模式测试
 *
 * Tests:
 * S2.1: boundedContexts → CardTreeNode[] 转换
 * S2.2: useProjectTree 支持 localData 参数
 * S2.3: CardTreeView 使用 boundedContexts 数据
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PreviewArea } from '../PreviewArea';

// Mock all dependencies
vi.mock('../../CardTree/CardTreeView', () => ({
  CardTreeView: ({ 'data-testid': testId, boundedContexts }: { 'data-testid'?: string; boundedContexts?: unknown }) => (
    <div data-testid={testId || 'preview-cardtree'}>
      CardTreeView
      {boundedContexts ? ` (localData: ${(boundedContexts as unknown[]).length} contexts)` : ' (no localData)'}
    </div>
  ),
  IS_CARD_TREE_ENABLED: false,
}));

vi.mock('@/components/visualization/CardTreeRenderer/CardTreeRenderer', () => ({
  CardTreeRenderer: () => <div data-testid="card-tree-renderer">MockRenderer</div>,
}));

vi.mock('../../CardTree/CardTree.module.css', () => ({
  wrapper: 'wrapper',
  empty: 'empty',
}));

vi.mock('@/components/ui/MermaidPreview', () => ({
  MermaidPreview: () => <div data-testid="mermaid-preview">Mermaid</div>,
}));

vi.mock('../NodeTreeSelector', () => ({
  NodeTreeSelector: () => <div data-testid="node-tree-selector">NodeTree</div>,
}));

vi.mock('@/stores/confirmationStore', () => {
  const mockSelector = (s: { flowMermaidCode: unknown }) => s.flowMermaidCode;
  return {
    useConfirmationStore: vi.fn((selector: typeof mockSelector) => {
      if (selector) return selector({ flowMermaidCode: null });
      return { flowMermaidCode: null };
    }),
  };
});

const defaultContext = {
  id: 'ctx-1',
  name: 'Test Context',
  description: 'A test context',
  type: 'core' as const,
  relationships: [],
};

describe('Epic 2: 本地数据模式', () => {
  describe('S2.1: boundedContexts → CardTreeNode[] 转换', () => {
    it('should render CardTreeView with boundedContexts as localData', () => {
      render(
        <PreviewArea
          useCardTree={true}
          projectId="test-project"
          currentStep={3}
          boundedContexts={[defaultContext]}
        />
      );

      expect(screen.queryByTestId('preview-cardtree')).toBeTruthy();
      expect(screen.queryByTestId('preview-cardtree')).toHaveTextContent('localData: 1 contexts');
    });

    it('should render CardTreeView with multiple boundedContexts', () => {
      render(
        <PreviewArea
          useCardTree={true}
          projectId="test-project"
          currentStep={3}
          boundedContexts={[
            { ...defaultContext, id: 'ctx-1', name: 'User Context' },
            { ...defaultContext, id: 'ctx-2', name: 'Order Context' },
            { ...defaultContext, id: 'ctx-3', name: 'Payment Context' },
          ]}
        />
      );

      expect(screen.queryByTestId('preview-cardtree')).toBeTruthy();
      expect(screen.queryByTestId('preview-cardtree')).toHaveTextContent('localData: 3 contexts');
    });

    it('should render CardTreeView even when boundedContexts is empty', () => {
      render(
        <PreviewArea
          useCardTree={true}
          projectId="test-project"
          currentStep={3}
          boundedContexts={[]}
        />
      );

      expect(screen.queryByTestId('preview-cardtree')).toBeTruthy();
    });
  });

  describe('S2.2: useProjectTree 支持 localData 参数', () => {
    it('should accept boundedContexts and render CardTree', () => {
      render(
        <PreviewArea
          useCardTree={true}
          projectId="my-project-456"
          currentStep={3}
          boundedContexts={[
            {
              ...defaultContext,
              id: 'ctx-user',
              name: 'User Management',
              description: 'Manages user accounts',
              type: 'core',
              relationships: [
                {
                  id: 'rel-1',
                  fromContextId: 'ctx-user',
                  toContextId: 'ctx-auth',
                  type: 'upstream',
                  description: 'Uses authentication service',
                },
              ],
            },
          ]}
        />
      );

      expect(screen.queryByTestId('preview-cardtree')).toBeTruthy();
      expect(screen.queryByTestId('preview-cardtree')).toHaveTextContent('localData: 1 contexts');
    });
  });

  describe('S2.3: CardTreeView 使用 boundedContexts 数据', () => {
    it('should pass boundedContexts to CardTreeView', () => {
      const contexts = [
        { ...defaultContext, name: 'Context A' },
        { ...defaultContext, name: 'Context B' },
      ];
      render(
        <PreviewArea
          useCardTree={true}
          projectId="project-789"
          currentStep={3}
          boundedContexts={contexts}
        />
      );

      const cardTree = screen.queryByTestId('preview-cardtree');
      expect(cardTree).toBeTruthy();
      expect(cardTree).toHaveTextContent('localData: 2 contexts');
    });
  });
});

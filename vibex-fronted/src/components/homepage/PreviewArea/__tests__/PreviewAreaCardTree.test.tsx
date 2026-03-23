/**
 * PreviewArea CardTree Integration Tests
 * 
 * Tests the Feature Flag integration for CardTree in PreviewArea
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PreviewArea } from '../PreviewArea';

// Mock CardTreeView
jest.mock('@/components/homepage/CardTree/CardTreeView', () => ({
  CardTreeView: jest.fn(() => <div data-testid="cardtree-view">CardTree View</div>),
  IS_CARD_TREE_ENABLED: false, // Default to false
}));

// Mock MermaidPreview
jest.mock('@/components/ui/MermaidPreview', () => ({
  MermaidPreview: jest.fn(() => <div data-testid="mermaid-preview">Mermaid Preview</div>),
}));

// Mock useConfirmationStore
jest.mock('@/stores/confirmationStore', () => ({
  useConfirmationStore: jest.fn(() => ''),
}));

// Import after mocks
const { IS_CARD_TREE_ENABLED } = require('@/components/homepage/CardTree/CardTreeView');

describe('PreviewArea CardTree Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Flag Control', () => {
    it('renders placeholder when Feature Flag is disabled and no mermaid code', () => {
      // IS_CARD_TREE_ENABLED is false by default
      // Without mermaidCode prop, PreviewArea renders placeholder (not MermaidPreview)
      render(<PreviewArea currentStep={1} />);
      
      // Should show placeholder when no code is provided
      expect(screen.queryByText('输入需求后，这里将显示 DDD 分析结果')).toBeTruthy();
    });

    it('renders MermaidPreview when Feature Flag is disabled and mermaid code provided', () => {
      // IS_CARD_TREE_ENABLED is false by default
      render(<PreviewArea currentStep={1} mermaidCode="graph TD; A-->B;" />);
      
      // Should show Mermaid preview when flag is off and code is provided
      expect(screen.queryByTestId('mermaid-preview')).toBeTruthy();
    });

    it('renders CardTreeView when useCardTree prop is true', () => {
      render(<PreviewArea currentStep={1} useCardTree={true} />);
      
      // Should show CardTree view when prop is true
      expect(screen.queryByTestId('cardtree-view')).toBeTruthy();
    });

    it('renders CardTreeView when Feature Flag is enabled via prop override', () => {
      render(<PreviewArea currentStep={1} useCardTree={true} />);
      
      // Should show CardTree view
      expect(screen.queryByTestId('cardtree-view')).toBeTruthy();
    });

    it('shows placeholder when useCardTree is false and no mermaid code', () => {
      render(<PreviewArea currentStep={1} useCardTree={false} />);
      
      // When useCardTree is false and no mermaid code, shows placeholder
      // (not mermaid preview because there's no code to render)
      expect(screen.queryByText('输入需求后，这里将显示 DDD 分析结果')).toBeTruthy();
    });
  });

  describe('Rendering', () => {
    it('renders placeholder when no mermaid code and flag is off', () => {
      render(<PreviewArea currentStep={1} />);
      
      // Should show placeholder
      expect(screen.queryByText('输入需求后，这里将显示 DDD 分析结果')).toBeTruthy();
    });

    it('renders step indicator with correct step label', () => {
      render(<PreviewArea currentStep={1} steps={[{id: 1, label: 'Step 1', description: 'desc'}]} />);
      
      // Should show step 1 indicator
      expect(screen.queryByText('Step 1')).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      render(<PreviewArea currentStep={1} isGenerating={true} />);
      
      // Should show loading indicator
      expect(screen.queryByText('AI 正在分析需求...')).toBeTruthy();
    });
  });
});

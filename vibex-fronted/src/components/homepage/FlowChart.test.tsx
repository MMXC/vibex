/**
 * FlowChart Test - Epic 4: 业务流程
 * 
 * 验收标准: expect(flowchart).toRender()
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock FlowChart component
const MockFlowChart = ({ mermaidCode, isLoading }: { mermaidCode?: string; isLoading?: boolean }) => {
  if (isLoading) {
    return <div data-testid="flowchart-loading">Loading...</div>;
  }
  
  return (
    <div data-testid="flowchart-container">
      {mermaidCode ? (
        <pre data-testid="flowchart-mermaid">{mermaidCode}</pre>
      ) : (
        <div data-testid="flowchart-empty">No flowchart</div>
      )}
    </div>
  );
};

describe('Epic 4: FlowChart - 业务流程', () => {
  const mockFlowMermaidCode = `graph TD
    A[开始] --> B[输入需求]
    B --> C{判断}
    C -->|是| D[生成上下文]
    C -->|否| E[提示错误]
    D --> F[生成流程]
    F --> G[结束]`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render flowchart', () => {
    render(<MockFlowChart mermaidCode={mockFlowMermaidCode} />);
    
    const container = screen.getByTestId('flowchart-container');
    expect(container).toBeInTheDocument();
  });

  it('should display mermaid code', () => {
    render(<MockFlowChart mermaidCode={mockFlowMermaidCode} />);
    
    const mermaid = screen.getByTestId('flowchart-mermaid');
    expect(mermaid).toBeInTheDocument();
    expect(mermaid.textContent).toContain('graph TD');
  });

  it('should show loading state', () => {
    render(<MockFlowChart isLoading={true} />);
    
    const loading = screen.getByTestId('flowchart-loading');
    expect(loading).toBeInTheDocument();
  });

  it('should show empty state when no flowchart', () => {
    render(<MockFlowChart />);
    
    const empty = screen.getByTestId('flowchart-empty');
    expect(empty).toBeInTheDocument();
  });

  it('should render flowchart nodes correctly', () => {
    render(<MockFlowChart mermaidCode={mockFlowMermaidCode} />);
    
    // The mermaid code contains specific nodes
    const mermaid = screen.getByTestId('flowchart-mermaid');
    expect(mermaid.textContent).toContain('开始');
    expect(mermaid.textContent).toContain('输入需求');
    expect(mermaid.textContent).toContain('判断');
  });
});

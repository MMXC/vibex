/**
 * InputArea Test - Epic 2: 需求录入
 * 
 * 验收标准: expect(input).toAcceptMultilineText()
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InputArea } from './InputArea';

describe('Epic 2: InputArea - 需求录入', () => {
  const defaultProps = {
    currentStep: 1,
    requirementText: '',
    onRequirementChange: vi.fn(),
    onGenerate: vi.fn(),
    onGenerateDomainModel: vi.fn(),
    onGenerateBusinessFlow: vi.fn(),
    onCreateProject: vi.fn(),
    onAnalyzePageStructure: vi.fn(),
    isGenerating: false,
    boundedContexts: [],
    selectedContextIds: new Set<string>(),
    domainModels: [],
    businessFlow: null,
    pageStructureAnalyzed: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept multiline text input', () => {
    render(<InputArea {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    
    fireEvent.change(textarea, { 
      target: { value: 'Line 1\nLine 2\nLine 3' } 
    });
    
    expect(defaultProps.onRequirementChange).toHaveBeenCalled();
  });

  it('should have multiline text area', () => {
    render(<InputArea {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should call onRequirementChange when typing', () => {
    render(<InputArea {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'New requirement' } });
    
    expect(defaultProps.onRequirementChange).toHaveBeenCalledWith('New requirement');
  });

  it('should disable button when requirement is empty', () => {
    render(<InputArea {...defaultProps} requirementText="" />);
    // Get button within ActionButtons container (not PlanBuildButtons)
    const actionButtonsContainer = document.querySelector('[class*="actionButtons"]');
    const buttons = actionButtonsContainer ? actionButtonsContainer.querySelectorAll('button') : screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('should enable button when requirement has content', () => {
    render(<InputArea {...defaultProps} requirementText="Test requirement" />);
    const actionButtonsContainer = document.querySelector('[class*="actionButtons"]');
    const buttons = actionButtonsContainer ? actionButtonsContainer.querySelectorAll('button') : screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
  });
});

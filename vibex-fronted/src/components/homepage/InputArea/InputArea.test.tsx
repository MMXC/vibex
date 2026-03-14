import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputArea } from './InputArea';

describe('InputArea', () => {
  const defaultProps = {
    currentStep: 1,
    requirementText: '',
    onRequirementChange: jest.fn(),
    onGenerate: jest.fn(),
    onGenerateDomainModel: jest.fn(),
    onGenerateBusinessFlow: jest.fn(),
    onCreateProject: jest.fn(),
    isGenerating: false,
    boundedContexts: [],
    domainModels: [],
    businessFlow: null,
  };

  it('renders correctly with step 1', () => {
    render(<InputArea {...defaultProps} />);
    expect(screen.getByText(/Step 1: 需求输入/)).toBeInTheDocument();
  });

  it('displays requirement input area', () => {
    render(<InputArea {...defaultProps} />);
    // "描述你的产品需求" appears in multiple places, use getAllByText
    const elements = screen.getAllByText('描述你的产品需求');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows page subtitle', () => {
    render(<InputArea {...defaultProps} />);
    // Step 1 的 description 是 '描述你的产品需求'，出现在 subtitle 和 label 中
    const elements = screen.getAllByText('描述你的产品需求');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays value when provided', () => {
    render(<InputArea {...defaultProps} requirementText="Test requirement" />);
    // The RequirementInput component should display the value
    const textarea = screen.getByPlaceholderText(/描述你的产品需求/);
    expect(textarea).toHaveValue('Test requirement');
  });

  it('calls onRequirementChange when typing', () => {
    const onRequirementChange = jest.fn();
    render(<InputArea {...defaultProps} onRequirementChange={onRequirementChange} />);
    const textarea = screen.getByPlaceholderText(/描述你的产品需求/);
    fireEvent.change(textarea, { target: { value: 'new requirement' } });
    expect(onRequirementChange).toHaveBeenCalledWith('new requirement');
  });

  it('shows correct step title for step 2', () => {
    render(<InputArea {...defaultProps} currentStep={2} />);
    expect(screen.getByText(/Step 2: 限界上下文/)).toBeInTheDocument();
  });

  it('shows correct step title for step 3', () => {
    render(<InputArea {...defaultProps} currentStep={3} />);
    expect(screen.getByText(/Step 3: 领域模型/)).toBeInTheDocument();
  });

  it('shows correct step title for step 4', () => {
    render(<InputArea {...defaultProps} currentStep={4} />);
    expect(screen.getByText(/Step 4: 业务流程/)).toBeInTheDocument();
  });

  it('shows correct step title for step 5', () => {
    render(<InputArea {...defaultProps} currentStep={5} />);
    expect(screen.getByText(/Step 5: 项目创建/)).toBeInTheDocument();
  });

  it('shows import options', () => {
    render(<InputArea {...defaultProps} />);
    expect(screen.getByText(/从 GitHub 导入项目/)).toBeInTheDocument();
    expect(screen.getByText(/从 Figma 导入设计/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    render(<InputArea {...defaultProps} className="custom-class" />);
    // Component should render without errors
    expect(screen.getByText(/Step 1/)).toBeInTheDocument();
  });
});
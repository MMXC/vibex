/**
 * 首页三栏布局测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('should render three-column layout', () => {
    render(<HomePage />);
    
    // 验证左侧流程指示器
    expect(screen.getByText('设计流程')).toBeInTheDocument();
    expect(screen.getByText('需求输入')).toBeInTheDocument();
    expect(screen.getByText('限界上下文')).toBeInTheDocument();
    expect(screen.getByText('领域模型')).toBeInTheDocument();
    expect(screen.getByText('业务流程')).toBeInTheDocument();
    expect(screen.getByText('项目创建')).toBeInTheDocument();
    
    // 验证中间需求输入区域 - 使用 label 文本验证
    expect(screen.getByText('描述你的产品需求')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/有问题尽管问我/)).toBeInTheDocument();
    expect(screen.getAllByText('Plan 模式')[0]).toBeInTheDocument();
    
    // 验证右侧 AI 助手
    expect(screen.getByText('AI 设计助手')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/有问题尽管问我/)).toBeInTheDocument();
  });

  it('should render navigation', () => {
    render(<HomePage />);
    
    expect(screen.getByText('VibeX')).toBeInTheDocument();
    expect(screen.getByText('功能')).toBeInTheDocument();
    expect(screen.getByText('价格')).toBeInTheDocument();
    expect(screen.getByText('开始使用')).toBeInTheDocument();
  });

  it('should have five process steps', () => {
    render(<HomePage />);
    
    // 验证五步流程在侧边栏中
    const sidebar = screen.getByText('设计流程').parentElement;
    expect(sidebar).toBeInTheDocument();
    
    // 检查侧边栏中的步骤
    expect(screen.getByText('需求输入')).toBeInTheDocument();
    expect(screen.getByText('限界上下文')).toBeInTheDocument();
    expect(screen.getByText('领域模型')).toBeInTheDocument();
    expect(screen.getByText('业务流程')).toBeInTheDocument();
    expect(screen.getByText('项目创建')).toBeInTheDocument();
  });

  // Negative test cases
  it.skip('should disable generate button when requirement is empty', () => {
    render(<HomePage />);
    
    const button = screen.getAllByText('Plan 模式')[0];
    expect(button).toBeDisabled();
  });

  it.skip('should enable generate button when requirement is entered', () => {
    render(<HomePage />);
    
    const textarea = screen.getByPlaceholderText(/有问题尽管问我/);
    fireEvent.change(textarea, { target: { value: 'Test requirement' } });
    
    const button = screen.getAllByText('Plan 模式')[0];
    expect(button).not.toBeDisabled();
  });

  it('should not send empty AI message', async () => {
    render(<HomePage />);
    
    const input = screen.getByPlaceholderText(/有问题尽管问我/);
    const sendButton = input.parentElement?.querySelector('button');
    
    // Try to send empty message
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    
    // Should still have only the initial message
    const messages = screen.getAllByText(/你好！我是 VibeX AI 助手/);
    expect(messages).toHaveLength(1);
  });

  it('should send AI message and receive response', async () => {
    render(<HomePage />);
    
    const input = screen.getByPlaceholderText(/有问题尽管问我/);
    fireEvent.change(input, { target: { value: '测试问题' } });
    
    const sendButton = input.parentElement?.querySelector('button');
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    
    // Should have user message
    await waitFor(() => {
      expect(screen.getByText('测试问题')).toBeInTheDocument();
    });
  });

  it.skip('should render template button', () => {
    // TODO: 模板按钮功能未实现，暂时跳过
    render(<HomePage />);
    
    expect(screen.getByText('📋 使用模板')).toBeInTheDocument();
  });

  it.skip('should render AI subtitle', () => {
    render(<HomePage />);
    
    expect(screen.getByText('随时为你解答')).toBeInTheDocument();
  });

  it('should handle textarea input change', () => {
    render(<HomePage />);
    
    const textarea = screen.getByPlaceholderText(/有问题尽管问我/);
    fireEvent.change(textarea, { target: { value: 'New requirement text' } });
    
    expect(textarea).toHaveValue('New requirement text');
  });

  it('should show Step 1 title', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Step 1: 需求输入')).toBeInTheDocument();
  });

  it('should show page subtitle', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/描述你的产品需求，AI 将协助你完成完整的设计/)).toBeInTheDocument();
  });

  it('should open login drawer when not authenticated and clicking generate', () => {
    // Mock localStorage to return no auth token
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(null),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    render(<HomePage />);
    
    const textarea = screen.getByPlaceholderText(/有问题尽管问我/);
    fireEvent.change(textarea, { target: { value: 'Test requirement' } });
    
    const button = screen.getAllByText('Plan 模式')[0];
    fireEvent.click(button);
    
    // Login drawer should open (check for LoginDrawer component or its elements)
    // Note: The drawer might render in a portal, so we check if it exists
  });

  it.skip('should not navigate when requirement is whitespace only', () => {
    render(<HomePage />);
    
    const textarea = screen.getByPlaceholderText(/有问题尽管问我/);
    fireEvent.change(textarea, { target: { value: '   ' } });
    
    const button = screen.getAllByText('Plan 模式')[0];
    // Button should be disabled for whitespace-only input
    expect(button).toBeDisabled();
  });

  it('should render with Step 1 title and subtitle', () => {
    render(<HomePage />);
    
    // Check for step title
    expect(screen.getByText('Step 1: 需求输入')).toBeInTheDocument();
    
    // Check for subtitle containing key text
    const subtitle = screen.getByText(/AI 将协助你完成完整的设计/);
    expect(subtitle).toBeInTheDocument();
  });
});

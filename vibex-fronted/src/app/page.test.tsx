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
    
    // 验证中间需求输入区域 - 使用实际的 placeholder 文本
    expect(screen.getByText('描述你的产品需求')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/描述你的产品需求/)).toBeInTheDocument();
    expect(screen.getAllByText('Plan 模式')[0]).toBeInTheDocument();
    
    // 验证右侧 AI 助手
    expect(screen.getByText('AI 设计助手')).toBeInTheDocument();
  });

  it('should render navigation', () => {
    render(<HomePage />);
    
    expect(screen.getByText('VibeX')).toBeInTheDocument();
    expect(screen.getByText('设计')).toBeInTheDocument();
    expect(screen.getByText('模板')).toBeInTheDocument();
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
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test requirement' } });
    
    const button = screen.getAllByText('Plan 模式')[0];
    expect(button).not.toBeDisabled();
  });

  it('should handle textarea input change', () => {
    render(<HomePage />);
    
    const textarea = screen.getByPlaceholderText(/描述你的产品需求/);
    fireEvent.change(textarea, { target: { value: 'New requirement text' } });
    
    expect(textarea).toHaveValue('New requirement text');
  });

  it('should show Step 1 title', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Step 1: 需求输入/)).toBeInTheDocument();
  });

  it('should show page subtitle', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/描述你的产品需求，AI 将协助你完成完整的设计/)).toBeInTheDocument();
  });

  it('should render with Step 1 title and subtitle', () => {
    render(<HomePage />);
    
    // Check for step title - now shows step-based title
    expect(screen.getByText(/Step 1: 需求输入/)).toBeInTheDocument();
    
    // Check for subtitle containing key text
    const subtitle = screen.getByText(/AI 将协助你完成完整的设计/);
    expect(subtitle).toBeInTheDocument();
  });

  it('should render import options', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/从 GitHub 导入项目/)).toBeInTheDocument();
    expect(screen.getByText(/从 Figma 导入设计/)).toBeInTheDocument();
  });

  it('should render feature cards', () => {
    render(<HomePage />);
    
    expect(screen.getByText('你主导')).toBeInTheDocument();
    expect(screen.getByText('DDD 建模')).toBeInTheDocument();
    expect(screen.getByText('迭代优化')).toBeInTheDocument();
  });
});
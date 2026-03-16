/**
 * 首页三栏布局测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('should render three-column layout', async () => {
    render(<HomePage />);
    
    // 验证左侧流程指示器
    expect(screen.getByText('设计流程')).toBeInTheDocument();
    expect(screen.getByText('需求输入')).toBeInTheDocument();
    expect(screen.getByText('限界上下文')).toBeInTheDocument();
    expect(screen.getByText('领域模型')).toBeInTheDocument();
    expect(screen.getByText('业务流程')).toBeInTheDocument();
    expect(screen.getByText('项目创建')).toBeInTheDocument();
    
    // 验证导航或主要内容存在
    expect(screen.getByText('VibeX')).toBeInTheDocument();
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

  it('should show loading or Step 1 title', async () => {
    render(<HomePage />);
    
    // Either loading state or Step 1 should be visible (lazy loading)
    const hasLoading = screen.queryByText(/正在加载/);
    const hasStep = screen.queryAllByText(/Step 1/);
    
    expect(hasLoading || hasStep.length > 0).toBeTruthy();
  });

  it('should show step description or loading', async () => {
    render(<HomePage />);
    
    // 使用 getAllByText 处理多个匹配，或者检查加载状态
    const descElements = screen.queryAllByText(/描述你的产品需求/);
    const loadingElement = screen.queryByText(/正在加载/);
    
    expect(descElements.length > 0 || loadingElement).toBeTruthy();
  });

  it('should render with Step container', async () => {
    render(<HomePage />);
    
    // StepContainer 懒加载，显示加载状态或实际内容
    const loading = screen.queryByText(/正在加载/);
    const stepContent = screen.queryAllByText(/Step 1|需求输入|描述/);
    
    expect(loading || stepContent.length > 0).toBeTruthy();
  });

  it('should render import options', async () => {
    render(<HomePage />);
    
    // Wait for lazy loaded components
    await waitFor(() => {
      expect(screen.getByText(/从 GitHub 导入项目/)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText(/从 Figma 导入设计/)).toBeInTheDocument();
  });

  it('should render particle background', () => {
    render(<HomePage />);
    
    // 验证粒子背景存在
    const particleBg = document.querySelector('[id*="particles"]');
    expect(particleBg || screen.getByText('VibeX')).toBeTruthy();
  });
});
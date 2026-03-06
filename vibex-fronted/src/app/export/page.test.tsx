import { render, screen, fireEvent } from '@testing-library/react';
import Export from '@/app/export/page';

describe('Export (/export)', () => {
  it('EXPORT-001: 页面加载 - 导出页面正确渲染', () => {
    render(<Export />);
    // 标题 "导出项目" 被拆分为导航链接和标题，使用 getAllByText
    expect(screen.getAllByText('导出').length).toBeGreaterThan(0);
    expect(screen.getByText('选择导出格式')).toBeInTheDocument();
    expect(screen.getByText('导出选项')).toBeInTheDocument();
  });

  it('EXPORT-002: 导出格式选择 - 选择 React + Next.js', () => {
    render(<Export />);
    // 点击选择 React + Next.js
    fireEvent.click(screen.getByText('React + Next.js'));
    // 验证已选择状态
    expect(screen.getByText('✓ 已选择')).toBeInTheDocument();
  });

  it('EXPORT-003: 导出格式选择 - 选择 Vue 3', () => {
    render(<Export />);
    // 点击选择 Vue 3
    fireEvent.click(screen.getByText('Vue 3'));
    // 验证已选择状态
    expect(screen.getByText('✓ 已选择')).toBeInTheDocument();
  });

  it('EXPORT-004: 导出格式选择 - 选择原生 HTML', () => {
    render(<Export />);
    // 点击选择原生 HTML
    fireEvent.click(screen.getByText('原生 HTML/CSS/JS'));
    // 验证已选择状态
    expect(screen.getByText('✓ 已选择')).toBeInTheDocument();
  });

  it('EXPORT-005: 导出选项 - TypeScript 默认选中', () => {
    render(<Export />);
    const checkbox = screen.getByRole('checkbox', { name: /TypeScript/i });
    expect(checkbox).toBeChecked();
  });

  it('EXPORT-006: 导出选项 - 切换选项状态', () => {
    render(<Export />);
    const checkbox = screen.getByRole('checkbox', { name: /TypeScript/i });
    // 取消选中
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // 重新选中
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('EXPORT-007: 导出预览 - 显示文件结构', () => {
    render(<Export />);
    expect(screen.getByText('导出内容预览')).toBeInTheDocument();
    expect(screen.getByText('📁 my-vibex-project/')).toBeInTheDocument();
    expect(screen.getByText('📄 package.json')).toBeInTheDocument();
  });

  it('EXPORT-008: 导出按钮存在', () => {
    render(<Export />);
    expect(screen.getByText('🚀 开始导出')).toBeInTheDocument();
  });

  it('EXPORT-009: 导出流程 - 点击导出按钮', () => {
    render(<Export />);
    const exportButton = screen.getByText('🚀 开始导出');
    fireEvent.click(exportButton);
    // 验证进度条显示
    expect(screen.getByText('正在导出...')).toBeInTheDocument();
  });

  it('EXPORT-010: 导出进度显示', () => {
    render(<Export />);
    const exportButton = screen.getByText('🚀 开始导出');
    fireEvent.click(exportButton);
    // 验证进度显示
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('EXPORT-011: 部署指南显示', () => {
    render(<Export />);
    expect(screen.getByText('📤 部署指南')).toBeInTheDocument();
    expect(screen.getByText(/npm install && npm run dev/)).toBeInTheDocument();
  });

  it('EXPORT-012: 导航链接存在', () => {
    render(<Export />);
    expect(screen.getByText('控制台')).toBeInTheDocument();
    expect(screen.getByText('编辑器')).toBeInTheDocument();
    // "导出" 在多处出现（导航和标题），使用 getAllByText
    expect(screen.getAllByText('导出').length).toBeGreaterThan(0);
  });

  it('EXPORT-013: 导出格式描述显示', () => {
    render(<Export />);
    expect(
      screen.getByText('现代 React 框架，适合构建复杂 Web 应用')
    ).toBeInTheDocument();
  });
});

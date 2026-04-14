import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Auth from '@/app/auth/page';

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth',
  useParams: () => ({}),
}));

// Mock api service
const mockLogin = vi.fn().mockResolvedValue({ token: 'test-token', user: { id: '1' } });
const mockRegister = vi.fn().mockResolvedValue({ id: '1' });
vi.mock('@/services/api/modules/auth', () => ({
  authApi: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
  },
}));

// E1-S1.1.3 禁止内联浅色样式（迁移后 page.tsx 中不应出现这些内联样式）
const FORBIDDEN_INLINE_STYLES = [
  "backgroundColor: '#f8f9fa'",
  "backgroundColor: 'white'",
  "color: '#0070f3'",
  "color: '#64748b'",
  "border: '1px solid #e2e8f0'",
  "boxShadow: '0 4px 24px rgba(0,0,0,0.08)'",
];

// E1-S1.1.1 玻璃态验证
const FORBIDDEN_GLASS_STYLES = [
  'background-color: #ffffff',
  'background-color: #f8f9fa',
];

describe('Auth (/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders page', () => {
    render(<Auth />);
  });

  it('renders login text', () => {
    render(<Auth />);
    expect(screen.getAllByText(/登录/)[0]).toBeInTheDocument();
  });

  it('toggles to register', () => {
    render(<Auth />);
    const switchBtn = screen.getByText(/注册/);
    fireEvent.click(switchBtn);
    expect(screen.getByText(/已有账号/)).toBeInTheDocument();
  });

  it('toggles back to login', () => {
    render(<Auth />);
    // First toggle to register
    const switchToRegister = screen.getByText(/注册/);
    fireEvent.click(switchToRegister);
    // Then toggle back to login
    const switchToLogin = screen.getByText(/已有账号/);
    fireEvent.click(switchToLogin);
    expect(screen.getByText(/登录/)).toBeInTheDocument();
  });

  it('handles login success', async () => {
    render(<Auth />);
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) {
      fireEvent.submit(form);
    }
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('handles register success', async () => {
    render(<Auth />);
    // Switch to register
    const switchBtn = screen.getByText(/注册/);
    fireEvent.click(switchBtn);
    // Submit the form
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) {
      fireEvent.submit(form);
    }
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });
});

// ── E1 品牌一致性迁移测试 ─────────────────────────────────────────

describe('E1 Auth CSS Migration', () => {
  const pagePath = join(__dirname, 'page.tsx');
  const cssPath = join(__dirname, 'auth.module.css');

  it('S1.1.3: page.tsx has no forbidden inline light styles', () => {
    // validateReturnTo 函数内部的 style 变量是逻辑变量，非 CSS，可豁免
    // 读取 page.tsx 内容（排除 validateReturnTo 函数的 style 变量）
    const content = readFileSync(pagePath, 'utf8');
    // 提取 JSX return 部分（style={{}} 在 return 内才是 CSS 内联）
    const returnBlock = content.match(/return \(([\s\S]*?)\);?\s*\}/)?.[1] ?? '';
    FORBIDDEN_INLINE_STYLES.forEach((style) => {
      expect(returnBlock).not.toContain(style);
    });
  });

  it('S1.1.1: auth.module.css uses glass morphism (backdrop-filter: blur)', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain('backdrop-filter');
    expect(css).toMatch(/backdrop-filter:\s*blur\(/);
  });

  it('S1.1.2: auth.module.css uses --gradient-primary for submit button', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/--gradient-primary/);
  });

  it('S1.2: auth.module.css has grid overlay and glow effect', () => {
    const css = readFileSync(cssPath, 'utf8');
    // 网格叠加层
    expect(css).toContain('gridOverlay');
    expect(css).toMatch(/linear-gradient\(rgba\(0,\s*255,\s*255/);
    // 发光球
    expect(css).toContain('glowEffect');
    expect(css).toMatch(/radial-gradient\(circle/);
  });

  it('S1.1.3: page.tsx uses className instead of inline style={{}} in JSX', () => {
    const content = readFileSync(pagePath, 'utf8');
    // 确认 JSX 中没有 style={{ ... }} 模式（validateReturnTo 函数除外）
    const lines = content.split('\n');
    let inValidateFn = false;
    for (const line of lines) {
      if (/^function validateReturnTo/.test(line.trim())) inValidateFn = true;
      if (inValidateFn && /^function \w/.test(line.trim())) inValidateFn = false;
      if (inValidateFn) continue;
      // style={{ 出现在 JSX 中（不在 validateReturnTo 中）
      expect(line).not.toMatch(/style=\{\{/);
    }
  });
});

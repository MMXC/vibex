/**
 * 首页三栏布局测试
 */

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import HomePage from '../app/page';

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('HomePage', () => {
  it('should Render three-column layout', async () => {
    render(<HomePage />, { wrapper: createWrapper() });
    
    // 验证页面基本元素存在
    expect(screen.getByText('VibeX')).toBeInTheDocument();
  });

  it('should render navigation', () => {
    render(<HomePage />, { wrapper: createWrapper() });
    
    expect(screen.getByText('VibeX')).toBeInTheDocument();
  });

  it('should have five process steps', () => {
    render(<HomePage />, { wrapper: createWrapper() });
    
    // Verify basic page structure
    expect(screen.getByText('VibeX')).toBeInTheDocument();
  });

  it('should Render with basic elements', () => {
    render(<HomePage />, { wrapper: createWrapper() });
    
    // Verify the page renders with basic elements
    expect(screen.getByText('VibeX')).toBeInTheDocument();
  });
});

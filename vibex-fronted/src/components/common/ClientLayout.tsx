/**
 * ClientLayout — S2.1: 客户端布局包装器
 *
 * 在根 layout 下挂载全局客户端 Provider（AuthProvider 等）。
 * 解决 layout.tsx 是 Server Component 无法直接使用客户端 Provider 的问题。
 */
'use client';

import React from 'react';
import { AuthProvider } from './AuthProvider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

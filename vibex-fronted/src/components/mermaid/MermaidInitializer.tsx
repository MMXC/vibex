/**
 * MermaidInitializer - Mermaid 预初始化组件
 *
 * 直接在 useEffect 中初始化，无需状态管理或轮询。
 * 使用方式: 在 RootLayout 中添加 <MermaidInitializer />
 */

'use client';

import { useEffect } from 'react';
import { preInitialize } from './mermaidInit';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';

export function MermaidInitializer() {
  useEffect(() => {
    // 直接初始化，不阻塞 UI
    mermaidManager.initialize().catch(() => {
      // 静默失败，不影响用户
    });
    // 保持旧接口兼容
    preInitialize().catch(() => {
      // 静默失败，不影响用户
    });
  }, []);

  // 无 UI，仅用于初始化
  return null;
}

export default MermaidInitializer;

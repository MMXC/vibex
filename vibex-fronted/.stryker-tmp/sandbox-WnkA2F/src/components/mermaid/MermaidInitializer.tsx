/**
 * MermaidInitializer - Mermaid 预初始化组件
 * 
 * F2.1: 预初始化优化 - 在应用启动时预加载 mermaid
 * F2.2: 初始化优化 - 使用统一的初始化逻辑
 * 
 * 使用方式: 在 RootLayout 中添加 <MermaidInitializer />
 */
// @ts-nocheck


'use client';

import { useEffect, useState } from 'react';
import { preInitialize, isReady } from './mermaidInit';
import { mermaidManager } from '@/lib/mermaid/MermaidManager';

export function MermaidInitializer() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // F1.2: 静默预初始化，不阻塞 UI
    // 同时初始化 mermaidManager 单例
    mermaidManager.initialize().catch(() => {
      // 静默失败，不影响用户
    });
    // 保持旧接口兼容
    preInitialize().catch(() => {
      // 静默失败，不影响用户
    });

    // 简单的轮询检查初始化状态（用于调试）
    const checkReady = setInterval(() => {
      if (isReady()) {
        setTick(t => t + 1);
        clearInterval(checkReady);
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, []);

  // 无 UI，仅用于初始化
  return null;
}

export default MermaidInitializer;

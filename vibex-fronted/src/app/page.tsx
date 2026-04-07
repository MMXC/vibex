/**
 * VibeX 首页 — 重定向到 canvas
 *
 * 2026-04-02: 统一 canvas 为唯一首页入口
 * 旧 HomePage 组件已迁移到 /canvas 路由
 */
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/canvas');
}

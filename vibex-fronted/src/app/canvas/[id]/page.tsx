/**
 * Canvas [id] — 动态画布页面（Onboarding 跳转目标）
 *
 * E01: Onboarding → Canvas 无断点
 *
 * 功能：
 * 1. generateStaticParams() — Next.js output:export 兼容
 * 2. 100ms 内显示 CanvasPageSkeleton，避免白屏
 * 3. 数据就绪后渲染真实 CanvasPage
 * 4. 支持 AI 降级格式 { raw, parsed: null }
 */

import { CanvasPageClient } from './CanvasPageClient';

/** Next.js output:export 兼容 — 动态路由必须导出 generateStaticParams */
export async function generateStaticParams() {
  return [];
}

export default async function CanvasPageWithId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CanvasPageClient projectId={id} />;
}

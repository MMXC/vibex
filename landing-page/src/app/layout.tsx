import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeX - AI 驱动的下一代低代码平台',
  description: '用自然语言描述你的想法，AI 自动生成完整应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

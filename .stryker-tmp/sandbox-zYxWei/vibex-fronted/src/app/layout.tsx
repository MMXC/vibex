// @ts-nocheck
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/query/QueryProvider';
// OnboardingProvider removed - 2026-03-27

import { MermaidInitializer } from '@/components/mermaid/MermaidInitializer';
import { SentryInitializer } from '@/components/sentry/SentryInitializer';
import { DDDStoreInitializer } from '@/components/ddd/DDDStoreInitializer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VibeX - AI 驱动的产品建模平台',
  description: 'AI 驱动的需求分析与产品建模平台，帮助团队快速构建产品原型',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MermaidInitializer />
        <SentryInitializer />
        <ToastProvider>
          <DDDStoreInitializer />
          <QueryProvider>
            <AppErrorBoundary>
              {children}
            </AppErrorBoundary>
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/query/QueryProvider';

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
        <ToastProvider>
          <QueryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

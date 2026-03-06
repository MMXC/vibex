import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeX - AI-Powered App Builder',
  description: 'Build web applications with AI',
};

export default function Home() {
  redirect('/dashboard');
}

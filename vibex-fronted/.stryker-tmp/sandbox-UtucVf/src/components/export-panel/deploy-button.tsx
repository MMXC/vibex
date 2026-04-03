// @ts-nocheck
'use client';
import React from 'react';
import { isVercelConnected } from '@/lib/vercel-oauth';

interface DeployButtonProps {
  projectId: string;
  onDeployStart?: () => void;
  onDeploySuccess?: (url: string) => void;
  onDeployError?: (error: string) => void;
}

export function DeployButton({ projectId, onDeployStart, onDeploySuccess, onDeployError }: DeployButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const connected = isVercelConnected();
  
  async function handleDeploy() {
    if (!connected) {
      window.location.href = '/api/vercel/auth';
      return;
    }
    
    setLoading(true);
    onDeployStart?.();
    
    try {
      const response = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      
      const data = await response.json() as { url?: string; error?: string };
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Deploy failed');
      }
      
      onDeploySuccess?.(data.url!);
    } catch (err) {
      onDeployError?.(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <button onClick={handleDeploy} disabled={loading} type="button">
      {loading ? 'Deploying...' : connected ? 'Deploy to Vercel' : 'Connect Vercel'}
    </button>
  );
}

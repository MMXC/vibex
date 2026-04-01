'use client';
import React from 'react';

export type DeployStatus = 'idle' | 'building' | 'ready' | 'error';

interface DeployStatusProps {
  status: DeployStatus;
  url?: string;
  error?: string;
  startedAt?: number;
}

const TIMEOUT_MS = 60_000;

export function DeployStatusUI({ status, url, error, startedAt }: DeployStatusProps) {
  const isTimedOut = startedAt && Date.now() - startedAt > TIMEOUT_MS && status === 'building';
  
  if (isTimedOut) {
    return <div className="deploy-error">Deployment timed out after 60s</div>;
  }
  
  if (status === 'ready' && url) {
    return (
      <div className="deploy-success">
        Deployed! <a href={`https://${url}`} target="_blank" rel="noopener noreferrer">{url}</a>
      </div>
    );
  }
  
  if (status === 'error') {
    return <div className="deploy-error">{error || 'Deployment failed'}</div>;
  }
  
  if (status === 'building') {
    return <div className="deploy-building">Building...</div>;
  }
  
  return null;
}

'use client';

import { useState, useEffect } from 'react';

interface RBACResult {
  canDelete: boolean;
  canShare: boolean;
  canEdit: boolean;
  canView: boolean;
  loading: boolean;
  error?: string;
}

const RBAC_CACHE = new Map<string, { result: RBACResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // C-E3-3: 5 minutes cache

export function useCanvasRBAC(projectId: string | undefined): RBACResult {
  const [result, setResult] = useState<RBACResult>({
    canDelete: false, canShare: false, canEdit: false, canView: true, loading: !!projectId,
  });

  useEffect(() => {
    if (!projectId) {
      setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false });
      return;
    }

    // C-E3-3: Check cache first
    const cached = RBAC_CACHE.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResult(cached.result);
      return;
    }

    const fetchRBAC = async () => {
      try {
        // In a real implementation, this would call GET /v1/teams/:teamId/members
        // For now, set default permissions based on auth state
        // The actual RBAC check is done server-side — this hook provides frontend hints
        const res = await fetch(`/v1/projects/${projectId}/permissions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          const rbac: RBACResult = {
            canDelete: data.role === 'owner',
            canShare: data.role === 'owner' || data.role === 'member',
            canEdit: data.role === 'owner' || data.role === 'member',
            canView: true,
            loading: false,
          };
          RBAC_CACHE.set(projectId, { result: rbac, timestamp: Date.now() });
          setResult(rbac);
        } else {
          setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false });
        }
      } catch {
        setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false, error: 'RBAC check failed' });
      }
    };

    fetchRBAC();
  }, [projectId]);

  return result;
}
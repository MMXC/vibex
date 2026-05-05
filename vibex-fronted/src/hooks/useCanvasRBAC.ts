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

function rbacCacheKey(projectId: string | undefined, teamId?: string): string {
  return teamId ? `${projectId ?? ''}:${teamId}` : (projectId ?? '');
}

export function useCanvasRBAC(projectId: string | undefined, teamId?: string): RBACResult {
  const [result, setResult] = useState<RBACResult>({
    canDelete: false, canShare: false, canEdit: false, canView: true, loading: !!projectId,
  });

  useEffect(() => {
    if (!projectId) {
      setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false });
      return;
    }

    const cacheKey = rbacCacheKey(projectId, teamId);

    // C-E3-3: Check cache first
    const cached = RBAC_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResult(cached.result);
      return;
    }

    const fetchRBAC = async () => {
      try {
        // E5: If teamId is provided, check team membership + role
        if (teamId) {
          const token = localStorage.getItem('auth_token') ?? '';
          const res = await fetch(
            `/v1/teams/${encodeURIComponent(teamId)}/members`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.ok) {
            const data = await res.json();
            const members: { userId: string; role: string }[] = data.members ?? [];
            const userId = localStorage.getItem('user_id') ?? '';
            const myMember = members.find((m) => m.userId === userId);

            if (myMember) {
              const teamRole = myMember.role;
              // owner=全部操作, admin=编辑/导出, member=只读
              const rbac: RBACResult = {
                canDelete: teamRole === 'owner',
                canShare: teamRole === 'owner' || teamRole === 'admin',
                canEdit: teamRole === 'owner' || teamRole === 'admin',
                canView: true,
                loading: false,
              };
              RBAC_CACHE.set(cacheKey, { result: rbac, timestamp: Date.now() });
              setResult(rbac);
              return;
            }
          }
          // If not found in team, fall through to project-level check
        }

        // Project-level RBAC check (existing behavior)
        const res = await fetch(`/v1/projects/${projectId}/permissions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          const rbac: RBACResult = {
            canDelete: data.role === 'owner',
            canShare: data.role === 'owner',
            canEdit: data.role === 'owner',
            canView: true,
            loading: false,
          };
          RBAC_CACHE.set(cacheKey, { result: rbac, timestamp: Date.now() });
          setResult(rbac);
        } else {
          setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false });
        }
      } catch {
        setResult({ canDelete: false, canShare: false, canEdit: false, canView: true, loading: false, error: 'RBAC check failed' });
      }
    };

    fetchRBAC();
  }, [projectId, teamId]);

  return result;
}
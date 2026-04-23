/**
 * Teams API client — Frontend API layer for Teams feature
 * E3-U1: 团队列表页面
 *
 * API endpoints:
 *   GET  /v1/teams           — list teams
 *   POST /v1/teams          — create team
 *   GET  /v1/teams/:id       — get team detail
 *   GET  /v1/teams/:id/members — list members
 *   POST /v1/teams/:id/members — invite member
 *   PUT  /v1/teams/:id/members/:memberId — update member role
 *   DELETE /v1/teams/:id/members/:memberId — remove member
 */

import { getAuthToken } from '@/lib/auth-token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  myRole?: 'owner' | 'admin' | 'member';
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member';
}

async function fetchTeams<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const teamsApi = {
  /** List all teams for current user */
  list: () => fetchTeams<{ teams: Team[] }>(`${API_BASE}/v1/teams`),

  /** Create a new team */
  create: (data: CreateTeamRequest) =>
    fetchTeams<{ team: Team }>(`${API_BASE}/v1/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get team details */
  get: (teamId: string) => fetchTeams<{ team: Team }>(`${API_BASE}/v1/teams/${teamId}`),

  /** List team members */
  listMembers: (teamId: string) =>
    fetchTeams<{ members: TeamMember[] }>(`${API_BASE}/v1/teams/${teamId}/members`),

  /** Invite a member to team */
  inviteMember: (teamId: string, data: InviteMemberRequest) =>
    fetchTeams<{ member: TeamMember }>(`${API_BASE}/v1/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update member role */
  updateMember: (teamId: string, memberId: string, role: 'admin' | 'member') =>
    fetchTeams<{ member: TeamMember }>(`${API_BASE}/v1/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  /** Remove a member from team */
  removeMember: (teamId: string, memberId: string) =>
    fetchTeams<{ success: boolean }>(`${API_BASE}/v1/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  /** Delete a team */
  delete: (teamId: string) =>
    fetchTeams<{ success: boolean }>(`${API_BASE}/v1/teams/${teamId}`, {
      method: 'DELETE',
    }),
};
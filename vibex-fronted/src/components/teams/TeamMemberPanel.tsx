/**
 * TeamMemberPanel — Manage team members (invite/role/delete)
 * E3-U3: 成员管理面板
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RoleBadge } from './RoleBadge';
import type { TeamMember } from '@/lib/api/teams';
import styles from './TeamMemberPanel.module.css';

interface TeamMemberPanelProps {
  teamId: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
  currentUserId: string;
}

export function TeamMemberPanel({
  teamId,
  members,
  currentUserRole,
  currentUserId,
}: TeamMemberPanelProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      import('@/lib/api/teams').then((m) => m.teamsApi.inviteMember(teamId, { email, role: role as 'admin' | 'member' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      setInviteEmail('');
      setInviteError(null);
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      import('@/lib/api/teams').then((m) => m.teamsApi.removeMember(teamId, memberId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      import('@/lib/api/teams').then((m) => m.teamsApi.updateMember(teamId, memberId, role as 'admin' | 'member')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
  });

  const handleInvite = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
    },
    [inviteEmail, inviteRole, inviteMutation]
  );

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  return (
    <div className={styles.panel}>
      <h3 className={styles.sectionTitle}>Members ({members.length})</h3>

      {/* Invite form */}
      {canManage && (
        <form onSubmit={handleInvite} className={styles.inviteForm}>
          <input
            type="email"
            className={styles.emailInput}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite by email"
            aria-label="Email address to invite"
          />
          <select
            className={styles.roleSelect}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
            aria-label="Member role"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className={styles.inviteBtn}
            disabled={inviteMutation.isPending || !inviteEmail.trim()}
          >
            {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      )}
      {inviteError && (
        <div className={styles.inviteError} role="alert">{inviteError}</div>
      )}

      {/* Member list */}
      <ul className={styles.memberList} role="list">
        {members.map((member) => (
          <li key={member.userId} className={styles.memberItem}>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberEmail}>{member.email}</span>
            </div>
            <div className={styles.memberMeta}>
              <RoleBadge role={member.role} />
              {canManage && member.userId !== currentUserId && (
                <button
                  className={styles.removeBtn}
                  onClick={() => {
                    if (member.role === 'owner') return;
                    if (window.confirm(`Remove ${member.name} from team?`)) {
                      removeMutation.mutate(member.userId);
                    }
                  }}
                  disabled={member.role === 'owner' || removeMutation.isPending}
                  aria-label={`Remove ${member.name}`}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
/**
 * TeamList — Display list of teams with actions
 * E3-U1: 团队列表页面
 */

'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TeamList.module.css';

export interface TeamItem {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  myRole?: 'owner' | 'admin' | 'member';
}

interface TeamListProps {
  teams: TeamItem[];
  isLoading?: boolean;
  onDelete?: (teamId: string) => void;
  currentUserRole?: 'owner' | 'admin' | 'member';
}

export function TeamList({ teams, isLoading, onDelete, currentUserRole }: TeamListProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading teams...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No teams yet</h3>
          <p>Create your first team to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} role="list" aria-label="Teams list">
      {teams.map((team) => (
        <div key={team.id} className={styles.teamCard} role="listitem">
          <div className={styles.teamInfo}>
            <h3 className={styles.teamName}>{team.name}</h3>
            {team.description && (
              <p className={styles.teamDescription}>{team.description}</p>
            )}
            <div className={styles.teamMeta}>
              <span className={styles.memberCount}>
                {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
              </span>
              {team.myRole && (
                <span className={`${styles.roleBadge} ${styles[`role_${team.myRole}`]}`}>
                  {team.myRole}
                </span>
              )}
            </div>
          </div>

          <div className={styles.teamActions}>
            <Link
              href={`/dashboard/teams/${team.id}`}
              className={styles.viewBtn}
              aria-label={`View ${team.name}`}
            >
              View
            </Link>
            {(team.myRole === 'owner' || team.myRole === 'admin') && onDelete && (
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(team.id)}
                aria-label={`Delete ${team.name}`}
                disabled={team.myRole === 'owner' && currentUserRole !== 'owner'}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
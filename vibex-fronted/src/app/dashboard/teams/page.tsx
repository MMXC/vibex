/**
 * Teams Page — /dashboard/teams
 * E3-U1: 团队列表页面
 * E3-U2: 创建团队 Dialog
 * E5: 添加"团队 Canvas"标签页（与"成员"标签平级）
 *
 * Shows list of teams with TanStack Query + optimistic updates.
 * E5: For each team, shows a tabbed view with "成员" and "团队 Canvas" tabs.
 * Team Canvas tab shows canvases shared with the team via /v1/canvas-share/canvases.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamList, type TeamItem } from '@/components/teams/TeamList';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { teamsApi } from '@/lib/api/teams';
import { canvasShareApi, type CanvasShareRecord } from '@/lib/api/canvas-share';
import styles from './page.module.css';

type TabKey = 'members' | 'canvases';

export default function TeamsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Fetch all teams
  const { data, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await teamsApi.list();
      return res.teams;
    },
  });

  const teams: TeamItem[] = (data as TeamItem[] | undefined) ?? [];

  // Auto-select first team
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      const firstTeam = teams[0];
      if (firstTeam) setSelectedTeamId(firstTeam.id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Fetch canvases shared with selected team (E5)
  const {
    data: canvasShares = [],
    isLoading: canvasLoading,
    error: canvasError,
  } = useQuery({
    queryKey: ['team-canvases', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const res = await canvasShareApi.listCanvases(selectedTeamId);
      return res.canvases;
    },
    enabled: !!selectedTeamId,
  });

  // Fetch team members
  const {
    data: members = [],
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const res = await teamsApi.listMembers(selectedTeamId);
      return res.members;
    },
    enabled: !!selectedTeamId,
  });

  const handleCreateSuccess = useCallback((_team: { id: string; name: string }) => {
    setIsDialogOpen(false);
  }, []);

  const handleDelete = useCallback((teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      // Trigger delete mutation
    }
  }, []);

  // E5: Canvas list tab
  const [activeTab, setActiveTab] = useState<TabKey>('members');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Teams</h1>
          <p className={styles.subtitle}>Manage your teams and collaborations</p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setIsDialogOpen(true)}
          aria-label="Create new team"
        >
          + Create Team
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          Failed to load teams: {(error as Error).message}
        </div>
      )}

      <TeamList
        teams={teams}
        isLoading={isLoading}
        onDelete={handleDelete}
      />

      {/* E5: Team detail panel — shown when a team is selected */}
      {selectedTeam && (
        <div className={styles.teamDetail} data-testid="team-detail-panel">
          {/* Team header */}
          <div className={styles.teamDetailHeader}>
            <h2 className={styles.teamDetailTitle}>{selectedTeam.name}</h2>
            {selectedTeam.myRole && (
              <span className={`${styles.roleBadge} ${styles[`role_${selectedTeam.myRole}`]}`}>
                {selectedTeam.myRole}
              </span>
            )}
          </div>

          {/* Tab navigation */}
          <div className={styles.tabs} role="tablist">
            <button
              role="tab"
              className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('members')}
              aria-selected={activeTab === 'members'}
              data-testid="tab-members"
            >
              成员
            </button>
            <button
              role="tab"
              className={`${styles.tab} ${activeTab === 'canvases' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('canvases')}
              aria-selected={activeTab === 'canvases'}
              data-testid="tab-canvases"
            >
              团队 Canvas
            </button>
          </div>

          {/* Tab content: Members */}
          {activeTab === 'members' && (
            <div className={styles.tabContent} role="tabpanel">
              {membersLoading && <div className={styles.loading}>加载成员...</div>}
              {!membersLoading && members.length === 0 && (
                <div className={styles.emptyState}>暂无成员</div>
              )}
              {!membersLoading && members.length > 0 && (
                <ul className={styles.memberList}>
                  {members.map((m) => (
                    <li key={m.userId} className={styles.memberItem}>
                      <span className={styles.memberAvatar}>
                        {m.name?.[0]?.toUpperCase() ?? 'U'}
                      </span>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{m.name}</span>
                        <span className={styles.memberRole}>{m.role}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tab content: Team Canvases (E5) */}
          {activeTab === 'canvases' && (
            <div
              className={styles.tabContent}
              role="tabpanel"
              data-testid="team-canvas-list"
            >
              {canvasLoading && <div className={styles.loading}>加载 Canvas 列表...</div>}
              {!canvasLoading && canvasShares.length === 0 && (
                <div className={styles.emptyState}>暂无共享的画布项目</div>
              )}
              {!canvasLoading && canvasShares.length > 0 && (
                <ul className={styles.canvasList}>
                  {canvasShares.map((share: CanvasShareRecord) => (
                    <li
                      key={`${share.canvasId}-${share.teamId}`}
                      className={styles.canvasItem}
                      data-testid="team-project-item"
                    >
                      <div className={styles.canvasIcon}>◈</div>
                      <div className={styles.canvasInfo}>
                        <span className={styles.canvasName}>Canvas {share.canvasId}</span>
                        <span className={styles.canvasMeta}>
                          分享于 {new Date(share.sharedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <span className={`${styles.roleBadge} ${styles[`role_${share.role}`]}`}>
                        {share.role === 'editor' ? '编辑' : '只读'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <CreateTeamDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
/**
 * Teams Page — /dashboard/teams
 * E3-U1: 团队列表页面
 * E3-U2: 创建团队 Dialog
 *
 * Shows list of teams with TanStack Query + optimistic updates.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamList, type TeamItem } from '@/components/teams/TeamList';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { teamsApi } from '@/lib/api/teams';
import styles from './page.module.css';

export default function TeamsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch teams list
  const { data, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await teamsApi.list();
      return res.teams;
    },
  });

  // Create team mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => teamsApi.create(data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['teams'] });

      // Snapshot previous value
      const previousTeams = queryClient.getQueryData<TeamItem[]>(['teams']);

      // Optimistically add new team
      const optimisticTeam: TeamItem = {
        id: `temp-${Date.now()}`,
        name: newData.name,
        description: newData.description,
        memberCount: 1,
        createdAt: new Date().toISOString(),
        myRole: 'owner',
      };

      queryClient.setQueryData<TeamItem[]>(['teams'], (old) =>
        old ? [optimisticTeam, ...old] : [optimisticTeam]
      );

      return { previousTeams };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousTeams) {
        queryClient.setQueryData(['teams'], context.previousTeams);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Delete team mutation
  const deleteMutation = useMutation({
    mutationFn: (teamId: string) => teamsApi.delete(teamId),
    onMutate: async (teamId) => {
      await queryClient.cancelQueries({ queryKey: ['teams'] });
      const previousTeams = queryClient.getQueryData<TeamItem[]>(['teams']);

      queryClient.setQueryData<TeamItem[]>(['teams'], (old) =>
        old ? old.filter((t) => t.id !== teamId) : []
      );

      return { previousTeams };
    },
    onError: (_err, _teamId, context) => {
      if (context?.previousTeams) {
        queryClient.setQueryData(['teams'], context.previousTeams);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const handleCreateSuccess = useCallback((team: { id: string; name: string }) => {
    setIsDialogOpen(false);
    // Team will be refetched via onSettled
  }, []);

  const handleDelete = useCallback(
    (teamId: string) => {
      if (window.confirm('Are you sure you want to delete this team?')) {
        deleteMutation.mutate(teamId);
      }
    },
    [deleteMutation]
  );

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
        teams={(data as TeamItem[] | undefined) ?? []}
        isLoading={isLoading}
        onDelete={handleDelete}
      />

      <CreateTeamDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
/**
 * ShareToTeamModal — Share canvas with a team
 * E5: Teams × Canvas 共享权限
 *
 * data-testid="team-share-modal"
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { teamsApi, type Team, type TeamMember } from '@/lib/api/teams';
import { canvasShareApi } from '@/lib/api/canvas-share';
import { getUserId } from '@/lib/auth-token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';
import styles from './ShareToTeamModal.module.css';

interface ShareToTeamModalProps {
  isOpen: boolean;
  canvasId: string;
  canvasName?: string;
  onClose: () => void;
}

export function ShareToTeamModal({
  isOpen,
  canvasId,
  canvasName,
  onClose,
}: ShareToTeamModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('editor');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch user's teams when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFeedback(null);
    setSelectedTeamId(null);

    teamsApi
      .list()
      .then((res) => setTeams(res.teams))
      .catch(() => setFeedback({ type: 'error', message: 'Failed to load teams' }))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const triggerNotifications = useCallback(async (
    projectId: string,
    projectName: string,
    teamMembers: TeamMember[]
  ) => {
    const currentUserId = getUserId();
    const notifyPromises = teamMembers
      .filter((m) => m.userId !== currentUserId)
      .map((member) =>
        fetch(`${API_BASE}/v1/projects/${projectId}/share/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: member.userId,
            recipientName: member.name,
            senderName: member.name,
            projectName: projectName,
          }),
        }).catch((err) => {
          console.warn('[ShareToTeamModal] Notification failed for', member.userId, err);
        })
      );
    await Promise.all(notifyPromises);
  }, []);

  const handleShare = useCallback(async () => {
    if (!selectedTeamId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      await canvasShareApi.share({
        canvasId,
        teamId: selectedTeamId,
        role: selectedRole,
      });

      // E02: Send notifications to team members
      try {
        const { members } = await teamsApi.listMembers(selectedTeamId);
        await triggerNotifications(canvasId, canvasName ?? canvasId, members);
      } catch (notifyErr) {
        // Notification is non-critical — log and continue
        console.warn('[ShareToTeamModal] Notification trigger failed:', notifyErr);
      }

      const teamName = teams.find((t) => t.id === selectedTeamId)?.name ?? selectedTeamId;
      setFeedback({ type: 'success', message: `已成功分享给团队「${teamName}」` });
      setSelectedTeamId(null);
      // Auto-close after 1.5s
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : '分享失败，请重试',
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedTeamId, selectedRole, canvasId, teams, onClose, canvasName, triggerNotifications]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-to-team-title"
      data-testid="team-share-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="share-to-team-title" className={styles.title}>
            分享给团队
          </h2>
          {canvasName && (
            <p className={styles.subtitle}>项目：{canvasName}</p>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingState}>加载团队列表...</div>
          )}

          {!loading && teams.length === 0 && (
            <div className={styles.emptyState}>
              <span>暂无团队</span>
              <p>你还没有创建或加入任何团队</p>
            </div>
          )}

          {!loading && teams.length > 0 && (
            <>
              <div className={styles.teamList}>
                {teams.map((team) => (
                  <label key={team.id} className={styles.teamItem}>
                    <input
                      type="radio"
                      name="team-select"
                      value={team.id}
                      checked={selectedTeamId === team.id}
                      onChange={() => setSelectedTeamId(team.id)}
                      className={styles.radio}
                    />
                    <div className={styles.teamInfo}>
                      <span className={styles.teamName}>{team.name}</span>
                      <span className={styles.teamMeta}>
                        {team.memberCount} 成员
                        {team.myRole && (
                          <span className={`${styles.roleTag} ${styles[`role_${team.myRole}`]}`}>
                            {team.myRole === 'owner' ? '所有者' : team.myRole === 'admin' ? '管理员' : '成员'}
                          </span>
                        )}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Role selection */}
              {selectedTeamId && (
                <div className={styles.roleSection}>
                  <span className={styles.roleLabel}>权限级别</span>
                  <div className={styles.roleOptions}>
                    <label className={styles.roleOption}>
                      <input
                        type="radio"
                        name="role-select"
                        value="viewer"
                        checked={selectedRole === 'viewer'}
                        onChange={() => setSelectedRole('viewer')}
                      />
                      <span>只读</span>
                      <small>可查看画布内容</small>
                    </label>
                    <label className={styles.roleOption}>
                      <input
                        type="radio"
                        name="role-select"
                        value="editor"
                        checked={selectedRole === 'editor'}
                        onChange={() => setSelectedRole('editor')}
                      />
                      <span>编辑</span>
                      <small>可编辑和导出画布</small>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`${styles.feedback} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}
              role="alert"
              aria-live="polite"
            >
              {feedback.type === 'success' ? '✓ ' : '✗ '}
              {feedback.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={handleShare}
            disabled={!selectedTeamId || submitting}
            data-testid="confirm-share-btn"
          >
            {submitting ? '分享中...' : '确认分享'}
          </button>
        </div>
      </div>
    </div>
  );
}
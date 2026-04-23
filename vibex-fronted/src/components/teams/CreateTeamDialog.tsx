/**
 * CreateTeamDialog — Form for creating a new team
 * E3-U2: 创建团队 Dialog
 */

'use client';

import React, { useState, useCallback } from 'react';
import styles from './CreateTeamDialog.module.css';

interface CreateTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (team: { id: string; name: string }) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export function CreateTeamDialog({ isOpen, onClose, onSuccess }: CreateTeamDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name: 1-100 chars
    if (!name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Team name must be 100 characters or less';
    }

    // Description: max 500 chars
    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, description]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        // Import dynamically to avoid SSR issues
        const { teamsApi } = await import('@/lib/api/teams');
        const { team } = await teamsApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onSuccess(team);
        // Reset form
        setName('');
        setDescription('');
        setErrors({});
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to create team');
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, description, validate, onSuccess]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="dialog-title" className={styles.title}>Create Team</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="team-name" className={styles.label}>
              Team Name <span className={styles.required}>*</span>
            </label>
            <input
              id="team-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              maxLength={100}
              aria-describedby={errors.name ? 'name-error' : undefined}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <span id="name-error" className={styles.errorMsg} role="alert">
                {errors.name}
              </span>
            )}
            <span className={styles.charCount}>{name.length}/100</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="team-description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="team-description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team for?"
              maxLength={500}
              rows={3}
              aria-describedby={errors.description ? 'desc-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.description && (
              <span id="desc-error" className={styles.errorMsg} role="alert">
                {errors.description}
              </span>
            )}
            <span className={styles.charCount}>{description.length}/500</span>
          </div>

          {submitError && (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
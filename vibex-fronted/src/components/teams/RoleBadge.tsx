/**
 * RoleBadge — Display member role with color coding
 * E3-U4: 权限分层 UI
 */

'use client';

import React from 'react';
import styles from './RoleBadge.module.css';

interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'member';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };

  return (
    <span className={`${styles.badge} ${styles[`role_${role}`]}`} role="status">
      {labels[role]}
    </span>
  );
}
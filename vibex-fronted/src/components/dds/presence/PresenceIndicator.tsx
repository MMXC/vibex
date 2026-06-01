/**
 * PresenceIndicator — Real-time collaboration presence display
 * Sprint 53 E1: 协作实时 Presence UI
 *
 * Shows online users in the collaboration canvas with avatars and names.
 * Integrates with presenceStore (WebSocket-backed remote users).
 */
'use client';

import { usePresenceStore } from '@/lib/collaboration/presenceStore';

interface PresenceIndicatorProps {
  /** Maximum number of avatars to show before "+N" overflow */
  maxVisible?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * PresenceIndicator displays remote collaborators currently on the same canvas.
 *
 * States:
 * - 0 users: renders nothing (or empty state if explicitly requested)
 * - 1 user: shows name + avatar
 * - 2+ users: shows avatar stack with names on hover
 * - Overflow: "+N" badge when maxVisible exceeded
 */
export function PresenceIndicator({ maxVisible = 5, className }: PresenceIndicatorProps) {
  const remoteUsers = usePresenceStore((state) => state.remoteUsers);

  // Convert Map to array, exclude self (identified by currentUser)
  const users = Array.from(remoteUsers.values()).filter(
    (u) => u.lastSeen > 0 // filter out stale entries
  );

  if (users.length === 0) {
    return null;
  }

  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = users.length - maxVisible;

  return (
    <div
      className={className}
      data-testid="presence-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      role="group"
      aria-label="在线协作者"
    >
      {/* Avatar stack */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
            data-testid={`presence-user-${user.userId}`}
            data-username={user.name}
            role="img"
            aria-label={user.name}
            title={user.name}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: user.avatar || '#6366f1',
              border: '2px solid rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              marginLeft: index === 0 ? 0 : '-8px',
              zIndex: visibleUsers.length - index,
              position: 'relative',
              cursor: 'default',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}

        {/* Overflow badge */}
        {overflowCount > 0 && (
          <div
            data-testid="presence-overflow"
            role="img"
            aria-label={`还有 ${overflowCount} 位用户`}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              marginLeft: '-8px',
              zIndex: 0,
            }}
            title={`还有 ${overflowCount} 位用户`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* User count label */}
      <span
        data-testid="presence-count"
        style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 500,
        }}
      >
        {users.length} 在线
      </span>
    </div>
  );
}

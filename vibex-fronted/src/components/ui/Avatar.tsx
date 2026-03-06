import React, { useState } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  shape = 'circle',
  status,
  className = '',
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showFallback = !src || imageError;

  const classNames = [
    styles.avatar,
    styles[size],
    styles[shape],
    onClick && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={classNames}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {showFallback ? (
        <span className={styles.fallback}>
          {fallback ? getInitials(fallback) : '?'}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || fallback || 'Avatar'}
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      {status && <span className={`${styles.status} ${styles[status]}`} />}
    </div>
  );
}

export default Avatar;

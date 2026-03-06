import React from 'react';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  showLabel?: boolean;
}

export function Switch({
  size = 'md',
  label,
  description,
  showLabel = true,
  className = '',
  checked,
  disabled,
  id,
  ...props
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(false);

  const isChecked = isControlled ? checked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalChecked(e.target.checked);
    }
    props.onChange?.(e);
  };

  const containerClassNames = [
    styles.container,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const switchClassNames = [
    styles.switch,
    styles[size],
    isChecked && styles.checked,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassNames}>
      <label htmlFor={switchId} className={styles.label}>
        <input
          type="checkbox"
          id={switchId}
          className={styles.input}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <span className={switchClassNames}>
          <span className={styles.track} />
          <span className={styles.thumb} />
        </span>
        {showLabel && label && (
          <span className={styles.labelText}>
            {label}
            {description && (
              <span className={styles.description}>{description}</span>
            )}
          </span>
        )}
      </label>
    </div>
  );
}

export default Switch;

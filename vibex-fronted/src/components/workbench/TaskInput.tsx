'use client';

import { useState, FormEvent } from 'react';
import styles from './WorkbenchUI.module.css';

interface TaskInputProps {
  onSubmit: (task: string) => Promise<void>;
  disabled?: boolean;
}

export function TaskInput({ onSubmit, disabled }: TaskInputProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(value.trim());
      setValue('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.taskInputForm} onSubmit={handleSubmit}>
      <textarea
        className={styles.taskInput}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="描述你要完成的任务..."
        disabled={disabled || loading}
        rows={3}
      />
      <button
        type="submit"
        className={styles.taskSubmit}
        disabled={!value.trim() || loading || disabled}
      >
        {loading ? '发送中...' : '发送任务'}
      </button>
    </form>
  );
}

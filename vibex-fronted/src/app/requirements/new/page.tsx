'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './requirements.module.css';
import { apiService, Requirement, RequirementCreate } from '@/services/api';

export default function NewRequirement() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Redirect to new confirmation flow
  useEffect(() => {
    router.replace('/confirm');
  }, [router]);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id');

    if (!token) {
      router.push('/auth');
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← 返回
        </Link>
        <h1>需求输入</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.loading}>
          <p>正在跳转到新页面...</p>
        </div>
      </div>
    </div>
  );
}

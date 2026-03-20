'use client';

/**
 * @deprecated This page is deprecated since 2026-03-21.
 * All functionality has been migrated to the homepage step flow at /.
 * @see docs/vibex-page-structure-consolidation/IMPLEMENTATION_PLAN.md
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../confirm.module.css';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { CelebrationEffect } from '@/components/effects/CelebrationEffect';

export default function SuccessPage() {
  const router = useRouter();
  const {
    createdProjectId,
    boundedContexts,
    domainModels,
    businessFlow,
    reset,
  } = useConfirmationStore();

  const handleGoToProject = () => {
    reset();
    router.push('/dashboard');
  };

  const handleStartNew = () => {
    reset();
    router.push('/confirm');
  };

  if (!createdProjectId) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>创建失败</h1>
          <p className={styles.description}>无法创建项目，请重试。</p>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/confirm')}
          >
            返回重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Celebration effect on success */}
      <CelebrationEffect type="confetti" />
      
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>项目创建成功！</h1>
        <p className={styles.description}>您的项目已成功创建，包含以下内容：</p>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>限界上下文</span>
            <span className={styles.summaryValue}>
              {boundedContexts.length} 个
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>领域模型</span>
            <span className={styles.summaryValue}>
              {domainModels.length} 个
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>业务流程状态</span>
            <span className={styles.summaryValue}>
              {businessFlow?.states?.length || 0} 个
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={handleGoToProject}>
            前往项目
          </button>
          <button className={styles.secondaryButton} onClick={handleStartNew}>
            开始新的确认流程
          </button>
        </div>
      </div>
    </div>
  );
}

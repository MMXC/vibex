/**
 * AI Coding Agent Page
 * 
 * Sprint40 P001-E1: i18n AI生成区迁移收尾
 * 
 * Full-page AI Coding Agent interface with:
 * - Session list sidebar (AgentSessions)
 * - Feedback panel (AgentFeedbackPanel)
 */

'use client';

import { useTranslations } from '@/hooks/useTranslations';
import { AgentSessions } from '@/components/agent/AgentSessions';
import { AgentFeedbackPanel } from '@/components/agent/AgentFeedbackPanel';
import styles from './ai.module.css';

export default function AIPage() {
  const t = useTranslations('ai')();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('aiPageTitle')}</h1>
        <p className={styles.subtitle}>{t('aiPageSubtitle')}</p>
      </div>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <AgentSessions />
        </aside>
        <main className={styles.main}>
          <AgentFeedbackPanel />
        </main>
      </div>
    </div>
  );
}

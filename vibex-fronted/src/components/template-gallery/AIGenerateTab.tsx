/**
 * AIGenerateTab — S91 E1: AI Template Generation
 *
 * Tab content for the "AI 生成" tab in TemplateGallery.
 * Shows a quick-start card and opens the AIGenerateDialog.
 */

'use client';

import React from 'react';
import { useAIGenerateStore } from '@/stores/aiGenerateStore';
import { AIGenerateDialog } from './AIGenerateDialog';
import styles from './AIGenerateTab.module.css';

const EXAMPLE_PROMPTS = [
  '电商落地页：导航、产品网格、客户评价、底部 CTA',
  '个人作品集：Hero 区、技能展示、项目案例、联系方式',
  'SaaS 产品页：定价表格、功能列表、FAQ、免费试用入口',
  '博客页面：文章列表、侧边栏标签、评论区、订阅框',
];

export function AIGenerateTab() {
  const { dialogOpen, openDialog, closeDialog, history } = useAIGenerateStore();

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    return `${Math.floor(diff / 3600000)} 小时前`;
  };

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>✨</div>
          <h3 className={styles.heroTitle}>AI 智能生成</h3>
          <p className={styles.heroDesc}>
            描述你想要的页面，AI 将在 10 秒内生成可编辑的模板。
          </p>
          <button className={styles.startBtn} onClick={openDialog}>
            ✨ 开始生成
          </button>
        </div>

        <div className={styles.examples}>
          <h4 className={styles.examplesTitle}>试试这些描述</h4>
          <div className={styles.exampleList}>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                className={styles.exampleChip}
                onClick={() => { openDialog(); }}
                title={p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className={styles.history}>
            <h4 className={styles.historyTitle}>生成历史</h4>
            <div className={styles.historyList}>
              {history.slice(0, 5).map((job) => (
                <div key={job.id} className={styles.historyItem}>
                  <span className={`${styles.statusDot} ${styles[job.status]}`} />
                  <span className={styles.historyPrompt}>{job.prompt.slice(0, 60)}{job.prompt.length > 60 ? '...' : ''}</span>
                  <span className={styles.historyTime}>{formatTime(job.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AIGenerateDialog open={dialogOpen} onClose={closeDialog} />
    </>
  );
}

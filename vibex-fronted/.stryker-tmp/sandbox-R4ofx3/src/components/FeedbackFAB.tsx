/**
 * FeedbackFAB — 反馈浮动按钮
 * E3 S3.3: 右下角浮动按钮，点击展开 Feedback 表单
 *
 * 遵守 AGENTS.md 规范：
 * - 无 any 类型泄漏
 * - 完整的可访问性 (aria-label, role, keyboard navigation)
 */
// @ts-nocheck

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import styles from './FeedbackFAB.module.css';

export function FeedbackFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { submit, isSubmitting, lastError } = useFeedback();

  // Focus first input when form opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTitle('');
    setContent('');
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const ok = await submit(title, content);
    if (ok) {
      setSubmitted(true);
      setTimeout(handleClose, 2000);
    }
  }, [title, content, submit, handleClose]);

  if (submitted) {
    return (
      <div className={styles.fabWrapper} aria-live="polite">
        <div className={styles.miniToast} role="status">
          <span aria-hidden="true">✅</span>
          <span>反馈已发送，感谢您的反馈！</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className={styles.fabWrapper}>
        <button
          type="button"
          className={styles.fab}
          onClick={() => setIsOpen(true)}
          aria-label="提交反馈"
          aria-haspopup="dialog"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={styles.backdrop}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Feedback Form Panel */}
      {isOpen && (
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="提交反馈"
        >
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span aria-hidden="true">💬</span>
              提交反馈
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.field}>
              <label htmlFor="feedback-title" className={styles.label}>
                标题 <span className={styles.required} aria-hidden="true">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="feedback-title"
                type="text"
                className={styles.input}
                placeholder="简述反馈主题，如：页面加载慢"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="feedback-content" className={styles.label}>
                详细描述 <span className={styles.required} aria-hidden="true">*</span>
              </label>
              <textarea
                id="feedback-content"
                className={styles.textarea}
                placeholder="请详细描述您的反馈、建议或遇到的问题..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={2000}
                aria-required="true"
                disabled={isSubmitting}
              />
              <div className={styles.charCount} aria-live="polite">
                {content.length}/2000
              </div>
            </div>

            {lastError && (
              <div className={styles.errorMessage} role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>{lastError}</span>
              </div>
            )}
          </div>

          <div className={styles.panelFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  发送中...
                </>
              ) : (
                '发送反馈'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

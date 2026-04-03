/**
 * useFeedback — 提交用户反馈
 * E3 S3.3: Feedback FAB 提交 hook
 *
 * 发送反馈到后端 /api/feedback，由后端转发到 Slack #coord 频道
 *
 * 遵守 AGENTS.md 规范：
 * - 无 any 类型泄漏
 * - 错误处理完整
 */
// @ts-nocheck

import { useState, useCallback } from 'react';

interface FeedbackPayload {
  title: string;
  content: string;
  timestamp: number;
}

interface UseFeedbackReturn {
  submit: (title: string, content: string) => Promise<boolean>;
  isSubmitting: boolean;
  lastError: string | null;
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const submit = useCallback(async (title: string, content: string): Promise<boolean> => {
    if (!title.trim() || !content.trim()) {
      setLastError('标题和内容不能为空');
      return false;
    }

    setIsSubmitting(true);
    setLastError(null);

    try {
      const payload: FeedbackPayload = {
        title: title.trim(),
        content: content.trim(),
        timestamp: Date.now(),
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败，请稍后重试';
      setLastError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, lastError };
}

// @ts-nocheck
'use client';

/**
 * ConfirmPage - Confirmation flow standalone input page
 *
 * This page provides the requirement input step for the confirmation flow.
 * It uses the shared confirmationStore for state persistence.
 *
 * Compatible with `output: 'export'` (static HTML export).
 */

import { useEffect, useState } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';

interface ConfirmPageProps {
  className?: string;
}

export default function ConfirmPage({ className }: ConfirmPageProps) {
  const {
    requirementText,
    setRequirementText,
    currentStep,
    createdProjectId,
    boundedContexts,
    _hasHydrated,
    setHasHydrated,
  } = useConfirmationStore();

  const [localText, setLocalText] = useState('');
  const [mounted, setMounted] = useState(false);

  // Hydration guard - wait for client-side hydration
  useEffect(() => {
    setMounted(true);
    setHasHydrated(true);
  }, [setHasHydrated]);

  // Sync local state with store (after hydration)
  useEffect(() => {
    if (_hasHydrated && requirementText !== localText) {
      setLocalText(requirementText);
    }
  }, [_hasHydrated, requirementText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalText(value);
    setRequirementText(value);
  };

  // Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div
        data-testid="confirm-page"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <div style={{ color: '#666', fontSize: '0.875rem' }}>加载中...</div>
      </div>
    );
  }

  const hasData = boundedContexts.length > 0 || createdProjectId;

  return (
    <div
      data-testid="confirm-page"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '640px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            data-testid="confirm-title"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1a1a2e',
              margin: 0,
              marginBottom: '0.5rem',
            }}
          >
            {hasData ? '继续您的需求分析' : '开始需求分析'}
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0,
            }}
          >
            输入您的需求描述，AI 将帮助您完成分析和建模
          </p>
        </div>

        {/* Input area */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="requirement-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            需求描述
          </label>
          <textarea
            id="requirement"
            data-testid="requirement-input"
            value={localText}
            onChange={handleChange}
            placeholder="请描述您的需求，例如：设计一个电商订单处理系统..."
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Step indicator */}
        <div
          data-testid="step-indicator"
          style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          当前步骤: {currentStep}
          {createdProjectId && (
            <span data-testid="order-id" style={{ marginLeft: '1rem' }}>
              项目ID: {createdProjectId}
            </span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          data-testid="submit-requirement"
          disabled={!localText.trim()}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: localText.trim() ? '#667eea' : '#d1d5db',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: localText.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
          onClick={() => {
            if (localText.trim()) {
              // Navigate to homepage to continue the flow
              window.location.href = '/?step=context';
            }
          }}
        >
          开始生成
        </button>
      </div>
    </div>
  );
}

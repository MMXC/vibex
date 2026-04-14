/**
 * CardPreview — Unit Tests
 * Epic 3: F15
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardPreview } from '../CardPreview';
import type { DDSCard } from '@/types/dds';

// ==================== Fixtures ====================

const userStoryCard: DDSCard = {
  id: 'card-us-1',
  type: 'user-story',
  title: '用户登录',
  position: { x: 100, y: 200 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  role: 'PM',
  action: '我想要编辑用户信息',
  benefit: '以便于快速更新',
  priority: 'high',
};

const boundedContextCard: DDSCard = {
  id: 'card-bc-1',
  type: 'bounded-context',
  title: '用户上下文',
  position: { x: 300, y: 400 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: '用户上下文',
  description: '管理用户注册和登录',
  responsibility: '处理认证',
};

const flowStepCard: DDSCard = {
  id: 'card-fs-1',
  type: 'flow-step',
  title: '登录步骤',
  position: { x: 500, y: 600 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  stepName: '输入凭据',
  actor: '用户',
};

// ==================== Tests ====================

describe('CardPreview', () => {
  const defaultProps = {
    cards: [] as DDSCard[],
    onAccept: vi.fn(),
    onEdit: vi.fn(),
    onRetry: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the preview container', () => {
      render(<CardPreview {...defaultProps} />);
      expect(screen.getByTestId('card-preview')).toBeInTheDocument();
    });

    it('shows empty state when no cards provided', () => {
      render(<CardPreview {...defaultProps} cards={[]} />);
      expect(screen.getByTestId('card-preview-empty')).toBeInTheDocument();
      expect(screen.getByTestId('card-preview-empty')).toHaveTextContent('暂无卡片');
    });

    it('renders multiple cards in the card list', () => {
      const cards = [userStoryCard, boundedContextCard, flowStepCard];
      render(<CardPreview {...defaultProps} cards={cards} />);
      expect(screen.getByTestId('card-list')).toBeInTheDocument();
    });

    it('displays card count badge', () => {
      const cards = [userStoryCard, boundedContextCard];
      render(<CardPreview {...defaultProps} cards={cards} />);
      const badge = screen.getByTestId('card-preview').querySelector('[class*="badge"]');
      expect(badge).toHaveTextContent('2 张卡片');
    });
  });

  describe('Action Buttons', () => {
    it('renders all three action buttons when cards exist', () => {
      render(<CardPreview {...defaultProps} cards={[userStoryCard]} />);
      expect(screen.getByTestId('btn-accept')).toBeInTheDocument();
      expect(screen.getByTestId('btn-edit')).toBeInTheDocument();
      expect(screen.getByTestId('btn-retry')).toBeInTheDocument();
    });

    it('does not render action buttons when no cards', () => {
      render(<CardPreview {...defaultProps} cards={[]} />);
      expect(screen.queryByTestId('btn-accept')).not.toBeInTheDocument();
      expect(screen.queryByTestId('btn-edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('btn-retry')).not.toBeInTheDocument();
    });

    it('calls onAccept when accept button is clicked', () => {
      const onAccept = vi.fn();
      render(
        <CardPreview {...defaultProps} cards={[userStoryCard]} onAccept={onAccept} />
      );
      fireEvent.click(screen.getByTestId('btn-accept'));
      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(
        <CardPreview {...defaultProps} cards={[boundedContextCard]} onEdit={onEdit} />
      );
      fireEvent.click(screen.getByTestId('btn-edit'));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(
        <CardPreview {...defaultProps} cards={[flowStepCard]} onRetry={onRetry} />
      );
      fireEvent.click(screen.getByTestId('btn-retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('disables all buttons when isLoading is true', () => {
      render(
        <CardPreview {...defaultProps} cards={[userStoryCard]} isLoading={true} />
      );
      expect(screen.getByTestId('btn-accept')).toBeDisabled();
      expect(screen.getByTestId('btn-edit')).toBeDisabled();
      expect(screen.getByTestId('btn-retry')).toBeDisabled();
    });

    it('buttons are not disabled when not loading', () => {
      render(
        <CardPreview {...defaultProps} cards={[userStoryCard]} isLoading={false} />
      );
      expect(screen.getByTestId('btn-accept')).not.toBeDisabled();
      expect(screen.getByTestId('btn-edit')).not.toBeDisabled();
      expect(screen.getByTestId('btn-retry')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('accept button has correct aria-label', () => {
      render(<CardPreview {...defaultProps} cards={[userStoryCard]} />);
      expect(screen.getByTestId('btn-accept')).toHaveAttribute(
        'aria-label',
        '接受卡片，添加到画布'
      );
    });

    it('edit button has correct aria-label', () => {
      render(<CardPreview {...defaultProps} cards={[userStoryCard]} />);
      expect(screen.getByTestId('btn-edit')).toHaveAttribute(
        'aria-label',
        '编辑卡片'
      );
    });

    it('retry button has correct aria-label', () => {
      render(<CardPreview {...defaultProps} cards={[userStoryCard]} />);
      expect(screen.getByTestId('btn-retry')).toHaveAttribute(
        'aria-label',
        '重新生成卡片'
      );
    });
  });

  describe('Event Propagation', () => {
    it('does not propagate click events to parent elements', () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <CardPreview {...defaultProps} cards={[userStoryCard]} />
        </div>
      );
      fireEvent.click(screen.getByTestId('btn-accept'));
      expect(parentClick).not.toHaveBeenCalled();
    });
  });
});

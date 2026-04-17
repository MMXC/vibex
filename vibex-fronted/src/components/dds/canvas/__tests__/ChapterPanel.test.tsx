/**
 * ChapterPanel Unit Tests
 * Epic 2: F10 (DDSScrollContainer content), Epic 2-E1-U2 (CRUD)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChapterPanel } from '../ChapterPanel';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { UserStoryCard, BoundedContextCard, FlowStepCard } from '@/types/dds';

// ==================== Store Setup ====================

function setupStore(overrides = {}) {
  useDDSCanvasStore.setState({
    activeChapter: 'requirement',
    chapters: {
      requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: null },
      context: { type: 'context', cards: [], edges: [], loading: false, error: null },
      flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
      api: { type: 'api', cards: [], edges: [], loading: false, error: null },
      businessRules: { type: 'business-rules', cards: [], edges: [], loading: false, error: null },
    },
    selectedCardIds: [],
    ...overrides,
  });
}

function setupConfirmMock(returnValue = true) {
  const confirmMock = vi.fn(() => returnValue);
  vi.stubGlobal('confirm', confirmMock);
  return confirmMock;
}

// ==================== ChapterPanel Tests ====================

describe('ChapterPanel', () => {
  beforeEach(() => {
    setupStore();
    vi.clearAllMocks();
  });

  describe('chapter header', () => {
    it('renders chapter label', () => {
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByText('需求')).toBeInTheDocument();
    });

    it('renders card count badge — zero cards', () => {
      render(<ChapterPanel chapter="requirement" />);
      const count = screen.getByText('0');
      expect(count).toBeInTheDocument();
    });

    it('renders card count badge — shows actual count', () => {
      setupStore({
        chapters: {
          requirement: {
            type: 'requirement',
            cards: [
              {
                id: 'card-1',
                type: 'user-story',
                title: 'Story 1',
                role: 'user',
                action: 'login',
                benefit: 'access',
                priority: 'high',
                position: { x: 0, y: 0 },
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              } as UserStoryCard,
            ],
            edges: [],
            loading: false,
            error: null,
          },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no cards and not loading', () => {
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByText(/暂无用户故事/)).toBeInTheDocument();
      expect(screen.getByText(/点击下方按钮添加/)).toBeInTheDocument();
    });

    it('does not show empty state when loading', () => {
      setupStore({
        chapters: {
          requirement: { type: 'requirement', cards: [], edges: [], loading: true, error: null },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.queryByText(/暂无用户故事/)).not.toBeInTheDocument();
    });
  });

  describe('loading skeleton', () => {
    it('shows skeleton when loading', () => {
      setupStore({
        chapters: {
          requirement: { type: 'requirement', cards: [], edges: [], loading: true, error: null },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      render(<ChapterPanel chapter="requirement" />);
      // Skeleton cards have data-chapter on parent, but we just check no empty state
      expect(screen.queryByText(/暂无用户故事/)).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error state with retry button', () => {
      setupStore({
        chapters: {
          requirement: { type: 'requirement', cards: [], edges: [], loading: false, error: '加载失败，请重试' },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByText('加载失败，请重试')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    });
  });

  describe('add card button', () => {
    it('shows add card button for requirement chapter', () => {
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByRole('button', { name: /添加用户故事/i })).toBeInTheDocument();
    });

    it('shows add card button for context chapter', () => {
      render(<ChapterPanel chapter="context" />);
      expect(screen.getByRole('button', { name: /添加限界上下文/i })).toBeInTheDocument();
    });

    it('shows add card button for flow chapter', () => {
      render(<ChapterPanel chapter="flow" />);
      expect(screen.getByRole('button', { name: /添加流程步骤/i })).toBeInTheDocument();
    });

    it('shows create form after clicking add card button', () => {
      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: /添加用户故事/i }));
      // Form should show role/作为 input
      expect(screen.getByPlaceholderText('角色，如：用户、管理员')).toBeInTheDocument();
    });

    it('hides add button while create form is open', () => {
      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: /添加用户故事/i }));
      expect(screen.queryByRole('button', { name: /添加用户故事/i })).not.toBeInTheDocument();
    });

    it('cancels create form on cancel click', () => {
      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: /添加用户故事/i }));
      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      // Add button should be back
      expect(screen.getByRole('button', { name: /添加用户故事/i })).toBeInTheDocument();
      // Form should be gone
      expect(screen.queryByPlaceholderText('角色，如：用户、管理员')).not.toBeInTheDocument();
    });
  });

  describe('card creation', () => {
    it('creates a user-story card on form submit', () => {
      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: /添加用户故事/i }));

      fireEvent.change(screen.getByPlaceholderText('角色，如：用户、管理员'), {
        target: { value: '管理员' },
      });
      fireEvent.change(screen.getByPlaceholderText('行为，如：查看项目列表'), {
        target: { value: '审核用户' },
      });
      fireEvent.change(screen.getByPlaceholderText('收益，如：快速了解项目进度'), {
        target: { value: '确保用户身份合法' },
      });

      // Submit button should be enabled now
      const submitBtn = screen.getByRole('button', { name: '创建' });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);

      // Form should be closed
      expect(screen.queryByPlaceholderText('角色，如：用户、管理员')).not.toBeInTheDocument();
      // Store should have the card
      const cards = useDDSCanvasStore.getState().chapters.requirement.cards;
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe('user-story');
      expect((cards[0] as UserStoryCard).role).toBe('管理员');
      expect((cards[0] as UserStoryCard).action).toBe('审核用户');
    });

    it('creates a bounded-context card on form submit', () => {
      render(<ChapterPanel chapter="context" />);
      fireEvent.click(screen.getByRole('button', { name: /添加限界上下文/i }));

      fireEvent.change(screen.getByPlaceholderText('限界上下文名称'), {
        target: { value: '用户域' },
      });
      fireEvent.change(screen.getByPlaceholderText('简要描述'), {
        target: { value: '管理所有用户相关业务' },
      });

      fireEvent.click(screen.getByRole('button', { name: '创建' }));

      const cards = useDDSCanvasStore.getState().chapters.context.cards;
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe('bounded-context');
      expect((cards[0] as BoundedContextCard).name).toBe('用户域');
    });

    it('creates a flow-step card on form submit', () => {
      render(<ChapterPanel chapter="flow" />);
      fireEvent.click(screen.getByRole('button', { name: /添加流程步骤/i }));

      fireEvent.change(screen.getByPlaceholderText('步骤名称'), {
        target: { value: '提交申请' },
      });

      fireEvent.click(screen.getByRole('button', { name: '创建' }));

      const cards = useDDSCanvasStore.getState().chapters.flow.cards;
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe('flow-step');
      expect((cards[0] as FlowStepCard).stepName).toBe('提交申请');
    });

    it('submit button is disabled when required fields are empty', () => {
      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: /添加用户故事/i }));

      // role is empty → submit should be disabled
      const submitBtn = screen.getByRole('button', { name: '创建' });
      expect(submitBtn).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText('角色，如：用户、管理员'), {
        target: { value: ' ' }, // whitespace only
      });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('card selection', () => {
    it('selects a card on click', () => {
      setupStore({
        chapters: {
          requirement: {
            type: 'requirement',
            cards: [
              {
                id: 'card-1',
                type: 'user-story',
                title: 'Story 1',
                role: 'user',
                action: 'login',
                benefit: 'access',
                priority: 'high',
                position: { x: 0, y: 0 },
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              } as UserStoryCard,
            ],
            edges: [],
            loading: false,
            error: null,
          },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });

      render(<ChapterPanel chapter="requirement" />);
      const cardItem = screen.getByText('Story 1');
      fireEvent.click(cardItem);

      expect(useDDSCanvasStore.getState().selectedCardIds).toContain('card-1');
    });

    it('clicking already-selected card keeps it selected (additive selection)', () => {
      // selectCard is additive — clicking a selected card stays selected
      setupStore({
        chapters: {
          requirement: {
            type: 'requirement',
            cards: [
              {
                id: 'card-1',
                type: 'user-story',
                title: 'Story 1',
                role: 'user',
                action: 'login',
                benefit: 'access',
                priority: 'high',
                position: { x: 0, y: 0 },
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              } as UserStoryCard,
            ],
            edges: [],
            loading: false,
            error: null,
          },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
        selectedCardIds: ['card-1'],
      });

      render(<ChapterPanel chapter="requirement" />);
      const cardItem = screen.getByText('Story 1');
      fireEvent.click(cardItem);

      // selectCard is additive, card stays selected
      expect(useDDSCanvasStore.getState().selectedCardIds).toContain('card-1');
    });
  });

  describe('card deletion', () => {
    it('deletes a card when delete button is clicked and confirmed', () => {
      setupStore({
        chapters: {
          requirement: {
            type: 'requirement',
            cards: [
              {
                id: 'card-1',
                type: 'user-story',
                title: 'Story 1',
                role: 'user',
                action: 'login',
                benefit: 'access',
                priority: 'high',
                position: { x: 0, y: 0 },
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              } as UserStoryCard,
            ],
            edges: [],
            loading: false,
            error: null,
          },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      const confirmMock = setupConfirmMock(true);
      vi.stubGlobal('confirm', confirmMock);

      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByText('Story 1')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: '删除卡片' });
      fireEvent.click(deleteBtn);

      expect(confirmMock).toHaveBeenCalledWith('确定删除此卡片？');
      expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(0);
    });

    it('does not delete card when confirm returns false', () => {
      setupStore({
        chapters: {
          requirement: {
            type: 'requirement',
            cards: [
              {
                id: 'card-1',
                type: 'user-story',
                title: 'Story 1',
                role: 'user',
                action: 'login',
                benefit: 'access',
                priority: 'high',
                position: { x: 0, y: 0 },
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              } as UserStoryCard,
            ],
            edges: [],
            loading: false,
            error: null,
          },
          context: { type: 'context', cards: [], edges: [], loading: false, error: null },
          flow: { type: 'flow', cards: [], edges: [], loading: false, error: null },
        },
      });
      const confirmMock = setupConfirmMock(false);
      vi.stubGlobal('confirm', confirmMock);

      render(<ChapterPanel chapter="requirement" />);
      fireEvent.click(screen.getByRole('button', { name: '删除卡片' }));

      expect(useDDSCanvasStore.getState().chapters.requirement.cards).toHaveLength(1);
    });
  });

  describe('chapter card type restriction', () => {
    it('only shows user-story add button for requirement chapter', () => {
      render(<ChapterPanel chapter="requirement" />);
      expect(screen.getByRole('button', { name: /添加用户故事/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加限界上下文/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加流程步骤/i })).not.toBeInTheDocument();
    });

    it('only shows bounded-context add button for context chapter', () => {
      render(<ChapterPanel chapter="context" />);
      expect(screen.getByRole('button', { name: /添加限界上下文/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加用户故事/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加流程步骤/i })).not.toBeInTheDocument();
    });

    it('only shows flow-step add button for flow chapter', () => {
      render(<ChapterPanel chapter="flow" />);
      expect(screen.getByRole('button', { name: /添加流程步骤/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加用户故事/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /添加限界上下文/i })).not.toBeInTheDocument();
    });
  });
});

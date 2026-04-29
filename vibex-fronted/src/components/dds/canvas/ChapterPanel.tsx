/**
 * ChapterPanel — Single Chapter Content Panel
 *
 * Renders a chapter's card list with CRUD operations:
 * - Chapter header with title + card count
 * - Vertical card list (CardRenderer)
 * - + Add Card button (opens creation form)
 * - Delete card on hover
 *
 * Epic2-E1-U1: 3-chapter structure with data-chapter attribute
 * Epic2-E1-U2: CRUD for cards (add/update/delete)
 * Epic2-E1-U3: Schema rendering (delegates to CardRenderer)
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import { CardRenderer } from '@/components/dds/cards';
import { useConfirmDialogStore } from '@/lib/canvas/stores/confirmDialogStore';
import type { ChapterType, DDSCard, CardType, UserStoryCard, BoundedContextCard, FlowStepCard, APIEndpointCard } from '@/types/dds';
import styles from './ChapterPanel.module.css';

// ==================== Constants ====================

const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

const CHAPTER_CARD_TYPES: Record<ChapterType, CardType[]> = {
  requirement: ['user-story'],
  context: ['bounded-context'],
  flow: ['flow-step'],
  api: ['api-endpoint'],
  'business-rules': ['state-machine'],
};

const CARD_TYPE_LABELS: Record<CardType, string> = {
  'user-story': '用户故事',
  'bounded-context': '限界上下文',
  'flow-step': '流程步骤',
  'api-endpoint': 'API 端点',
  'state-machine': '状态机',
};

// ==================== ID Generator ====================

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as unknown as { randomUUID?: () => string }).randomUUID === 'function') {
    return (crypto as unknown as { randomUUID: () => string }).randomUUID();
  }
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ==================== Props ====================

export interface ChapterPanelProps {
  chapter: ChapterType;
  className?: string;
}

// ==================== Card Creation Forms ====================

function CreateUserStoryForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { role: string; action: string; benefit: string; priority: string }) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [benefit, setBenefit] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  return (
    <div className={styles.createForm}>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>作为</label>
        <input
          className={styles.formInput}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="角色，如：用户、管理员"
          autoFocus
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>我想要</label>
        <input
          className={styles.formInput}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="行为，如：查看项目列表"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>以便</label>
        <input
          className={styles.formInput}
          value={benefit}
          onChange={(e) => setBenefit(e.target.value)}
          placeholder="收益，如：快速了解项目进度"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>优先级</label>
        <select
          className={styles.formSelect}
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
        >
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>取消</button>
        <button
          className={styles.submitBtn}
          onClick={() => onSubmit({ role, action, benefit, priority })}
          disabled={!role.trim() || !action.trim()}
        >
          创建
        </button>
      </div>
    </div>
  );
}

function CreateBoundedContextForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description: string; responsibility: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [responsibility, setResponsibility] = useState('');

  return (
    <div className={styles.createForm}>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>名称</label>
        <input
          className={styles.formInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="限界上下文名称"
          autoFocus
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>描述</label>
        <input
          className={styles.formInput}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简要描述"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>职责</label>
        <textarea
          className={styles.formTextarea}
          value={responsibility}
          onChange={(e) => setResponsibility(e.target.value)}
          placeholder="核心职责描述"
          rows={2}
        />
      </div>
      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>取消</button>
        <button
          className={styles.submitBtn}
          onClick={() => onSubmit({ name, description, responsibility })}
          disabled={!name.trim()}
        >
          创建
        </button>
      </div>
    </div>
  );
}

function CreateFlowStepForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { stepName: string; actor?: string; preCondition?: string; postCondition?: string }) => void;
  onCancel: () => void;
}) {
  const [stepName, setStepName] = useState('');
  const [actor, setActor] = useState('');
  const [preCondition, setPreCondition] = useState('');
  const [postCondition, setPostCondition] = useState('');

  return (
    <div className={styles.createForm}>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>步骤名称</label>
        <input
          className={styles.formInput}
          value={stepName}
          onChange={(e) => setStepName(e.target.value)}
          placeholder="步骤名称"
          autoFocus
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>执行者</label>
        <input
          className={styles.formInput}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="执行此步骤的角色（可选）"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>前置条件</label>
        <input
          className={styles.formInput}
          value={preCondition}
          onChange={(e) => setPreCondition(e.target.value)}
          placeholder="前置条件（可选）"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>后置条件</label>
        <input
          className={styles.formInput}
          value={postCondition}
          onChange={(e) => setPostCondition(e.target.value)}
          placeholder="后置条件（可选）"
        />
      </div>
      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>取消</button>
        <button
          className={styles.submitBtn}
          onClick={() => onSubmit({ stepName, actor, preCondition, postCondition })}
          disabled={!stepName.trim()}
        >
          创建
        </button>
      </div>
    </div>
  );
}

// ==================== Card Item ====================

function CardItem({
  card,
  selected,
  onSelect,
  onDelete,
}: {
  card: DDSCard;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`${styles.cardItem} ${selected ? styles.cardItemSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className={styles.cardItemContent}>
        <CardRenderer card={card} selected={selected} />
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="删除卡片"
        aria-label="删除卡片"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

// ==================== Main ChapterPanel ====================

export const ChapterPanel = memo(function ChapterPanel({
  chapter,
  className = '',
}: ChapterPanelProps) {
  const cards = useDDSCanvasStore((s) => s.chapters[chapter].cards);
  const loading = useDDSCanvasStore((s) => s.chapters[chapter].loading);
  const error = useDDSCanvasStore((s) => s.chapters[chapter].error);
  const selectedCardIds = useDDSCanvasStore((s) => s.selectedCardIds);
  const loadChapter = useDDSCanvasStore((s) => s.loadChapter);
  const { addCard, deleteCard } = ddsChapterActions;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingType, setCreatingType] = useState<CardType | null>(null);

  // ---- Add card ----
  const handleAddCard = useCallback(
    (type: CardType) => {
      setCreatingType(type);
      setShowCreateForm(true);
    },
    []
  );

  const handleCreateUserStory = useCallback(
    ({ role, action, benefit, priority }: { role: string; action: string; benefit: string; priority: string }) => {
      const card: UserStoryCard = {
        id: generateId(),
        type: 'user-story',
        title: `作为${role}，我想要${action}`,
        role,
        action,
        benefit,
        priority: priority as 'high' | 'medium' | 'low',
        position: { x: 0, y: 0 },
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      addCard(chapter, card);
      setShowCreateForm(false);
      setCreatingType(null);
    },
    [chapter, addCard]
  );

  const handleCreateBoundedContext = useCallback(
    ({ name, description, responsibility }: { name: string; description: string; responsibility: string }) => {
      const card: BoundedContextCard = {
        id: generateId(),
        type: 'bounded-context',
        title: name,
        name,
        description,
        responsibility,
        position: { x: 0, y: 0 },
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      addCard(chapter, card);
      setShowCreateForm(false);
      setCreatingType(null);
    },
    [chapter, addCard]
  );

  const handleCreateAPIEndpoint = useCallback((data: { method: string; path: string; summary?: string; description?: string }) => {
    const id = `api-ep-${Date.now()}`;
    const card: APIEndpointCard = {
      id,
      type: 'api-endpoint',
      title: data.summary || `${data.method} ${data.path}`,
      method: data.method as APIEndpointCard['method'],
      path: data.path,
      summary: data.summary,
      description: data.description,
      tags: [],
      parameters: [],
      responses: [],
      position: { x: 0, y: 0 },
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    addCard('api', card);
    setShowCreateForm(false);
    setCreatingType(null);
  }, [addCard]);

  const handleCreateFlowStep = useCallback(
    ({ stepName, actor, preCondition, postCondition }: { stepName: string; actor?: string; preCondition?: string; postCondition?: string }) => {
      const card: FlowStepCard = {
        id: generateId(),
        type: 'flow-step',
        title: stepName,
        stepName,
        actor,
        preCondition,
        postCondition,
        position: { x: 0, y: 0 },
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      addCard(chapter, card);
      setShowCreateForm(false);
      setCreatingType(null);
    },
    [chapter, addCard]
  );

  // E1-U2: Cancel button for create form
  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setCreatingType(null);
  }, []);

  // E1-U2: Open confirmation dialog before delete
  const handleDeleteCard = useCallback(
    (cardId: string) => {
      useConfirmDialogStore.getState().open({
        title: '确认删除',
        message: '确定删除此卡片？',
        confirmLabel: '删除',
        cancelLabel: '取消',
        destructive: true,
        onConfirm: () => {
          deleteCard(chapter, cardId);
        },
      });
    },
    [chapter, deleteCard]
  );

  const handleSelectCard = useCallback(
    (cardId: string) => {
      useDDSCanvasStore.getState().selectCard(cardId);
    },
    []
  );

  const availableCardTypes = CHAPTER_CARD_TYPES[chapter];

  return (
    <div className={`${styles.chapterPanel} ${className}`} data-chapter={chapter}>
      {/* Header */}
      <div className={styles.chapterHeader}>
        <span className={styles.chapterTitle}>{CHAPTER_LABELS[chapter]}</span>
        <span className={styles.chapterCount}>{cards.length}</span>
      </div>

      {/* Card List */}
      <div className={styles.cardList}>
        {/* E5-U3: Error state — show retry button */}
        {error ? (
          <div className={styles.errorState}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className={styles.errorMessage}>{error}</p>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => loadChapter(chapter)}
            >
              重试
            </button>
          </div>
        ) : cards.length === 0 && !showCreateForm ? (
          /* E5-U1: Skeleton loading when loading, else empty state */
          loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonBadge} />
                  <div className={styles.skeletonLine} style={{ width: '60%' }} />
                  <div className={styles.skeletonLine} style={{ width: '80%' }} />
                  <div className={styles.skeletonLine} style={{ width: '40%' }} />
                </div>
              ))}
            </div>
          ) : (
            /* E5-U2: Empty state with guidance */
            <div className={styles.emptyState}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>暂无{CARD_TYPE_LABELS[availableCardTypes[0]!]}</p>
              <p>点击下方按钮添加</p>
            </div>
          )
        ) : (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              selected={selectedCardIds.includes(card.id)}
              onSelect={() => handleSelectCard(card.id)}
              onDelete={() => handleDeleteCard(card.id)}
            />
          ))
        )}

        {/* Create Form */}
        {showCreateForm && creatingType === 'user-story' && (
          <CreateUserStoryForm
            onSubmit={handleCreateUserStory}
            onCancel={() => { setShowCreateForm(false); setCreatingType(null); }}
          />
        )}
        {showCreateForm && creatingType === 'bounded-context' && (
          <CreateBoundedContextForm
            onSubmit={handleCreateBoundedContext}
            onCancel={() => { setShowCreateForm(false); setCreatingType(null); }}
          />
        )}
        {showCreateForm && creatingType === 'flow-step' && (
          <CreateFlowStepForm
            onSubmit={handleCreateFlowStep}
            onCancel={() => { setShowCreateForm(false); setCreatingType(null); }}
          />
        )}
        {showCreateForm && creatingType === 'api-endpoint' && (
          <div className={styles.createForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>方法</label>
              <select className={styles.formInput} id="create-api-method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>路径</label>
              <input className={styles.formInput} id="create-api-path" placeholder="/api/users" />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>摘要</label>
              <input className={styles.formInput} id="create-api-summary" placeholder="用户列表" />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>描述</label>
              <input className={styles.formInput} id="create-api-desc" placeholder="获取所有用户" />
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={handleCancelCreate}>取消</button>
              <button
                type="button"
                className={styles.createBtn}
                onClick={() => {
                  const method = (document.getElementById('create-api-method') as HTMLSelectElement)?.value || 'GET';
                  const path = (document.getElementById('create-api-path') as HTMLInputElement)?.value || '/';
                  const summary = (document.getElementById('create-api-summary') as HTMLInputElement)?.value;
                  const description = (document.getElementById('create-api-desc') as HTMLInputElement)?.value;
                  handleCreateAPIEndpoint({ method, path, summary, description });
                }}
              >
                创建端点
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      {!showCreateForm && (
        <div className={styles.chapterFooter}>
          {availableCardTypes.map((type) => (
            <button
              key={type}
              className={styles.addCardBtn}
              onClick={() => handleAddCard(type)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加{CARD_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

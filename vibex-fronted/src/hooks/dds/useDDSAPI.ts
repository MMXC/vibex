/**
 * useDDSAPI — 前端 API Client Hook
 *
 * 封装 fetch，类型安全调用 /api/v1/dds/* 端点
 * 对应 API Spec: specs/api-card-crud.md
 *
 * Epic 1: F5
 */

import { useCallback } from 'react';
import type {
  DDSResponse,
  DDSCard,
  DDSEdge,
  ChapterType,
  ChatMessage,
} from '@/types/dds';

// ==================== API Client Functions ====================

async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<DDSResponse<T>> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = await res.json();
  return data as DDSResponse<T>;
}

// ==================== API Client ====================

export interface DDSAPIClient {
  // Cards
  getCards: (chapterId: string) => Promise<DDSResponse<DDSCard[]>>;
  createCard: (
    chapterId: string,
    card: Omit<DDSCard, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<DDSResponse<DDSCard>>;
  updateCard: (cardId: string, updates: Partial<DDSCard>) => Promise<DDSResponse<DDSCard>>;
  deleteCard: (cardId: string) => Promise<DDSResponse<null>>;

  // Relations & Position
  updateRelations: (
    cardId: string,
    relations: Array<{ targetId: string; type: string; label?: string }>
  ) => Promise<DDSResponse<DDSEdge[]>>;
  updatePosition: (
    cardId: string,
    position: { x: number; y: number }
  ) => Promise<DDSResponse<DDSCard>>;

  // Chapters
  getChapters: (projectId: string) => Promise<DDSResponse<{ id: string; type: ChapterType }[]>>;

  // Chat History (optional — future)
  saveChatHistory?: (chapterId: string, messages: ChatMessage[]) => Promise<DDSResponse<null>>;
}

function createDDSAPI(baseUrl = ''): DDSAPIClient {
  const base = `${baseUrl}/api/v1/dds`;

  return {
    // GET /api/v1/dds/chapters/:chapterId/cards
    getCards: (chapterId) =>
      apiFetch<DDSCard[]>(`${base}/chapters/${chapterId}/cards`),

    // POST /api/v1/dds/chapters/:chapterId/cards
    createCard: (chapterId, card) =>
      apiFetch<DDSCard>(`${base}/chapters/${chapterId}/cards`, {
        method: 'POST',
        body: JSON.stringify(card),
      }),

    // PUT /api/v1/dds/cards/:cardId
    updateCard: (cardId, updates) =>
      apiFetch<DDSCard>(`${base}/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    // DELETE /api/v1/dds/cards/:cardId
    deleteCard: (cardId) =>
      apiFetch<null>(`${base}/cards/${cardId}`, { method: 'DELETE' }),

    // PUT /api/v1/dds/cards/:cardId/relations
    updateRelations: (cardId, relations) =>
      apiFetch<DDSEdge[]>(`${base}/cards/${cardId}/relations`, {
        method: 'PUT',
        body: JSON.stringify({ relations }),
      }),

    // PUT /api/v1/dds/cards/:cardId/position
    updatePosition: (cardId, position) =>
      apiFetch<DDSCard>(`${base}/cards/${cardId}/position`, {
        method: 'PUT',
        body: JSON.stringify({ position }),
      }),

    // GET /api/v1/dds/chapters?projectId=xxx
    getChapters: (projectId) =>
      apiFetch<{ id: string; type: ChapterType }[]>(
        `${base}/chapters?projectId=${projectId}`
      ),
  };
}

// ==================== React Hook ====================

/**
 * useDDSAPI — 返回类型安全的 API client
 *
 * 使用示例：
 * ```typescript
 * const api = useDDSAPI();
 * const { data, error } = await api.getCards('ch-1');
 * ```
 *
 * 注意：此 hook 不做数据获取（避免 SSR/hydration 问题），
 * 仅返回 client 函数供组件/其他 hook 调用。
 */
export function useDDSAPI(): DDSAPIClient {
  // 使用 useCallback 确保稳定的引用
  return useCallback(() => createDDSAPI(), [])() as DDSAPIClient;
}

// ==================== 独立导出（可不用 hook 直接调用）================

export { createDDSAPI };

// Re-export types for consumers
export type { DDSResponse };

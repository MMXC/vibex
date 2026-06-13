/**
 * useShare — S94-E2: Advanced Canvas Sharing Hook
 *
 * Provides API integration for:
 * - Creating share links with role, expiration, password
 * - Listing share links for a canvas
 * - Revoking share links
 * - Managing webhooks (list + add)
 */

import { useCallback } from 'react';
import { useShareStore, ShareRole, ShareLink, Webhook, WebhookEvent } from '@/stores/shareStore';

interface CreateShareOptions {
  role: ShareRole;
  expiresInHours: number;
  password?: string;
  allowComments?: boolean;
  allowDownload?: boolean;
}

interface CreateWebhookOptions {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useShare(canvasId: string) {
  const store = useShareStore();

  const createShareLink = useCallback(
    async (options: CreateShareOptions): Promise<ShareLink> => {
      store.setLoading(true);
      store.setError(null);
      try {
        const body: Record<string, unknown> = {
          role: options.role,
          expiresInHours: options.expiresInHours,
          allowComments: options.allowComments ?? true,
          allowDownload: options.allowDownload ?? false,
        };
        if (options.password) {
          body.password = options.password;
        }

        const data = await apiFetch<{
          id: string;
          token: string;
          shareUrl: string;
          embedUrl: string;
          role: ShareRole;
          expiresAt: string;
          hasPassword: boolean;
          allowComments: boolean;
          allowDownload: boolean;
        }>(`/api/canvas/${canvasId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const link: ShareLink = {
          id: data.id,
          token: data.token,
          role: data.role,
          shareUrl: data.shareUrl,
          embedUrl: data.embedUrl,
          expiresAt: data.expiresAt,
          hasPassword: data.hasPassword,
          allowComments: data.allowComments,
          allowDownload: data.allowDownload,
          viewCount: 0,
          createdAt: new Date().toISOString(),
        };

        store.addShareLink(link);
        return link;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create share link';
        store.setError(msg);
        throw err;
      } finally {
        store.setLoading(false);
      }
    },
    [canvasId, store]
  );

  const listShareLinks = useCallback(async (): Promise<ShareLink[]> => {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await apiFetch<{
        shares: Array<{
          id: string;
          token: string;
          role: string;
          shareUrl: string;
          embedUrl: string;
          expiresAt: string | null;
          hasPassword: boolean;
          allowComments: boolean;
          allowDownload: boolean;
          viewCount?: number;
        }>;
      }>(`/api/canvas/${canvasId}/share?canvasId=${canvasId}`);

      const links: ShareLink[] = data.shares.map((s) => ({
        id: s.id,
        token: s.token,
        role: s.role as ShareRole,
        shareUrl: s.shareUrl,
        embedUrl: s.embedUrl,
        expiresAt: s.expiresAt,
        hasPassword: s.hasPassword,
        allowComments: s.allowComments,
        allowDownload: s.allowDownload,
        viewCount: s.viewCount ?? 0,
        createdAt: new Date().toISOString(),
      }));

      store.setShareLinks(links);
      return links;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to list share links';
      store.setError(msg);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [canvasId, store]);

  const revokeShareLink = useCallback(
    async (token: string): Promise<void> => {
      store.setLoading(true);
      store.setError(null);
      try {
        await apiFetch(`/api/canvas/${canvasId}/share?token=${encodeURIComponent(token)}`, {
          method: 'DELETE',
        });
        // Find and remove the link from store by token
        const link = store.shareLinks.find((l) => l.token === token);
        if (link) {
          store.removeShareLink(link.id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to revoke share link';
        store.setError(msg);
        throw err;
      } finally {
        store.setLoading(false);
      }
    },
    [canvasId, store]
  );

  const listWebhooks = useCallback(async (): Promise<Webhook[]> => {
    store.setLoadingWebhooks(true);
    store.setError(null);
    try {
      const data = await apiFetch<{
        webhooks: Array<{
          id: string;
          canvasId: string;
          url: string;
          events: WebhookEvent[];
          isActive: boolean;
          createdBy: string;
          createdAt: string;
          updatedAt: string;
        }>;
      }>(`/api/canvas/${canvasId}/webhooks`);

      store.setWebhooks(data.webhooks);
      return data.webhooks;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to list webhooks';
      store.setError(msg);
      throw err;
    } finally {
      store.setLoadingWebhooks(false);
    }
  }, [canvasId, store]);

  const addWebhook = useCallback(
    async (options: CreateWebhookOptions): Promise<Webhook> => {
      store.setLoadingWebhooks(true);
      store.setError(null);
      try {
        const data = await apiFetch<{
          id: string;
          canvasId: string;
          url: string;
          secret: string;
          events: WebhookEvent[];
          isActive: boolean;
          createdBy: string;
        }>(`/api/canvas/${canvasId}/webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });

        const webhook: Webhook = {
          id: data.id,
          canvasId: data.canvasId,
          url: data.url,
          secret: data.secret,
          events: data.events,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        store.addWebhook(webhook);
        return webhook;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add webhook';
        store.setError(msg);
        throw err;
      } finally {
        store.setLoadingWebhooks(false);
      }
    },
    [canvasId, store]
  );

  return {
    createShareLink,
    listShareLinks,
    revokeShareLink,
    listWebhooks,
    addWebhook,
  };
}

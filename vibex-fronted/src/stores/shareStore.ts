/**
 * shareStore — S94-E2: Advanced Canvas Sharing
 *
 * Manages advanced share panel state:
 * - Panel visibility (share panel vs. webhook config)
 * - Active share links with role, expiration, password status
 * - Webhook configurations
 * - Embed code generation
 */

import { create } from 'zustand';

export type ShareRole = 'owner' | 'editor' | 'viewer' | 'commenter';

export interface ShareLink {
  id: string;
  token: string;
  role: ShareRole;
  shareUrl: string;
  embedUrl: string;
  expiresAt: string | null;
  hasPassword: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  viewCount: number;
  createdAt: string;
}

export type WebhookEvent =
  | 'share.created'
  | 'share.accessed'
  | 'share.expired'
  | 'share.revoked'
  | 'canvas.updated'
  | 'canvas.deleted'
  | 'canvas.exported'
  | 'comment.created'
  | 'comment.updated';

export interface Webhook {
  id: string;
  canvasId: string;
  url: string;
  secret: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type PanelTab = 'share' | 'webhooks';

interface ShareState {
  /** Whether the share panel is open */
  isOpen: boolean;

  /** Active tab within the panel */
  activeTab: PanelTab;

  /** All share links for the current canvas */
  shareLinks: ShareLink[];

  /** All webhooks for the current canvas */
  webhooks: Webhook[];

  /** Whether share data is loading */
  isLoading: boolean;

  /** Whether webhooks are loading */
  isLoadingWebhooks: boolean;

  /** Error message */
  error: string | null;

  /** Currently selected share role in the share panel */
  selectedRole: ShareRole;

  /** Expiration hours for new share link */
  expiresInHours: number;

  /** Password for new share link */
  sharePassword: string;

  /** Allow comments on share */
  allowComments: boolean;

  /** Allow download on share */
  allowDownload: boolean;

  /** New webhook URL */
  webhookUrl: string;

  /** New webhook events */
  webhookEvents: WebhookEvent[];

  // Actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveTab: (tab: PanelTab) => void;
  setSelectedRole: (role: ShareRole) => void;
  setExpiresInHours: (hours: number) => void;
  setSharePassword: (password: string) => void;
  setAllowComments: (allow: boolean) => void;
  setAllowDownload: (allow: boolean) => void;
  setWebhookUrl: (url: string) => void;
  setWebhookEvents: (events: WebhookEvent[]) => void;

  setShareLinks: (links: ShareLink[]) => void;
  addShareLink: (link: ShareLink) => void;
  removeShareLink: (id: string) => void;

  setWebhooks: (webhooks: Webhook[]) => void;
  addWebhook: (webhook: Webhook) => void;
  removeWebhook: (id: string) => void;

  setLoading: (loading: boolean) => void;
  setLoadingWebhooks: (loading: boolean) => void;
  setError: (error: string | null) => void;

  reset: () => void;
}

const initialState = {
  isOpen: false,
  activeTab: 'share' as PanelTab,
  shareLinks: [],
  webhooks: [],
  isLoading: false,
  isLoadingWebhooks: false,
  error: null,
  selectedRole: 'viewer' as ShareRole,
  expiresInHours: 720,
  sharePassword: '',
  allowComments: true,
  allowDownload: false,
  webhookUrl: '',
  webhookEvents: [] as WebhookEvent[],
};

export const useShareStore = create<ShareState>((set) => ({
  ...initialState,

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedRole: (selectedRole) => set({ selectedRole }),
  setExpiresInHours: (expiresInHours) => set({ expiresInHours }),
  setSharePassword: (sharePassword) => set({ sharePassword }),
  setAllowComments: (allowComments) => set({ allowComments }),
  setAllowDownload: (allowDownload) => set({ allowDownload }),
  setWebhookUrl: (webhookUrl) => set({ webhookUrl }),
  setWebhookEvents: (webhookEvents) => set({ webhookEvents }),

  setShareLinks: (shareLinks) => set({ shareLinks }),
  addShareLink: (link) =>
    set((s) => ({ shareLinks: [link, ...s.shareLinks] })),
  removeShareLink: (id) =>
    set((s) => ({ shareLinks: s.shareLinks.filter((l) => l.id !== id) })),

  setWebhooks: (webhooks) => set({ webhooks }),
  addWebhook: (webhook) =>
    set((s) => ({ webhooks: [webhook, ...s.webhooks] })),
  removeWebhook: (id) =>
    set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),
  setLoadingWebhooks: (isLoadingWebhooks) => set({ isLoadingWebhooks }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

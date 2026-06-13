/**
 * SharePanel.test.tsx — S94-E2: Advanced Canvas Sharing Vitest Tests
 *
 * Tests:
 * 1. Renders nothing when panel is closed
 * 2. Renders panel when open
 * 3. Shows role selection options
 * 4. Expiration select options
 * 5. Password input field
 * 6. Toggle allowComments and allowDownload
 * 7. Embed code display and copy button
 * 8. Webhooks tab switching
 * 9. Webhook URL + event selection
 * 10. Close button calls closePanel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharePanel } from './SharePanel';
import { useShareStore } from '@/stores/shareStore';

// Mock hook state
const mockHookState = vi.hoisted(() => ({
  createShareLink: vi.fn().mockResolvedValue({ id: 'link-1', token: 'tok1', shareUrl: '/canvas/share?token=tok1', embedUrl: '/canvas/share?token=tok1&embed=1&mode=viewer', role: 'viewer', expiresAt: null, hasPassword: false, allowComments: true, allowDownload: false, viewCount: 0, createdAt: '' }),
  listShareLinks: vi.fn().mockResolvedValue([]),
  revokeShareLink: vi.fn().mockResolvedValue(undefined),
  listWebhooks: vi.fn().mockResolvedValue([]),
  addWebhook: vi.fn().mockResolvedValue({ id: 'wh-1', canvasId: 'c1', url: 'https://example.com/webhook', secret: 's', events: ['share.created'], isActive: true, createdBy: 'u1', createdAt: '', updatedAt: '' }),
}));

const mockStoreState = vi.hoisted(() => ({
  isOpen: false,
  activeTab: 'share' as 'share' | 'webhooks',
  shareLinks: [],
  webhooks: [],
  isLoading: false,
  isLoadingWebhooks: false,
  error: null,
  selectedRole: 'viewer' as 'viewer',
  expiresInHours: 720,
  sharePassword: '',
  allowComments: true,
  allowDownload: false,
  webhookUrl: '',
  webhookEvents: [] as string[],
  closePanel: vi.fn(),
  openPanel: vi.fn(),
  togglePanel: vi.fn(),
  setActiveTab: vi.fn(),
  setSelectedRole: vi.fn(),
  setExpiresInHours: vi.fn(),
  setSharePassword: vi.fn(),
  setAllowComments: vi.fn(),
  setAllowDownload: vi.fn(),
  setWebhookUrl: vi.fn(),
  setWebhookEvents: vi.fn(),
  setShareLinks: vi.fn(),
  addShareLink: vi.fn(),
  removeShareLink: vi.fn(),
  setWebhooks: vi.fn(),
  addWebhook: vi.fn(),
  removeWebhook: vi.fn(),
  setLoading: vi.fn(),
  setLoadingWebhooks: vi.fn(),
  setError: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/stores/shareStore', () => ({
  useShareStore: vi.fn((selector?) => {
    if (typeof selector === 'function') return selector(mockStoreState);
    return mockStoreState;
  }),
}));

vi.mock('@/hooks/canvas/useShare', () => ({
  useShare: vi.fn(() => mockHookState),
}));

describe('SharePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.isOpen = false;
    mockStoreState.activeTab = 'share';
    mockStoreState.shareLinks = [];
    mockStoreState.webhooks = [];
    mockStoreState.error = null;
    mockStoreState.selectedRole = 'viewer';
    mockStoreState.expiresInHours = 720;
    mockStoreState.sharePassword = '';
    mockStoreState.allowComments = true;
    mockStoreState.allowDownload = false;
    mockStoreState.webhookUrl = '';
    mockStoreState.webhookEvents = [];
    mockHookState.createShareLink.mockResolvedValue({
      id: 'link-1',
      token: 'tok1',
      shareUrl: '/canvas/share?token=tok1',
      embedUrl: '/canvas/share?token=tok1&embed=1&mode=viewer',
      role: 'viewer',
      expiresAt: null,
      hasPassword: false,
      allowComments: true,
      allowDownload: false,
      viewCount: 0,
      createdAt: '',
    });
  });

  it('does not render when panel is closed', () => {
    mockStoreState.isOpen = false;
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.queryByTestId('share-panel')).toBeNull();
  });

  it('renders panel when open', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" canvasName="Test Canvas" />);
    expect(screen.getByTestId('share-panel')).toBeInTheDocument();
    expect(screen.getByText('分享与设置')).toBeInTheDocument();
  });

  it('shows role selection options', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByText('Viewer — 只查看')).toBeInTheDocument();
    expect(screen.getByText('Commenter — 可评论')).toBeInTheDocument();
    expect(screen.getByText('Editor — 可编辑')).toBeInTheDocument();
    expect(screen.getByText('Owner — 所有者')).toBeInTheDocument();
  });

  it('shows expiration select', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    const select = screen.getByTestId('expiry-select');
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option')).toHaveLength(5);
  });

  it('calls setSelectedRole when role is clicked', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    fireEvent.click(screen.getByText('Editor — 可编辑'));
    expect(mockStoreState.setSelectedRole).toHaveBeenCalledWith('editor');
  });

  it('shows password input', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByTestId('share-password-input')).toBeInTheDocument();
  });

  it('shows allowComments and allowDownload toggles', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByText('允许评论')).toBeInTheDocument();
    expect(screen.getByText('允许下载')).toBeInTheDocument();
  });

  it('create share button calls createShareLink', async () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    fireEvent.click(screen.getByTestId('create-share-btn'));
    expect(mockHookState.createShareLink).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'viewer', expiresInHours: 720 })
    );
  });

  it('shows active share link with embed code', () => {
    mockStoreState.isOpen = true;
    mockStoreState.shareLinks = [{
      id: 'link-1',
      token: 'tok1',
      role: 'viewer',
      shareUrl: '/canvas/share?token=tok1',
      embedUrl: '/canvas/share?token=tok1&embed=1&mode=viewer',
      expiresAt: null,
      hasPassword: false,
      allowComments: true,
      allowDownload: false,
      viewCount: 5,
      createdAt: '2026-01-01T00:00:00Z',
    }];
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByTestId('active-share')).toBeInTheDocument();
    expect(screen.getByTestId('embed-code')).toBeInTheDocument();
    expect(screen.getByTestId('copy-embed-btn')).toBeInTheDocument();
  });

  it('copy embed button works', async () => {
    mockStoreState.isOpen = true;
    mockStoreState.shareLinks = [{
      id: 'link-1',
      token: 'tok1',
      role: 'viewer',
      shareUrl: '/canvas/share?token=tok1',
      embedUrl: '/canvas/share?token=tok1&embed=1&mode=viewer',
      expiresAt: null,
      hasPassword: false,
      allowComments: true,
      allowDownload: false,
      viewCount: 0,
      createdAt: '',
    }];
    const clipboard = { writeText: vi.fn() };
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, writable: true });
    clipboard.writeText.mockResolvedValue(undefined);
    render(<SharePanel canvasId="canvas-1" />);
    fireEvent.click(screen.getByTestId('copy-embed-btn'));
    expect(clipboard.writeText).toHaveBeenCalled();
  });

  it('switching to webhooks tab shows webhook form', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    // Simulate tab change via store
    mockStoreState.activeTab = 'webhooks';
    // Force re-render
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByTestId('webhook-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('add-webhook-btn')).toBeInTheDocument();
  });

  it('close button calls closePanel', () => {
    mockStoreState.isOpen = true;
    render(<SharePanel canvasId="canvas-1" />);
    fireEvent.click(screen.getByTestId('close-share-panel'));
    expect(mockStoreState.closePanel).toHaveBeenCalled();
  });

  it('shows error banner when error is set', () => {
    mockStoreState.isOpen = true;
    mockStoreState.error = 'Failed to create share link';
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByTestId('share-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to create share link')).toBeInTheDocument();
  });

  it('shows revoke button on active share', () => {
    mockStoreState.isOpen = true;
    mockStoreState.shareLinks = [{
      id: 'link-1',
      token: 'tok1',
      role: 'viewer',
      shareUrl: '/canvas/share?token=tok1',
      embedUrl: '/canvas/share?token=tok1&embed=1&mode=viewer',
      expiresAt: null,
      hasPassword: false,
      allowComments: true,
      allowDownload: false,
      viewCount: 0,
      createdAt: '',
    }];
    render(<SharePanel canvasId="canvas-1" />);
    expect(screen.getByTestId('revoke-share-btn')).toBeInTheDocument();
  });

  it('add webhook button disabled when no URL or events', () => {
    mockStoreState.isOpen = true;
    mockStoreState.activeTab = 'webhooks';
    render(<SharePanel canvasId="canvas-1" />);
    const btn = screen.getByTestId('add-webhook-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('add webhook button enabled when URL and events provided', () => {
    mockStoreState.isOpen = true;
    mockStoreState.activeTab = 'webhooks';
    mockStoreState.webhookUrl = 'https://example.com/webhook';
    mockStoreState.webhookEvents = ['share.created'];
    render(<SharePanel canvasId="canvas-1" />);
    const btn = screen.getByTestId('add-webhook-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

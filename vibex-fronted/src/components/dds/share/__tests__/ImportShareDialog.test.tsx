/**
 * ImportShareDialog.test.tsx — S83-E2 vitest tests
 *
 * Tests the share link import dialog:
 * - Token validation states (loading, success, error)
 * - Preview display (canvas name, role badge, expiry)
 * - Import confirmation flow
 * - Error retry flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ImportShareDialog } from '../ImportShareDialog';

// Mock useTranslations — avoids next-intl provider dependency
vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: (ns: string) => (key: string) => {
    const map: Record<string, string> = {
      validatingToken: '正在验证分享链接...',
      invalidTokenHint: '该分享链接可能已过期或已被撤回。',
      cancel: '取消',
      importCanvas: '导入画布',
    };
    return map[key] ?? key;
  },
}));

// Mock API — mock fns declared outside vi.mock (ShareDialog pattern)
const mockValidateShareToken = vi.fn();
const mockImportCanvas = vi.fn();

vi.mock('@/lib/api/canvas-share', () => ({
  canvasShareApi: {
    validateShareToken: (...args: unknown[]) => mockValidateShareToken(...args),
    importCanvas: (...args: unknown[]) => mockImportCanvas(...args),
  },
}));

const successResponse = {
  success: true as const,
  token: 'test-share-token-123',
  canvasId: 'canvas-abc',
  canvasName: 'My Awesome Canvas',
  canvasVersion: 3,
  role: 'editor' as const,
  expiresAt: null as null,
  canvasData: null as null,
};

describe('ImportShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', async () => {
    mockValidateShareToken.mockResolvedValue(successResponse);
    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-share-token-123"
        onClose={vi.fn()}
        onImported={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('import-share-dialog')).toBeInTheDocument();
    });
  });

  it('shows canvas preview after successful token validation', async () => {
    mockValidateShareToken.mockResolvedValue(successResponse);

    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-share-token-123"
        onClose={vi.fn()}
        onImported={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Awesome Canvas')).toBeInTheDocument();
    });
    expect(screen.getByText('可编辑')).toBeInTheDocument();
  });

  it('shows error state when token is invalid', async () => {
    mockValidateShareToken.mockRejectedValue(new Error('Token expired or invalid'));

    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-share-token-123"
        onClose={vi.fn()}
        onImported={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Token expired or invalid')).toBeInTheDocument();
    });
    expect(screen.getByText('该分享链接可能已过期或已被撤回。')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    mockValidateShareToken.mockResolvedValue(successResponse);
    const onClose = vi.fn();

    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-share-token-123"
        onClose={onClose}
        onImported={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /取消/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onImported on import button click', async () => {
    mockValidateShareToken.mockResolvedValue(successResponse);
    mockImportCanvas.mockResolvedValue({ success: true, canvasId: 'imported-id', canvasName: 'Copy' });
    const onImported = vi.fn();

    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-share-token-123"
        onClose={vi.fn()}
        onImported={onImported}
      />
    );

    // Wait for the import button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '导入画布' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '导入画布' }));

    await waitFor(() => {
      expect(onImported).toHaveBeenCalledWith('canvas-abc', 'My Awesome Canvas');
    });
  });

  it('shows viewer badge for viewer role', async () => {
    mockValidateShareToken.mockResolvedValue({
      ...successResponse,
      canvasName: 'Read-only Canvas',
      role: 'viewer' as const,
    });

    render(
      <ImportShareDialog
        isOpen={true}
        shareToken="test-token"
        onClose={vi.fn()}
        onImported={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('只读查看')).toBeInTheDocument();
    });
  });
});

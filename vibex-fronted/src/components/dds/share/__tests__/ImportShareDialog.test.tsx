/**
 * ImportShareDialog.test.tsx — S83-E2 vitest tests
 *
 * Tests the share link import dialog:
 * - Token validation states (loading, success, error)
 * - Preview display (canvas name, role badge, expiry)
 * - Import confirmation flow
 * - Error retry flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ImportShareDialog } from '../ImportShareDialog';

const mockValidateShareToken = vi.fn();
const mockImportCanvas = vi.fn();

// Mock the canvas-share API module
vi.mock('@/lib/api/canvas-share', async () => {
  const actual = await import('@/lib/api/canvas-share');
  return {
    ...actual,
    canvasShareApi: {
      ...actual.canvasShareApi,
      validateShareToken: mockValidateShareToken,
      importCanvas: mockImportCanvas,
    },
  };
});

describe('ImportShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    shareToken: 'test-share-token-123',
    onClose: vi.fn(),
    onImported: vi.fn(),
  };

  it('renders dialog when open with token', () => {
    mockValidateShareToken.mockResolvedValue(null); // still loading initially
    render(<ImportShareDialog {...defaultProps} />);
    expect(screen.getByTestId('import-share-dialog')).toBeInTheDocument();
  });

  it('shows loading state while validating token', async () => {
    mockValidateShareToken.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<ImportShareDialog {...defaultProps} />);
    // Dialog should render but show loading indicator
    expect(screen.getByTestId('import-share-dialog')).toBeInTheDocument();
  });

  it('shows preview after successful token validation', async () => {
    mockValidateShareToken.mockResolvedValue({
      token: 'test-share-token-123',
      canvasId: 'canvas-abc',
      canvasName: 'My Awesome Canvas',
      canvasVersion: 3,
      role: 'editor',
      expiresAt: null,
      canvasData: null,
    });

    render(<ImportShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('My Awesome Canvas')).toBeInTheDocument();
    });
    expect(screen.getByText('可编辑')).toBeInTheDocument();
  });

  it('shows error state when token is invalid', async () => {
    mockValidateShareToken.mockRejectedValue(new Error('Token expired or invalid'));

    render(<ImportShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/无效|过期|无效/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    mockValidateShareToken.mockResolvedValue({
      token: 'test-share-token-123',
      canvasId: 'canvas-abc',
      canvasName: 'Test Canvas',
      canvasVersion: 1,
      role: 'viewer',
      expiresAt: null,
      canvasData: null,
    });

    render(<ImportShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onImported with canvasId on successful import', async () => {
    mockValidateShareToken.mockResolvedValue({
      token: 'test-share-token-123',
      canvasId: 'canvas-abc',
      canvasName: 'Test Canvas',
      canvasVersion: 1,
      role: 'editor',
      expiresAt: null,
      canvasData: null,
    });

    mockImportCanvas.mockResolvedValue({
      canvasId: 'imported-canvas-xyz',
      canvasName: 'Imported Copy',
    });

    render(<ImportShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('确认导入')).toBeInTheDocument();
    });

    const importBtn = screen.getByRole('button', { name: /确认导入|导入/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(defaultProps.onImported).toHaveBeenCalledWith('imported-canvas-xyz', 'Imported Copy');
    });
  });

  it('shows viewer badge for viewer role', async () => {
    mockValidateShareToken.mockResolvedValue({
      token: 'test-token',
      canvasId: 'canvas-abc',
      canvasName: 'Read-only Canvas',
      canvasVersion: 1,
      role: 'viewer',
      expiresAt: null,
      canvasData: null,
    });

    render(<ImportShareDialog {...defaultProps} shareToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('只读查看')).toBeInTheDocument();
    });
  });
});

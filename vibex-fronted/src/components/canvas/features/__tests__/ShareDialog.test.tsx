/**
 * ShareDialog.test.tsx — Sprint58 E4: Canvas Share Dialog Tests
 *
 * Tests the canvas/features ShareDialog (S58 E4) with mocked shareService.
 * Note: This component uses permission selectors and team mode tabs.
 * It is distinct from the S82-E3 dds/share/ShareDialog.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from '../ShareDialog';

// Mock useTranslations
vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      share: '分享',
      close: '关闭',
      permission: '分享权限',
      viewerOnly: '仅查看',
      editorAccess: '可编辑',
      disableShare: '关闭分享',
      copyLink: '复制链接',
      copied: '已复制',
      shareFailed: '分享失败',
      shareLink: '分享链接',
      shareUrl: '分享链接',
      viewerHint: '接收者仅可查看画布内容',
      editorHint: '接收者可查看并编辑画布内容',
      shareDisabled: '分享已关闭，收到的链接将无法访问此画布',
      shareToTeam: '分享给团队',
    };
    return map[key] ?? key;
  },
}));

// Mock shareUtils
vi.mock('@/lib/shareUtils', () => ({
  buildShareUrl: vi.fn((canvasId: string, token: string) =>
    `https://example.com/canvas/${canvasId}?share=${token}`
  ),
  generateShareToken: vi.fn(() => 'mock-token-from-generate'),
  copyToClipboard: vi.fn(() => Promise.resolve(true)),
}));

const defaultProps = {
  isOpen: true,
  canvasId: 'canvas-123',
  canvasName: '测试画布',
  onClose: vi.fn(),
  onSave: vi.fn(),
  onTeamShareRequest: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ShareDialog (canvas/features)', () => {
  it('isOpen=false时不渲染', () => {
    render(<ShareDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('isOpen=true时渲染dialog', () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('显示画布名称', () => {
    render(<ShareDialog {...defaultProps} canvasName="我的项目" />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();
  });

  it('点击关闭按钮调用onClose', () => {
    render(<ShareDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('share-dialog-close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层调用onClose', () => {
    render(<ShareDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  describe('Link Mode', () => {
    it('默认显示链接模式标签', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByTestId('share-mode-link')).toBeInTheDocument();
    });

    it('点击团队标签切换到团队模式', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} />);
      await user.click(screen.getByTestId('share-mode-team'));
      expect(screen.getByTestId('share-mode-team')).toBeInTheDocument();
    });

    it('权限下拉默认显示当前权限', () => {
      render(<ShareDialog {...defaultProps} currentPermission="viewer" />);
      expect(screen.getByRole('combobox')).toHaveValue('viewer');
    });

    it('切换权限到可编辑生成新token', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} currentToken={null} currentPermission="none" />);
      await user.selectOptions(screen.getByRole('combobox'), 'editor');
      // Permission changed to editor — a token should be auto-generated
      expect(screen.getByRole('combobox')).toHaveValue('editor');
    });

    it('权限关闭时隐藏分享链接', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} currentPermission="editor" currentToken="existing-token" />);
      await user.selectOptions(screen.getByRole('combobox'), 'none');
      expect(screen.queryByTestId('share-url-input')).toBeNull();
    });

    it('复制按钮调用copyToClipboard', async () => {
      const user = userEvent.setup();
      const { copyToClipboard } = await import('@/lib/shareUtils');
      render(<ShareDialog {...defaultProps} currentToken="test-token" currentPermission="viewer" />);
      await user.click(screen.getByTestId('share-copy-btn'));
      expect(copyToClipboard).toHaveBeenCalled();
    });

    it('错误时显示dismiss按钮', async () => {
      const { copyToClipboard } = await import('@/lib/shareUtils');
      vi.mocked(copyToClipboard).mockResolvedValueOnce(false);
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} currentToken="test-token" currentPermission="viewer" />);
      await user.click(screen.getByTestId('share-copy-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('share-error-dismiss')).toBeInTheDocument();
      });
    });

    it('dismiss按钮清除错误', async () => {
      const { copyToClipboard } = await import('@/lib/shareUtils');
      vi.mocked(copyToClipboard).mockResolvedValueOnce(false);
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} currentToken="test-token" currentPermission="viewer" />);
      await user.click(screen.getByTestId('share-copy-btn'));
      await waitFor(() => expect(screen.getByTestId('share-error-dismiss')).toBeInTheDocument());
      await user.click(screen.getByTestId('share-error-dismiss'));
      await waitFor(() => {
        expect(screen.queryByTestId('share-error-dismiss')).toBeNull();
      });
    });

    it('保存按钮调用onSave和onClose', () => {
      render(<ShareDialog {...defaultProps} currentToken="test-token" currentPermission="viewer" />);
      fireEvent.click(screen.getByTestId('share-save-btn'));
      expect(defaultProps.onSave).toHaveBeenCalledWith('test-token', 'viewer');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('权限关闭时保存调用onSave(null, none)', () => {
      render(<ShareDialog {...defaultProps} currentToken="test-token" currentPermission="viewer" />);
      fireEvent.click(screen.getByTestId('share-save-btn'));
      expect(defaultProps.onSave).toHaveBeenCalledWith('test-token', 'viewer');
    });
  });

  describe('Team Mode', () => {
    it('切换到团队模式显示团队分享按钮', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} />);
      await user.click(screen.getByTestId('share-mode-team'));
      expect(screen.getByTestId('share-open-team-modal')).toBeInTheDocument();
    });

    it('点击打开团队分享调用onTeamShareRequest并关闭', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} />);
      await user.click(screen.getByTestId('share-mode-team'));
      await user.click(screen.getByTestId('share-open-team-modal'));
      expect(defaultProps.onTeamShareRequest).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Footer', () => {
    it('取消按钮调用onClose', async () => {
      const user = userEvent.setup();
      render(<ShareDialog {...defaultProps} />);
      await user.click(screen.getByTestId('share-cancel-btn'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});

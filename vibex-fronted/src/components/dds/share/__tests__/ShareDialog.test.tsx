/**
 * ShareDialog.test.tsx — Sprint82 E3: Canvas Share Dialog Tests
 *
 * Tests ShareDialog component with mocked shareService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from '../ShareDialog';

// Mock useTranslations
vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => {
    return (key: string) => {
      const map: Record<string, string> = {
        share: '分享',
        close: '关闭',
        permission: '权限',
        viewer: '仅查看',
        editor: '可编辑',
        copyLink: '复制链接',
        copied: '已复制',
        revokeLink: '撤销链接',
        generateLink: '生成链接',
        teamShare: '团队分享',
        save: '保存',
        cancel: '取消',
        loading: '加载中...',
        expires: '链接有效期至',
        noExpiry: '永久有效',
        shareLink: '分享链接',
        embedPreview: '嵌入预览',
        shareFailed: '分享失败',
        noShareLink: '暂无分享链接',
        otherLinks: '其他链接',
      };
      return map[key] ?? key;
    };
  },
}));

// Mock shareService
const mockGenerateShareLink = vi.fn();
const mockRevokeShareLink = vi.fn();
const mockListShareLinks = vi.fn();
const mockCopyToClipboardShare = vi.fn();

vi.mock('@/services/shareService', () => ({
  generateShareLink: (...args: unknown[]) => mockGenerateShareLink(...args),
  revokeShareLink: (...args: unknown[]) => mockRevokeShareLink(...args),
  listShareLinks: (...args: unknown[]) => mockListShareLinks(...args),
  copyToClipboardShare: (...args: unknown[]) => mockCopyToClipboardShare(...args),
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
  mockListShareLinks.mockResolvedValue([]);
  mockGenerateShareLink.mockResolvedValue({
    token: 'test-token-12345',
    url: 'https://vibex-app.pages.dev/snapshot?canvas=canvas-123&share=test-token-12345',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  mockRevokeShareLink.mockResolvedValue(true);
  mockCopyToClipboardShare.mockResolvedValue(true);
});

describe('ShareDialog', () => {
  it('renders nothing when isOpen=false', () => {
    render(<ShareDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog when isOpen=true', () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays canvas name in header', () => {
    render(<ShareDialog {...defaultProps} canvasName="我的项目" />);
    expect(screen.getByText('我的项目')).toBeInTheDocument();
  });

  it('has a permission selector', () => {
    render(<ShareDialog {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('clicking close button calls onClose', () => {
    render(<ShareDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('share-dialog-close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking overlay calls onClose', () => {
    render(<ShareDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    // The overlay div is the dialog's parent (aria-modal creates the overlay)
    // Click the overlay part (outside the dialog box)
    fireEvent.click(dialog, { target: dialog });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "暂无分享链接" when no links exist', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('暂无分享链接')).toBeInTheDocument();
    });
  });

  it('shows generate link button when no links exist', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('生成链接')).toBeInTheDocument();
    });
  });

  it('clicking generate link creates a share link', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => {
      expect(mockGenerateShareLink).toHaveBeenCalledWith({
        canvasId: 'canvas-123',
        canvasName: '测试画布',
        role: 'viewer',
      });
    });
  });

  it('shows URL and copy button after link is generated', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => {
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: /分享链接/ })).toBeInTheDocument();
  });

  it('copy button shows "已复制" on success', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => screen.getByText('复制链接'));
    await userEvent.click(screen.getByText('复制链接'));

    await waitFor(() => {
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  it('calls onSave when save button is clicked', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => screen.getByText('保存'));
    await userEvent.click(screen.getByText('保存'));

    expect(defaultProps.onSave).toHaveBeenCalledWith('test-token-12345', 'viewer');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows revoke button after link is generated', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => {
      expect(screen.getByText('撤销链接')).toBeInTheDocument();
    });
  });

  it('clicking revoke removes the link', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => screen.getByText('撤销链接'));
    await userEvent.click(screen.getByText('撤销链接'));

    await waitFor(() => {
      expect(mockRevokeShareLink).toHaveBeenCalledWith('test-token-12345');
    });
  });

  it('permission selector changes role', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => screen.getByText('复制链接'));

    const select = screen.getByTestId('share-permission-select');
    await userEvent.selectOptions(select, 'editor');

    expect(screen.getByTestId('share-permission-select')).toHaveValue('editor');
  });

  it('shows team share button when onTeamShareRequest is provided', () => {
    render(<ShareDialog {...defaultProps} onTeamShareRequest={vi.fn()} />);
    expect(screen.getByText('团队分享')).toBeInTheDocument();
  });

  it('clicking team share calls onTeamShareRequest', async () => {
    const onTeamShareRequestMock = vi.fn();
    render(<ShareDialog {...defaultProps} onTeamShareRequest={onTeamShareRequestMock} />);
    await userEvent.click(screen.getByText('团队分享'));
    expect(onTeamShareRequestMock).toHaveBeenCalledTimes(1);
  });
  it('cancel button calls onClose', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('取消'));
    await userEvent.click(screen.getByText('取消'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('loads existing links when dialog opens', async () => {
    mockListShareLinks.mockResolvedValue([
      {
        token: 'existing-token-1',
        role: 'viewer',
        createdAt: new Date().toISOString(),
        expiresAt: null,
      },
      {
        token: 'existing-token-2',
        role: 'editor',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /分享链接/ })).toBeInTheDocument();
    });
  });

  it('shows error when generateShareLink fails', async () => {
    mockGenerateShareLink.mockRejectedValue(new Error('Network error'));
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByText('生成链接'));
    await userEvent.click(screen.getByText('生成链接'));

    await waitFor(() => {
      expect(screen.getByText('分享失败')).toBeInTheDocument();
    });
  });
});


// ============================================
// S88-E4: Embed Preview Tests
// ============================================

describe('ShareDialog E4 Embed Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Pre-populate a link so embed section appears
    mockListShareLinks.mockResolvedValue([
      {
        token: 'embed-token-123',
        canvasId: 'canvas-123',
        role: 'viewer',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    mockGenerateShareLink.mockResolvedValue({
      token: 'embed-token-123',
      url: 'https://vibex-app.pages.dev/snapshot?canvas=canvas-123&share=embed-token-123',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    mockRevokeShareLink.mockResolvedValue(true);
    mockCopyToClipboardShare.mockResolvedValue(true);
  });

  it('AC1: shows embed iframe when share link exists', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('embed-preview-iframe')).toBeInTheDocument();
    });
  });

  it('AC2: changing width updates embed iframe src', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-preview-iframe'));

    const widthInput = screen.getByTestId('embed-width-input');
    fireEvent.change(widthInput, { target: { value: '1200' } });

    const iframe = screen.getByTestId('embed-preview-iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('width=1200');
  });

  it('AC6: generated iframe code includes theme parameter', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-code-textarea'));

    const textarea = screen.getByTestId('embed-code-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('theme=');
  });

  it('AC3: copy embed code button triggers clipboard copy', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-copy-btn'));

    await userEvent.click(screen.getByTestId('embed-copy-btn'));

    await waitFor(() => {
      expect(mockCopyToClipboardShare).toHaveBeenCalled();
    });
  });

  it('shows comment-only permission option', async () => {
    render(<ShareDialog {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // The comment-only option should be in the select
    const options = screen.getAllByRole('option');
    const values = options.map(o => o.getAttribute('value'));
    expect(values).toContain('comment-only');
  });

  it('changing permission to comment-only updates iframe src', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-preview-iframe'));

    const permSelect = screen.getByTestId('share-permission-select');
    await userEvent.selectOptions(permSelect, 'comment-only');

    // The permission should change (will regenerate the link)
    await waitFor(() => {
      expect(mockGenerateShareLink).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'comment-only' })
      );
    });
  });

  it('embed preview iframe has correct data-testid', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      const iframe = screen.getByTestId('embed-preview-iframe');
      expect(iframe).toHaveAttribute('title', expect.stringContaining('嵌入'));
    });
  });

  it('theme select is present in embed params', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-theme-select'));
    expect(screen.getByTestId('embed-theme-select')).toBeInTheDocument();
  });

  it('toolbar toggle is present in embed params', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-toolbar-toggle'));
    expect(screen.getByTestId('embed-toolbar-toggle')).toBeInTheDocument();
  });

  it('AC6: changing theme updates embed code textarea', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => screen.getByTestId('embed-theme-select'));

    const themeSelect = screen.getByTestId('embed-theme-select');
    await userEvent.selectOptions(themeSelect, 'dark');

    const textarea = screen.getByTestId('embed-code-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('theme=dark');
  });
});

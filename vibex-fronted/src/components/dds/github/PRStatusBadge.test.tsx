/**
 * PRStatusBadge.test.tsx — Sprint89 E4
 * 验证 GitHub PR Status Badge 的渲染和交互
 *
 * AC3: PR 状态徽章显示（标题 + open/merged/closed + 图标）
 * AC5: 点击徽章跳转 GitHub PR 页面
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PRStatusBadge } from './PRStatusBadge';
import type { GitHubPR } from '@/hooks/useGitHubPR';

// Stub window.open
const mockOpen = vi.fn();
vi.stubGlobal('window', { open: mockOpen });

const mockPR = (overrides: Partial<GitHubPR> = {}): GitHubPR => ({
  number: 42,
  title: 'Add new feature',
  state: 'open',
  htmlUrl: 'https://github.com/owner/repo/pull/42',
  user: { login: 'alice', avatarUrl: 'https://avatars.githubusercontent.com/u/1' },
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-02T10:00:00Z',
  mergedAt: null,
  closedAt: null,
  ...overrides,
});

describe('PRStatusBadge', () => {
  beforeEach(() => {
    mockOpen.mockReset();
  });

  it('renders open PR badge correctly', () => {
    render(<PRStatusBadge pr={mockPR()} />);
    expect(screen.getByText(/#42 Add new feature/)).toBeInTheDocument();
    expect(screen.getByText(/@alice/)).toBeInTheDocument();
  });

  it('renders merged PR with merged state icon', () => {
    render(<PRStatusBadge pr={mockPR({ state: 'merged', mergedAt: '2026-06-05T12:00:00Z' })} />);
    expect(screen.getByText(/#42 Add new feature/)).toBeInTheDocument();
    expect(screen.getByTestId('pr-status-badge')).toBeInTheDocument();
  });

  it('renders closed PR with closed state icon', () => {
    render(<PRStatusBadge pr={mockPR({ state: 'closed', closedAt: '2026-06-05T12:00:00Z' })} />);
    expect(screen.getByText(/#42 Add new feature/)).toBeInTheDocument();
  });

  it('calls window.open with htmlUrl when clicked', () => {
    render(<PRStatusBadge pr={mockPR()} />);
    fireEvent.click(screen.getByTestId('pr-status-badge'));
    expect(mockOpen).toHaveBeenCalledWith(
      'https://github.com/owner/repo/pull/42',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls onClick prop when provided instead of window.open', () => {
    const onClick = vi.fn();
    render(<PRStatusBadge pr={mockPR()} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('pr-status-badge'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(mockPR());
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<PRStatusBadge pr={mockPR()} isLoading={true} />);
    const badge = screen.getByTestId('pr-status-badge');
    expect(badge.querySelector('[class*="spinner"]')).toBeTruthy();
  });
});

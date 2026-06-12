/**
 * TemplateVersionHistory.test.tsx — S93-E2: Template Versioning & Fork
 *
 * Tests:
 * 1. Renders nothing when no versions and loading done (shows empty state)
 * 2. Shows loading state when loading and no versions
 * 3. Lists versions with correct metadata
 * 4. Shows "最新" badge on newest version
 * 5. Shows "已固定" badge on pinned version
 * 6. Calls onPin when pin button is clicked
 * 7. Calls onClose when close button is clicked
 * 8. Calls onRefresh when refresh button is clicked
 * 9. Shows error banner when error is present
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplateVersionHistory, type TemplateVersion } from './TemplateVersionHistory';

const TEMPLATE_ID = 'tpl-001';

const mockVersions: TemplateVersion[] = [
  {
    id: 'v2',
    templateId: TEMPLATE_ID,
    versionNumber: 2,
    description: 'Added new sections',
    snapshotJson: '{}',
    pinned: false,
    createdBy: 'user-001',
    createdAt: 1718400000,
  },
  {
    id: 'v1',
    templateId: TEMPLATE_ID,
    versionNumber: 1,
    description: 'Initial version',
    snapshotJson: '{}',
    pinned: true,
    createdBy: 'user-001',
    createdAt: 1718300000,
  },
];

describe('TemplateVersionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when loading and no versions', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={[]}
        isLoading={true}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('shows empty state when no versions and not loading', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={[]}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText('暂无版本记录')).toBeInTheDocument();
    expect(screen.getByText('保存模板后自动创建第一个版本')).toBeInTheDocument();
  });

  it('lists versions with version number and description', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Added new sections')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('Initial version')).toBeInTheDocument();
  });

  it('marks latest version with "最新" badge', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('最新')).toBeInTheDocument();
    // v2 is the latest
    const v2Badge = screen.getByText('v2').closest('[class]');
    expect(v2Badge).toBeTruthy();
  });

  it('shows "已固定" badge on pinned version', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('已固定')).toBeInTheDocument();
  });

  it('calls onPin when pin button is clicked', async () => {
    const onPin = vi.fn();
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={onPin}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Find the pin/unpin button for v1 (which is pinned, so shows "取消固定")
    const unpinButtons = screen.getAllByText('取消固定');
    expect(unpinButtons.length).toBe(1);
    fireEvent.click(unpinButtons[0]);
    expect(onPin).toHaveBeenCalledWith('v1', false);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={onClose}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '关闭版本历史' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '刷新' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows error banner when error is present', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={[]}
        isLoading={false}
        error="Failed to load versions"
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Failed to load versions')).toBeInTheDocument();
  });

  it('renders panel with correct aria-label', () => {
    render(
      <TemplateVersionHistory
        templateId={TEMPLATE_ID}
        versions={mockVersions}
        isLoading={false}
        error={null}
        onPin={vi.fn()}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByRole('complementary', { name: '模板版本历史' })).toBeInTheDocument();
  });
});

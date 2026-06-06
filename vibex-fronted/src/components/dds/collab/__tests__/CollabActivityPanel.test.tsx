/**
 * CollabActivityPanel.test.tsx
 * S67-E2: 实时协作活动流面板测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Test data
const mockActivityEntries = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Alice',
    type: 'add' as const,
    nodeId: 'n1',
    nodeName: '测试节点',
    timestamp: Date.now() - 5000,
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Bob',
    type: 'focus' as const,
    nodeId: 'n2',
    nodeName: '另一个节点',
    timestamp: Date.now() - 30000,
  },
  {
    id: '3',
    userId: 'local-user',
    userName: '我',
    type: 'edit' as const,
    nodeId: 'n3',
    timestamp: Date.now() - 60000,
  },
];

const activityLabelMock = vi.fn((type: string) => {
  const labels: Record<string, string> = {
    add: '添加了节点',
    edit: '编辑了节点',
    focus: '聚焦了节点',
    delete: '删除了节点',
    join: '加入了画布',
    leave: '离开了画布',
  };
  return labels[type] ?? type;
});

const formatActivityTimeMock = vi.fn((ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  return `${Math.floor(diff / 3600000)} 小时前`;
});

function createMockStore(entries: typeof mockActivityEntries = mockActivityEntries) {
  return {
    recentActivity: entries,
    entries,
    clearEntries: vi.fn(),
  };
}

// Dynamic import helper
let CollabActivityPanel: React.ComponentType<{
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
}>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  // Set up mock BEFORE importing the component
  vi.mock('@/lib/collaboration/activityStore', () => ({
    useActivityStore: vi.fn(),
    activityLabel: activityLabelMock,
    formatActivityTime: formatActivityTimeMock,
  }));

  const mod = await import('@/components/dds/collab/CollabActivityPanel');
  CollabActivityPanel = mod.default;
});

describe('CollabActivityPanel', () => {
  it('renders empty state when no entries', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore([]);
        return selector(createMockStore([]));
      }
    );

    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('暂无协作活动')).toBeInTheDocument();
  });

  it('renders activity entries when open', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);

    const entries = screen.getAllByRole('listitem');
    expect(entries.length).toBeGreaterThan(0);
  });

  it('renders user names and activity types', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows "你" for own activities when currentUserId matches', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(
      <CollabActivityPanel
        open={true}
        onClose={vi.fn()}
        currentUserId="local-user"
      />
    );
    expect(screen.getByText('你')).toBeInTheDocument();
  });

  it('renders entry count in footer', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/\/20 条活动/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(<CollabActivityPanel open={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /关闭活动面板/ });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', async () => {
    const { useActivityStore } = await import('@/lib/collaboration/activityStore');
    (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: ReturnType<typeof createMockStore>) => unknown) => {
        if (!selector) return createMockStore();
        return selector(createMockStore());
      }
    );

    render(<CollabActivityPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});

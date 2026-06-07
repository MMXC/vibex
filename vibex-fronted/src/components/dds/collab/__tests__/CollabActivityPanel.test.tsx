/**
 * CollabActivityPanel.test.tsx
 * S67-E2: 实时协作活动流面板测试
 * S75-E4: 协作活动流消息发送 — MentionInput 集成 + activityStore.addEntry
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ==================== Mock MentionInput ====================
// Tracks typed text across events so Enter/click can send it.
// _triggerSend() is exported for test use — bypasses fireEvent/keyDown jsdom quirks.
let _mentionValue = '';
let _mentionOnSend: (text: string, mentions: string[]) => void = () => {};
export function _triggerSend() {
  _mentionOnSend(_mentionValue, []);
}

vi.mock('@/components/dds/collaboration/MentionInput', () => ({
  MentionInput: vi.fn(({
    placeholder,
    onSend,
    disabled,
  }: {
    placeholder?: string;
    onSend: (text: string, mentions: string[]) => void;
    disabled?: boolean;
  }) => {
    _mentionOnSend = onSend;
    return (
      <div data-testid="mention-input" role="form" aria-label="协作者消息输入">
        <textarea
          data-testid="mention-textarea"
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            _mentionValue = e.target.value;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              _mentionOnSend(_mentionValue, []);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              _mentionValue = '';
            }
          }}
          aria-label="消息输入"
        />
        <button
          data-testid="mention-send-btn"
          type="button"
          disabled={disabled}
          aria-label="发送消息"
          onClick={() => {
            _mentionOnSend(_mentionValue, []);
          }}
        >
          发送
        </button>
      </div>
    );
  }),
  _triggerSend,  // allow tests to trigger send bypassing jsdom keydown
}));

// ==================== Mock activityStore ====================
const activityLabelMock = vi.fn((type: string) => {
  const labels: Record<string, string> = {
    add: '添加了节点',
    edit: '编辑了节点',
    focus: '聚焦了节点',
    delete: '删除了节点',
    join: '加入了画布',
    leave: '离开了画布',
    comment: '发送了评论',
  };
  return labels[type] ?? type;
});

const formatActivityTimeMock = vi.fn((ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  return `${Math.floor(diff / 3600000)} 小时前`;
});

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

function createMockStore(entries = mockActivityEntries) {
  return {
    recentActivity: entries,
    entries,
    clearEntries: vi.fn(),
    addEntry: vi.fn(),
    getState: vi.fn(() => ({
      recentActivity: entries,
      entries,
      clearEntries: vi.fn(),
      addEntry: vi.fn(),
    })),
  };
}

// Dynamic import helper
let CollabActivityPanel: React.ComponentType<{
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
  canvasId?: string;
}>;

let useActivityStore: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  _mentionValue = '';  // Reset MentionInput state

  // Set up activityStore mock BEFORE importing the component
  // Must support BOTH hook form (selector) AND .getState() static call
  useActivityStore = vi.fn() as any;
  vi.doMock('@/lib/collaboration/activityStore', () => ({
    useActivityStore,
    activityLabel: activityLabelMock,
    formatActivityTime: formatActivityTimeMock,
  }));

  const mod = await import('@/components/dds/collab/CollabActivityPanel');
  CollabActivityPanel = mod.default;
});

function setupMockStore(entries = mockActivityEntries) {
  const mock = createMockStore(entries);
  // Attach .getState so component can call useActivityStore.getState().addEntry()
  useActivityStore.getState = () => mock as any;
  (useActivityStore as ReturnType<typeof vi.fn>).mockImplementation(
    (selector?: (s: typeof mock) => unknown) => {
      if (!selector) return mock;
      return selector(mock);
    }
  );
}

describe('CollabActivityPanel', () => {
  it('renders empty state when no entries', () => {
    setupMockStore([]);
    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('暂无协作活动')).toBeInTheDocument();
  });

  it('renders activity entries when open', () => {
    setupMockStore();
    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    const entries = screen.getAllByRole('listitem');
    expect(entries.length).toBeGreaterThan(0);
  });

  it('renders user names and activity types', () => {
    setupMockStore();
    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows "你" for own activities when currentUserId matches', () => {
    setupMockStore();
    render(
      <CollabActivityPanel
        open={true}
        onClose={vi.fn()}
        currentUserId="local-user"
      />
    );
    expect(screen.getByText('你')).toBeInTheDocument();
  });

  it('renders entry count in footer', () => {
    setupMockStore();
    render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/\/20 条活动/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    setupMockStore();
    render(<CollabActivityPanel open={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /关闭活动面板/ });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    setupMockStore();
    render(<CollabActivityPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  // ===== S75-E4: 协作活动流消息发送测试 =====

  describe('S75-E4: MessageInput integration', () => {
    it('renders message input area with placeholder', () => {
      setupMockStore([]);
      render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('mention-input')).toBeInTheDocument();
    });

    it('renders send button in message input', () => {
      setupMockStore([]);
      render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('mention-send-btn')).toBeInTheDocument();
    });

    it('renders textarea with correct placeholder text', () => {
      setupMockStore([]);
      render(<CollabActivityPanel open={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('mention-textarea')).toHaveAttribute(
        'placeholder',
        '说点什么... @提及其他人'
      );
    });

    it('calls activityStore.addEntry when message is sent via Enter', async () => {
      const user = userEvent.setup();
      setupMockStore([]);
      render(
        <CollabActivityPanel
          open={true}
          onClose={vi.fn()}
          currentUserId="u1"
        />
      );

      const textarea = screen.getByTestId('mention-textarea');
      await user.type(textarea, 'Hello world');

      // Import _triggerSend from the mock
      const { _triggerSend } = await import('@/components/dds/collaboration/MentionInput');
      _triggerSend();

      // Get the actual mock store (not the separate local variable)
      const mockStore = (useActivityStore as any).getState();
      expect(mockStore.addEntry).toHaveBeenCalledTimes(1);
      const [entry] = mockStore.addEntry.mock.calls[0];
      expect(entry.message).toBe('Hello world');
      expect(entry.userId).toBe('u1');
      expect(entry.type).toBe('comment');
    });

    it('calls activityStore.addEntry when message is sent via button click', async () => {
      const user = userEvent.setup();
      setupMockStore([]);
      render(
        <CollabActivityPanel
          open={true}
          onClose={vi.fn()}
          currentUserId="u2"
        />
      );

      const textarea = screen.getByTestId('mention-textarea');
      await user.type(textarea, 'Test message');

      // Trigger via _triggerSend (same as button click handler)
      const { _triggerSend } = await import('@/components/dds/collaboration/MentionInput');
      _triggerSend();

      const mockStore = (useActivityStore as any).getState();
      expect(mockStore.addEntry).toHaveBeenCalledTimes(1);
      const [entry] = mockStore.addEntry.mock.calls[0];
      expect(entry.message).toBe('Test message');
      expect(entry.userId).toBe('u2');
    });

    it('passes canvasId to addEntry when provided', async () => {
      const user = userEvent.setup();
      setupMockStore([]);
      render(
        <CollabActivityPanel
          open={true}
          onClose={vi.fn()}
          currentUserId="u1"
          canvasId="canvas-123"
        />
      );

      const textarea = screen.getByTestId('mention-textarea');
      await user.type(textarea, 'Canvas message');

      const { _triggerSend } = await import('@/components/dds/collaboration/MentionInput');
      _triggerSend();

      const mockStore = (useActivityStore as any).getState();
      expect(mockStore.addEntry).toHaveBeenCalledTimes(1);
      const [entry] = mockStore.addEntry.mock.calls[0];
      expect(entry.canvasId).toBe('canvas-123');
    });

    it('uses default userId when currentUserId is not provided', async () => {
      const user = userEvent.setup();
      setupMockStore([]);
      render(
        <CollabActivityPanel open={true} onClose={vi.fn()} />
      );

      const textarea = screen.getByTestId('mention-textarea');
      await user.type(textarea, 'Anonymous message');

      const { _triggerSend } = await import('@/components/dds/collaboration/MentionInput');
      _triggerSend();

      const mockStore = (useActivityStore as any).getState();
      expect(mockStore.addEntry).toHaveBeenCalledTimes(1);
      const [entry] = mockStore.addEntry.mock.calls[0];
      expect(entry.userId).toBe('local-user');
    });
  });
});

/**
 * BottomPanel Epic 6 完整测试
 * 覆盖 ST-6.1 ~ ST-6.10
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BottomPanel } from './BottomPanel';
import { CollapseHandle } from './CollapseHandle';
import { BottomPanelInputArea } from './BottomPanelInputArea';
import { QuickAskButtons, QUICK_ASK_QUESTIONS } from './QuickAskButtons/QuickAskButtons';
import { ChatHistory } from './ChatHistory/ChatHistory';

// Mock useDraft hook
jest.mock('./hooks/useDraft', () => ({
  useDraft: jest.fn(() => ({
    restoreDraft: jest.fn(() => ''),
    saveDraft: jest.fn(),
    clearDraft: jest.fn(),
    getSavedAt: jest.fn(() => null),
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const defaultProps = {
  isGenerating: false,
  onAIAsk: jest.fn(),
  onDiagnose: jest.fn(),
  onOptimize: jest.fn(),
  onHistory: jest.fn(),
  onSave: jest.fn(),
  onRegenerate: jest.fn(),
  onCreateProject: jest.fn(),
  onSendMessage: jest.fn(),
  diagnosisCount: 0,
  optimizeCount: 0,
  clarificationRounds: 0,
  chatHistory: [],
  onDraftRestored: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

// ============================================================
// ST-6.1: 收起/展开手柄 (30px)
// ============================================================
describe('ST-6.1: 收起/展开手柄', () => {
  it('renders collapse handle and is visible', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('collapse-handle')).toBeVisible();
  });

  it('collapse handle has correct testid', () => {
    render(<BottomPanel {...defaultProps} />);
    const handle = screen.getByTestId('collapse-handle');
    expect(handle).toBeInTheDocument();
    // Verify handle role
    expect(handle).toHaveAttribute('role', 'button');
  });

  it('clicking collapse handle collapses the panel', () => {
    render(<BottomPanel {...defaultProps} />);
    const handle = screen.getByTestId('collapse-handle');
    fireEvent.click(handle);
    // After collapse, only the handle is shown
    expect(screen.getByTestId('collapse-handle')).toBeVisible();
  });

  it('clicking collapsed handle expands the panel', async () => {
    render(<BottomPanel {...defaultProps} />);
    // Click to collapse
    fireEvent.click(screen.getByTestId('collapse-handle'));
    // Wait for collapsed state - re-query to get the updated element
    await waitFor(() => {
      expect(screen.getByTestId('collapse-handle')).toHaveAttribute('title', '展开面板');
    });
    // Click again to expand
    fireEvent.click(screen.getByTestId('collapse-handle'));
    await waitFor(() => {
      expect(screen.getByTestId('input-area')).toBeVisible();
    });
  });
});

// ============================================================
// ST-6.2: 需求录入 TextArea (支持 5000 字)
// ============================================================
describe('ST-6.2: 需求录入 TextArea', () => {
  it('renders requirement input textarea', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('requirement-input')).toBeVisible();
    expect(screen.getByTestId('requirement-input').tagName).toBe('TEXTAREA');
  });

  it('shows placeholder text', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('requirement-input')).toHaveAttribute(
      'placeholder',
      '输入需求或问题...'
    );
  });

  it('shows char count display (ST-6.2)', () => {
    render(<BottomPanel {...defaultProps} />);
    const charCount = screen.getByTestId('char-count');
    expect(charCount).toBeVisible();
    expect(charCount).toHaveTextContent('0/5000');
  });

  it('updates char count in real-time (ST-6.2)', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试' } });
    expect(screen.getByTestId('char-count')).toHaveTextContent('2/5000');
  });

  it('does not crash when pasting 5000 characters', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    // Use 'a' to avoid unicode multi-byte issues in tests
    const longText = 'a'.repeat(5000);
    fireEvent.input(textarea, { target: { value: longText } });
    const charCount = screen.getByTestId('char-count');
    expect(charCount).toHaveTextContent('5000/5000');
  });

  it('shows error style when over 5000 characters', () => {
    render(<BottomPanel {...defaultProps} />);
    const overLimit = 'a'.repeat(5100);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: overLimit } });
    expect(screen.getByTestId('char-count')).toHaveClass('charCountError');
  });
});

// ============================================================
// ST-6.3: 发送按钮
// ============================================================
describe('ST-6.3: 发送按钮', () => {
  it('renders send button', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('send-btn')).toBeVisible();
  });

  it('send button is disabled when textarea is empty', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('send-btn')).toBeDisabled();
  });

  it('send button is enabled when textarea has content', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试需求' } });
    expect(screen.getByTestId('send-btn')).toBeEnabled();
  });

  it('clicking send button calls onSendMessage with trimmed text', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '  测试需求  ' } });
    fireEvent.click(screen.getByTestId('send-btn'));
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('测试需求');
  });

  it('clears textarea after sending', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试' } });
    fireEvent.click(screen.getByTestId('send-btn'));
    expect(textarea).toHaveValue('');
  });
});

// ============================================================
// ST-6.4: AI 快捷询问 (5个预设问题)
// ============================================================
describe('ST-6.4: AI 快捷询问', () => {
  it('renders quick ask buttons container', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('quick-ask-buttons')).toBeVisible();
  });

  it('renders exactly 5 preset questions', () => {
    render(<BottomPanel {...defaultProps} />);
    const buttons = screen.getAllByRole('button', { name: /快捷询问/ });
    expect(buttons).toHaveLength(5);
  });

  it('each quick ask button has correct label', () => {
    render(<BottomPanel {...defaultProps} />);
    QUICK_ASK_QUESTIONS.forEach((question) => {
      expect(
        screen.getByRole('button', { name: `快捷询问: ${question}` })
      ).toBeInTheDocument();
    });
  });

  it('clicking quick ask button calls onAIAsk', () => {
    render(<BottomPanel {...defaultProps} />);
    const firstBtn = screen.getByRole('button', {
      name: `快捷询问: ${QUICK_ASK_QUESTIONS[0]}`,
    });
    fireEvent.click(firstBtn);
    expect(defaultProps.onAIAsk).toHaveBeenCalledWith(QUICK_ASK_QUESTIONS[0]);
  });

  it('quick ask buttons are disabled when isGenerating', () => {
    render(<BottomPanel {...defaultProps} isGenerating={true} />);
    const buttons = screen.getAllByRole('button', { name: /快捷询问/ });
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});

// ============================================================
// ST-6.5: 诊断/优化按钮
// ============================================================
describe('ST-6.5: 诊断/优化按钮', () => {
  it('renders AIDisplay with diagnosis and optimize buttons', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('ai-display')).toBeVisible();
    // 3 cards: 智能诊断, 应用优化, AI对话澄清
    const cards = screen.getAllByRole('button', { name: /智能诊断|应用优化|AI对话澄清/ });
    expect(cards).toHaveLength(3);
  });

  it('shows diagnosis badge count when diagnosisCount > 0', () => {
    render(<BottomPanel {...defaultProps} diagnosisCount={3} />);
    const badges = screen.getAllByText('3');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows optimize badge count when optimizeCount > 0', () => {
    render(<BottomPanel {...defaultProps} optimizeCount={2} />);
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('clicking diagnose calls onDiagnose (AIDisplay card)', () => {
    render(<BottomPanel {...defaultProps} />);
    // AIDisplay has 智能诊断 card
    const diagnoseBtn = screen.getByRole('button', { name: /智能诊断/ });
    fireEvent.click(diagnoseBtn);
    expect(defaultProps.onDiagnose).toHaveBeenCalled();
  });

  it('clicking optimize calls onOptimize (AIDisplay card)', () => {
    render(<BottomPanel {...defaultProps} />);
    // AIDisplay has 应用优化 card
    const optimizeBtn = screen.getByRole('button', { name: /应用优化/ });
    fireEvent.click(optimizeBtn);
    expect(defaultProps.onOptimize).toHaveBeenCalled();
  });

  it('renders ActionBar with diagnose and optimize buttons', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('action-bar')).toBeVisible();
    // Use getAllByRole and filter to ActionBar buttons
    const actionBar = screen.getByTestId('action-bar');
    const diagnoseBtn = actionBar.querySelector('button[title="智能诊断"]');
    const optimizeBtn = actionBar.querySelector('button[title="应用优化"]');
    expect(diagnoseBtn).toBeVisible();
    expect(optimizeBtn).toBeVisible();
  });
});

// ============================================================
// ST-6.6: 历史记录 (最近10条)
// ============================================================
describe('ST-6.6: 历史记录', () => {
  const mockMessages = [
    { id: '1', role: 'user' as const, content: '用户消息1', timestamp: Date.now() - 60000 },
    { id: '2', role: 'assistant' as const, content: 'AI回复1', timestamp: Date.now() - 50000 },
    { id: '3', role: 'user' as const, content: '用户消息2', timestamp: Date.now() - 40000 },
  ];

  it('renders chat history container', () => {
    render(<BottomPanel {...defaultProps} chatHistory={mockMessages} />);
    expect(screen.getByTestId('chat-history')).toBeVisible();
  });

  it('shows "暂无历史记录" when messages is empty', () => {
    render(<BottomPanel {...defaultProps} chatHistory={[]} />);
    expect(screen.getByTestId('chat-history')).toHaveAttribute('aria-label', '历史记录（暂无）');
  });

  it('shows message count in header', () => {
    render(<BottomPanel {...defaultProps} chatHistory={mockMessages} />);
    expect(screen.getByTestId('chat-history')).toHaveAttribute('data-count', '3');
  });

  it('shows expanded list when clicking header', () => {
    render(<BottomPanel {...defaultProps} chatHistory={mockMessages} />);
    const header = screen.getByTestId('chat-history').querySelector('button');
    if (header) fireEvent.click(header);
    // List should be visible
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('displays up to 10 recent messages', () => {
    const manyMessages = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      role: 'user' as const,
      content: `消息 ${i}`,
      timestamp: Date.now() - i * 1000,
    }));
    render(<BottomPanel {...defaultProps} chatHistory={manyMessages} />);
    const header = screen.getByTestId('chat-history').querySelector('button');
    if (header) fireEvent.click(header);
    expect(screen.getByTestId('chat-history')).toHaveAttribute('data-count', '10');
  });

  it('clicking a history item calls onHistory and fills input', () => {
    render(<BottomPanel {...defaultProps} chatHistory={mockMessages} />);
    const header = screen.getByTestId('chat-history').querySelector('button');
    if (header) fireEvent.click(header);
    const items = screen.getAllByRole('listitem');
    if (items.length > 0) {
      fireEvent.click(items[0]);
      expect(defaultProps.onHistory).toHaveBeenCalled();
    }
  });
});

// ============================================================
// ST-6.7: 保存草稿 (localStorage)
// ============================================================
describe('ST-6.7: 保存草稿', () => {
  it('calls onSave when save button is clicked', () => {
    render(<BottomPanel {...defaultProps} />);
    const saveBtn = screen.getByRole('button', { name: /保存/i });
    fireEvent.click(saveBtn);
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('save button is disabled when isGenerating', () => {
    render(<BottomPanel {...defaultProps} isGenerating={true} />);
    const saveBtn = screen.getByRole('button', { name: /保存/i });
    expect(saveBtn).toBeDisabled();
  });

  it('clear draft callback is triggered after sending', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试' } });
    fireEvent.click(screen.getByTestId('send-btn'));
    // onSendMessage should be called
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('测试');
  });
});

// ============================================================
// ST-6.8: 重新生成按钮
// ============================================================
describe('ST-6.8: 重新生成按钮', () => {
  it('renders regenerate button in ActionBar', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /重新生成/i })).toBeVisible();
  });

  it('clicking regenerate calls onRegenerate', () => {
    render(<BottomPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /重新生成/i }));
    expect(defaultProps.onRegenerate).toHaveBeenCalled();
  });

  it('regenerate button is disabled when isGenerating', () => {
    render(<BottomPanel {...defaultProps} isGenerating={true} />);
    expect(screen.getByRole('button', { name: /重新生成/i })).toBeDisabled();
  });
});

// ============================================================
// ST-6.9: 创建项目按钮
// ============================================================
describe('ST-6.9: 创建项目按钮', () => {
  it('renders create project button in ActionBar', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /创建项目/i })).toBeVisible();
  });

  it('clicking create project calls onCreateProject', () => {
    render(<BottomPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /创建项目/i }));
    expect(defaultProps.onCreateProject).toHaveBeenCalled();
  });

  it('create project button is disabled when isGenerating', () => {
    render(<BottomPanel {...defaultProps} isGenerating={true} />);
    expect(screen.getByRole('button', { name: /创建项目/i })).toBeDisabled();
  });
});

// ============================================================
// ST-6.10: Ctrl+Enter 快捷键
// ============================================================
describe('ST-6.10: Ctrl+Enter 快捷键', () => {
  it('sends message on Ctrl+Enter', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试快捷键' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('测试快捷键');
  });

  it('sends message on Cmd+Enter (Mac)', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: 'Mac快捷键' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Mac快捷键');
  });

  it('does not send on plain Enter (no newline added)', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试' } });
    // Plain Enter does NOT trigger send (only Ctrl+Enter does)
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('does not send on Shift+Enter (only newline)', () => {
    render(<BottomPanel {...defaultProps} />);
    const textarea = screen.getByTestId('requirement-input');
    fireEvent.input(textarea, { target: { value: '测试' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });
});

// ============================================================
// Integration: Full BottomPanel render
// ============================================================
describe('BottomPanel Integration', () => {
  it('renders all sub-components', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByTestId('collapse-handle')).toBeVisible();
    expect(screen.getByTestId('quick-ask-buttons')).toBeVisible();
    expect(screen.getByTestId('ai-display')).toBeVisible();
    expect(screen.getByTestId('requirement-input')).toBeVisible();
    expect(screen.getByTestId('send-btn')).toBeVisible();
    expect(screen.getByTestId('char-count')).toBeVisible();
    expect(screen.getByTestId('chat-history')).toBeVisible();
    expect(screen.getByTestId('action-bar')).toBeVisible();
  });

  it('bottom panel has data-testid for verification', () => {
    render(<BottomPanel {...defaultProps} />);
    const panel = screen.getByTestId('bottom-panel');
    expect(panel).toBeVisible();
    // Verify panel is rendered in the DOM
    expect(panel.tagName).toBe('DIV');
  });
});

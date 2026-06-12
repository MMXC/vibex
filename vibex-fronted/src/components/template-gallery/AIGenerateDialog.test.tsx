/**
 * AIGenerateDialog.test — S91 E1
 * Vitest tests for AIGenerateDialog component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AIGenerateDialog } from './AIGenerateDialog';

vi.mock('@/stores/aiGenerateStore', () => {
  const fn = vi.fn();
  return {
    useAIGenerateStore: vi.fn(() => ({
      dialogOpen: false,
      openDialog: fn,
      closeDialog: fn,
      activeJob: null,
      setActiveJob: fn,
      history: [],
      setHistory: fn,
      addToHistory: fn,
      isGenerating: false,
      setGenerating: fn,
      error: null,
      setError: fn,
      reset: fn,
    })),
    pollJobUntilDone: fn(),
  };
});

describe('AIGenerateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when open=false', () => {
    render(<AIGenerateDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and textarea when open=true', () => {
    render(<AIGenerateDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByText('✨ AI 生成模板')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入页面描述...')).toBeInTheDocument();
  });

  it('disables generate button when prompt is too short', () => {
    render(<AIGenerateDialog open={true} onClose={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /开始生成/ });
    expect(btn).toBeDisabled();
  });

  it('enables generate button when prompt is sufficient', async () => {
    render(<AIGenerateDialog open={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText('输入页面描述...');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'an ecommerce landing page' } });
    });
    const btn = screen.getByRole('button', { name: /开始生成/ });
    expect(btn).not.toBeDisabled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<AIGenerateDialog open={true} onClose={onClose} />);
    const overlay = screen.getByRole('dialog');
    await act(async () => {
      fireEvent.click(overlay);
    });
    expect(onClose).toHaveBeenCalled();
  });
});

/**
 * TagSelector.test.tsx — S83-E4: Template Tag System
 * Tests for TagSelector multi-select component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagSelector } from '../TagSelector';

// Stable mock — vi.hoisted ensures this is evaluated before vi.mock factory runs
const { mockTags } = vi.hoisted(() => {
  const mockTags = [
    { value: 'flow', label: '流程图', color: '#3b82f6' },
    { value: 'mindmap', label: '思维导图', color: '#8b5cf6' },
    { value: 'swot', label: 'SWOT', color: '#10b981' },
    { value: 'analysis', label: '分析', color: '#f59e0b' },
  ];
  return { mockTags };
});

vi.mock('@/data/templates', () => ({
  TEMPLATE_USE_CASE_TAGS: mockTags,
}));

vi.mock('@/stores/templateStore', () => ({
  useTemplateStore: vi.fn(() => ({})),
}));

const mockOnChange = vi.fn();

describe('TagSelector', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders placeholder when no tags selected', () => {
    render(<TagSelector selected={[]} onChange={mockOnChange} />);
    expect(screen.getByText('选择或创建标签...')).toBeInTheDocument();
  });

  it('renders selected tag labels', () => {
    render(<TagSelector selected={['flow', 'mindmap']} onChange={mockOnChange} />);
    expect(screen.getByText('流程图')).toBeInTheDocument();
    expect(screen.getByText('思维导图')).toBeInTheDocument();
  });

  it('shows +N badge when more than 3 tags selected', () => {
    render(<TagSelector selected={['flow', 'mindmap', 'swot', 'analysis']} onChange={mockOnChange} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('opens dropdown on trigger click', async () => {
    const user = userEvent.setup();
    render(<TagSelector selected={[]} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /标签选择器/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('calls onChange when tag option is clicked', async () => {
    const user = userEvent.setup();
    render(<TagSelector selected={[]} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /标签选择器/i }));
    await user.click(screen.getByRole('option', { name: /流程图/i }));
    expect(mockOnChange).toHaveBeenCalledWith(['flow']);
  });

  it('removes tag on remove button click', async () => {
    const user = userEvent.setup();
    render(<TagSelector selected={['flow']} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: '移除 flow' }));
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('toggles tag off when already selected', async () => {
    const user = userEvent.setup();
    render(<TagSelector selected={['flow', 'mindmap']} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /标签选择器/i }));
    await user.click(screen.getByRole('option', { name: /流程图/i }));
    expect(mockOnChange).toHaveBeenCalledWith(['mindmap']);
  });

  it('closes dropdown on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <TagSelector selected={[]} onChange={mockOnChange} />
        <button>Outside</button>
      </div>
    );
    await user.click(screen.getByRole('button', { name: /标签选择器/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

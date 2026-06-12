/**
 * TemplateForkButton.test.tsx — S93-E2: Template Versioning & Fork
 *
 * Tests:
 * 1. Renders the Fork button
 * 2. Shows dialog when button is clicked
 * 3. Pre-fills dialog with default name
 * 4. Pre-fills dialog with "Copy of {sourceName}"
 * 5. Calls onFork with correct name when confirmed
 * 6. Shows error message on fork failure
 * 7. Closes dialog on cancel
 * 8. Disabled state prevents clicking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TemplateForkButton } from './TemplateForkButton';

const TEMPLATE_ID = 'tpl-001';

describe('TemplateForkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Fork button', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    expect(screen.getByTestId('fork-template-btn')).toBeInTheDocument();
    expect(screen.getByText('Fork')).toBeInTheDocument();
  });

  it('shows dialog when button is clicked', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    expect(screen.getByRole('dialog', { name: 'Fork 模板' })).toBeInTheDocument();
  });

  it('pre-fills dialog with default name when no sourceName', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    const input = screen.getByLabelText('名称') as HTMLInputElement;
    expect(input.value).toBe('My Fork');
  });

  it('pre-fills dialog with "Copy of {sourceName}" when sourceName provided', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        sourceName="Design Template"
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    const input = screen.getByLabelText('名称') as HTMLInputElement;
    expect(input.value).toBe('Copy of Design Template');
  });

  it('calls onFork with correct name when confirmed', async () => {
    const onFork = vi.fn().mockResolvedValue(undefined);
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        sourceName="Design Template"
        onFork={onFork}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    const input = screen.getByLabelText('名称') as HTMLInputElement;

    // Clear and enter a custom name
    fireEvent.change(input, { target: { value: 'My Custom Fork' } });

    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));

    // Should call with the trimmed name
    expect(onFork).toHaveBeenCalledWith('My Custom Fork');
  });

  it('shows error message on fork failure', async () => {
    const onFork = vi.fn().mockRejectedValue(new Error('Server error'));
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={onFork}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    fireEvent.click(screen.getByRole('button', { name: 'Fork' }));

    // Wait for the error to appear
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByText('Server error')).toBeInTheDocument();

    // Dialog should still be open
    expect(screen.getByRole('dialog', { name: 'Fork 模板' })).toBeInTheDocument();
  });

  it('closes dialog on cancel', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    expect(screen.getByRole('dialog', { name: 'Fork 模板' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByRole('dialog', { name: 'Fork 模板' })).not.toBeInTheDocument();
  });

  it('disabled button prevents opening dialog', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    expect(screen.queryByRole('dialog', { name: 'Fork 模板' })).not.toBeInTheDocument();
  });

  it('closes dialog on backdrop click', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    expect(screen.getByRole('dialog', { name: 'Fork 模板' })).toBeInTheDocument();

    // Click the overlay backdrop
    fireEvent.click(screen.getByTestId('fork-dialog-overlay'));

    expect(screen.queryByRole('dialog', { name: 'Fork 模板' })).not.toBeInTheDocument();
  });

  it('disables confirm button when name is empty', () => {
    render(
      <TemplateForkButton
        templateId={TEMPLATE_ID}
        onFork={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('fork-template-btn'));
    const input = screen.getByLabelText('名称') as HTMLInputElement;

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });

    const confirmBtn = screen.getByRole('button', { name: 'Fork' }) as HTMLButtonElement;
    expect(confirmBtn).toBeDisabled();
  });
});

/**
 * SaveIndicator — Tests (Jest)
 * E3-S2: 视觉反馈指示器测试
 */
// @ts-nocheck

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SaveIndicator } from '../SaveIndicator'

describe('SaveIndicator', () => {
  it('returns null when idle with no lastSavedAt', () => {
    const { container } = render(
      <SaveIndicator status="idle" lastSavedAt={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows saved indicator with lastSavedAt when idle', () => {
    const lastSaved = new Date()
    const { container } = render(
      <SaveIndicator status="idle" lastSavedAt={lastSaved} />
    )
    expect(container.textContent).toContain('已保存')
  })

  it('shows saving indicator when status is saving', () => {
    render(<SaveIndicator status="saving" lastSavedAt={null} />)
    expect(screen.getByText('保存中...')).toBeInTheDocument()
  })

  it('shows saved indicator when status is saved', () => {
    render(<SaveIndicator status="saved" lastSavedAt={null} />)
    expect(screen.getByText('已保存')).toBeInTheDocument()
  })

  it('shows error indicator when status is error', () => {
    render(<SaveIndicator status="error" lastSavedAt={null} />)
    expect(screen.getByText('保存失败')).toBeInTheDocument()
  })

  it('shows retry button on error when onSaveNow provided', () => {
    const onSaveNow = jest.fn()
    render(<SaveIndicator status="error" lastSavedAt={null} onSaveNow={onSaveNow} />)
    expect(screen.getByText('重试')).toBeInTheDocument()
  })

  it('has correct ARIA attributes for accessibility', () => {
    render(<SaveIndicator status="saving" lastSavedAt={null} />)
    const indicator = screen.getByRole('status')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveAttribute('aria-live', 'polite')
  })
})

// @ts-nocheck
'use client';

/**
 * ExportMenu — Component tests
 * F3-F9: 导出 PNG/SVG
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from '../ExportMenu';

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
  toSvg: jest.fn().mockResolvedValue('data:image/svg+xml;base64,mock'),
}));

// Mock canvas export hook
const mockExportCanvas = jest.fn().mockResolvedValue(undefined);
jest.mock('@/hooks/canvas/useCanvasExport', () => ({
  useCanvasExport: jest.fn(() => ({
    exportCanvas: mockExportCanvas,
    isExporting: false,
    error: null,
    cancelExport: jest.fn(),
  })),
}));

describe('ExportMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render export trigger button', () => {
    render(<ExportMenu />);
    expect(screen.getByTestId('export-menu-trigger')).toBeInTheDocument();
  });

  it('should open dropdown on click', () => {
    render(<ExportMenu />);
    fireEvent.click(screen.getByTestId('export-menu-trigger'));
    expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();
  });

  it('should have PNG and SVG export buttons', () => {
    render(<ExportMenu />);
    fireEvent.click(screen.getByTestId('export-menu-trigger'));
    expect(screen.getByTestId('export-png-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-svg-btn')).toBeInTheDocument();
  });

  it('should call exportCanvas with PNG when PNG button clicked', async () => {
    render(<ExportMenu />);
    fireEvent.click(screen.getByTestId('export-menu-trigger'));
    fireEvent.click(screen.getByTestId('export-png-btn'));

    expect(mockExportCanvas).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'png', scope: 'all' })
    );
  });

  it('should call exportCanvas with SVG when SVG button clicked', async () => {
    render(<ExportMenu />);
    fireEvent.click(screen.getByTestId('export-menu-trigger'));
    fireEvent.click(screen.getByTestId('export-svg-btn'));

    expect(mockExportCanvas).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'svg', scope: 'all' })
    );
  });

  it('should allow changing export scope', () => {
    render(<ExportMenu />);
    fireEvent.click(screen.getByTestId('export-menu-trigger'));

    // Select "context" scope
    const contextRadio = screen.getByRole('radio', { name: /上下文树/i });
    fireEvent.click(contextRadio);

    fireEvent.click(screen.getByTestId('export-png-btn'));
    expect(mockExportCanvas).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'png', scope: 'context' })
    );
  });
});

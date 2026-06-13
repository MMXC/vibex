/**
 * ExportProfilePanel.test.tsx — Vitest Tests
 * S95-E4: Export Profile Templates
 *
 * Tests ExportProfilePanel as rendered inside CanvasSettingsDrawer:
 * - Reads canvasId from DDSCanvasStore
 * - Calls openPanel(canvasId) + loadProfiles(canvasId) on mount
 * - Shows profile list, create form, scale/format toggles
 * - createProfile(canvasId) on form submit
 * - deleteProfile(canvasId, profileId) on card delete
 *
 * NOTE: Tests use Chinese text matching the actual panel implementation.
 * CSS module classes are hashed in test env — use aria attributes instead of class checks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExportProfilePanel } from '../export/ExportProfilePanel';

// vi.hoisted — stable mock refs before vi.mock hoisting
const mockOpenPanel = vi.fn().mockResolvedValue(undefined);
const mockLoadProfiles = vi.fn().mockResolvedValue(undefined);
const mockCreateProfile = vi.fn().mockResolvedValue(undefined);
const mockDeleteProfile = vi.fn().mockResolvedValue(undefined);
const mockSetFormName = vi.fn();
const mockSetFormFormat = vi.fn();
const mockSetFormScale = vi.fn();
const mockSetFormIncludeNodes = vi.fn();
const mockSetFormIncludeEdges = vi.fn();
const mockClosePanel = vi.fn();

const mockUseExportProfileStore = vi.hoisted(() =>
  vi.fn<(selector?: (s: ReturnType<typeof createDefaultState>) => unknown) => ReturnType<typeof createDefaultState>>()
);

function createDefaultState(overrides = {}) {
  return {
    // Panel reads isOpen to decide whether to render
    isOpen: true,
    currentCanvasId: 'canvas-abc',
    profiles: [] as Array<{
      id: string;
      canvasId: string;
      name: string;
      format: 'react' | 'svg' | 'md' | 'json';
      scale: number;
      includeNodes: boolean;
      includeEdges: boolean;
      createdAt: string;
      updatedAt: string;
    }>,
    isLoading: false,
    error: null as string | null,
    formName: '',
    formFormat: 'react' as const,
    formScale: 100,  // matches SCALES = [25, 50, 100, 150, 200]
    formIncludeNodes: true,
    formIncludeEdges: true,
    openPanel: mockOpenPanel,
    closePanel: mockClosePanel,
    loadProfiles: mockLoadProfiles,
    createProfile: mockCreateProfile,
    deleteProfile: mockDeleteProfile,
    setFormName: mockSetFormName,
    setFormFormat: mockSetFormFormat,
    setFormScale: mockSetFormScale,
    setFormIncludeNodes: mockSetFormIncludeNodes,
    setFormIncludeEdges: mockSetFormIncludeEdges,
    ...overrides,
  };
}

// Mock DDSCanvasStore to return a fixed projectId
vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn(() => ({
    projectId: 'canvas-abc',
  })),
}));

vi.mock('@/stores/exportProfileStore', () => ({
  useExportProfileStore: mockUseExportProfileStore,
}));

function renderWithState(overrides = {}) {
  mockUseExportProfileStore.mockImplementation(
    (selector?: (s: ReturnType<typeof createDefaultState>) => unknown) => {
      const state = createDefaultState(overrides);
      if (typeof selector === 'function') return selector(state);
      return state;
    }
  );
  return render(<ExportProfilePanel canvasId="canvas-abc" />);
}

describe('ExportProfilePanel — S95-E4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateProfile.mockResolvedValue(undefined);
    mockDeleteProfile.mockResolvedValue(undefined);
    mockOpenPanel.mockResolvedValue(undefined);
    mockLoadProfiles.mockResolvedValue(undefined);
  });

  // ============================================================
  // 1. Mount — calls openPanel + loadProfiles
  // ============================================================
  it('calls openPanel(canvasId) on mount', () => {
    renderWithState();
    expect(mockOpenPanel).toHaveBeenCalledWith('canvas-abc');
  });

  // ============================================================
  // 2. Empty state (Chinese text)
  // ============================================================
  it('shows empty state when no profiles exist', () => {
    renderWithState({ profiles: [], isLoading: false, error: null });
    expect(screen.getByText('暂无保存的模板')).toBeInTheDocument();
    expect(screen.getByText('在下方创建一个模板以保存导出配置')).toBeInTheDocument();
  });

  // ============================================================
  // 3. Loading state (Chinese text)
  // ============================================================
  it('shows loading state when isLoading=true', () => {
    renderWithState({ isLoading: true, profiles: [] });
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  // ============================================================
  // 4. Error banner
  // ============================================================
  it('shows error banner when error is set', () => {
    renderWithState({ error: 'Failed to load profiles', isLoading: false });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load profiles')).toBeInTheDocument();
  });

  // ============================================================
  // 5. Profile list — correct data
  // ============================================================
  it('renders profile cards with format badge, scale, and delete button', () => {
    renderWithState({
      profiles: [
        {
          id: 'prof-001',
          canvasId: 'canvas-abc',
          name: 'React Standard',
          format: 'react',
          scale: 100,
          includeNodes: true,
          includeEdges: true,
          createdAt: '2026-06-13T10:00:00Z',
          updatedAt: '2026-06-13T10:00:00Z',
        },
        {
          id: 'prof-002',
          canvasId: 'canvas-abc',
          name: 'SVG Light',
          format: 'svg',
          scale: 75,
          includeNodes: false,
          includeEdges: true,
          createdAt: '2026-06-13T11:00:00Z',
          updatedAt: '2026-06-13T11:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    });

    expect(screen.getByText('React Standard')).toBeInTheDocument();
    expect(screen.getByText('SVG Light')).toBeInTheDocument();
    // Format labels in panel: both format buttons AND profile cards show FORMAT_LABELS
    expect(screen.getAllByText('React')).toHaveLength(2); // format btn + card badge
    expect(screen.getAllByText('SVG')).toHaveLength(2); // format btn + card badge
    // Scale display: {profile.scale}% — scale 100 appears twice (button + card), scale 75 only on card
    expect(screen.getAllByText('100%')).toHaveLength(2); // 100% button + 100% card badge
    expect(screen.getByText('75%')).toBeInTheDocument(); // 75% card badge only (75 not in SCALES buttons)
    // Count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // ============================================================
  // 6. Profile count badge
  // ============================================================
  it('shows correct profile count badge', () => {
    renderWithState({
      profiles: [
        {
          id: 'prof-001',
          canvasId: 'canvas-abc',
          name: 'Profile One',
          format: 'react',
          scale: 100,
          includeNodes: true,
          includeEdges: true,
          createdAt: '2026-06-13T10:00:00Z',
          updatedAt: '2026-06-13T10:00:00Z',
        },
      ],
    });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // ============================================================
  // 7. Create form — name input (Chinese placeholder)
  // ============================================================
  it('calls setFormName on name input change', () => {
    renderWithState();
    const nameInput = screen.getByPlaceholderText('例如：高清 PNG 导出');
    fireEvent.change(nameInput, { target: { value: 'My New Profile' } });
    expect(mockSetFormName).toHaveBeenCalledWith('My New Profile');
  });

  // ============================================================
  // 8. Create form — format buttons
  // ============================================================
  it('calls setFormFormat on format button click', () => {
    renderWithState();
    const svgBtn = screen.getByRole('button', { name: /SVG/i });
    fireEvent.click(svgBtn);
    expect(mockSetFormFormat).toHaveBeenCalledWith('svg');
  });

  it('highlights the selected format button via aria-pressed', () => {
    renderWithState({ formFormat: 'svg' });
    const svgBtn = screen.getByRole('button', { name: /SVG/i });
    expect(svgBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // ============================================================
  // 9. Create form — scale buttons (Chinese text: "缩放比例")
  // ============================================================
  it('calls setFormScale on scale button click', () => {
    renderWithState();
    const scale150 = screen.getByRole('button', { name: '150%' });
    fireEvent.click(scale150);
    expect(mockSetFormScale).toHaveBeenCalledWith(150);
  });

  it('highlights the selected scale button via aria-pressed', () => {
    renderWithState({ formScale: 50 });
    const scale50 = screen.getByRole('button', { name: '50%' });
    expect(scale50).toHaveAttribute('aria-pressed', 'true');
  });

  // ============================================================
  // 10. Create form — includeNodes toggle
  // ============================================================
  it('calls setFormIncludeNodes on toggle', () => {
    renderWithState({ formIncludeNodes: true });
    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]);
    expect(mockSetFormIncludeNodes).toHaveBeenCalledWith(false);
  });

  // ============================================================
  // 11. Create form — includeEdges toggle
  // ============================================================
  it('calls setFormIncludeEdges on toggle', () => {
    renderWithState({ formIncludeEdges: true });
    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[1]);
    expect(mockSetFormIncludeEdges).toHaveBeenCalledWith(false);
  });

  // ============================================================
  // 12. Submit form — createProfile (Chinese text: "保存模板")
  // ============================================================
  it('calls createProfile(canvasId) on Create Profile click', async () => {
    mockCreateProfile.mockResolvedValueOnce(undefined);
    renderWithState({ formName: 'New Profile', formFormat: 'svg', formScale: 150, formIncludeNodes: false, formIncludeEdges: true });

    const createBtn = screen.getByRole('button', { name: /保存模板/i });
    fireEvent.click(createBtn);

    expect(mockCreateProfile).toHaveBeenCalledWith('canvas-abc');
  });

  it('disables create button when name is empty', () => {
    renderWithState({ formName: '' });
    const createBtn = screen.getByRole('button', { name: /保存模板/i });
    expect(createBtn).toBeDisabled();
  });

  it('enables create button when name is filled', () => {
    renderWithState({ formName: 'Profile Name' });
    const createBtn = screen.getByRole('button', { name: /保存模板/i });
    expect(createBtn).not.toBeDisabled();
  });

  // ============================================================
  // 13. Reset button (Chinese text: "重置")
  // ============================================================
  it('calls setFormName(""), setFormFormat("react"), setFormScale(100) on Reset', () => {
    renderWithState({ formName: 'Stale', formFormat: 'svg', formScale: 150 });
    const resetBtn = screen.getByRole('button', { name: /重置/i });
    fireEvent.click(resetBtn);
    expect(mockSetFormName).toHaveBeenCalledWith('');
    expect(mockSetFormFormat).toHaveBeenCalledWith('react');
    expect(mockSetFormScale).toHaveBeenCalledWith(100);
  });

  // ============================================================
  // 14. Delete profile
  // ============================================================
  it('calls deleteProfile(canvasId, profileId) on delete click', async () => {
    mockDeleteProfile.mockResolvedValueOnce(undefined);
    renderWithState({
      profiles: [
        {
          id: 'prof-001',
          canvasId: 'canvas-abc',
          name: 'To Delete',
          format: 'react',
          scale: 100,
          includeNodes: true,
          includeEdges: true,
          createdAt: '2026-06-13T10:00:00Z',
          updatedAt: '2026-06-13T10:00:00Z',
        },
      ],
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete profile To Delete/i });
    fireEvent.click(deleteBtn);

    expect(mockDeleteProfile).toHaveBeenCalledWith('canvas-abc', 'prof-001');
  });

  // ============================================================
  // 15. No edit/update button (no updateProfile in this epic)
  // ============================================================
  it('does not show Update Profile button', () => {
    renderWithState({
      profiles: [
        {
          id: 'prof-001',
          canvasId: 'canvas-abc',
          name: 'Profile',
          format: 'react',
          scale: 100,
          includeNodes: true,
          includeEdges: true,
          createdAt: '2026-06-13T10:00:00Z',
          updatedAt: '2026-06-13T10:00:00Z',
        },
      ],
    });
    expect(screen.queryByRole('button', { name: /Update Profile/i })).not.toBeInTheDocument();
  });

  // ============================================================
  // 16. No close button (no dialog/panel in settings drawer context)
  // ============================================================
  it('does not render a close button', () => {
    renderWithState();
    // Panel is rendered without onClose prop; no close button in settings context
    expect(screen.queryByRole('button', { name: /Close/i })).not.toBeInTheDocument();
  });
});

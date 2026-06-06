/**
 * CanvasSettingsDrawer.test.tsx — Tests for S70-E5 Canvas Settings Drawer
 * DoD: 抽屉开关 + tab 切换 + ESC 关闭
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Store mocks ---
vi.mock('@/stores/dds/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      backgroundColor: '#ffffff',
      gridSize: 20,
      gridVariant: 'dots' as const,
      defaultZoom: 1,
      setBackgroundColor: vi.fn(),
      setGridSize: vi.fn(),
      setGridVariant: vi.fn(),
      setDefaultZoom: vi.fn(),
      reset: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/stores/viewPresetsStore', () => ({
  useViewPresetsStore: vi.fn((selector) => {
    const state = {
      presets: [],
      currentPresetId: null,
      savePreset: vi.fn(),
      deletePreset: vi.fn(),
      loadPreset: vi.fn(),
      getPreset: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('CanvasSettingsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows dialog title', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('画布设置');
  });

  it('renders all 4 tabs', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /预设/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /画布/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /节点/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /协作/i })).toBeInTheDocument();
  });

  it('calls onClose when ESC is pressed', async () => {
    const onClose = vi.fn();
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches to canvas tab', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    const canvasTab = screen.getByRole('tab', { name: /画布/i });
    await userEvent.setup().click(canvasTab);
    expect(screen.getByRole('tab', { name: /画布/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to collaboration tab', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    const collabTab = screen.getByRole('tab', { name: /协作/i });
    await userEvent.setup().click(collabTab);
    expect(screen.getByRole('tab', { name: /协作/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to node tab', async () => {
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={vi.fn()} />);
    const nodeTab = screen.getByRole('tab', { name: /节点/i });
    await userEvent.setup().click(nodeTab);
    expect(screen.getByRole('tab', { name: /节点/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { CanvasSettingsDrawer } = await import('@/components/dds/settings/CanvasSettingsDrawer');
    render(<CanvasSettingsDrawer isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /关闭/i });
    await userEvent.setup().click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

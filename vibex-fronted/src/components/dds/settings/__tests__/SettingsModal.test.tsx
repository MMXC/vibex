/**
 * SettingsModal.test.tsx -- E4 (Sprint80): Canvas Settings Center
 * DoD: vitest: settingsModal tab switching 5/5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SettingsModal } from '../SettingsModal';

// Mock useSettingsStore
const mockSetLastOpenedTab = vi.fn();

vi.mock('@/stores/dds/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ lastOpenedTab: null, setLastOpenedTab: mockSetLastOpenedTab });
    }
    return { lastOpenedTab: null, setLastOpenedTab: mockSetLastOpenedTab };
  }),
}));

// Mock child panels
vi.mock('@/components/dds/shortcuts/ShortcutSettingsPanel', () => ({
  ShortcutSettingsPanel: vi.fn(({ onClose }) => (
    <div data-testid="shortcut-panel">ShortcutSettingsPanel<button onClick={onClose}>close</button></div>
  )),
}));

vi.mock('@/components/dds/settings/CanvasSettingsPanel', () => ({
  CanvasSettingsPanel: vi.fn(({ isOpen, onClose }) => (
    <div data-testid="canvas-panel" hidden={!isOpen}>CanvasSettingsPanel<button onClick={onClose}>close</button></div>
  )),
}));

vi.mock('@/components/dds/notifications/NotificationPreferencesPanel', () => ({
  NotificationPreferencesPanel: vi.fn(({ isOpen, onClose }) => (
    <div data-testid="notification-panel" hidden={!isOpen}>NotificationPreferencesPanel<button onClick={onClose}>close</button></div>
  )),
}));

vi.mock('@/components/dds/settings/PerformanceSettings', () => ({
  PerformanceSettings: vi.fn(() => <div data-testid="performance-panel">PerformanceSettings</div>),
}));

describe('SettingsModal', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    mockSetLastOpenedTab.mockClear();
  });

  it('renders nothing when open=false', () => {
    render(<SettingsModal open={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with default shortcuts tab when open=true', () => {
    render(<SettingsModal open={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-shortcuts')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('shortcut-panel')).toBeInTheDocument();
  });

  it('switches to notifications tab', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={onClose} />);

    await user.click(screen.getByTestId('settings-tab-notifications'));

    expect(screen.getByTestId('settings-tab-notifications')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('settings-tabpanel-notifications')).toBeInTheDocument();
  });

  it('switches to performance tab', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={onClose} />);

    await user.click(screen.getByTestId('settings-tab-performance'));

    expect(screen.getByTestId('settings-tab-performance')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('performance-panel')).toBeInTheDocument();
  });

  it('closes via Escape key', () => {
    render(<SettingsModal open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via close button', () => {
    render(<SettingsModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('settings-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('persists lastOpenedTab on tab switch', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={onClose} />);

    await user.click(screen.getByTestId('settings-tab-performance'));
    expect(mockSetLastOpenedTab).toHaveBeenCalledWith('performance');

    await user.click(screen.getByTestId('settings-tab-notifications'));
    expect(mockSetLastOpenedTab).toHaveBeenCalledWith('notifications');
  });
});

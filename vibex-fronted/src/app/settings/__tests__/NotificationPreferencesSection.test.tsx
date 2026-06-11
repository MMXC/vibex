/**
 * NotificationPreferencesSection — S87-E1 测试
 * 验证 Settings 页面通知偏好设置区块的渲染和交互
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NotificationPreferencesSection } from '../NotificationPreferencesSection';

// Mock notificationStore
const mockGetPreference = vi.fn();
const mockSetPreference = vi.fn();
const mockResetPreferences = vi.fn();

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn((selector?) => {
    const state = {
      getPreference: mockGetPreference,
      setPreference: mockSetPreference,
      resetPreferences: mockResetPreferences,
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

const defaultPrefs: Record<string, { enabled: boolean }> = {
  inApp: { enabled: true },
  browser: { enabled: false },
  mention: { enabled: true },
  reply: { enabled: true },
  system: { enabled: true },
  info: { enabled: false },
  template_update: { enabled: true },
  comment_reply: { enabled: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPreference.mockImplementation((key: string) => defaultPrefs[key]);
  mockResetPreferences.mockReturnValue(undefined);
  mockSetPreference.mockReturnValue(undefined);
});

describe('NotificationPreferencesSection', () => {
  it('renders notification preferences section', () => {
    render(<NotificationPreferencesSection />);
    expect(screen.getByTestId('notification-preferences-section')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('renders channel toggles', () => {
    render(<NotificationPreferencesSection />);
    expect(screen.getByTestId('channel-inApp')).toBeTruthy();
    expect(screen.getByTestId('channel-browser')).toBeTruthy();
    expect(screen.getByLabelText('应用内通知')).toBeTruthy();
    expect(screen.getByLabelText('浏览器推送')).toBeTruthy();
  });

  it('renders notification type toggles', () => {
    render(<NotificationPreferencesSection />);
    expect(screen.getByTestId('type-mention')).toBeTruthy();
    expect(screen.getByTestId('type-reply')).toBeTruthy();
    expect(screen.getByTestId('type-system')).toBeTruthy();
    expect(screen.getByTestId('type-info')).toBeTruthy();
    expect(screen.getByTestId('type-template_update')).toBeTruthy();
    expect(screen.getByTestId('type-comment_reply')).toBeTruthy();
  });

  it('shows correct channel checkbox state', () => {
    render(<NotificationPreferencesSection />);
    const inAppToggle = screen.getByTestId('channel-inApp') as HTMLInputElement;
    const browserToggle = screen.getByTestId('channel-browser') as HTMLInputElement;
    expect(inAppToggle.checked).toBe(true);
    expect(browserToggle.checked).toBe(false);
  });

  it('calls setPreference when channel toggle is clicked', () => {
    render(<NotificationPreferencesSection />);
    fireEvent.click(screen.getByTestId('channel-inApp'));
    expect(mockSetPreference).toHaveBeenCalledWith('inApp', false);
  });

  it('calls setPreference when type toggle is clicked', () => {
    render(<NotificationPreferencesSection />);
    fireEvent.click(screen.getByTestId('type-mention'));
    expect(mockSetPreference).toHaveBeenCalledWith('mention', false);
  });

  it('renders reset button', () => {
    render(<NotificationPreferencesSection />);
    const resetBtn = screen.getByTestId('reset-notification-prefs');
    expect(resetBtn).toBeTruthy();
    expect(screen.getByText('恢复默认设置')).toBeTruthy();
  });

  it('calls resetPreferences when reset button is clicked and confirmed', () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<NotificationPreferencesSection />);
    fireEvent.click(screen.getByTestId('reset-notification-prefs'));
    expect(mockResetPreferences).toHaveBeenCalled();
    vi.stubGlobal('confirm', vi.fn(() => false));
  });

  it('does not call resetPreferences when reset is cancelled', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    render(<NotificationPreferencesSection />);
    fireEvent.click(screen.getByTestId('reset-notification-prefs'));
    expect(mockResetPreferences).not.toHaveBeenCalled();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('handles missing preference gracefully (defaults to true)', () => {
    mockGetPreference.mockImplementation((key: string) => undefined);
    render(<NotificationPreferencesSection />);
    const inAppToggle = screen.getByTestId('channel-inApp') as HTMLInputElement;
    expect(inAppToggle.checked).toBe(true); // undefined → defaults to true
  });
});

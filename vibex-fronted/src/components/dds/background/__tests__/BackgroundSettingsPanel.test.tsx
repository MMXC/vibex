/**
 * BackgroundSettingsPanel.test.tsx
 * S55-E4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import React from 'react';
import { BackgroundSettingsPanel } from '../BackgroundSettingsPanel';

// Shared mutable store — Zustand-like behavior
type Preset = 'dots' | 'lines' | 'cross' | 'solid' | 'custom';

interface StoreState {
  preset: Preset;
  customColor: string;
  setPreset: (preset: Preset) => void;
  setCustomColor: (color: string) => void;
  resetToDefaults: () => void;
}

let storeState = {
  preset: 'dots' as Preset,
  customColor: '#3b82f6',
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((l) => l());
};

const setPreset = (preset: Preset) => {
  storeState.preset = preset;
  notify();
};

const setCustomColor = (color: string) => {
  storeState.customColor = color;
  storeState.preset = 'custom';
  notify();
};

const resetToDefaults = () => {
  storeState.preset = 'dots';
  storeState.customColor = '#3b82f6';
  notify();
};

const useBackgroundSettingsStore = (selector?: (s: StoreState) => unknown) => {
  const state: StoreState = {
    preset: storeState.preset,
    customColor: storeState.customColor,
    setPreset,
    setCustomColor,
    resetToDefaults,
  };
  if (selector) return selector(state);
  return state;
};

vi.mock('@/stores/backgroundSettingsStore', () => ({
  useBackgroundSettingsStore: vi.fn((selector?: (s: StoreState) => unknown) => {
    const state: StoreState = {
      preset: storeState.preset,
      customColor: storeState.customColor,
      setPreset,
      setCustomColor,
      resetToDefaults,
    };
    if (selector) return selector(state);
    return state;
  }),
}));

import { useBackgroundSettingsStore as actualUse } from '@/stores/backgroundSettingsStore';
const mockUseStore = actualUse as unknown as ReturnType<typeof vi.fn>;

// Mock react-colorful
vi.mock('react-colorful', () => ({
  HexColorPicker: vi.fn(({ className }: { className?: string }) => (
    <div data-testid="hex-color-picker" className={className}>
      Color Picker Mock
    </div>
  )),
}));

describe('BackgroundSettingsPanel', () => {
  beforeEach(() => {
    cleanup();
    // Reset shared store state
    storeState = { preset: 'dots', customColor: '#3b82f6' };
    listeners.clear();
    mockUseStore.mockClear();
    mockUseStore.mockImplementation(
      (selector?: (s: StoreState) => unknown) => {
        const state: StoreState = {
          preset: storeState.preset,
          customColor: storeState.customColor,
          setPreset,
          setCustomColor,
          resetToDefaults,
        };
        if (selector) return selector(state);
        return state;
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen=false', () => {
    render(<BackgroundSettingsPanel isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen=true', () => {
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '背景设置' })).toBeInTheDocument();
    expect(screen.getByText('Background Settings')).toBeInTheDocument();
  });

  it('renders all 5 preset buttons', () => {
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('preset-dots')).toBeInTheDocument();
    expect(screen.getByTestId('preset-lines')).toBeInTheDocument();
    expect(screen.getByTestId('preset-cross')).toBeInTheDocument();
    expect(screen.getByTestId('preset-solid')).toBeInTheDocument();
    expect(screen.getByTestId('preset-custom')).toBeInTheDocument();
  });

  it('highlights the active preset', () => {
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    const dotsBtn = screen.getByTestId('preset-dots');
    expect(dotsBtn).toHaveAttribute('aria-pressed', 'true');
    const linesBtn = screen.getByTestId('preset-lines');
    expect(linesBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setPreset when preset button is clicked', async () => {
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('preset-lines'));
    });
    expect(storeState.preset).toBe('lines');
  });

  it('shows color picker when custom preset is selected', async () => {
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByTestId('hex-color-picker')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId('preset-custom'));
    });
    expect(storeState.preset).toBe('custom');
    expect(screen.getByTestId('hex-color-picker')).toBeInTheDocument();
  });

  it('renders reset button', async () => {
    const resetFn = vi.fn();
    mockUseStore.mockImplementation((selector?: (s: StoreState) => unknown) => {
      const state: StoreState = {
        preset: storeState.preset,
        customColor: storeState.customColor,
        setPreset,
        setCustomColor,
        resetToDefaults: resetFn,
      };
      if (selector) return selector(state);
      return state;
    });
    render(<BackgroundSettingsPanel isOpen={true} onClose={vi.fn()} />);
    const resetBtn = screen.getByTestId('reset-background');
    expect(resetBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(resetBtn);
    });
    expect(resetFn).toHaveBeenCalled();
  });

  it('closes when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<BackgroundSettingsPanel isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(onClose).toHaveBeenCalled();
  });
});

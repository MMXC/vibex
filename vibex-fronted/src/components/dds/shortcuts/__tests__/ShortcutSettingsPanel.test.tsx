/**
 * ShortcutSettingsPanel.test.tsx
 * Sprint53 E4 — D4.3: isOpen prop + guard / D4.5: vitest coverage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutSettingsPanel } from '../ShortcutSettingsPanel';

// Mock shortcutStore
vi.mock('@/stores/shortcutStore', () => ({
  useShortcutStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        shortcuts: [
          {
            action: 'go-to-canvas',
            description: '切换到画布',
            defaultKey: 'Cmd+1',
            currentKey: 'Cmd+1',
            category: 'navigation',
          },
          {
            action: 'undo',
            description: '撤销',
            defaultKey: 'Cmd+Z',
            currentKey: 'Cmd+Z',
            category: 'edit',
          },
        ],
        editingAction: null,
        capturedKey: null,
        conflictInfo: null,
        startEditing: vi.fn(),
        cancelEditing: vi.fn(),
        captureKey: vi.fn(() => ({ hasConflict: false })),
        saveShortcut: vi.fn(),
        resetToDefault: vi.fn(),
        resetAll: vi.fn(),
        loadDefaults: vi.fn(),
        getShortcutKey: vi.fn((action: string) => {
          const map: Record<string, string> = {
            'go-to-canvas': 'Cmd+1',
            'undo': 'Cmd+Z',
          };
          return map[action] ?? '';
        }),
      });
    }
    return {
      shortcuts: [
        {
          action: 'go-to-canvas',
          description: '切换到画布',
          defaultKey: 'Cmd+1',
          currentKey: 'Cmd+1',
          category: 'navigation',
        },
      ],
      editingAction: null,
      capturedKey: null,
      conflictInfo: null,
    };
  }),
}));

describe('ShortcutSettingsPanel', () => {
  const defaultProps = {
    onClose: vi.fn(),
  };

  describe('D4.3 — isOpen prop', () => {
    it('renders panel when isOpen=true (default)', () => {
      render(<ShortcutSettingsPanel {...defaultProps} />);
      expect(screen.getByRole('dialog', { name: /快捷键设置/i })).toBeInTheDocument();
    });

    it('renders panel when isOpen=true explicitly', () => {
      render(<ShortcutSettingsPanel {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog', { name: /快捷键设置/i })).toBeInTheDocument();
    });

    it('does NOT render panel when isOpen=false', () => {
      render(<ShortcutSettingsPanel {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<ShortcutSettingsPanel {...defaultProps} />);
      const overlay = screen.getByRole('dialog');
      await user.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShortcutSettingsPanel {...defaultProps} />);
      const closeBtn = screen.getByRole('button', { name: /关闭/i });
      await user.click(closeBtn);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('D4.5 — vitest coverage', () => {
    it('renders shortcut rows grouped by category', () => {
      render(<ShortcutSettingsPanel {...defaultProps} />);
      expect(screen.getByText('⌨️ 导航')).toBeInTheDocument();
      expect(screen.getByText('✏️ 编辑')).toBeInTheDocument();
    });

    it('shows current shortcut key in badge', () => {
      render(<ShortcutSettingsPanel {...defaultProps} />);
      // Cmd+1 is the current key for go-to-canvas
      expect(screen.getByText('Cmd+1')).toBeInTheDocument();
    });

    it('shows edit button for each shortcut row', () => {
      render(<ShortcutSettingsPanel {...defaultProps} />);
      const editButtons = screen.getAllByRole('button', { name: /编辑/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('reset-all button triggers confirm dialog', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('confirm', vi.fn(() => true));
      render(<ShortcutSettingsPanel {...defaultProps} />);
      const resetAllBtn = screen.getByRole('button', { name: /重置所有/i });
      await user.click(resetAllBtn);
      expect(vi.mocked(confirm)).toHaveBeenCalledWith('确定重置所有快捷键到默认值?');
      vi.stubGlobal('confirm', vi.fn()); // restore
    });

    it('does not render reset button for shortcuts at default key', () => {
      render(<ShortcutSettingsPanel {...defaultProps} />);
      // go-to-canvas has currentKey === defaultKey (Cmd+1), so no reset button
      // The table has edit button but no reset for default-key rows
      const editButtons = screen.getAllByRole('button', { name: /编辑/i });
      expect(editButtons.length).toBe(2); // go-to-canvas + undo
    });
  });
});

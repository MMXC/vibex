/**
 * Colors Token Tests
 */

import { colors, themeColors } from './colors';

describe('colors', () => {
  it('should have primary colors defined', () => {
    expect(colors.primary).toBeDefined();
    expect(colors.primaryHover).toBeDefined();
  });

  it('should have semantic colors defined', () => {
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
  });

  it('should have neutral colors defined', () => {
    expect(colors.textPrimary).toBeDefined();
    expect(colors.textSecondary).toBeDefined();
    expect(colors.bgPrimary).toBeDefined();
  });

  // FE-1.2.1: Story 1.2 spec tokens
  it('should have Story 1.2 spec tokens defined', () => {
    expect(colors.bg).toBeDefined();
    expect(colors.bg).toContain('var(--color-bg');
    expect(colors.surface).toBeDefined();
    expect(colors.surface).toContain('var(--color-surface');
    expect(colors.text).toBeDefined();
    expect(colors.text).toContain('var(--color-text');
    expect(colors.textMuted).toBeDefined();
    expect(colors.textMuted).toContain('var(--color-text-muted');
  });

  it('should use CSS variables', () => {
    expect(colors.primary).toContain('var(--');
  });
});

describe('themeColors', () => {
  it('should have light and dark themes', () => {
    expect(themeColors.light).toBeDefined();
    expect(themeColors.dark).toBeDefined();
  });

  it('should have required properties', () => {
    expect(themeColors.light.bgPrimary).toBeDefined();
    expect(themeColors.light.textPrimary).toBeDefined();
  });
});

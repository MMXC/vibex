/**
 * Style Utilities Tests
 *
 * @module prototypes/renderer/style-utils.test
 */

import { describe, it, expect } from 'vitest';
import {
  styleValueToString,
  spacingToCss,
  shadowToCss,
  styleToCssProperties,
  ShadowConfig,
} from './style-utils';
import type { UITheme } from './types';

// Create a minimal theme for testing
const mockTheme: UITheme = {
  version: '1.0.0',
  name: 'test',
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    accent: '#722ed1',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#333333',
    textSecondary: '#666666',
    border: '#d9d9d9',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Consolas, monospace',
    },
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
    },
    fontWeight: {
      normal: 400,
      semibold: 600,
    },
    lineHeight: {
      normal: 1.5,
      tight: 1.2,
    },
  },
  spacing: {
    unit: 4,
    scale: [0, 4, 8, 12, 16, 24],
    names: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
  },
  breakpoints: [],
};

describe('styleValueToString', () => {
  it('should convert number to px string', () => {
    expect(styleValueToString(16)).toBe('16px');
    expect(styleValueToString(0)).toBe('0px');
    expect(styleValueToString(100)).toBe('100px');
  });

  it('should pass through string values', () => {
    expect(styleValueToString('50%')).toBe('50%');
    expect(styleValueToString('auto')).toBe('auto');
    expect(styleValueToString('calc(100% - 20px)')).toBe('calc(100% - 20px)');
  });

  it('should return undefined for undefined', () => {
    expect(styleValueToString(undefined)).toBeUndefined();
  });
});

describe('spacingToCss', () => {
  it('should convert string spacing', () => {
    const result = spacingToCss('16px', 'padding');
    expect(result).toBe('padding: 16px;');
  });

  it('should convert number spacing', () => {
    const result = spacingToCss(8, 'margin');
    expect(result).toBe('margin: 8px;');
  });

  it('should convert object spacing with all sides', () => {
    const result = spacingToCss({ top: 10, right: 20, bottom: 30, left: 40 }, 'padding');
    expect(result).toBe(
      'padding-top: 10px; padding-right: 20px; padding-bottom: 30px; padding-left: 40px;'
    );
  });

  it('should return empty string for undefined', () => {
    expect(spacingToCss(undefined, 'padding')).toBe('');
  });

  it('should handle partial object spacing', () => {
    const result = spacingToCss({ top: 10, bottom: 20 }, 'margin');
    expect(result).toBe('margin-top: 10px; margin-bottom: 20px;');
  });
});

describe('shadowToCss', () => {
  it('should pass through string shadows', () => {
    expect(shadowToCss('0 4px 8px rgba(0,0,0,0.1)')).toBe('0 4px 8px rgba(0,0,0,0.1)');
    expect(shadowToCss('none')).toBe('none');
  });

  it('should convert shadow config object', () => {
    const shadow: ShadowConfig = { x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.1)' };
    expect(shadowToCss(shadow)).toBe('0px 4px 8px 0px rgba(0,0,0,0.1)');
  });

  it('should use default values', () => {
    const shadow: ShadowConfig = {};
    expect(shadowToCss(shadow)).toBe('0px 4px 8px 0px rgba(0,0,0,0.1)');
  });

  it('should handle custom color', () => {
    const shadow: ShadowConfig = { x: 2, y: 2, blur: 4, color: 'blue' };
    expect(shadowToCss(shadow)).toBe('2px 2px 4px 0px blue');
  });

  it('should return empty string for undefined', () => {
    expect(shadowToCss('')).toBe('');
    expect(shadowToCss(undefined)).toBe('');
  });
});

describe('styleToCssProperties', () => {
  it('should convert size properties', () => {
    const style = {
      size: {
        width: 200,
        height: '100px',
        minWidth: 100,
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      width: '200px',
      height: '100px',
      minWidth: '100px',
    });
  });

  it('should convert spacing properties', () => {
    const style = {
      spacing: {
        margin: 16,
        padding: { top: 10, bottom: 10 },
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      margin: '16px',
      paddingTop: '10px',
      paddingBottom: '10px',
    });
  });

  it('should convert border properties', () => {
    const style = {
      border: {
        radius: 8,
        width: 2,
        style: 'solid',
        color: '#333',
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      borderRadius: '8px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#333',
    });
  });

  it('should convert shadow to boxShadow', () => {
    const style = {
      shadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.1)' },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result.boxShadow).toBe('0px 4px 8px 0px rgba(0,0,0,0.1)');
  });

  it('should convert typography properties', () => {
    const style = {
      typography: {
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.5,
        textAlign: 'center' as const,
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.5,
      textAlign: 'center',
    });
  });

  it('should convert flex properties', () => {
    const style = {
      flex: {
        direction: 'row',
        justify: 'space-between',
        align: 'center',
        gap: 16,
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
    });
  });

  it('should convert position properties', () => {
    const style = {
      position: {
        type: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      position: 'fixed',
      top: '0px',
      left: '0px',
      zIndex: 100,
    });
  });

  it('should convert color properties', () => {
    const style = {
      colors: {
        background: '#f0f0f0',
        foreground: '#333',
      },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      backgroundColor: '#f0f0f0',
      color: '#333',
    });
  });

  it('should handle empty style object', () => {
    const result = styleToCssProperties({}, mockTheme);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should combine multiple style properties', () => {
    const style = {
      size: { width: 300, height: 200 },
      spacing: { margin: 20 },
      border: { radius: 8 },
      colors: { background: '#fff' },
    };
    const result = styleToCssProperties(style, mockTheme);
    expect(result).toMatchObject({
      width: '300px',
      height: '200px',
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#fff',
    });
  });
});

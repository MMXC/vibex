// @ts-nocheck
import type { AxeConfiguration } from '@axe-core/playwright';

export const axeConfig: AxeConfiguration = {
  reporter: 'json',
  rules: {
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'aria-required-attr': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
};

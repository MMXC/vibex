/**
 * MSW Browser Configuration
 * 用于浏览器环境 (开发模式)
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

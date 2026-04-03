/**
 * MSW Node Configuration
 * 用于 Node.js 环境 (测试模式)
 */
// @ts-nocheck


import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

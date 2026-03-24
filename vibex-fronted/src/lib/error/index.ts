/**
 * VibeX Error Handling Middleware
 * 统一错误处理中间件
 * 
 * @deprecated All types are re-exported from @/types/error.
 * Import types directly from '@/types/error' for better tree-shaking.
 */

// 导出类型（从 shared types 重新导出，保持向后兼容）
export * from '@/types/error';

// 导出类
export { ErrorClassifier } from './ErrorClassifier';
export { ErrorCodeMapper, defaultErrorMapper } from './ErrorCodeMapper';
export { RetryHandler, defaultRetryHandler } from './RetryHandler';
export { ErrorMiddleware, defaultErrorMiddleware } from './ErrorMiddleware';

// 导出便捷函数
export { withErrorHandling } from './ErrorMiddleware';

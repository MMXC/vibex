"use strict";
/**
 * @fileoverview Canvas API Schema — 前后端契约类型定义
 *
 * 用于契约测试 (Epic 1)
 * 基于 canvasApi.ts 中的 API 调用定义
 *
 * Schema 版本: 1.0.0
 * 创建日期: 2026-03-31
 *
 * 注意: 本文件使用纯 TypeScript 类型，不依赖 zod
 * 如需运行时校验，使用类型守卫函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_COMPONENTS = exports.MIN_FLOWS = exports.MIN_CONTEXTS = exports.CONFIDENCE_THRESHOLD = exports.CANVAS_API_ENDPOINTS = void 0;
exports.isBoundedContextType = isBoundedContextType;
exports.isComponentType = isComponentType;
exports.isHttpMethod = isHttpMethod;
exports.isGenerateContextsResponse = isGenerateContextsResponse;
exports.isGenerateFlowsResponse = isGenerateFlowsResponse;
exports.isGenerateComponentsResponse = isGenerateComponentsResponse;
// =============================================================================
// 类型守卫函数 (用于运行时校验)
// =============================================================================
/** 校验 BoundedContextType */
function isBoundedContextType(value) {
    return (typeof value === 'string' &&
        ['core', 'supporting', 'generic', 'external'].indexOf(value) !== -1);
}
/** 校验 ComponentType */
function isComponentType(value) {
    return (typeof value === 'string' &&
        ['page', 'api', 'database', 'queue', 'cache', 'gateway', 'worker'].indexOf(value) !== -1);
}
/** 校验 HttpMethod */
function isHttpMethod(value) {
    return typeof value === 'string' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].indexOf(value) !== -1;
}
/** 校验 GenerateContextsResponse */
function isGenerateContextsResponse(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return (typeof obj.success === 'boolean' &&
        Array.isArray(obj.contexts) &&
        typeof obj.sessionId === 'string' &&
        typeof obj.confidence === 'number');
}
/** 校验 GenerateFlowsResponse */
function isGenerateFlowsResponse(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return (typeof obj.success === 'boolean' &&
        Array.isArray(obj.flows) &&
        typeof obj.confidence === 'number');
}
/** 校验 GenerateComponentsResponse */
function isGenerateComponentsResponse(value) {
    if (!value || typeof value !== 'object')
        return false;
    const obj = value;
    return typeof obj.success === 'boolean' && Array.isArray(obj.components);
}
// =============================================================================
// 契约测试常量
// =============================================================================
/** API 端点路径 */
exports.CANVAS_API_ENDPOINTS = {
    generateContexts: '/api/v1/canvas/generate-contexts',
    generateFlows: '/api/v1/canvas/generate-flows',
    generateComponents: '/api/v1/canvas/generate-components',
};
/** 置信度阈值 */
exports.CONFIDENCE_THRESHOLD = {
    LOW: 0.5,
    MEDIUM: 0.7,
    HIGH: 0.85,
};
/** 最少 Context 数量 */
exports.MIN_CONTEXTS = 1;
/** 最少 Flow 数量 */
exports.MIN_FLOWS = 1;
/** 最少 Component 数量 */
exports.MIN_COMPONENTS = 0;

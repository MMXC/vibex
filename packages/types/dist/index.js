"use strict";
/**
 * @fileoverview Shared type definitions for Vibex
 *
 * Modular structure:
 * - api.ts    — Domain and API types (BoundedContext, Dedup, etc.)
 * - store.ts  — Application state types (CardTree, TeamTasks, etc.)
 * - events.ts — Event-driven types (AppEvent, CardTree events, etc.)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES_PACKAGE_VERSION = void 0;
// Re-export all types from modular submodules
__exportStar(require("./api"), exports);
__exportStar(require("./store"), exports);
__exportStar(require("./events"), exports);
// Type guards
__exportStar(require("./guards"), exports);
// Package version
exports.TYPES_PACKAGE_VERSION = '0.1.0';

/**
 * @fileoverview Shared type definitions for Vibex
 *
 * Modular structure:
 * - api.ts    — Domain and API types (BoundedContext, Dedup, etc.)
 * - store.ts  — Application state types (CardTree, TeamTasks, etc.)
 * - events.ts — Event-driven types (AppEvent, CardTree events, etc.)
 */

// Re-export all types from modular submodules
export * from './api';
export * from './store';
export * from './events';

// Type guards
export * from './guards';

// Package version
export const TYPES_PACKAGE_VERSION = '0.1.0' as const;

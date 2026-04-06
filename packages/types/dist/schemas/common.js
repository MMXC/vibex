"use strict";
/**
 * @fileoverview Common Zod Schemas — Shared across packages
 *
 * Part of: E3-packages/types
 * Reusable schemas for common types like UUID, Email, etc.
 *
 * Usage in backend:
 *   import { uuidSchema, emailSchema } from '@vibex/types/schemas/common'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.positiveIntSchema = exports.optionalStringSchema = exports.nonEmptyStringSchema = exports.passwordSchema = exports.emailSchema = exports.uuidSchema = exports.cuidSchema = void 0;
const zod_1 = require("zod");
// ==================== Common Types ====================
/**
 * CUID format schema (Cloudflare ID used by Prisma)
 * Matches Prisma's default ID format
 */
exports.cuidSchema = zod_1.z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format');
/**
 * UUID v4 schema
 */
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
/**
 * Email schema with strict validation
 */
exports.emailSchema = zod_1.z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim();
/**
 * Password schema with security requirements
 */
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
/**
 * Non-empty string schema
 */
exports.nonEmptyStringSchema = zod_1.z
    .string()
    .min(1, 'Field cannot be empty')
    .max(1000, 'Field too long')
    .trim();
/**
 * Optional string schema (allows empty, trims if present)
 */
exports.optionalStringSchema = zod_1.z
    .string()
    .max(1000, 'Field too long')
    .transform((val) => (val === '' ? undefined : val.trim()))
    .optional();
/**
 * Positive integer schema
 */
exports.positiveIntSchema = zod_1.z
    .string()
    .or(zod_1.z.number())
    .transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num) || num < 1) {
        throw new Error('Must be a positive integer');
    }
    return num;
});
/**
 * Pagination query schema
 */
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => {
        const num = typeof val === 'string' ? parseInt(val, 10) : (val ?? 1);
        return isNaN(num) || num < 1 ? 1 : Math.floor(num);
    }),
    pageSize: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => {
        const num = typeof val === 'string' ? parseInt(val, 10) : (val ?? 20);
        if (isNaN(num) || num < 1)
            return 20;
        return Math.min(Math.floor(num), 100); // Max 100 per page
    }),
});

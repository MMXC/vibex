/**
 * @fileoverview Common Zod Schemas — Shared across packages
 *
 * Part of: E3-packages/types
 * Reusable schemas for common types like UUID, Email, etc.
 *
 * Usage in backend:
 *   import { uuidSchema, emailSchema } from '@vibex/types/schemas/common'
 */
import { z } from 'zod';
/**
 * CUID format schema (Cloudflare ID used by Prisma)
 * Matches Prisma's default ID format
 */
export declare const cuidSchema: z.ZodString;
/**
 * UUID v4 schema
 */
export declare const uuidSchema: z.ZodString;
/**
 * Email schema with strict validation
 */
export declare const emailSchema: z.ZodString;
/**
 * Password schema with security requirements
 */
export declare const passwordSchema: z.ZodString;
/**
 * Non-empty string schema
 */
export declare const nonEmptyStringSchema: z.ZodString;
/**
 * Optional string schema (allows empty, trims if present)
 */
export declare const optionalStringSchema: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
/**
 * Positive integer schema
 */
export declare const positiveIntSchema: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
/**
 * Pagination query schema
 */
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>, number, string | number | undefined>;
    pageSize: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>, number, string | number | undefined>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
}, {
    page?: string | number | undefined;
    pageSize?: string | number | undefined;
}>;
export type Uuid = z.infer<typeof uuidSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type NonEmptyString = z.infer<typeof nonEmptyStringSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
//# sourceMappingURL=common.d.ts.map
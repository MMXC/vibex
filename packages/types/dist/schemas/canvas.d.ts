/**
 * @fileoverview Canvas Zod Schemas — Shared across packages
 *
 * Part of: E3-packages/types
 * Validates canvas API requests (bounded contexts, flows, components)
 *
 * Usage in backend:
 *   import { boundedContextSchema } from '@vibex/types/schemas/canvas'
 */
import { z } from 'zod';
/**
 * Bounded context schema (used in flow/component generation)
 */
export declare const boundedContextSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        core: "core";
        supporting: "supporting";
        generic: "generic";
        external: "external";
    }>>;
}, z.core.$strip>;
export type BoundedContextInput = z.infer<typeof boundedContextSchema>;
/**
 * Flow step schema
 */
export declare const flowStepSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    actor: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type FlowStepInput = z.infer<typeof flowStepSchema>;
/**
 * Business flow schema
 */
export declare const businessFlowSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    contextId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        actor: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type BusinessFlowInput = z.infer<typeof businessFlowSchema>;
/**
 * Generate bounded contexts request body
 */
export declare const generateContextsSchema: z.ZodObject<{
    requirementText: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type GenerateContextsInput = z.infer<typeof generateContextsSchema>;
/**
 * Generate business flows request body
 */
export declare const generateFlowsSchema: z.ZodObject<{
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            core: "core";
            supporting: "supporting";
            generic: "generic";
            external: "external";
        }>>;
    }, z.core.$strip>>;
    sessionId: z.ZodString;
}, z.core.$strict>;
export type GenerateFlowsInput = z.infer<typeof generateFlowsSchema>;
/**
 * Generate components request body
 */
export declare const generateComponentsSchema: z.ZodObject<{
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            core: "core";
            supporting: "supporting";
            generic: "generic";
            external: "external";
        }>>;
    }, z.core.$strip>>;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        contextId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            actor: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            order: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    sessionId: z.ZodString;
}, z.core.$strict>;
export type GenerateComponentsInput = z.infer<typeof generateComponentsSchema>;
/**
 * Generate contexts response
 */
export declare const generateContextsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            core: "core";
            supporting: "supporting";
            generic: "generic";
            external: "external";
        }>>;
    }, z.core.$strip>>;
    generationId: z.ZodString;
    confidence: z.ZodNumber;
}, z.core.$strip>;
export type GenerateContextsResponse = z.infer<typeof generateContextsResponseSchema>;
/**
 * Generate flows response
 */
export declare const generateFlowsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    generationId: z.ZodString;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        contextId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            actor: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            order: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    confidence: z.ZodNumber;
}, z.core.$strip>;
export type GenerateFlowsResponse = z.infer<typeof generateFlowsResponseSchema>;
/**
 * Component API definition
 */
export declare const componentApiSchema: z.ZodObject<{
    method: z.ZodEnum<{
        GET: "GET";
        POST: "POST";
        PUT: "PUT";
        DELETE: "DELETE";
        PATCH: "PATCH";
    }>;
    path: z.ZodString;
    params: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ComponentApi = z.infer<typeof componentApiSchema>;
/**
 * Component node schema
 */
export declare const componentNodeSchema: z.ZodObject<{
    flowId: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    props: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    api: z.ZodObject<{
        method: z.ZodEnum<{
            GET: "GET";
            POST: "POST";
            PUT: "PUT";
            DELETE: "DELETE";
            PATCH: "PATCH";
        }>;
        path: z.ZodString;
        params: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ComponentNode = z.infer<typeof componentNodeSchema>;
/**
 * Generate components response
 */
export declare const generateComponentsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    generationId: z.ZodString;
    components: z.ZodArray<z.ZodObject<{
        flowId: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        props: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        api: z.ZodObject<{
            method: z.ZodEnum<{
                GET: "GET";
                POST: "POST";
                PUT: "PUT";
                DELETE: "DELETE";
                PATCH: "PATCH";
            }>;
            path: z.ZodString;
            params: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type GenerateComponentsResponse = z.infer<typeof generateComponentsResponseSchema>;
/**
 * Canvas generate request body (POST /api/v1/canvas/generate)
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 */
export declare const canvasGenerateSchema: z.ZodObject<{
    projectId: z.ZodString;
    pageIds: z.ZodArray<z.ZodString>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        parallel: "parallel";
        sequential: "sequential";
    }>>>;
}, z.core.$strict>;
export type CanvasGenerateInput = z.infer<typeof canvasGenerateSchema>;
//# sourceMappingURL=canvas.d.ts.map
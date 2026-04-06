/**
 * @fileoverview Canvas API Zod Schemas — Shared between frontend and backend
 *
 * Used by both:
 *   - frontend: src/lib/canvas/api/canvasApiValidation.ts
 *   - backend:  API response validation
 *
 * Schema definitions for Epic: Zod Schema 统一 (E1)
 */
import { z } from 'zod';
export declare const BoundedContextSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<{
        core: "core";
        supporting: "supporting";
        generic: "generic";
        external: "external";
    }>;
}, z.core.$strip>;
export declare const GenerateContextsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<{
            core: "core";
            supporting: "supporting";
            generic: "generic";
            external: "external";
        }>;
    }, z.core.$strip>>;
    generationId: z.ZodString;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GenerateContextsOutput = z.infer<typeof GenerateContextsResponseSchema>;
export declare const BusinessFlowStepSchema: z.ZodObject<{
    name: z.ZodString;
    actor: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
}, z.core.$strip>;
export declare const BusinessFlowSchema: z.ZodObject<{
    name: z.ZodString;
    contextId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        actor: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GenerateFlowsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    flows: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        contextId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            actor: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GenerateFlowsOutput = z.infer<typeof GenerateFlowsResponseSchema>;
export declare const ComponentApiSchema: z.ZodObject<{
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
export declare const ComponentSchema: z.ZodObject<{
    name: z.ZodString;
    flowId: z.ZodString;
    type: z.ZodEnum<{
        page: "page";
        form: "form";
        list: "list";
        detail: "detail";
        modal: "modal";
    }>;
    description: z.ZodOptional<z.ZodString>;
    api: z.ZodOptional<z.ZodObject<{
        method: z.ZodEnum<{
            GET: "GET";
            POST: "POST";
            PUT: "PUT";
            DELETE: "DELETE";
            PATCH: "PATCH";
        }>;
        path: z.ZodString;
        params: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GenerateComponentsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    components: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        flowId: z.ZodString;
        type: z.ZodEnum<{
            page: "page";
            form: "form";
            list: "list";
            detail: "detail";
            modal: "modal";
        }>;
        description: z.ZodOptional<z.ZodString>;
        api: z.ZodOptional<z.ZodObject<{
            method: z.ZodEnum<{
                GET: "GET";
                POST: "POST";
                PUT: "PUT";
                DELETE: "DELETE";
                PATCH: "PATCH";
            }>;
            path: z.ZodString;
            params: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GenerateComponentsOutput = z.infer<typeof GenerateComponentsResponseSchema>;
export declare function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput;
export declare function isValidGenerateFlowsResponse(value: unknown): value is GenerateFlowsOutput;
export declare function isValidGenerateComponentsResponse(value: unknown): value is GenerateComponentsOutput;
//# sourceMappingURL=canvasSchema.d.ts.map
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
    type: z.ZodEnum<["core", "supporting", "generic", "external"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "core" | "supporting" | "generic" | "external";
    name: string;
    description: string;
}, {
    id: string;
    type: "core" | "supporting" | "generic" | "external";
    name: string;
    description: string;
}>;
export declare const GenerateContextsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["core", "supporting", "generic", "external"]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "core" | "supporting" | "generic" | "external";
        name: string;
        description: string;
    }, {
        id: string;
        type: "core" | "supporting" | "generic" | "external";
        name: string;
        description: string;
    }>, "many">;
    generationId: z.ZodString;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    contexts: {
        id: string;
        type: "core" | "supporting" | "generic" | "external";
        name: string;
        description: string;
    }[];
    confidence: number;
    generationId: string;
    error?: string | undefined;
}, {
    success: boolean;
    contexts: {
        id: string;
        type: "core" | "supporting" | "generic" | "external";
        name: string;
        description: string;
    }[];
    confidence: number;
    generationId: string;
    error?: string | undefined;
}>;
export type GenerateContextsOutput = z.infer<typeof GenerateContextsResponseSchema>;
export declare const BusinessFlowStepSchema: z.ZodObject<{
    name: z.ZodString;
    actor: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    actor: string;
    order: number;
}, {
    name: string;
    description: string;
    actor: string;
    order: number;
}>;
export declare const BusinessFlowSchema: z.ZodObject<{
    name: z.ZodString;
    contextId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        actor: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        actor: string;
        order: number;
    }, {
        name: string;
        description: string;
        actor: string;
        order: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    contextId: string;
    steps: {
        name: string;
        description: string;
        actor: string;
        order: number;
    }[];
    description?: string | undefined;
}, {
    name: string;
    contextId: string;
    steps: {
        name: string;
        description: string;
        actor: string;
        order: number;
    }[];
    description?: string | undefined;
}>;
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
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            actor: string;
            order: number;
        }, {
            name: string;
            description: string;
            actor: string;
            order: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            description: string;
            actor: string;
            order: number;
        }[];
        description?: string | undefined;
    }, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            description: string;
            actor: string;
            order: number;
        }[];
        description?: string | undefined;
    }>, "many">;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    confidence: number;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            description: string;
            actor: string;
            order: number;
        }[];
        description?: string | undefined;
    }[];
    error?: string | undefined;
}, {
    success: boolean;
    confidence: number;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            description: string;
            actor: string;
            order: number;
        }[];
        description?: string | undefined;
    }[];
    error?: string | undefined;
}>;
export type GenerateFlowsOutput = z.infer<typeof GenerateFlowsResponseSchema>;
export declare const ComponentApiSchema: z.ZodObject<{
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    path: z.ZodString;
    params: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    params: string[];
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}, {
    params: string[];
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}>;
export declare const ComponentSchema: z.ZodObject<{
    name: z.ZodString;
    flowId: z.ZodString;
    type: z.ZodEnum<["page", "form", "list", "detail", "modal"]>;
    description: z.ZodOptional<z.ZodString>;
    api: z.ZodOptional<z.ZodObject<{
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
        path: z.ZodString;
        params: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    }, {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "page" | "form" | "list" | "detail" | "modal";
    name: string;
    flowId: string;
    api?: {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    } | undefined;
    description?: string | undefined;
}, {
    type: "page" | "form" | "list" | "detail" | "modal";
    name: string;
    flowId: string;
    api?: {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    } | undefined;
    description?: string | undefined;
}>;
export declare const GenerateComponentsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    components: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        flowId: z.ZodString;
        type: z.ZodEnum<["page", "form", "list", "detail", "modal"]>;
        description: z.ZodOptional<z.ZodString>;
        api: z.ZodOptional<z.ZodObject<{
            method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
            path: z.ZodString;
            params: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        }, {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "page" | "form" | "list" | "detail" | "modal";
        name: string;
        flowId: string;
        api?: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        } | undefined;
        description?: string | undefined;
    }, {
        type: "page" | "form" | "list" | "detail" | "modal";
        name: string;
        flowId: string;
        api?: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        } | undefined;
        description?: string | undefined;
    }>, "many">;
    confidence: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    confidence: number;
    components: {
        type: "page" | "form" | "list" | "detail" | "modal";
        name: string;
        flowId: string;
        api?: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        } | undefined;
        description?: string | undefined;
    }[];
    error?: string | undefined;
}, {
    success: boolean;
    confidence: number;
    components: {
        type: "page" | "form" | "list" | "detail" | "modal";
        name: string;
        flowId: string;
        api?: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        } | undefined;
        description?: string | undefined;
    }[];
    error?: string | undefined;
}>;
export type GenerateComponentsOutput = z.infer<typeof GenerateComponentsResponseSchema>;
export declare function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput;
export declare function isValidGenerateFlowsResponse(value: unknown): value is GenerateFlowsOutput;
export declare function isValidGenerateComponentsResponse(value: unknown): value is GenerateComponentsOutput;
//# sourceMappingURL=canvasSchema.d.ts.map
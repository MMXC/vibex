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
    type: z.ZodDefault<z.ZodEnum<["core", "supporting", "generic", "external"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    type: "core" | "supporting" | "generic" | "external";
}, {
    id: string;
    name: string;
    description: string;
    type?: "core" | "supporting" | "generic" | "external" | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    name: string;
    actor: string;
    id?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
}, {
    name: string;
    actor: string;
    id?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
}>;
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
    }, "strip", z.ZodTypeAny, {
        name: string;
        actor: string;
        id?: string | undefined;
        description?: string | undefined;
        order?: number | undefined;
    }, {
        name: string;
        actor: string;
        id?: string | undefined;
        description?: string | undefined;
        order?: number | undefined;
    }>, "many">;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    contextId: string;
    steps: {
        name: string;
        actor: string;
        id?: string | undefined;
        description?: string | undefined;
        order?: number | undefined;
    }[];
    confidence?: number | undefined;
    id?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    contextId: string;
    steps: {
        name: string;
        actor: string;
        id?: string | undefined;
        description?: string | undefined;
        order?: number | undefined;
    }[];
    confidence?: number | undefined;
    id?: string | undefined;
    description?: string | undefined;
}>;
export type BusinessFlowInput = z.infer<typeof businessFlowSchema>;
/**
 * Generate bounded contexts request body
 */
export declare const generateContextsSchema: z.ZodObject<{
    requirementText: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    requirementText: string;
    projectId?: string | undefined;
}, {
    requirementText: string;
    projectId?: string | undefined;
}>;
export type GenerateContextsInput = z.infer<typeof generateContextsSchema>;
/**
 * Generate business flows request body
 */
export declare const generateFlowsSchema: z.ZodObject<{
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["core", "supporting", "generic", "external"]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }, {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }>, "many">;
    sessionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    contexts: {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }[];
    sessionId: string;
}, {
    contexts: {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }[];
    sessionId: string;
}>;
export type GenerateFlowsInput = z.infer<typeof generateFlowsSchema>;
/**
 * Generate components request body
 */
export declare const generateComponentsSchema: z.ZodObject<{
    contexts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["core", "supporting", "generic", "external"]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }, {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }>, "many">;
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
        }, "strip", z.ZodTypeAny, {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }, {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }>, "many">;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }>, "many">;
    sessionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    contexts: {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }[];
    sessionId: string;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }[];
}, {
    contexts: {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }[];
    sessionId: string;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }[];
}>;
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
        type: z.ZodDefault<z.ZodEnum<["core", "supporting", "generic", "external"]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }, {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }>, "many">;
    generationId: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: true;
    contexts: {
        id: string;
        name: string;
        description: string;
        type: "core" | "supporting" | "generic" | "external";
    }[];
    confidence: number;
    generationId: string;
}, {
    success: true;
    contexts: {
        id: string;
        name: string;
        description: string;
        type?: "core" | "supporting" | "generic" | "external" | undefined;
    }[];
    confidence: number;
    generationId: string;
}>;
export type GenerateContextsResponse = z.infer<typeof generateContextsResponseSchema>;
/**
 * Generate flows response
 */
export declare const generateFlowsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    generationId: z.ZodString;
} & {
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
        }, "strip", z.ZodTypeAny, {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }, {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }>, "many">;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }, {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }>, "many">;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: true;
    confidence: number;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }[];
    generationId: string;
}, {
    success: true;
    confidence: number;
    flows: {
        name: string;
        contextId: string;
        steps: {
            name: string;
            actor: string;
            id?: string | undefined;
            description?: string | undefined;
            order?: number | undefined;
        }[];
        confidence?: number | undefined;
        id?: string | undefined;
        description?: string | undefined;
    }[];
    generationId: string;
}>;
export type GenerateFlowsResponse = z.infer<typeof generateFlowsResponseSchema>;
/**
 * Component API definition
 */
export declare const componentApiSchema: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    api: {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    };
    name: string;
    type: string;
    flowId: string;
    props: Record<string, unknown>;
}, {
    api: {
        params: string[];
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    };
    name: string;
    type: string;
    flowId: string;
    props: Record<string, unknown>;
}>;
export type ComponentNode = z.infer<typeof componentNodeSchema>;
/**
 * Generate components response
 */
export declare const generateComponentsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    generationId: z.ZodString;
} & {
    components: z.ZodArray<z.ZodObject<{
        flowId: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        props: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        api: z.ZodObject<{
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
    }, "strip", z.ZodTypeAny, {
        api: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        };
        name: string;
        type: string;
        flowId: string;
        props: Record<string, unknown>;
    }, {
        api: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        };
        name: string;
        type: string;
        flowId: string;
        props: Record<string, unknown>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    success: true;
    components: {
        api: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        };
        name: string;
        type: string;
        flowId: string;
        props: Record<string, unknown>;
    }[];
    generationId: string;
}, {
    success: true;
    components: {
        api: {
            params: string[];
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        };
        name: string;
        type: string;
        flowId: string;
        props: Record<string, unknown>;
    }[];
    generationId: string;
}>;
export type GenerateComponentsResponse = z.infer<typeof generateComponentsResponseSchema>;
/**
 * Canvas generate request body (POST /api/v1/canvas/generate)
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 */
export declare const canvasGenerateSchema: z.ZodObject<{
    projectId: z.ZodString;
    pageIds: z.ZodArray<z.ZodString, "many">;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["parallel", "sequential"]>>>;
}, "strict", z.ZodTypeAny, {
    projectId: string;
    pageIds: string[];
    mode: "parallel" | "sequential";
}, {
    projectId: string;
    pageIds: string[];
    mode?: "parallel" | "sequential" | undefined;
}>;
export type CanvasGenerateInput = z.infer<typeof canvasGenerateSchema>;
//# sourceMappingURL=canvas.d.ts.map
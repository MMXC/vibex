export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode' | 'health_check';
export declare function executeTool(name: ToolName, args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    _health: import("../health.js").HealthCheckResult;
} | {
    content: {
        type: string;
        text: string;
    }[];
    _health?: undefined;
}>;

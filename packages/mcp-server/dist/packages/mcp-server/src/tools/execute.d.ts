export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode' | 'health_check' | 'review_design' | 'coding_agent';
export declare function executeTool(name: ToolName, args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    _health: import("../health.js").HealthCheckResult;
    _designReview?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    _designReview: import("./reviewDesign.js").DesignReviewReport;
    _health?: undefined;
} | {
    content: {
        type: string;
        text: any;
    }[];
    _health?: undefined;
    _designReview?: undefined;
}>;

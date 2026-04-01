export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode';
export declare function executeTool(name: ToolName, args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;

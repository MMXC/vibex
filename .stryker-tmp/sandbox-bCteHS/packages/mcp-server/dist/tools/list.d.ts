// @ts-nocheck
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
export interface VibeXTool {
    name: string;
    description: string;
    inputSchema: object;
}
export declare function listTools(): Tool[];

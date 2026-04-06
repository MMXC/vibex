/**
 * E7-S1: MCP Health Check Tool
 *
 * Provides /health endpoint functionality for MCP server.
 * Returns structured health status of the MCP server.
 */
import { z } from 'zod';
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    tools: {
        registered: number;
        names: string[];
    };
    checks: {
        name: string;
        status: 'pass' | 'fail';
        message?: string;
    }[];
}
/**
 * E7-S1: Perform health check
 *
 * Checks:
 * - MCP server is running
 * - Tools are registered
 * - Server is responsive
 */
export declare function performHealthCheck(): Promise<HealthCheckResult>;
/**
 * E7-S1: Health check tool definition for MCP
 * This tool can be called by clients to check MCP server health
 */
export declare const healthCheckTool: {
    readonly name: "health_check";
    readonly description: "Check the health status of the VibeX MCP server. Returns server uptime, registered tools, and health status.";
    readonly inputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    readonly handler: () => Promise<HealthCheckResult>;
};

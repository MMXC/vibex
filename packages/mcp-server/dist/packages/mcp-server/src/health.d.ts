/**
 * E7-S1: MCP Health Check Tool
 *
 * Provides health_check MCP tool functionality via stdio transport.
 * The HTTP endpoint approach is NOT used — MCP uses stdio transport.
 */
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
    connectedClients: number;
}
export interface HealthCheckOptions {
    serverVersion?: string;
}
/**
 * E7-S1: Perform health check
 *
 * Checks:
 * - MCP server is running
 * - Tools are registered
 * - Server is responsive
 */
export declare function performHealthCheck(options?: HealthCheckOptions): Promise<HealthCheckResult>;

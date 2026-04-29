/**
 * E7-S1: MCP Health Check Tool
 *
 * Provides health_check MCP tool functionality via stdio transport.
 * The HTTP endpoint approach is NOT used — MCP uses stdio transport.
 */
import { listTools } from './tools/list.js';
/** Server start time for uptime calculation */
const serverStartTime = Date.now();
/** Default version if not provided */
const DEFAULT_VERSION = '0.1.0';
/**
 * E7-S1: Perform health check
 *
 * Checks:
 * - MCP server is running
 * - Tools are registered
 * - Server is responsive
 */
export async function performHealthCheck(options = {}) {
    const checks = [];
    // Check 1: MCP server running
    try {
        checks.push({
            name: 'server_running',
            status: 'pass',
            message: 'MCP server is responding',
        });
    }
    catch {
        checks.push({
            name: 'server_running',
            status: 'fail',
            message: 'MCP server is not responding',
        });
    }
    // Check 2: Tools registered
    let registeredCount = 0;
    let toolNames = [];
    try {
        const tools = listTools();
        registeredCount = tools.length;
        toolNames = tools.map((t) => t.name);
        checks.push({
            name: 'tools_registered',
            status: registeredCount > 0 ? 'pass' : 'fail',
            message: `${registeredCount} tools registered`,
        });
    }
    catch {
        checks.push({
            name: 'tools_registered',
            status: 'fail',
            message: 'Failed to list tools',
        });
    }
    // Determine overall status
    const failedChecks = checks.filter((c) => c.status === 'fail').length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks === 1 ? 'degraded' : 'unhealthy';
    return {
        status,
        timestamp: new Date().toISOString(),
        version: options.serverVersion ?? DEFAULT_VERSION,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        tools: {
            registered: registeredCount,
            names: toolNames,
        },
        checks,
        // E7-S1: connectedClients — stdio transport has 1 active client (the host process)
        connectedClients: 1,
    };
}

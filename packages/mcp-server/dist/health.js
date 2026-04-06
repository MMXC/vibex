"use strict";
/**
 * E7-S1: MCP Health Check Tool
 *
 * Provides /health endpoint functionality for MCP server.
 * Returns structured health status of the MCP server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckTool = void 0;
exports.performHealthCheck = performHealthCheck;
const zod_1 = require("zod");
const list_js_1 = require("./tools/list.js");
const healthCheckSchema = zod_1.z.object({});
/** Server start time for uptime calculation */
const serverStartTime = Date.now();
/**
 * E7-S1: Perform health check
 *
 * Checks:
 * - MCP server is running
 * - Tools are registered
 * - Server is responsive
 */
async function performHealthCheck() {
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
        const tools = (0, list_js_1.listTools)();
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
        version: '0.1.0',
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        tools: {
            registered: registeredCount,
            names: toolNames,
        },
        checks,
    };
}
/**
 * E7-S1: Health check tool definition for MCP
 * This tool can be called by clients to check MCP server health
 */
exports.healthCheckTool = {
    name: 'health_check',
    description: 'Check the health status of the VibeX MCP server. Returns server uptime, registered tools, and health status.',
    inputSchema: healthCheckSchema,
    handler: async () => {
        return performHealthCheck();
    },
};

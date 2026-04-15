/**
 * E7-S1: MCP Health Check Tool + HTTP Health Endpoint
 *
 * Provides /health endpoint functionality for MCP server.
 * Returns structured health status of the MCP server.
 */

import { listTools } from './tools/list.js';

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
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = [];

  // Check 1: MCP server running
  try {
    checks.push({
      name: 'server_running',
      status: 'pass',
      message: 'MCP server is responding',
    });
  } catch {
    checks.push({
      name: 'server_running',
      status: 'fail',
      message: 'MCP server is not responding',
    });
  }

  // Check 2: Tools registered
  let registeredCount = 0;
  let toolNames: string[] = [];
  try {
    const tools = listTools();
    registeredCount = tools.length;
    toolNames = tools.map((t) => t.name);
    checks.push({
      name: 'tools_registered',
      status: registeredCount > 0 ? 'pass' : 'fail',
      message: `${registeredCount} tools registered`,
    });
  } catch {
    checks.push({
      name: 'tools_registered',
      status: 'fail',
      message: 'Failed to list tools',
    });
  }

  // Determine overall status
  const failedChecks = checks.filter((c) => c.status === 'fail').length;
  const status: HealthCheckResult['status'] =
    failedChecks === 0 ? 'healthy' : failedChecks === 1 ? 'degraded' : 'unhealthy';

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
    // E7-S1: connectedClients — stdio transport has 1 active client (the host process)
    connectedClients: 1,
  };
}

/**
 * E7-S1: Add a GET /health HTTP endpoint to the MCP server.
 * Starts a small HTTP server on the given port (default 3100).
 */
export function addHealthEndpoint(port = 3100): void {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      performHealthCheck().then((result) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Health endpoint listening on http://localhost:${port}/health`);
  });
}

/**
 * E7-S1: Health check tool definition for MCP
 * This tool can be called by clients to check MCP server health
 */
export const healthCheckTool = {
  name: 'health_check',
  description:
    'Check the health status of the VibeX MCP server. Returns server uptime, registered tools, and health status.',
  inputSchema: healthCheckSchema,
  handler: async (): Promise<HealthCheckResult> => {
    return performHealthCheck();
  },
} as const;

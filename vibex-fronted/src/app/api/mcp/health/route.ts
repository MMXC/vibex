/**
 * GET /api/mcp/health — MCP Server Health Check Endpoint
 * E07 S07.1: MCP Server 集成完善
 *
 * Returns health status of the MCP server.
 * Used for monitoring and readiness probes.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    status: 'ok',
    service: 'mcp',
    timestamp,
  });
}

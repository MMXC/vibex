/**
 * E1-U3: HTTP /health endpoint for MCP server dev monitoring
 *
 * Standalone HTTP server on port 3100 that returns MCP tool health.
 * This is separate from the stdio MCP transport (used in production).
 * Run separately during development to check tool registration status.
 */

import http from 'node:http';
import { listTools } from '../tools/list.js';

const PORT = 3100;
const HOST = '0.0.0.0';

function buildResponse(statusCode: number, body: object): http.ServerResponse<http.IncomingMessage>['writeHead'] {
  return (res) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(body, null, 2));
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    const tools = listTools();
    const body = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tools: {
        registered: tools.length,
        names: tools.map((t) => t.name),
      },
    };

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(body, null, 2));
    return;
  }

  // 404 for all other routes
  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ error: 'Not Found', path: url.pathname }, null, 2));
});

server.listen(PORT, HOST, () => {
  console.log(`[health] MCP health server running at http://${HOST}:${PORT}/health`);
  console.log(`[health] Registered tools: ${listTools().length}`);
});

server.on('error', (err) => {
  console.error('[health] Server error:', err);
  process.exit(1);
});

export default server;
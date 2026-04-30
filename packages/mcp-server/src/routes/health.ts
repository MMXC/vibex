/**
 * E1-U3: HTTP /health endpoint for MCP server dev monitoring
 * P001-T1: Merged into stdio startup sequence (was standalone HTTP process)
 */

import http from 'node:http';
import { listTools } from '../tools/list.js';

const HOST = '0.0.0.0';

/**
 * P001-T1: Setup health endpoint on given port
 * Called from main() in index.ts during stdio startup sequence.
 * Does NOT call process.exit() on error — lets caller handle.
 */
export function setupHealthEndpoint(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
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

    server.on('error', (err) => {
      reject(err);
    });

    server.listen(port, HOST, () => {
      console.log(`[mcp] /health ready on http://${HOST}:${port}/health`);
      resolve(server);
    });
  });
}
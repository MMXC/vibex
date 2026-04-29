/**
 * E1-U3: HTTP /health endpoint for MCP server dev monitoring
 *
 * Standalone HTTP server on port 3100 that returns MCP tool health.
 * This is separate from the stdio MCP transport (used in production).
 * Run separately during development to check tool registration status.
 */
import http from 'node:http';
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export default server;

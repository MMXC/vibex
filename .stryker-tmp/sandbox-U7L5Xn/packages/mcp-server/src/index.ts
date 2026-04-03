// @ts-nocheck
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listTools } from './tools/list.js';
import { executeTool, type ToolName } from './tools/execute.js';

const server = new Server(
  { name: 'vibex-mcp-server', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: listTools() };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return executeTool(request.params.name as ToolName, request.params.arguments ?? {});
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('VibeX MCP Server running on stdio');
}

main().catch(console.error);

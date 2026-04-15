import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listTools } from './tools/list.js';
import { executeTool, type ToolName } from './tools/execute.js';
import { logger } from './logger.js'

// E7-S1: SDK version check at startup
const MCP_SDK_VERSION = '0.5.0'
logger.info('mcp_server_starting', { version: '0.1.0', sdkVersion: MCP_SDK_VERSION })

const server = new Server(
  { name: 'vibex-mcp-server', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // E7-S2: Log tool list request
  logger.debug('mcp_list_tools', { toolCount: listTools().length })
  return { tools: listTools() };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name as ToolName
  const args = request.params.arguments ?? {}
  
  // E7-S2: Structured logging with tool/duration/success
  const startTime = Date.now()
  logger.info('mcp_tool_call', {
    tool: toolName,
    argsKeys: Object.keys(args),
  })
  
  try {
    const result = await executeTool(toolName, args)
    const durationMs = Date.now() - startTime
    // E7-S2: logToolCall includes tool/duration/success
    logger.logToolCall(toolName, durationMs, true)
    return result
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.logToolCall(toolName, durationMs, false)
    logger.error('mcp_tool_error', {
      tool: toolName,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('mcp_server_ready', { transport: 'stdio' })
  console.error('VibeX MCP Server running on stdio');
}

main().catch((err) => {
  logger.error('mcp_server_fatal', { error: String(err) })
  process.exit(1)
});

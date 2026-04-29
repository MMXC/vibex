import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { listTools } from './tools/list.js';
import { executeTool } from './tools/execute.js';
import { logger } from './logger.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// E7-S1: Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const SERVER_VERSION = packageJson.version;
// E7-S1: SDK version check at startup
const MCP_SDK_VERSION = '0.5.0';
logger.info('mcp_server_starting', { version: SERVER_VERSION, sdkVersion: MCP_SDK_VERSION });
const server = new Server({ name: 'vibex-mcp-server', version: SERVER_VERSION }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => {
    // E7-S2: Log tool list request
    logger.debug('mcp_list_tools', { toolCount: listTools().length });
    return { tools: listTools() };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments ?? {};
    // E7-S2: Structured logging with tool/duration/success
    const startTime = Date.now();
    logger.info('mcp_tool_call', {
        tool: toolName,
        argsKeys: Object.keys(args),
    });
    try {
        const result = await executeTool(toolName, args);
        const durationMs = Date.now() - startTime;
        // E7-S2: logToolCall includes tool/duration/success
        logger.logToolCall(toolName, durationMs, true);
        return result;
    }
    catch (error) {
        const durationMs = Date.now() - startTime;
        logger.logToolCall(toolName, durationMs, false);
        logger.error('mcp_tool_error', {
            tool: toolName,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('mcp_server_ready', { transport: 'stdio' });
    console.error('VibeX MCP Server running on stdio');
}
main().catch((err) => {
    logger.error('mcp_server_fatal', { error: String(err) });
    process.exit(1);
});

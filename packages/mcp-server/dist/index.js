"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const list_js_1 = require("./tools/list.js");
const execute_js_1 = require("./tools/execute.js");
const logger_js_1 = require("./logger.js");
// E7-S1: Structured logging — server startup
logger_js_1.logger.info('mcp_server_starting', { version: '0.1.0' });
const server = new index_js_1.Server({ name: 'vibex-mcp-server', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    // E7-S2: Log tool list request
    logger_js_1.logger.debug('mcp_list_tools', { toolCount: (0, list_js_1.listTools)().length });
    return { tools: (0, list_js_1.listTools)() };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments ?? {};
    // E7-S2: Structured logging — tool call
    logger_js_1.logger.info('mcp_tool_call', {
        tool: toolName,
        argsKeys: Object.keys(args),
    });
    try {
        const result = await (0, execute_js_1.executeTool)(toolName, args);
        logger_js_1.logger.info('mcp_tool_success', { tool: toolName });
        return result;
    }
    catch (error) {
        logger_js_1.logger.error('mcp_tool_error', {
            tool: toolName,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    logger_js_1.logger.info('mcp_server_ready', { transport: 'stdio' });
    console.error('VibeX MCP Server running on stdio');
}
main().catch((err) => {
    logger_js_1.logger.error('mcp_server_fatal', { error: String(err) });
    process.exit(1);
});

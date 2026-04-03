// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const list_js_1 = require("./tools/list.js");
const execute_js_1 = require("./tools/execute.js");
const server = new index_js_1.Server({ name: 'vibex-mcp-server', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools: (0, list_js_1.listTools)() };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    return (0, execute_js_1.executeTool)(request.params.name, request.params.arguments ?? {});
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('VibeX MCP Server running on stdio');
}
main().catch(console.error);

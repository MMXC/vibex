"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTool = executeTool;
// E7-S1: Import health check
const health_js_1 = require("../health.js");
async function executeTool(name, args) {
    switch (name) {
        // E7-S1: Health check endpoint
        case 'health_check': {
            const health = await (0, health_js_1.performHealthCheck)();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(health, null, 2),
                    },
                ],
                _health: health, // structured data for programmatic access
            };
        }
        case 'createProject':
            return { content: [{ type: 'text', text: `Project created: ${args.name}` }] };
        case 'getProject':
            return { content: [{ type: 'text', text: `Project ${args.projectId} details` }] };
        case 'listComponents':
            return { content: [{ type: 'text', text: `Components for ${args.projectId}` }] };
        case 'generateCode':
            return { content: [{ type: 'text', text: `Code generated for ${args.componentId} in ${args.framework || 'react'}` }] };
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

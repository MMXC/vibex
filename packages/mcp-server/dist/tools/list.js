"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTools = listTools;
function listTools() {
    return [
        // E7-S1: Health check endpoint
        {
            name: 'health_check',
            description: 'Check the health status of the VibeX MCP server. Returns server uptime, registered tools count, and detailed health checks.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'createProject',
            description: 'Create a new VibeX project from a PRD description',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Project name' },
                    description: { type: 'string', description: 'PRD or project description' },
                },
                required: ['name', 'description'],
            },
        },
        {
            name: 'getProject',
            description: 'Get project details and status',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string', description: 'Project ID' },
                },
                required: ['projectId'],
            },
        },
        {
            name: 'listComponents',
            description: 'List all components in a project',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string', description: 'Project ID' },
                },
                required: ['projectId'],
            },
        },
        {
            name: 'generateCode',
            description: 'Generate code for a component',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string', description: 'Project ID' },
                    componentId: { type: 'string', description: 'Component ID' },
                    framework: { type: 'string', enum: ['react', 'vue', 'solid'], description: 'Target framework' },
                },
                required: ['projectId', 'componentId'],
            },
        },
    ];
}

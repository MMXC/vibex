import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface VibeXTool {
  name: string;
  description: string;
  inputSchema: object;
}

export function listTools(): Tool[] {
  return [
    {
      name: 'create_project',
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
      name: 'get_project',
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
      name: 'list_components',
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
      name: 'generate_code',
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

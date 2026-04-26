import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface VibeXTool {
  name: string;
  description: string;
  inputSchema: object;
}

export function listTools(): Tool[] {
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
    // E9-S1: Design review tool
    {
      name: 'review_design',
      description: 'Review canvas design for compliance, accessibility, and component reuse opportunities. Returns a DesignReviewReport covering color/typography/spacing compliance, WCAG 2.1 AA issues, and structural similarity candidates.',
      inputSchema: {
        type: 'object',
        properties: {
          canvasId: {
            type: 'string',
            description: 'The ID of the canvas to review',
          },
          nodes: {
            type: 'array',
            description: 'Array of canvas nodes to review',
            items: { type: 'object' },
          },
          checkCompliance: {
            type: 'boolean',
            description: 'Check design compliance (color/typography/spacing)',
            default: true,
          },
          checkA11y: {
            type: 'boolean',
            description: 'Check WCAG 2.1 AA accessibility issues',
            default: true,
          },
          checkReuse: {
            type: 'boolean',
            description: 'Analyze component reuse opportunities',
            default: true,
          },
        },
        required: ['canvasId'],
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

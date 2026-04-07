export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode' | 'health_check';

// E7-S1: Import health check
import { performHealthCheck } from '../health.js'

export async function executeTool(name: ToolName, args: Record<string, unknown>) {
  switch (name) {
    // E7-S1: Health check endpoint
    case 'health_check': {
      const health = await performHealthCheck()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(health, null, 2),
          },
        ],
        _health: health, // structured data for programmatic access
      }
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

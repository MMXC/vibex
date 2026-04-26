export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode' | 'health_check' | 'review_design';

// E7-S1: Import health check
import { performHealthCheck } from '../health.js'

// E9-S1: Import review_design tool
import { reviewDesign } from './reviewDesign.js'

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
    // E9-S1: Design review MCP tool
    case 'review_design': {
      const report = await reviewDesign({
        canvasId: (args.canvasId as string) ?? 'unknown',
        nodes: (args.nodes as Array<Record<string, unknown>>) ?? [],
        checkCompliance: (args.checkCompliance as boolean) ?? true,
        checkA11y: (args.checkA11y as boolean) ?? true,
        checkReuse: (args.checkReuse as boolean) ?? true,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
        _designReview: report,
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

export type ToolName = 'createProject' | 'getProject' | 'listComponents' | 'generateCode';

export async function executeTool(name: ToolName, args: Record<string, unknown>) {
  switch (name) {
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

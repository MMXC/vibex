type ToolName = 'create_project' | 'get_project' | 'list_components' | 'generate_code';

export async function executeTool(name: ToolName, args: Record<string, unknown>) {
  switch (name) {
    case 'create_project':
      return { content: [{ type: 'text', text: `Project created: ${args.name}` }] };
    case 'get_project':
      return { content: [{ type: 'text', text: `Project ${args.projectId} details` }] };
    case 'list_components':
      return { content: [{ type: 'text', text: `Components for ${args.projectId}` }] };
    case 'generate_code':
      return { content: [{ type: 'text', text: `Code generated for ${args.componentId} in ${args.framework || 'react'}` }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

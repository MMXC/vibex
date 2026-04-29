// E7-S1: Import health check
import { performHealthCheck } from '../health.js';
// E9-S1: Import review_design tool
import { reviewDesign } from './reviewDesign.js';
export async function executeTool(name, args) {
    switch (name) {
        // E7-S1: Health check endpoint
        case 'health_check': {
            const health = await performHealthCheck();
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
        // E9-S1: Design review MCP tool
        case 'review_design': {
            const report = await reviewDesign({
                canvasId: args.canvasId ?? 'unknown',
                nodes: args.nodes ?? [],
                checkCompliance: args.checkCompliance ?? true,
                checkA11y: args.checkA11y ?? true,
                checkReuse: args.checkReuse ?? true,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(report, null, 2),
                    },
                ],
                _designReview: report,
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
        case 'coding_agent': {
            // E15-P005 U1: Invoke AI coding agent via /api/chat
            const task = args?.task || '';
            const context = args?.context || {};
            // Call /api/chat with coding mode (fetch from same origin, no loop)
            try {
                const response = await fetch(`${process.env.MCP_API_BASE || 'http://localhost:3000'}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: 'You are an AI coding assistant. Generate code based on the task description.' },
                            { role: 'user', content: task },
                        ],
                        mode: 'coding',
                        context,
                    }),
                });
                if (!response.ok) {
                    return { content: [{ type: 'text', text: `[MCP] coding_agent failed: ${response.statusText}` }] };
                }
                const data = await response.json();
                const message = data?.message?.content || '';
                return { content: [{ type: 'text', text: message }] };
            }
            catch (err) {
                return { content: [{ type: 'text', text: `[MCP] coding_agent error: ${String(err)}` }] };
            }
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

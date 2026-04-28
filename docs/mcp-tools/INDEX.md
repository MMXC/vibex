# MCP Tool Index

> Auto-generated at 2026-04-28T18:43:10.068Z by scripts/generate-tool-index.ts

| # | Tool | Description |
|---|------|-------------|
| 1 | `health_check` | Check the health status of the VibeX MCP server. Returns server uptime, registered tools count, and detailed health checks. |
| 2 | `review_design` | Review canvas design for compliance, accessibility, and component reuse opportunities. Returns a DesignReviewReport covering color/typography/spacing compliance, WCAG 2.1 AA issues, and structural similarity candidates. |
|   |   |   ↳ `nodes`: Array of canvas nodes to review |
| 3 | `coding_agent` | Invoke the VibeX AI coding agent to generate code from design context. Returns code blocks that can be accepted or rejected. |
|   |   |   ↳ `context`: Design nodes |
| 4 | `createProject` | Create a new VibeX project from a PRD description |
|   |   |   ↳ `description`: PRD or project description |
| 5 | `getProject` | Get project details and status |
| 6 | `listComponents` | List all components in a project |
| 7 | `generateCode` | Generate code for a component |
|   |   |   ↳ `componentId`: Component ID |

**Total tools: 7**